import {
    addUserCartItem,
    getUserCart,
    removeUserCartItem,
    updateUserCartItem
} from '../services/cartService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const cartResponse = (res, message, cart) => sendSuccess(res, {
    statusCode: 200,
    message,
    data: { cart }
});

export const getCart = async (req, res, next) => {
    try {
        return cartResponse(res, 'Lấy giỏ hàng thành công.', await getUserCart(req.user.id));
    } catch (error) {
        return next(error);
    }
};

export const addCartItem = async (req, res, next) => {
    try {
        const cart = await addUserCartItem(req.user.id, req.body);
        return cartResponse(res, 'Đã thêm sản phẩm vào giỏ.', cart);
    } catch (error) {
        return next(error);
    }
};

export const updateCartItem = async (req, res, next) => {
    try {
        const cart = await updateUserCartItem(req.user.id, req.params.productId, req.body);
        return cartResponse(res, 'Cập nhật giỏ hàng thành công.', cart);
    } catch (error) {
        return next(error);
    }
};

export const removeCartItem = async (req, res, next) => {
    try {
        const cart = await removeUserCartItem(req.user.id, req.params.productId);
        return cartResponse(res, 'Đã xóa sản phẩm khỏi giỏ.', cart);
    } catch (error) {
        return next(error);
    }
};
