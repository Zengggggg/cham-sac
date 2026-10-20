import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';

const stringId = (value) => {
    // ObjectId.id is a binary buffer, not the public hexadecimal product ID.
    const id = typeof value?.toHexString === 'function'
        ? value.toHexString()
        : String(value?._id || value?.id || value);
    return /^[a-f\d]{24}$/i.test(id) ? id.toLowerCase() : id;
};

export const mergeCartItems = (cartItems) => {
    const items = new Map();
    for (const cartItem of cartItems) {
        const productId = stringId(cartItem.productId);
        const existing = items.get(productId);
        if (existing) {
            existing.quantity += cartItem.quantity;
            existing.selected = existing.selected || cartItem.selected;
        } else {
            items.set(productId, {
                productId,
                quantity: cartItem.quantity,
                selected: cartItem.selected,
                addedAt: cartItem.addedAt
            });
        }
    }
    return [...items.values()];
};

export const buildCartSummary = (cartItems, products) => {
    const productMap = new Map(products.map((product) => [stringId(product), product]));
    let subtotalAmount = 0;
    let selectedSubtotalAmount = 0;

    const items = mergeCartItems(cartItems).map((cartItem) => {
        const productId = stringId(cartItem.productId);
        const product = productMap.get(productId);
        let issue = null;
        if (!product) issue = 'PRODUCT_NOT_FOUND';
        else if (product.status !== 'active') issue = 'PRODUCT_INACTIVE';
        else if (product.stock < cartItem.quantity) issue = 'INSUFFICIENT_STOCK';

        const unitPrice = product?.price || 0;
        const lineTotal = unitPrice * cartItem.quantity;
        subtotalAmount += lineTotal;
        if (cartItem.selected) selectedSubtotalAmount += lineTotal;

        return {
            productId,
            quantity: cartItem.quantity,
            selected: cartItem.selected,
            addedAt: cartItem.addedAt,
            product: product ? {
                id: stringId(product),
                name: product.name,
                price: product.price,
                stock: product.stock,
                status: product.status,
                images: product.images || []
            } : null,
            lineTotal,
            isAvailable: issue === null,
            issue
        };
    });

    return { items, subtotalAmount, selectedSubtotalAmount };
};

const getCartUser = async (userId) => {
    const user = await User.findById(userId).select('+cartItems');
    if (!user) throw new AppError('Tài khoản không tồn tại.', 404);
    const mergedItems = mergeCartItems(user.cartItems);
    if (mergedItems.length !== user.cartItems.length) user.cartItems = mergedItems;
    return user;
};

const loadCartSummary = async (user) => {
    const productIds = user.cartItems.map(({ productId }) => productId);
    const products = productIds.length ? await Product.find({ _id: { $in: productIds } }) : [];
    return buildCartSummary(user.cartItems, products);
};

export const getUserCart = async (userId) => loadCartSummary(await getCartUser(userId));

export const addUserCartItem = async (userId, { productId, quantity }) => {
    const product = await Product.findOne({ _id: productId, status: 'active' });
    if (!product) throw new AppError('Sản phẩm không tồn tại hoặc đã ngừng bán.', 404);
    if (product.stock <= 0) throw new AppError('Sản phẩm đã hết hàng.', 409);

    const user = await getCartUser(userId);
    const existing = user.cartItems.find((item) => stringId(item.productId) === stringId(productId));
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) {
        throw new AppError('Số lượng vượt quá tồn kho hiện có.', 409, [{
            field: 'quantity',
            message: `Chỉ còn ${product.stock} sản phẩm.`
        }]);
    }

    if (existing) {
        existing.quantity = nextQuantity;
        existing.selected = true;
    } else {
        user.cartItems.push({ productId, quantity, selected: true });
    }
    await user.save();
    return loadCartSummary(user);
};

export const updateUserCartItem = async (userId, productId, updates) => {
    const user = await getCartUser(userId);
    const item = user.cartItems.find((entry) => stringId(entry.productId) === stringId(productId));
    if (!item) throw new AppError('Sản phẩm không có trong giỏ.', 404);

    if (updates.quantity !== undefined) {
        const product = await Product.findOne({ _id: productId, status: 'active' });
        if (!product) throw new AppError('Sản phẩm đã ngừng bán.', 409);
        if (updates.quantity > product.stock) {
            throw new AppError('Số lượng vượt quá tồn kho hiện có.', 409);
        }
        item.quantity = updates.quantity;
    }
    if (updates.selected !== undefined) item.selected = updates.selected;

    await user.save();
    return loadCartSummary(user);
};

export const removeUserCartItem = async (userId, productId) => {
    const user = await getCartUser(userId);
    const originalLength = user.cartItems.length;
    user.cartItems = user.cartItems.filter((item) => stringId(item.productId) !== stringId(productId));
    if (user.cartItems.length === originalLength) {
        throw new AppError('Sản phẩm không có trong giỏ.', 404);
    }
    await user.save();
    return loadCartSummary(user);
};
