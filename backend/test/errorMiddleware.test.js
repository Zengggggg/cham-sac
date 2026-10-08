import assert from 'node:assert/strict';
import test from 'node:test';
import { errorHandler } from '../src/middlewares/errorMiddleware.js';
import AppError from '../src/utils/appError.js';

const runErrorHandler = (error) => {
    const result = {};
    const res = {
        status(statusCode) {
            result.httpStatusCode = statusCode;
            return this;
        },
        json(body) {
            result.body = body;
            return this;
        }
    };

    errorHandler(error, {}, res, () => {});
    return result;
};

test('operational errors follow the shared response contract', () => {
    const result = runErrorHandler(new AppError('Không tìm thấy dữ liệu.', 404));

    assert.deepEqual(result.body, {
        success: false,
        statusCode: 404,
        message: 'Không tìm thấy dữ liệu.',
        data: null,
        meta: null,
        errors: null
    });
    assert.equal(result.httpStatusCode, result.body.statusCode);
});

test('production server errors do not expose internal details', () => {
    const originalEnvironment = process.env.NODE_ENV;
    const originalConsoleError = console.error;
    process.env.NODE_ENV = 'production';
    console.error = () => {};

    try {
        const result = runErrorHandler(new Error('Database connection timeout'));
        assert.equal(result.httpStatusCode, 500);
        assert.equal(result.body.statusCode, 500);
        assert.equal(result.body.data, null);
        assert.equal(result.body.errors, null);
    } finally {
        console.error = originalConsoleError;
        if (originalEnvironment === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = originalEnvironment;
    }
});
