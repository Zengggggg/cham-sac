import mongoose from 'mongoose';
import { sendError } from '../utils/apiResponse.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateContactWrite = (req, res, next) => {
    const body = req.body || {};
    const fields = ['receiverName', 'phone', 'email', 'topic', 'message'];
    const errors = fields
        .filter((field) => typeof body[field] !== 'string' || !body[field].trim())
        .map((field) => ({ field, message: `${field} là bắt buộc.` }));
    if (body.email && !emailPattern.test(String(body.email).trim())) errors.push({ field: 'email', message: 'Email không hợp lệ.' });
    if (errors.length) return sendError(res, { statusCode: 422, message: 'Dữ liệu liên hệ không hợp lệ.', errors });
    req.body = Object.fromEntries(fields.map((field) => [field, body[field].trim()]));
    return next();
};

export const validateContactStatus = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id) || typeof req.body?.isContactted !== 'boolean') {
        return sendError(res, { statusCode: 422, message: 'Trạng thái liên hệ không hợp lệ.' });
    }
    return next();
};
