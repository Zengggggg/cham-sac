import AppError from '../utils/appError.js';
import { sendError } from '../utils/apiResponse.js';

export const notFoundHandler = (req, _res, next) => {
    next(new AppError(`Không tìm thấy endpoint ${req.method} ${req.originalUrl}.`, 404));
};

export const errorHandler = (error, _req, res, next) => {
    void next;
    if (error instanceof AppError) {
        return sendError(res, {
            statusCode: error.statusCode,
            message: error.message,
            errors: error.details
        });
    }

    if (error?.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors || {}).map((detail) => ({
            field: detail.path,
            message: detail.message
        }));
        return sendError(res, {
            statusCode: 422,
            message: 'Dữ liệu không hợp lệ.',
            errors: validationErrors
        });
    }

    if (error?.type === 'entity.parse.failed') {
        return sendError(res, {
            statusCode: 400,
            message: 'JSON không hợp lệ.'
        });
    }

    console.error(error);
    return sendError(res, {
        statusCode: 500,
        message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau!',
        errors: process.env.NODE_ENV === 'development'
            ? [{ message: error.message }]
            : null
    });
};
