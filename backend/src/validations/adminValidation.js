import mongoose from 'mongoose';
import { GLB_URL_PATTERN, HTTPS_URL_PATTERN } from '../models/modelValidators.js';
import { sendError } from '../utils/apiResponse.js';

const USER_STATUSES = new Set(['pending_verification', 'active', 'blocked']);
const AR_MODEL_STATUSES = new Set(['draft', 'published', 'hidden', 'deleted']);
const GAME_RULE_CREATE_FIELDS = new Set([
    'productId', 'title', 'summary', 'content', 'coverImageUrl'
]);
const GAME_RULE_UPDATE_FIELDS = new Set([
    'title', 'summary', 'content', 'coverImageUrl', 'expectedUpdatedAt'
]);
const HERITAGE_SITE_CREATE_FIELDS = new Set([
    'name', 'shortDescription', 'content', 'targetImageUrl'
]);
const HERITAGE_SITE_UPDATE_FIELDS = new Set([
    'name', 'shortDescription', 'content', 'targetImageUrl', 'expectedUpdatedAt'
]);
const AR_MODEL_CREATE_FIELDS = new Set([
    'heritageSiteId', 'targetIndex', 'model3dUrl', 'defaultScale', 'defaultPosition',
    'defaultRotation', 'thumbnail', 'status'
]);
const AR_MODEL_UPDATE_FIELDS = new Set([
    'targetIndex', 'model3dUrl', 'defaultScale', 'defaultPosition', 'defaultRotation',
    'thumbnail', 'status', 'expectedUpdatedAt'
]);

const sendValidationError = (res, errors) => sendError(res, {
    statusCode: 422,
    message: 'Dữ liệu không hợp lệ.',
    errors
});

const trimString = (value) => typeof value === 'string' ? value.trim() : '';
const isValidDateString = (value) => (
    typeof value === 'string' && value.trim() && !Number.isNaN(Date.parse(value))
);

const rejectUnknownFields = (body, allowedFields, errors) => {
    const unknownField = Object.keys(body).find((field) => !allowedFields.has(field));
    if (unknownField) {
        errors.push({ field: unknownField, message: 'Trường dữ liệu không được phép.' });
    }
};

const validateRequiredText = (body, field, { maxLength, create }, errors, normalized) => {
    if (body[field] === undefined) {
        if (create) errors.push({ field, message: `${field} là bắt buộc.` });
        return;
    }
    const value = trimString(body[field]);
    if (!value || value.length > maxLength) {
        errors.push({
            field,
            message: `${field} phải có nội dung và tối đa ${maxLength} ký tự.`
        });
        return;
    }
    normalized[field] = value;
};

const validateOptionalHttpsUrl = (body, field, errors, normalized) => {
    if (body[field] === undefined) return;
    const value = trimString(body[field]);
    if (!value || value.length > 2048 || !HTTPS_URL_PATTERN.test(value)) {
        errors.push({ field, message: `${field} phải là HTTPS URL hợp lệ.` });
        return;
    }
    normalized[field] = value;
};

const validateExpectedUpdatedAt = (body, errors, normalized) => {
    if (!isValidDateString(body.expectedUpdatedAt)) {
        errors.push({
            field: 'expectedUpdatedAt',
            message: 'expectedUpdatedAt là bắt buộc và phải là thời gian hợp lệ.'
        });
        return;
    }
    normalized.expectedUpdatedAt = new Date(body.expectedUpdatedAt);
};

export const validateUserStatusUpdate = (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    rejectUnknownFields(body, new Set(['status', 'expectedUpdatedAt']), errors);

    const status = trimString(body.status);
    if (!USER_STATUSES.has(status)) {
        errors.push({ field: 'status', message: 'Trạng thái tài khoản không hợp lệ.' });
    }
    const normalized = { status };
    validateExpectedUpdatedAt(body, errors, normalized);
    if (errors.length) return sendValidationError(res, errors);

    req.body = normalized;
    return next();
};

export const validateGameRuleWrite = (req, res, next) => {
    const body = req.body || {};
    const create = req.method === 'POST';
    const errors = [];
    const normalized = {};
    rejectUnknownFields(
        body,
        create ? GAME_RULE_CREATE_FIELDS : GAME_RULE_UPDATE_FIELDS,
        errors
    );

    if (create) {
        const productId = trimString(body.productId);
        if (!mongoose.isValidObjectId(productId)) {
            errors.push({ field: 'productId', message: 'Sản phẩm không hợp lệ.' });
        } else normalized.productId = productId;
    }
    validateRequiredText(body, 'title', { maxLength: 300, create }, errors, normalized);
    validateRequiredText(body, 'summary', { maxLength: 2000, create }, errors, normalized);
    validateRequiredText(body, 'content', { maxLength: 100000, create }, errors, normalized);
    validateOptionalHttpsUrl(body, 'coverImageUrl', errors, normalized);
    if (!create) validateExpectedUpdatedAt(body, errors, normalized);

    const managedFieldCount = Object.keys(normalized)
        .filter((field) => field !== 'expectedUpdatedAt').length;
    if (!create && managedFieldCount === 0) {
        errors.push({ field: 'body', message: 'Cần ít nhất một trường luật chơi để cập nhật.' });
    }
    if (errors.length) return sendValidationError(res, errors);

    req.body = normalized;
    return next();
};

export const validateHeritageSiteWrite = (req, res, next) => {
    const body = req.body || {};
    const create = req.method === 'POST';
    const errors = [];
    const normalized = {};
    rejectUnknownFields(
        body,
        create ? HERITAGE_SITE_CREATE_FIELDS : HERITAGE_SITE_UPDATE_FIELDS,
        errors
    );

    validateRequiredText(body, 'name', { maxLength: 200, create }, errors, normalized);
    if (normalized.name && normalized.name.length < 2) {
        errors.push({ field: 'name', message: 'name phải có từ 2 đến 200 ký tự.' });
    }
    validateRequiredText(
        body,
        'shortDescription',
        { maxLength: 1000, create },
        errors,
        normalized
    );
    validateRequiredText(body, 'content', { maxLength: 100000, create }, errors, normalized);

    if (body.targetImageUrl !== undefined) {
        validateOptionalHttpsUrl(body, 'targetImageUrl', errors, normalized);
    } else if (create) {
        errors.push({ field: 'targetImageUrl', message: 'targetImageUrl là bắt buộc.' });
    }
    if (!create) validateExpectedUpdatedAt(body, errors, normalized);

    const managedFieldCount = Object.keys(normalized)
        .filter((field) => field !== 'expectedUpdatedAt').length;
    if (!create && managedFieldCount === 0) {
        errors.push({ field: 'body', message: 'Cần ít nhất một trường địa danh để cập nhật.' });
    }
    if (errors.length) return sendValidationError(res, errors);

    req.body = normalized;
    return next();
};

const validateVector = (body, field, errors, normalized) => {
    if (body[field] === undefined) return;
    const value = body[field];
    const axes = ['x', 'y', 'z'];
    if (!value || typeof value !== 'object' || Array.isArray(value)
        || Object.keys(value).length !== axes.length
        || !axes.every((axis) => Number.isFinite(value[axis]))) {
        errors.push({ field, message: `${field} phải gồm ba số hữu hạn x, y, z.` });
        return;
    }
    normalized[field] = { x: value.x, y: value.y, z: value.z };
};

export const validateArModelWrite = (req, res, next) => {
    const body = req.body || {};
    const create = req.method === 'POST';
    const errors = [];
    const normalized = {};
    rejectUnknownFields(
        body,
        create ? AR_MODEL_CREATE_FIELDS : AR_MODEL_UPDATE_FIELDS,
        errors
    );

    if (create) {
        const heritageSiteId = trimString(body.heritageSiteId);
        if (!mongoose.isValidObjectId(heritageSiteId)) {
            errors.push({ field: 'heritageSiteId', message: 'Địa danh không hợp lệ.' });
        } else normalized.heritageSiteId = heritageSiteId;
    }
    if (body.targetIndex !== undefined) {
        if (!Number.isInteger(body.targetIndex) || body.targetIndex < 0 || body.targetIndex > 8) {
            errors.push({ field: 'targetIndex', message: 'targetIndex phải là số nguyên từ 0 đến 8.' });
        } else normalized.targetIndex = body.targetIndex;
    }
    if (body.model3dUrl !== undefined) {
        const model3dUrl = trimString(body.model3dUrl);
        if (!model3dUrl || model3dUrl.length > 2048 || !GLB_URL_PATTERN.test(model3dUrl)) {
            errors.push({ field: 'model3dUrl', message: 'model3dUrl phải là HTTPS URL tới file .glb.' });
        } else normalized.model3dUrl = model3dUrl;
    } else if (create) {
        errors.push({ field: 'model3dUrl', message: 'model3dUrl là bắt buộc.' });
    }
    if (body.defaultScale !== undefined) {
        if (!Number.isFinite(body.defaultScale) || body.defaultScale <= 0) {
            errors.push({ field: 'defaultScale', message: 'defaultScale phải là số dương.' });
        } else normalized.defaultScale = body.defaultScale;
    }
    validateVector(body, 'defaultPosition', errors, normalized);
    validateVector(body, 'defaultRotation', errors, normalized);
    validateOptionalHttpsUrl(body, 'thumbnail', errors, normalized);

    if (body.status !== undefined) {
        const status = trimString(body.status);
        if (!AR_MODEL_STATUSES.has(status)) {
            errors.push({ field: 'status', message: 'Trạng thái model AR không hợp lệ.' });
        } else normalized.status = status;
    }
    if (!create) validateExpectedUpdatedAt(body, errors, normalized);

    const managedFieldCount = Object.keys(normalized)
        .filter((field) => field !== 'expectedUpdatedAt').length;
    if (!create && managedFieldCount === 0) {
        errors.push({ field: 'body', message: 'Cần ít nhất một trường model AR để cập nhật.' });
    }
    if (errors.length) return sendValidationError(res, errors);

    req.body = normalized;
    return next();
};

export const validateVersionedDelete = (req, res, next) => {
    const body = req.body || {};
    const errors = [];
    const normalized = {};
    rejectUnknownFields(body, new Set(['expectedUpdatedAt']), errors);
    validateExpectedUpdatedAt(body, errors, normalized);
    if (errors.length) return sendValidationError(res, errors);
    req.body = normalized;
    return next();
};
