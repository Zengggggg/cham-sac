import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createErrorResponse,
    createSuccessResponse,
    sendError,
    sendSuccess
} from '../src/utils/apiResponse.js';

const createResponseDouble = () => {
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
    return { res, result };
};

test('success response always follows the backend-to-frontend contract', () => {
    assert.deepEqual(createSuccessResponse({
        statusCode: 200,
        message: 'Lấy dữ liệu thành công.',
        data: { id: 'user-id' }
    }), {
        success: true,
        statusCode: 200,
        message: 'Lấy dữ liệu thành công.',
        data: { id: 'user-id' },
        meta: null,
        errors: null
    });
});

test('error response always has null data and normalizes errors to an array', () => {
    assert.deepEqual(createErrorResponse({
        statusCode: 400,
        message: 'Dữ liệu đầu vào không hợp lệ.',
        errors: { field: 'email', message: 'Email đã tồn tại.' }
    }), {
        success: false,
        statusCode: 400,
        message: 'Dữ liệu đầu vào không hợp lệ.',
        data: null,
        meta: null,
        errors: [{ field: 'email', message: 'Email đã tồn tại.' }]
    });
});

test('response senders keep the body statusCode equal to the HTTP status', () => {
    const success = createResponseDouble();
    sendSuccess(success.res, { statusCode: 201, message: 'Đã tạo.', data: { id: '1' } });
    assert.equal(success.result.httpStatusCode, 201);
    assert.equal(success.result.body.statusCode, 201);

    const failure = createResponseDouble();
    sendError(failure.res, { statusCode: 422, message: 'Không hợp lệ.' });
    assert.equal(failure.result.httpStatusCode, 422);
    assert.equal(failure.result.body.statusCode, 422);
});
