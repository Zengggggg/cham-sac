import mongoose from 'mongoose';
import { sendError } from '../utils/apiResponse.js';

const sendValidationError = (res, errors) => sendError(res, {
    statusCode: 422,
    message: 'Dữ liệu không hợp lệ.',
    errors
});

const rejectUnknownFields = (body, allowedFields, errors) => {
    const unknownField = Object.keys(body).find((field) => !allowedFields.has(field));
    if (unknownField) {
        errors.push({ field: unknownField, message: 'Trường dữ liệu không được phép.' });
    }
};

const normalizeText = (value) => typeof value === 'string' ? value.trim() : '';

const validateQuestionContentValue = (body, errors, normalized) => {
    const content = normalizeText(body.content);
    if (content.length < 3 || content.length > 500) {
        errors.push({
            field: 'content',
            message: 'Câu hỏi phải có từ 3 đến 500 ký tự.'
        });
    } else {
        normalized.content = content;
    }
};

const validateExpectedUpdatedAt = (body, errors, normalized) => {
    const value = normalizeText(body.expectedUpdatedAt);
    if (!value || Number.isNaN(Date.parse(value))) {
        errors.push({
            field: 'expectedUpdatedAt',
            message: 'expectedUpdatedAt là bắt buộc và phải là thời gian hợp lệ.'
        });
    } else {
        normalized.expectedUpdatedAt = new Date(value);
    }
};

export const validateQuestionWrite = (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    const normalized = {};
    rejectUnknownFields(body, new Set(['content']), errors);
    validateQuestionContentValue(body, errors, normalized);
    if (errors.length) return sendValidationError(res, errors);
    req.body = normalized;
    return next();
};

export const validateAdminQuestionWrite = (req, res, next) => {
    const body = req.body || {};
    const update = req.method === 'PATCH';
    const errors = [];
    const normalized = {};
    rejectUnknownFields(
        body,
        new Set(update ? ['content', 'expectedUpdatedAt'] : ['content']),
        errors
    );
    validateQuestionContentValue(body, errors, normalized);
    if (update) validateExpectedUpdatedAt(body, errors, normalized);
    if (errors.length) return sendValidationError(res, errors);
    req.body = normalized;
    return next();
};

export const validateAdminQuestionDelete = (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    const normalized = {};
    rejectUnknownFields(body, new Set(['expectedUpdatedAt']), errors);
    validateExpectedUpdatedAt(body, errors, normalized);
    if (errors.length) return sendValidationError(res, errors);
    req.body = normalized;
    return next();
};

export const validatePrivateQuestionListWrite = (req, res, next) => {
    const body = req.body || {};
    const create = req.method === 'POST';
    const errors = [];
    const normalized = {};
    rejectUnknownFields(body, new Set(['name', 'heritageSiteId']), errors);

    if (body.name !== undefined || create) {
        const name = normalizeText(body.name);
        if (name.length < 2 || name.length > 100) {
            errors.push({
                field: 'name',
                message: 'Tên danh sách phải có từ 2 đến 100 ký tự.'
            });
        } else {
            normalized.name = name;
        }
    }

    if (body.heritageSiteId !== undefined || create) {
        const heritageSiteId = normalizeText(body.heritageSiteId);
        if (!mongoose.isValidObjectId(heritageSiteId)) {
            errors.push({ field: 'heritageSiteId', message: 'Địa danh không hợp lệ.' });
        } else {
            normalized.heritageSiteId = heritageSiteId;
        }
    }

    if (!create && Object.keys(normalized).length === 0) {
        errors.push({ field: 'body', message: 'Cần ít nhất một trường để cập nhật.' });
    }
    if (errors.length) return sendValidationError(res, errors);
    req.body = normalized;
    return next();
};
