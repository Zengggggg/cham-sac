import mongoose from 'mongoose';
import { sendError } from '../utils/apiResponse.js';
import { E164_PHONE_PATTERN, HTTPS_URL_PATTERN } from '../models/modelValidators.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRODUCT_STATUSES = new Set(['active', 'inactive', 'sold_out']);
const ORDER_STATUSES = new Set(['confirmed', 'shipping', 'done', 'cancelled']);
const PRODUCT_FIELDS = new Set(['name', 'description', 'price', 'stock', 'images', 'status', 'expectedUpdatedAt']);

const sendValidationError = (res, errors) => sendError(res, {
    statusCode: 422,
    message: 'Dữ liệu không hợp lệ.',
    errors
});

const trimString = (value) => typeof value === 'string' ? value.trim() : '';
const isNonNegativeMoney = (value) => Number.isSafeInteger(value) && value >= 0;
const isPositiveQuantity = (value) => Number.isSafeInteger(value) && value > 0;
const isValidDateString = (value) => (
    typeof value === 'string' && value.trim() && !Number.isNaN(Date.parse(value))
);

export const validateObjectIdParam = (paramName) => (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[paramName])) {
        return sendValidationError(res, [{
            field: paramName,
            message: `${paramName} không hợp lệ.`
        }]);
    }
    return next();
};

export const validateAddCartItem = (req, res, next) => {
    const productId = trimString(req.body?.productId);
    const quantity = req.body?.quantity;
    const errors = [];

    if (!mongoose.isValidObjectId(productId)) {
        errors.push({ field: 'productId', message: 'Sản phẩm không hợp lệ.' });
    }
    if (!isPositiveQuantity(quantity)) {
        errors.push({ field: 'quantity', message: 'Số lượng phải là số nguyên dương.' });
    }
    if (errors.length) return sendValidationError(res, errors);

    req.body = { productId, quantity };
    return next();
};

export const validateUpdateCartItem = (req, res, next) => {
    const quantity = req.body?.quantity;
    const selected = req.body?.selected;
    const errors = [];

    if (quantity === undefined && selected === undefined) {
        errors.push({ field: 'body', message: 'Cần cung cấp quantity hoặc selected.' });
    }
    if (quantity !== undefined && !isPositiveQuantity(quantity)) {
        errors.push({ field: 'quantity', message: 'Số lượng phải là số nguyên dương.' });
    }
    if (selected !== undefined && typeof selected !== 'boolean') {
        errors.push({ field: 'selected', message: 'selected phải là boolean.' });
    }
    if (errors.length) return sendValidationError(res, errors);

    req.body = {
        ...(quantity !== undefined ? { quantity } : {}),
        ...(selected !== undefined ? { selected } : {})
    };
    return next();
};

const normalizeCheckoutBody = (body) => ({
    customer: {
        fullName: trimString(body.customer?.fullName),
        phone: trimString(body.customer?.phone),
        email: trimString(body.customer?.email).toLowerCase()
    },
    shippingAddress: {
        addressLine: trimString(body.shippingAddress?.addressLine),
        ward: trimString(body.shippingAddress?.ward),
        province: trimString(body.shippingAddress?.province),
        note: trimString(body.shippingAddress?.note)
    }
});

export const validateCheckout = (req, res, next) => {
    const checkoutKey = trimString(req.get?.('Idempotency-Key'));
    const body = normalizeCheckoutBody(req.body || {});
    const errors = [];

    if (!checkoutKey || checkoutKey.length > 200) {
        errors.push({
            field: 'Idempotency-Key',
            message: 'Idempotency-Key là bắt buộc và tối đa 200 ký tự.'
        });
    }
    if (body.customer.fullName.length < 2 || body.customer.fullName.length > 100) {
        errors.push({ field: 'customer.fullName', message: 'Họ tên phải có từ 2 đến 100 ký tự.' });
    }
    if (!E164_PHONE_PATTERN.test(body.customer.phone)) {
        errors.push({ field: 'customer.phone', message: 'Số điện thoại phải theo định dạng E.164.' });
    }
    if (body.customer.email && (!EMAIL_PATTERN.test(body.customer.email) || body.customer.email.length > 254)) {
        errors.push({ field: 'customer.email', message: 'Email không hợp lệ.' });
    }
    if (!body.shippingAddress.addressLine || body.shippingAddress.addressLine.length > 500) {
        errors.push({ field: 'shippingAddress.addressLine', message: 'Địa chỉ chi tiết là bắt buộc.' });
    }
    if (!body.shippingAddress.province || body.shippingAddress.province.length > 200) {
        errors.push({ field: 'shippingAddress.province', message: 'Tỉnh/thành là bắt buộc.' });
    }
    if (body.shippingAddress.ward.length > 200) {
        errors.push({ field: 'shippingAddress.ward', message: 'Phường/xã tối đa 200 ký tự.' });
    }
    if (body.shippingAddress.note.length > 1000) {
        errors.push({ field: 'shippingAddress.note', message: 'Ghi chú tối đa 1000 ký tự.' });
    }
    if (errors.length) return sendValidationError(res, errors);

    if (!body.customer.email) delete body.customer.email;
    if (!body.shippingAddress.ward) delete body.shippingAddress.ward;
    if (!body.shippingAddress.note) delete body.shippingAddress.note;
    req.checkoutKey = checkoutKey;
    req.body = body;
    return next();
};

export const validateCreatePayment = (req, res, next) => {
    const orderId = trimString(req.body?.orderId);
    if (!mongoose.isValidObjectId(orderId)) {
        return sendValidationError(res, [{ field: 'orderId', message: 'Đơn hàng không hợp lệ.' }]);
    }
    req.body = { orderId };
    return next();
};

export const validateProductWrite = (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    const unknownFields = Object.keys(body).filter((field) => !PRODUCT_FIELDS.has(field));
    if (unknownFields.length) {
        errors.push({ field: unknownFields[0], message: 'Trường dữ liệu không được phép.' });
    }

    const isCreate = req.method === 'POST';
    const normalized = {};
    if (body.name !== undefined) {
        normalized.name = trimString(body.name);
        if (normalized.name.length < 2 || normalized.name.length > 200) {
            errors.push({ field: 'name', message: 'Tên phải có từ 2 đến 200 ký tự.' });
        }
    } else if (isCreate) errors.push({ field: 'name', message: 'Tên sản phẩm là bắt buộc.' });

    if (body.description !== undefined) {
        normalized.description = trimString(body.description);
        if (normalized.description.length > 5000) {
            errors.push({ field: 'description', message: 'Mô tả tối đa 5000 ký tự.' });
        }
    }
    if (body.price !== undefined) {
        normalized.price = body.price;
        if (!isNonNegativeMoney(body.price)) {
            errors.push({ field: 'price', message: 'Giá phải là số nguyên VND không âm.' });
        }
    } else if (isCreate) errors.push({ field: 'price', message: 'Giá là bắt buộc.' });

    if (body.stock !== undefined) {
        normalized.stock = body.stock;
        if (!isNonNegativeMoney(body.stock)) {
            errors.push({ field: 'stock', message: 'Tồn kho phải là số nguyên không âm.' });
        }
    } else if (isCreate) errors.push({ field: 'stock', message: 'Tồn kho là bắt buộc.' });

    if (body.images !== undefined) {
        normalized.images = body.images;
        if (!Array.isArray(body.images) || body.images.some((url) => (
            typeof url !== 'string' || url.length > 2048 || !HTTPS_URL_PATTERN.test(url)
        ))) {
            errors.push({ field: 'images', message: 'Mỗi ảnh phải là HTTPS URL hợp lệ.' });
        }
    }
    if (body.status !== undefined) {
        normalized.status = body.status;
        if (!PRODUCT_STATUSES.has(body.status)) {
            errors.push({ field: 'status', message: 'Trạng thái sản phẩm không hợp lệ.' });
        }
    } else if (isCreate) normalized.status = 'inactive';

    if (!isCreate) {
        if (!isValidDateString(body.expectedUpdatedAt)) {
            errors.push({ field: 'expectedUpdatedAt', message: 'expectedUpdatedAt là bắt buộc.' });
        } else normalized.expectedUpdatedAt = new Date(body.expectedUpdatedAt);
        if (Object.keys(normalized).length === 1 && normalized.expectedUpdatedAt) {
            errors.push({ field: 'body', message: 'Cần ít nhất một trường sản phẩm để cập nhật.' });
        }
    }
    if (errors.length) return sendValidationError(res, errors);

    req.body = normalized;
    return next();
};

export const validateOrderStatusUpdate = (req, res, next) => {
    const body = req.body || {};
    const status = trimString(body.status);
    const reason = trimString(body.reason);
    const forcePaymentOverride = body.forcePaymentOverride === true;
    const errors = [];

    if (!ORDER_STATUSES.has(status)) {
        errors.push({ field: 'status', message: 'Trạng thái đơn không hợp lệ.' });
    }
    if (!isValidDateString(body.expectedUpdatedAt)) {
        errors.push({ field: 'expectedUpdatedAt', message: 'expectedUpdatedAt là bắt buộc.' });
    }
    if ((status === 'cancelled' || forcePaymentOverride) && !reason) {
        errors.push({ field: 'reason', message: 'Lý do là bắt buộc cho thao tác này.' });
    }
    if (reason.length > 1000) {
        errors.push({ field: 'reason', message: 'Lý do tối đa 1000 ký tự.' });
    }
    if (body.forcePaymentOverride !== undefined && typeof body.forcePaymentOverride !== 'boolean') {
        errors.push({ field: 'forcePaymentOverride', message: 'forcePaymentOverride phải là boolean.' });
    }
    if (errors.length) return sendValidationError(res, errors);

    req.body = {
        status,
        reason: reason || undefined,
        forcePaymentOverride,
        expectedUpdatedAt: new Date(body.expectedUpdatedAt)
    };
    return next();
};
