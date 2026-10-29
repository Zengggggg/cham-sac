import mongoose from 'mongoose';
import Order from '../models/orderModel.js';
import Payment from '../models/paymentModel.js';
import Product from '../models/productModel.js';
import AppError from '../utils/appError.js';
import { canTransitionOrder, restoreOrderStock } from './orderService.js';

const MANAGED_PRODUCT_FIELDS = ['name', 'description', 'price', 'stock', 'images', 'status'];

const comparable = (value) => JSON.stringify(value ?? null);

export const collectProductChanges = (current, updates) => MANAGED_PRODUCT_FIELDS
    .filter((field) => Object.hasOwn(updates, field) && comparable(current[field]) !== comparable(updates[field]))
    .map((field) => ({ field, from: current[field], to: updates[field] }));

const normalizePagination = (query = {}) => ({
    currentPage: Math.max(Number.parseInt(query.page, 10) || 1, 1),
    limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100)
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listAdminProducts = async (query = {}) => {
    const { currentPage, limit } = normalizePagination(query);
    const filter = {};
    if (['active', 'inactive', 'sold_out'].includes(query.status)) filter.status = query.status;
    if (typeof query.search === 'string' && query.search.trim()) {
        filter.name = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
    }
    const [products, totalItems] = await Promise.all([
        Product.find(filter).sort({ createdAt: -1 }).skip((currentPage - 1) * limit).limit(limit),
        Product.countDocuments(filter)
    ]);
    return {
        products,
        meta: { currentPage, limit, totalItems, totalPages: Math.ceil(totalItems / limit) }
    };
};

export const getAdminProduct = async (productId) => {
    const product = await Product.findById(productId).select('+changeHistory');
    if (!product) throw new AppError('Sản phẩm không tồn tại.', 404);
    return product;
};

export const createAdminProduct = async (adminId, input) => {
    const product = new Product(input);
    const changes = collectProductChanges({}, input);
    product.changeHistory.push({ changedBy: adminId, changes });
    await product.save();
    return product;
};

export const updateAdminProduct = async (adminId, productId, input) => {
    const { expectedUpdatedAt, ...updates } = input;
    const product = await Product.findOne({ _id: productId, updatedAt: expectedUpdatedAt })
        .select('+changeHistory');
    if (!product) {
        const exists = await Product.exists({ _id: productId });
        if (exists) throw new AppError('Sản phẩm đã được cập nhật bởi người khác. Hãy tải lại.', 409);
        throw new AppError('Sản phẩm không tồn tại.', 404);
    }

    const changes = collectProductChanges(product.toObject(), updates);
    if (!changes.length) return product;
    Object.assign(product, updates);
    product.changeHistory.push({ changedBy: adminId, changes });
    try {
        await product.save();
    } catch (error) {
        if (error?.name === 'VersionError') {
            throw new AppError('Sản phẩm đã được cập nhật bởi người khác. Hãy tải lại.', 409);
        }
        throw error;
    }
    return product;
};

const orderFilter = (query) => {
    const filter = {};
    if (['pending', 'confirmed', 'shipping', 'done', 'cancelled'].includes(query.orderStatus)) {
        filter.orderStatus = query.orderStatus;
    }
    if (['unpaid', 'paid', 'refunded'].includes(query.paymentStatus)) {
        filter.paymentStatus = query.paymentStatus;
    }
    if (typeof query.orderCode === 'string' && query.orderCode.trim()) {
        const searchExpression = { $regex: escapeRegex(query.orderCode.trim()), $options: 'i' };
        filter.$or = [
            { orderCode: searchExpression },
            { 'customer.fullName': searchExpression },
            { 'customer.email': searchExpression },
            { 'customer.phone': searchExpression }
        ];
    }
    if (query.from || query.to) {
        filter.createdAt = {};
        const from = query.from ? new Date(query.from) : null;
        const to = query.to ? new Date(query.to) : null;
        if (from && !Number.isNaN(from.getTime())) filter.createdAt.$gte = from;
        if (to && !Number.isNaN(to.getTime())) filter.createdAt.$lte = to;
        if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
    }
    return filter;
};

export const listAdminOrders = async (query = {}) => {
    const { currentPage, limit } = normalizePagination(query);
    const filter = orderFilter(query);
    const [orders, totalItems, summaryRows] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip((currentPage - 1) * limit).limit(limit),
        Order.countDocuments(filter),
        Order.aggregate([
            { $match: filter },
            { $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalValue: { $sum: '$totalAmount' },
                paidCount: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] } }
            } },
            { $project: { _id: 0, totalOrders: 1, totalValue: 1, paidCount: 1 } }
        ])
    ]);
    return {
        orders,
        meta: { currentPage, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
        summary: summaryRows[0] || { totalOrders: 0, totalValue: 0, paidCount: 0 }
    };
};

export const getAdminOrder = async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Đơn hàng không tồn tại.', 404);
    const payments = await Payment.find({ orderId }).sort({ createdAt: -1 }).select('-webhookPayload');
    return { order, payments };
};

export const getOrderTransitionIssue = (order, update) => {
    if (!canTransitionOrder(order.orderStatus, update.status)) return 'INVALID_TRANSITION';
    if (update.status === 'confirmed' && order.paymentStatus !== 'paid') {
        if (!update.forcePaymentOverride) return 'PAYMENT_REQUIRED';
        if (!update.reason) return 'OVERRIDE_REASON_REQUIRED';
    }
    if (update.status === 'cancelled' && !update.reason) return 'CANCELLATION_REASON_REQUIRED';
    return null;
};

const transitionMessage = (issue) => ({
    INVALID_TRANSITION: 'Bước chuyển trạng thái đơn không hợp lệ.',
    PAYMENT_REQUIRED: 'Đơn chưa thanh toán. Cần đối soát ngoại lệ để xác nhận.',
    OVERRIDE_REASON_REQUIRED: 'Cần lý do khi xác nhận đơn chưa thanh toán.',
    CANCELLATION_REASON_REQUIRED: 'Cần lý do khi hủy đơn.'
}[issue]);

export const updateAdminOrderStatus = async (adminId, orderId, update) => {
    const session = await mongoose.startSession();
    let updatedOrder;
    try {
        await session.withTransaction(async () => {
            const order = await Order.findOne({ _id: orderId, updatedAt: update.expectedUpdatedAt })
                .session(session);
            if (!order) {
                const exists = await Order.exists({ _id: orderId }).session(session);
                if (exists) throw new AppError('Đơn đã được cập nhật bởi người khác. Hãy tải lại.', 409);
                throw new AppError('Đơn hàng không tồn tại.', 404);
            }

            const issue = getOrderTransitionIssue(order, update);
            if (issue) throw new AppError(transitionMessage(issue), 409);
            const previousStatus = order.orderStatus;
            if (update.status === 'cancelled') {
                await restoreOrderStock(order, session);
                order.cancelledAt = new Date();
                order.cancellationReason = update.reason;
                if (order.paymentStatus === 'paid') order.refundRequired = true;
                await Payment.updateMany(
                    { orderId: order._id, status: 'pending' },
                    {
                        $set: {
                            status: 'failed',
                            reviewReason: 'Đơn hàng đã bị quản trị viên hủy.'
                        }
                    },
                    { session }
                );
            }
            order.orderStatus = update.status;
            order.statusHistory.push({
                from: previousStatus,
                to: update.status,
                actorId: adminId,
                actorRole: 'admin',
                reason: update.reason
            });
            try {
                await order.save({ session });
            } catch (error) {
                if (error?.name === 'VersionError') {
                    throw new AppError('Đơn đã được cập nhật bởi người khác. Hãy tải lại.', 409);
                }
                throw error;
            }
            updatedOrder = order;
        });
    } finally {
        await session.endSession();
    }
    return updatedOrder;
};
