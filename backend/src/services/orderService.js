import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { getShopEnvironment } from '../config/environment.js';
import Order from '../models/orderModel.js';
import Payment from '../models/paymentModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import { mergeCartItems } from './cartService.js';

const ORDER_TRANSITIONS = {
    pending: new Set(['confirmed', 'cancelled']),
    confirmed: new Set(['shipping', 'cancelled']),
    shipping: new Set(['done']),
    done: new Set(),
    cancelled: new Set()
};

export const canTransitionOrder = (from, to) => ORDER_TRANSITIONS[from]?.has(to) || false;

export const calculateOrderAmounts = (items, shippingFee) => {
    if (!Number.isSafeInteger(shippingFee) || shippingFee < 0) {
        throw new TypeError('shippingFee phải là số nguyên VND không âm.');
    }
    const subtotalAmount = items.reduce((total, item) => {
        if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0
            || !Number.isSafeInteger(item.unitPrice) || item.unitPrice < 0) {
            throw new TypeError('Item có số lượng hoặc đơn giá không hợp lệ.');
        }
        const lineTotal = item.quantity * item.unitPrice;
        if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(total + lineTotal)) {
            throw new TypeError('Tổng tiền vượt giới hạn an toàn.');
        }
        return total + lineTotal;
    }, 0);
    const totalAmount = subtotalAmount + shippingFee;
    if (!Number.isSafeInteger(totalAmount)) throw new TypeError('Tổng tiền vượt giới hạn an toàn.');
    return { subtotalAmount, shippingFee, totalAmount };
};

export const createOrderCode = () => (
    `CSV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
);

export const createProviderOrderCode = () => {
    const value = Date.now() * 1000 + crypto.randomInt(0, 1000);
    if (!Number.isSafeInteger(value)) throw new Error('Không thể tạo mã thanh toán an toàn.');
    return value;
};

const selectedCartItems = (user) => mergeCartItems(user.cartItems).filter(({ selected }) => selected);

const throwCartConflict = (field, message) => {
    throw new AppError('Giỏ hàng đã thay đổi. Vui lòng kiểm tra lại.', 409, [{ field, message }]);
};

export const createUserOrder = async (userId, checkoutKey, checkout) => {
    const existingOrder = await Order.findOne({ userId, checkoutKey });
    if (existingOrder) return { order: existingOrder, reused: true };

    const session = await mongoose.startSession();
    let createdOrder;
    try {
        await session.withTransaction(async () => {
            const user = await User.findById(userId).select('+cartItems').session(session);
            if (!user) throw new AppError('Tài khoản không tồn tại.', 404);

            const selectedItems = selectedCartItems(user);
            if (!selectedItems.length) {
                throw new AppError('Hãy chọn ít nhất một sản phẩm để đặt hàng.', 422);
            }

            const products = await Product.find({
                _id: { $in: selectedItems.map(({ productId }) => productId) }
            }).session(session);
            const productMap = new Map(products.map((product) => [String(product._id), product]));
            const snapshots = [];

            for (const cartItem of selectedItems) {
                const product = productMap.get(String(cartItem.productId));
                if (!product) throwCartConflict('items', 'Một sản phẩm không còn tồn tại.');
                if (product.status !== 'active') {
                    throwCartConflict('items', `${product.name} đã ngừng bán.`);
                }

                const updatedProduct = await Product.findOneAndUpdate(
                    { _id: product._id, status: 'active', stock: { $gte: cartItem.quantity } },
                    { $inc: { stock: -cartItem.quantity } },
                    { new: true, session, runValidators: true }
                );
                if (!updatedProduct) {
                    throwCartConflict('items', `${product.name} không còn đủ tồn kho.`);
                }

                snapshots.push({
                    productId: product._id,
                    productName: product.name,
                    quantity: cartItem.quantity,
                    unitPrice: product.price,
                    isBox: true
                });
            }

            const shopEnvironment = getShopEnvironment();
            const amounts = calculateOrderAmounts(snapshots, shopEnvironment.shippingFee);
            const expiresAt = new Date(
                Date.now() + shopEnvironment.paymentExpiresInMinutes * 60 * 1000
            );
            const [order] = await Order.create([{
                orderCode: createOrderCode(),
                userId: user._id,
                checkoutKey,
                customer: checkout.customer,
                shippingAddress: checkout.shippingAddress,
                items: snapshots,
                shippingFee: amounts.shippingFee,
                totalAmount: amounts.totalAmount,
                paymentStatus: 'unpaid',
                orderStatus: 'pending',
                expiresAt,
                statusHistory: [{
                    from: null,
                    to: 'pending',
                    actorId: user._id,
                    actorRole: 'user',
                    reason: 'User tạo đơn hàng.'
                }]
            }], { session });

            const selectedIds = new Set(selectedItems.map(({ productId }) => String(productId)));
            user.cartItems = user.cartItems.filter(({ productId }) => !selectedIds.has(String(productId)));
            user.defaultShippingAddress = checkout.shippingAddress;
            await user.save({ session });
            createdOrder = order;
        });
    } catch (error) {
        if (error?.code === 11000) {
            const duplicate = await Order.findOne({ userId, checkoutKey });
            if (duplicate) return { order: duplicate, reused: true };
        }
        throw error;
    } finally {
        await session.endSession();
    }

    return { order: createdOrder, reused: false };
};

const pagination = (query = {}) => ({
    currentPage: Math.max(Number.parseInt(query.page, 10) || 1, 1),
    limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100)
});

export const listUserOrders = async (userId, query = {}) => {
    const { currentPage, limit } = pagination(query);
    const filter = { userId };
    const [orders, totalItems] = await Promise.all([
        Order.find(filter).sort({ createdAt: -1 }).skip((currentPage - 1) * limit).limit(limit),
        Order.countDocuments(filter)
    ]);
    return {
        orders,
        meta: {
            currentPage,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
        }
    };
};

export const getUserOrder = async (userId, orderId) => {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) throw new AppError('Đơn hàng không tồn tại.', 404);
    const payments = await Payment.find({ orderId: order._id })
        .sort({ createdAt: -1 })
        .select('-webhookPayload');
    return { order, payments };
};

export const restoreOrderStock = async (order, session) => {
    if (order.stockRestoredAt) return false;
    const operations = order.items.map((item) => ({
        updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { stock: item.quantity } }
        }
    }));
    if (operations.length) await Product.bulkWrite(operations, { session });
    order.stockRestoredAt = new Date();
    return true;
};

export const reserveOrderStock = async (order, session) => {
    if (!order.stockRestoredAt) return true;

    const products = await Product.find({
        _id: { $in: order.items.map((item) => item.productId) }
    }).select('_id stock').session(session).lean();
    const stockByProductId = new Map(products.map((product) => [String(product._id), product.stock]));
    if (order.items.some((item) => (stockByProductId.get(String(item.productId)) ?? -1) < item.quantity)) {
        return false;
    }

    const operations = order.items.map((item) => ({
        updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { stock: -item.quantity } }
        }
    }));
    if (operations.length) {
        const result = await Product.bulkWrite(operations, { session });
        if (result.matchedCount !== operations.length) {
            const error = new Error('Không thể giữ lại tồn kho cho đơn đã thanh toán.');
            error.code = 'ORDER_STOCK_RESERVATION_CONFLICT';
            throw error;
        }
    }
    order.stockRestoredAt = undefined;
    return true;
};

export const expireOrder = async (orderId, now = new Date()) => {
    const session = await mongoose.startSession();
    let expired = false;
    try {
        await session.withTransaction(async () => {
            const order = await Order.findOne({
                _id: orderId,
                orderStatus: 'pending',
                paymentStatus: 'unpaid',
                expiresAt: { $lte: now }
            }).session(session);
            if (!order) return;

            await restoreOrderStock(order, session);
            order.orderStatus = 'cancelled';
            order.cancelledAt = now;
            order.cancellationReason = 'Đơn hàng hết thời hạn thanh toán.';
            order.statusHistory.push({
                from: 'pending',
                to: 'cancelled',
                actorRole: 'system',
                reason: order.cancellationReason,
                changedAt: now
            });
            await Payment.updateMany(
                { orderId: order._id, status: 'pending' },
                {
                    $set: {
                        status: 'failed',
                        reviewReason: 'Đơn hàng hết thời hạn thanh toán.'
                    }
                },
                { session }
            );
            await order.save({ session });
            expired = true;
        });
    } finally {
        await session.endSession();
    }
    return expired;
};

export const expirePendingOrders = async (now = new Date(), batchSize = 50) => {
    const candidates = await Order.find({
        orderStatus: 'pending',
        paymentStatus: 'unpaid',
        expiresAt: { $lte: now }
    }).select('_id').limit(batchSize).lean();
    let expiredCount = 0;
    for (const candidate of candidates) {
        if (await expireOrder(candidate._id, now)) expiredCount += 1;
    }
    return expiredCount;
};
