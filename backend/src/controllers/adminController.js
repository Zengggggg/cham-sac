import {
    createAdminProduct,
    getAdminOrder,
    listAdminOrders,
    listAdminProducts,
    updateAdminOrderStatus,
    updateAdminProduct
} from '../services/adminService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const listProducts = async (req, res, next) => {
    try {
        const result = await listAdminProducts(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách sản phẩm quản trị thành công.',
            data: result.products,
            meta: result.meta
        });
    } catch (error) {
        return next(error);
    }
};

export const createProduct = async (req, res, next) => {
    try {
        const product = await createAdminProduct(req.user.id, req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Tạo sản phẩm thành công.',
            data: { product }
        });
    } catch (error) {
        return next(error);
    }
};

export const updateProduct = async (req, res, next) => {
    try {
        const product = await updateAdminProduct(req.user.id, req.params.id, req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật sản phẩm thành công.',
            data: { product }
        });
    } catch (error) {
        return next(error);
    }
};

export const listOrders = async (req, res, next) => {
    try {
        const result = await listAdminOrders(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách đơn hàng quản trị thành công.',
            data: result.orders,
            meta: result.meta
        });
    } catch (error) {
        return next(error);
    }
};

export const getOrder = async (req, res, next) => {
    try {
        const result = await getAdminOrder(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy chi tiết đơn hàng quản trị thành công.',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};

export const updateOrderStatus = async (req, res, next) => {
    try {
        const order = await updateAdminOrderStatus(req.user.id, req.params.id, req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật trạng thái đơn hàng thành công.',
            data: { order }
        });
    } catch (error) {
        return next(error);
    }
};
