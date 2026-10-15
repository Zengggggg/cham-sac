import { getActiveProduct, listActiveProducts } from '../services/productService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const listProducts = async (req, res, next) => {
    try {
        const result = await listActiveProducts(req.query);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách sản phẩm thành công.',
            data: result.products,
            meta: result.meta
        });
    } catch (error) {
        return next(error);
    }
};

export const getProduct = async (req, res, next) => {
    try {
        const product = await getActiveProduct(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy chi tiết sản phẩm thành công.',
            data: { product }
        });
    } catch (error) {
        return next(error);
    }
};
