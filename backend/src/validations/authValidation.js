import { sendError } from '../utils/apiResponse.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const EMAIL_OTP_PATTERN = /^\d{6}$/;

const sendValidationError = (res, errors) => sendError(res, {
    statusCode: 422,
    message: 'Dữ liệu không hợp lệ.',
    errors
});

export const validateRegistration = (req, res, next) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const errors = [];

    if (name.length < 2 || name.length > 100) {
        errors.push({ field: 'name', message: 'Tên phải có từ 2 đến 100 ký tự.' });
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        errors.push({ field: 'email', message: 'Email không hợp lệ.' });
    }
    if (password.length < 8 || password.length > 72 || !PASSWORD_PATTERN.test(password)) {
        errors.push({
            field: 'password',
            message: 'Mật khẩu phải có 8-72 ký tự, gồm ít nhất một chữ cái và một chữ số.'
        });
    }
    if (Object.hasOwn(body, 'role')) {
        errors.push({ field: 'role', message: 'Không thể tự chọn vai trò khi đăng ký.' });
    }

    if (errors.length > 0) return sendValidationError(res, errors);

    req.body = { name, email, password };
    return next();
};

export const validateLogin = (req, res, next) => {
    const body = req.body || {};
    const email = typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const errors = [];

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        errors.push({ field: 'email', message: 'Email không hợp lệ.' });
    }
    if (!password) {
        errors.push({ field: 'password', message: 'Mật khẩu là bắt buộc.' });
    }

    if (errors.length > 0) return sendValidationError(res, errors);

    req.body = { email, password };
    return next();
};

export const validateEmailOtp = (req, res, next) => {
    const body = req.body || {};
    const email = typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';
    const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
    const errors = [];

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        errors.push({ field: 'email', message: 'Email không hợp lệ.' });
    }
    if (!EMAIL_OTP_PATTERN.test(otp)) {
        errors.push({ field: 'otp', message: 'OTP phải gồm đúng 6 chữ số.' });
    }

    if (errors.length > 0) return sendValidationError(res, errors);

    req.body = { email, otp };
    return next();
};

export const validateVerificationEmail = (req, res, next) => {
    const body = req.body || {};
    const email = typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        return sendValidationError(res, [{ field: 'email', message: 'Email không hợp lệ.' }]);
    }

    req.body = { email };
    return next();
};

export const validateRefreshToken = (req, res, next) => {
    const body = req.body || {};
    const refreshToken = typeof body.refreshToken === 'string'
        ? body.refreshToken.trim()
        : '';

    if (!refreshToken) {
        return sendValidationError(res, [{
            field: 'refreshToken',
            message: 'Refresh token là bắt buộc.'
        }]);
    }

    req.body = { refreshToken };
    return next();
};

export const validateGoogleIdToken = (req, res, next) => {
    const body = req.body || {};
    const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : '';

    if (!idToken || idToken.length > 10000) {
        return sendValidationError(res, [{
            field: 'idToken',
            message: 'Google ID token không hợp lệ.'
        }]);
    }

    req.body = { idToken };
    return next();
};
