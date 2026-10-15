import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Payment from '../models/paymentModel.js';
import AppError from '../utils/appError.js';
import { createPayOSPaymentLink, verifyPayOSWebhook } from '../providers/payOSProvider.js';
import { createProviderOrderCode, expireOrder, restoreOrderStock } from './orderService.js';

const toPaymentResponse = (payment) => {
    const value = typeof payment.toJSON === 'function' ? payment.toJSON() : { ...payment };
    delete value.webhookPayload;
    return value;
};

export const normalizeVerifiedPayment = (verifiedData) => {
    const paidAt = new Date(verifiedData.transactionDateTime);
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

    let payment;
    try {
        payment = await Payment.create({
            orderId: order._id,
            provider: 'payos',
            providerOrderCode: createProviderOrderCode(),
            amount: order.totalAmount,
            transferContent: order.orderCode.replaceAll('-', '').slice(0, 25),
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

export const processPayOSWebhook = async (payload) => {
    let verifiedData;
    try {
        verifiedData = await verifyPayOSWebhook(payload);
    } catch (_error) {
        throw new AppError('Chữ ký webhook không hợp lệ.', 400);
    }
    const normalized = normalizeVerifiedPayment(verifiedData);
    const existingTransaction = normalized.providerTransactionId
        ? await Payment.findOne({
            provider: 'payos',
            providerTransactionId: normalized.providerTransactionId
        })
        : null;
    if (existingTransaction) return { payment: toPaymentResponse(existingTransaction), duplicate: true };

    const payment = await Payment.findOne({ providerOrderCode: normalized.providerOrderCode });
    if (!payment) throw new AppError('Không tìm thấy giao dịch tương ứng.', 404);
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

            const isLate = transactionalOrder.orderStatus === 'cancelled'
                || transactionalOrder.expiresAt <= normalized.paidAt;
            transactionalPayment.status = 'success';
            transactionalPayment.paidAt = normalized.paidAt;
            transactionalPayment.requiresManualReview = isLate;
            transactionalPayment.reviewReason = isLate
                ? 'Thanh toán thành công sau khi đơn đã hết hạn hoặc bị hủy.'
                : undefined;
            transactionalOrder.paymentStatus = 'paid';
            if (isLate) {
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
        if (error?.code === 11000) {
            const duplicate = await Payment.findOne({
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
