import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Payment from '../models/paymentModel.js';
import AppError from '../utils/appError.js';
import { createPayOSPaymentLink, verifyPayOSWebhook } from '../providers/payOSProvider.js';
import {
    createProviderOrderCode,
    expireOrder,
    reserveOrderStock,
    restoreOrderStock
} from './orderService.js';

const EXPIRED_ORDER_CANCELLATION_REASON = 'Đơn hàng hết thời hạn thanh toán.';
const LATE_PAYMENT_CANCELLATION_REASON = 'Thanh toán đến sau thời hạn.';

const parsePayOSTransactionDate = (value) => {
    if (typeof value !== 'string') return new Date(value);
    const timezoneMissing = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value);
    const normalizedValue = timezoneMissing
        ? `${value.replace(' ', 'T')}+07:00`
        : value;
    return new Date(normalizedValue);
};

const toPaymentResponse = (payment) => {
    const value = typeof payment.toJSON === 'function' ? payment.toJSON() : { ...payment };
    delete value.webhookPayload;
    return value;
};

export const isRecoverableExpiredOrder = (order, paidAt) => {
    const lastStatusChange = order.statusHistory?.[order.statusHistory.length - 1];
    const recoverableCancellationReasons = [
        EXPIRED_ORDER_CANCELLATION_REASON,
        LATE_PAYMENT_CANCELLATION_REASON
    ];
    return order.orderStatus === 'cancelled'
        && recoverableCancellationReasons.includes(order.cancellationReason)
        && lastStatusChange?.to === 'cancelled'
        && lastStatusChange.actorRole === 'system'
        && lastStatusChange.reason === order.cancellationReason
        && paidAt <= order.expiresAt;
};

export const isLatePayment = (order, paidAt) => (
    order.orderStatus === 'cancelled' || paidAt > order.expiresAt
);

const recoverDelayedSuccessfulPayment = async (paymentId, paidAt) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const payment = await Payment.findById(paymentId).session(session);
            if (!payment) return;
            const order = await Order.findById(payment.orderId).session(session);
            if (!order) return;
            if (payment.status !== 'success' || !isRecoverableExpiredOrder(order, paidAt)) return;

            payment.paidAt = paidAt;
            const stockReserved = await reserveOrderStock(order, session);
            if (!stockReserved) {
                payment.requiresManualReview = true;
                payment.reviewReason = 'Đã thanh toán trước hạn nhưng sản phẩm không còn đủ tồn kho; cần hoàn tiền hoặc xử lý thủ công.';
                order.refundRequired = true;
            } else {
                order.orderStatus = 'pending';
                order.cancelledAt = undefined;
                order.cancellationReason = undefined;
                order.refundRequired = false;
                order.statusHistory.push({
                    from: 'cancelled',
                    to: 'pending',
                    actorRole: 'system',
                    reason: 'PayOS xác nhận thanh toán trước hạn; khôi phục đơn do webhook đến muộn.'
                });
                payment.requiresManualReview = false;
                payment.reviewReason = undefined;
            }
            await payment.save({ session });
            await order.save({ session });
        });
    } finally {
        await session.endSession();
    }
};

export const createPayOSTransferContent = (providerOrderCode) => {
    if (!Number.isSafeInteger(providerOrderCode) || providerOrderCode <= 0) {
        throw new TypeError('providerOrderCode phải là số nguyên dương.');
    }
    return `CSV${String(providerOrderCode).slice(-6)}`;
};

export const normalizeVerifiedPayment = (verifiedData) => {
    const paidAt = parsePayOSTransactionDate(verifiedData.transactionDateTime);
    return {
        providerOrderCode: verifiedData.orderCode,
        amount: verifiedData.amount,
        providerTransactionId: verifiedData.reference,
        paymentLinkId: verifiedData.paymentLinkId,
        paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
        isSuccessful: verifiedData.code === '00',
        webhookPayload: {
            orderCode: verifiedData.orderCode,
            amount: verifiedData.amount,
            description: verifiedData.description,
            reference: verifiedData.reference,
            transactionDateTime: verifiedData.transactionDateTime,
            currency: verifiedData.currency,
            paymentLinkId: verifiedData.paymentLinkId,
            code: verifiedData.code,
            desc: verifiedData.desc
        }
    };
};

const getOwnedOrder = async (userId, orderId) => {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw new AppError('Đơn hàng không tồn tại.', 404);
    return order;
};

export const createUserPayment = async (userId, orderId) => {
    let order = await getOwnedOrder(userId, orderId);
    if (order.orderStatus === 'cancelled') throw new AppError('Đơn hàng đã bị hủy.', 410);
    if (order.orderStatus !== 'pending') {
        throw new AppError('Đơn hàng không còn ở trạng thái chờ thanh toán.', 409);
    }
    if (order.paymentStatus === 'paid') {
        const successful = await Payment.findOne({ orderId, status: 'success' });
        return { payment: successful ? toPaymentResponse(successful) : null, alreadyPaid: true };
    }
    if (order.expiresAt <= new Date()) {
        await expireOrder(order._id);
        throw new AppError('Đơn hàng đã hết thời hạn thanh toán.', 410);
    }

    const reusable = await Payment.findOne({ orderId, status: 'pending', checkoutUrl: { $exists: true } });
    if (reusable) return { payment: toPaymentResponse(reusable), reused: true };

    const providerOrderCode = createProviderOrderCode();
    let payment;
    try {
        payment = await Payment.create({
            orderId: order._id,
            provider: 'payos',
            providerOrderCode,
            amount: order.totalAmount,
            transferContent: createPayOSTransferContent(providerOrderCode),
            status: 'pending',
            expiresAt: order.expiresAt
        });
    } catch (error) {
        if (error?.code !== 11000) throw error;
        const concurrent = await Payment.findOne({ orderId, status: 'pending' });
        if (!concurrent) throw error;
        if (concurrent.checkoutUrl) return { payment: toPaymentResponse(concurrent), reused: true };
        throw new AppError('Thông tin thanh toán đang được tạo. Vui lòng thử lại.', 409);
    }

    try {
        const link = await createPayOSPaymentLink({
            providerOrderCode: payment.providerOrderCode,
            amount: order.totalAmount,
            transferContent: payment.transferContent,
            buyer: order.customer,
            items: order.items.map((item) => ({
                name: item.productName.slice(0, 25),
                quantity: item.quantity,
                price: item.unitPrice
            })),
            expiredAt: Math.floor(order.expiresAt.getTime() / 1000)
        });
        if (link.amount !== order.totalAmount || link.orderCode !== payment.providerOrderCode) {
            throw new Error('payOS trả về thông tin thanh toán không khớp.');
        }
        payment.paymentLinkId = link.paymentLinkId;
        payment.checkoutUrl = link.checkoutUrl;
        payment.qrCode = link.qrCode;
        await payment.save();
        return { payment: toPaymentResponse(payment), reused: false };
    } catch (error) {
        payment.status = 'failed';
        payment.requiresManualReview = true;
        payment.reviewReason = 'Không thể tạo payment link.';
        await payment.save().catch(() => undefined);
        console.error('payOS payment link creation failed', {
            name: error?.name,
            message: error?.message,
            code: error?.code,
            status: error?.status
        });
        throw new AppError('Không thể tạo thông tin thanh toán. Vui lòng thử lại.', 502);
    }
};

export const getUserPaymentStatus = async (userId, orderId) => {
    const order = await getOwnedOrder(userId, orderId);
    const payment = await Payment.findOne({ orderId }).sort({ createdAt: -1 }).select('-webhookPayload');
    return {
        orderId: order.id,
        orderCode: order.orderCode,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        payment: payment ? toPaymentResponse(payment) : null
    };
};

export const processPayOSWebhook = async (
    payload,
    {
        verifyWebhook = verifyPayOSWebhook,
        findPayment = (query) => Payment.findOne(query)
    } = {}
) => {
    let verifiedData;
    try {
        verifiedData = await verifyWebhook(payload);
    } catch (_error) {
        throw new AppError('Chữ ký webhook không hợp lệ.', 400);
    }
    const normalized = normalizeVerifiedPayment(verifiedData);
    const existingTransaction = normalized.providerTransactionId
        ? await findPayment({
            provider: 'payos',
            providerTransactionId: normalized.providerTransactionId
        })
        : null;
    if (existingTransaction) {
        if (existingTransaction.status === 'success') {
            await recoverDelayedSuccessfulPayment(existingTransaction._id, normalized.paidAt);
            const updated = await Payment.findById(existingTransaction._id);
            return { payment: toPaymentResponse(updated), duplicate: true };
        }
        return { payment: toPaymentResponse(existingTransaction), duplicate: true };
    }

    const payment = await findPayment({ providerOrderCode: normalized.providerOrderCode });
    if (!payment) {
        console.warn('Ignoring payOS webhook without a matching payment', {
            providerOrderCode: normalized.providerOrderCode
        });
        return { payment: null, duplicate: false, ignored: true };
    }
    const order = await Order.findById(payment.orderId);
    if (!order) throw new AppError('Không tìm thấy đơn hàng tương ứng.', 404);

    const mismatch = payment.amount !== normalized.amount
        || (payment.paymentLinkId && payment.paymentLinkId !== normalized.paymentLinkId);
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const transactionalPayment = await Payment.findById(payment._id).session(session);
            const transactionalOrder = await Order.findById(order._id).session(session);
            if (transactionalPayment.status === 'success') return;

            const otherSuccessfulPayment = await Payment.findOne({
                _id: { $ne: transactionalPayment._id },
                orderId: transactionalOrder._id,
                status: 'success'
            }).session(session);
            if (otherSuccessfulPayment) {
                transactionalPayment.status = 'failed';
                transactionalPayment.providerTransactionId = normalized.providerTransactionId;
                transactionalPayment.webhookPayload = normalized.webhookPayload;
                transactionalPayment.requiresManualReview = true;
                transactionalPayment.reviewReason = 'Đơn hàng đã có một giao dịch thành công khác.';
                await transactionalPayment.save({ session });
                return;
            }

            transactionalPayment.providerTransactionId = normalized.providerTransactionId;
            transactionalPayment.webhookPayload = normalized.webhookPayload;
            if (mismatch || !normalized.isSuccessful) {
                transactionalPayment.status = 'failed';
                transactionalPayment.requiresManualReview = mismatch;
                transactionalPayment.reviewReason = mismatch
                    ? 'Webhook có số tiền hoặc paymentLinkId không khớp.'
                    : 'Nhà cung cấp báo giao dịch không thành công.';
                await transactionalPayment.save({ session });
                return;
            }

            const recoverExpiredOrder = isRecoverableExpiredOrder(transactionalOrder, normalized.paidAt);
            transactionalPayment.status = 'success';
            transactionalPayment.paidAt = normalized.paidAt;
            transactionalPayment.requiresManualReview = false;
            transactionalPayment.reviewReason = undefined;
            transactionalOrder.paymentStatus = 'paid';

            if (recoverExpiredOrder) {
                const stockReserved = await reserveOrderStock(transactionalOrder, session);
                if (stockReserved) {
                    transactionalOrder.orderStatus = 'pending';
                    transactionalOrder.cancelledAt = undefined;
                    transactionalOrder.cancellationReason = undefined;
                    transactionalOrder.refundRequired = false;
                    transactionalOrder.statusHistory.push({
                        from: 'cancelled',
                        to: 'pending',
                        actorRole: 'system',
                        reason: 'PayOS xác nhận thanh toán trước hạn; khôi phục đơn do webhook đến muộn.'
                    });
                } else {
                    transactionalPayment.requiresManualReview = true;
                    transactionalPayment.reviewReason = 'Đã thanh toán trước hạn nhưng sản phẩm không còn đủ tồn kho; cần hoàn tiền hoặc xử lý thủ công.';
                    transactionalOrder.refundRequired = true;
                }
            } else {
                const isLate = isLatePayment(transactionalOrder, normalized.paidAt);
                transactionalPayment.requiresManualReview = isLate;
                transactionalPayment.reviewReason = isLate
                    ? 'Thanh toán thành công sau khi đơn đã hết hạn hoặc bị hủy.'
                    : undefined;
                if (!isLate) {
                    await transactionalPayment.save({ session });
                    await transactionalOrder.save({ session });
                    return;
                }

                await restoreOrderStock(transactionalOrder, session);
                if (transactionalOrder.orderStatus !== 'cancelled') {
                    const previousStatus = transactionalOrder.orderStatus;
                    transactionalOrder.orderStatus = 'cancelled';
                    transactionalOrder.cancelledAt = new Date();
                    transactionalOrder.cancellationReason = 'Thanh toán đến sau thời hạn.';
                    transactionalOrder.statusHistory.push({
                        from: previousStatus,
                        to: 'cancelled',
                        actorRole: 'system',
                        reason: transactionalOrder.cancellationReason
                    });
                }
                transactionalOrder.refundRequired = true;
            }
            await transactionalPayment.save({ session });
            await transactionalOrder.save({ session });
        });
    } catch (error) {
        if (error?.code === 'ORDER_STOCK_RESERVATION_CONFLICT') {
            const fallbackSession = await mongoose.startSession();
            try {
                await fallbackSession.withTransaction(async () => {
                    const transactionalPayment = await Payment.findById(payment._id).session(fallbackSession);
                    const transactionalOrder = await Order.findById(order._id).session(fallbackSession);
                    if (transactionalPayment.status === 'success') return;

                    const otherSuccessfulPayment = await Payment.findOne({
                        _id: { $ne: transactionalPayment._id },
                        orderId: transactionalOrder._id,
                        status: 'success'
                    }).session(fallbackSession);
                    if (otherSuccessfulPayment) {
                        transactionalPayment.status = 'failed';
                        transactionalPayment.providerTransactionId = normalized.providerTransactionId;
                        transactionalPayment.webhookPayload = normalized.webhookPayload;
                        transactionalPayment.requiresManualReview = true;
                        transactionalPayment.reviewReason = 'Đơn hàng đã có một giao dịch thành công khác.';
                        await transactionalPayment.save({ session: fallbackSession });
                        return;
                    }

                    transactionalPayment.status = 'success';
                    transactionalPayment.paidAt = normalized.paidAt;
                    transactionalPayment.providerTransactionId = normalized.providerTransactionId;
                    transactionalPayment.webhookPayload = normalized.webhookPayload;
                    transactionalPayment.requiresManualReview = true;
                    transactionalPayment.reviewReason = 'Đã thanh toán trước hạn nhưng tồn kho vừa thay đổi; cần hoàn tiền hoặc xử lý thủ công.';
                    transactionalOrder.paymentStatus = 'paid';
                    transactionalOrder.refundRequired = true;
                    await transactionalPayment.save({ session: fallbackSession });
                    await transactionalOrder.save({ session: fallbackSession });
                });
            } finally {
                await fallbackSession.endSession();
            }
            const updated = await Payment.findById(payment._id);
            return { payment: toPaymentResponse(updated), duplicate: false };
        }
        if (error?.code === 11000) {
            const duplicate = await findPayment({
                provider: 'payos',
                providerTransactionId: normalized.providerTransactionId
            });
            if (duplicate) return { payment: toPaymentResponse(duplicate), duplicate: true };
        }
        throw error;
    } finally {
        await session.endSession();
    }
    const updated = await Payment.findById(payment._id);
    return { payment: toPaymentResponse(updated), duplicate: false };
};
