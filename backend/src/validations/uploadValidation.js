import { sendError } from '../utils/apiResponse.js';

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_CONTENT_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
]);

const ALLOWED_FIELDS = new Set(['fileName', 'contentType', 'size']);

const validationError = (res, errors) => sendError(res, {
    statusCode: 422,
    message: 'Dữ liệu ảnh không hợp lệ.',
    errors
});

export const validateProductImageUpload = (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    const unknownField = Object.keys(body).find((field) => !ALLOWED_FIELDS.has(field));
    const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
    const contentType = typeof body.contentType === 'string'
        ? body.contentType.trim().toLowerCase()
        : '';
    const size = body.size;

    if (unknownField) {
        errors.push({ field: unknownField, message: 'Trường dữ liệu không được phép.' });
    }
    if (!fileName || fileName.length > 255) {
        errors.push({ field: 'fileName', message: 'Tên file là bắt buộc và tối đa 255 ký tự.' });
    }
    if (!PRODUCT_IMAGE_CONTENT_TYPES.has(contentType)) {
        errors.push({
            field: 'contentType',
            message: 'Ảnh phải có định dạng JPEG, PNG, WebP hoặc AVIF.'
        });
    }
    if (!Number.isSafeInteger(size) || size <= 0 || size > PRODUCT_IMAGE_MAX_BYTES) {
        errors.push({ field: 'size', message: 'Kích thước ảnh phải lớn hơn 0 và không quá 5 MB.' });
    }
    if (errors.length) return validationError(res, errors);

    req.body = { fileName, contentType, size };
    return next();
};
