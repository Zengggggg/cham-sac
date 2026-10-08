import { rateLimit } from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';

const buildRateLimitHandler = (message) => (req, res) => {
    void req;
    return sendError(res, {
        statusCode: 429,
        message
    });
};

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: buildRateLimitHandler(
        'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.'
    )
});

export const emailOtpVerificationRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: buildRateLimitHandler(
        'Bạn đã nhập OTP quá nhiều lần. Vui lòng thử lại sau 15 phút.'
    )
});

export const emailOtpResendRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: buildRateLimitHandler(
        'Bạn đã yêu cầu gửi OTP quá nhiều lần. Vui lòng thử lại sau.'
    )
});
