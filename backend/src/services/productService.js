import Product from '../models/productModel.js';
import AppError from '../utils/appError.js';

const plainProduct = (product) => (
    typeof product?.toJSON === 'function' ? product.toJSON() : { ...product }
);

export const toPublicProduct = (product) => {
    const value = plainProduct(product);
    const isSoldOut = value.status === 'sold_out' || value.stock <= 0;
    return {
        ...value,
        availabilityStatus: isSoldOut ? 'sold_out' : value.status,
        canPurchase: value.status === 'active' && !isSoldOut
    };
};

const normalizePagination = ({ page, limit }) => {
    const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const normalizedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 12, 1), 100);
    return { currentPage, limit: normalizedLimit };
};

export const listActiveProducts = async (query = {}) => {
    const { currentPage, limit } = normalizePagination(query);
    const filter = { status: 'active' };
    const [products, totalItems] = await Promise.all([
        Product.find(filter)
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit),
        Product.countDocuments(filter)
    ]);

    return {
        products: products.map(toPublicProduct),
        meta: {
            currentPage,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit)
        }
    };
};

export const getActiveProduct = async (productId) => {
    const product = await Product.findOne({ _id: productId, status: 'active' });
    if (!product) throw new AppError('Sản phẩm không tồn tại hoặc đã ngừng bán.', 404);
    return toPublicProduct(product);
};
