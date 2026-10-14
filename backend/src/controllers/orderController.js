import {
    createUserOrder,
    getUserOrder,
    listUserOrders
} from '../services/orderService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createOrder = async (req, res, next) => {
    try {
        const result = await createUserOrder(req.user.id, req.checkoutKey, req.body);
        return sendSuccess(res, {
            statusCode: result.reused ? 200 : 201,
            message: result.reused
                ? 'Yêu cầu này đã được xử lý trước đó.'
                : 'Tạo đơn hàng thành công.',
            data: { order: result.order }
        });
    } catch (error) {
        return next(error);
    }
};

export const listMyOrders = async (req, res, next) => {
    try {
        const result = await listUserOrders(req.user.id, req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy lịch sử đơn hàng thành công.',
            data: result.orders,
            meta: result.meta
        });
    } catch (error) {
        return next(error);
    }
};

export const getMyOrder = async (req, res, next) => {
    try {
        const result = await getUserOrder(req.user.id, req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy chi tiết đơn hàng thành công.',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};
