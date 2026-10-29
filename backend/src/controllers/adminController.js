import {
    createAdminProduct,
    getAdminOrder,
    getAdminProduct,
    listAdminOrders,
    listAdminProducts,
    updateAdminOrderStatus,
    updateAdminProduct
} from '../services/adminService.js';
import {
    createAdminArModel,
    createAdminGameRule,
    createAdminHeritageSite,
    deleteAdminArModel,
    deleteAdminGameRule,
    deleteAdminHeritageSite,
    getAdminArModel,
    getAdminDashboard,
    getAdminGameRule,
    getAdminHeritageSite,
    getAdminUser,
    listAdminArModels,
    listAdminGameRules,
    listAdminHeritageSites,
    listAdminUsers,
    updateAdminArModel,
    updateAdminGameRule,
    updateAdminHeritageSite,
    updateAdminUserStatus
} from '../services/adminManagementService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { createProductImageUpload } from '../services/uploadService.js';

export const presignProductImageUpload = async (req, res, next) => {
    try {
        const upload = await createProductImageUpload(req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Tạo URL tải ảnh lên thành công.',
            data: { upload }
        });
    } catch (error) {
        return next(error);
    }
};

export const listProducts = async (req, res, next) => {
    try {
        const result = await listAdminProducts(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách sản phẩm quản trị thành công.',
            data: result.products,
            meta: { ...result.meta, summary: result.summary }
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

export const getProduct = async (req, res, next) => {
    try {
        const product = await getAdminProduct(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy chi tiết sản phẩm quản trị thành công.',
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

export const getDashboard = async (_req, res, next) => {
    try {
        const dashboard = await getAdminDashboard();
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy dữ liệu dashboard thành công.',
            data: dashboard
        });
    } catch (error) {
        return next(error);
    }
};

export const listUsers = async (req, res, next) => {
    try {
        const result = await listAdminUsers(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách tài khoản thành công.',
            data: result.users,
            meta: result.meta
        });
    } catch (error) {
        return next(error);
    }
};

export const getUser = async (req, res, next) => {
    try {
        const result = await getAdminUser(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy chi tiết tài khoản thành công.',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};

export const updateUserStatus = async (req, res, next) => {
    try {
        const user = await updateAdminUserStatus(req.user.id, req.params.id, req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật trạng thái tài khoản thành công.',
            data: { user }
        });
    } catch (error) {
        return next(error);
    }
};

export const listGameRules = async (req, res, next) => {
    try {
        const result = await listAdminGameRules(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách luật chơi thành công.',
            data: result.rules,
            meta: result.meta
        });
    } catch (error) {
        return next(error);
    }
};

export const getGameRule = async (req, res, next) => {
    try {
        const rule = await getAdminGameRule(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy chi tiết luật chơi thành công.',
            data: { rule }
        });
    } catch (error) {
        return next(error);
    }
};

export const createGameRule = async (req, res, next) => {
    try {
        const rule = await createAdminGameRule(req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Tạo luật chơi thành công.',
            data: { rule }
        });
    } catch (error) {
        return next(error);
    }
};

export const updateGameRule = async (req, res, next) => {
    try {
        const rule = await updateAdminGameRule(req.params.id, req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật luật chơi thành công.',
            data: { rule }
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteGameRule = async (req, res, next) => {
    try {
        await deleteAdminGameRule(req.params.id, req.body.expectedUpdatedAt);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Xóa luật chơi thành công.',
            data: null
        });
    } catch (error) {
        return next(error);
    }
};

export const listHeritageSites = async (req, res, next) => {
    try {
        const result = await listAdminHeritageSites(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách địa danh thành công.',
            data: result.heritageSites,
            meta: result.meta
        });
    } catch (error) {
        return next(error);
    }
};

export const getHeritageSite = async (req, res, next) => {
    try {
        const heritageSite = await getAdminHeritageSite(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy chi tiết địa danh thành công.',
            data: { heritageSite }
        });
    } catch (error) {
        return next(error);
    }
};

export const createHeritageSite = async (req, res, next) => {
    try {
        const heritageSite = await createAdminHeritageSite(req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Tạo địa danh thành công.',
            data: { heritageSite }
        });
    } catch (error) {
        return next(error);
    }
};

export const updateHeritageSite = async (req, res, next) => {
    try {
        const heritageSite = await updateAdminHeritageSite(req.params.id, req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật địa danh thành công.',
            data: { heritageSite }
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteHeritageSite = async (req, res, next) => {
    try {
        await deleteAdminHeritageSite(req.params.id, req.body.expectedUpdatedAt);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Xóa địa danh thành công.',
            data: null
        });
    } catch (error) {
        return next(error);
    }
};

export const listArModels = async (req, res, next) => {
    try {
        const result = await listAdminArModels(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách model AR thành công.',
            data: result.models,
            meta: result.meta
        });
    } catch (error) {
        return next(error);
    }
};

export const getArModel = async (req, res, next) => {
    try {
        const model = await getAdminArModel(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy chi tiết model AR thành công.',
            data: { model }
        });
    } catch (error) {
        return next(error);
    }
};

export const createArModel = async (req, res, next) => {
    try {
        const model = await createAdminArModel(req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Tạo model AR thành công.',
            data: { model }
        });
    } catch (error) {
        return next(error);
    }
};

export const updateArModel = async (req, res, next) => {
    try {
        const model = await updateAdminArModel(req.params.id, req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật model AR thành công.',
            data: { model }
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteArModel = async (req, res, next) => {
    try {
        const model = await deleteAdminArModel(req.params.id, req.body.expectedUpdatedAt);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Ẩn model AR thành công.',
            data: { model }
        });
    } catch (error) {
        return next(error);
    }
};
