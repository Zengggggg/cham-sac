import { OAuth2Client } from 'google-auth-library';
import { getGoogleClientId } from '../config/environment.js';
import AppError from '../utils/appError.js';

const googleClient = new OAuth2Client();

export const normalizeGooglePayload = (payload) => {
    const googleId = typeof payload?.sub === 'string' ? payload.sub.trim() : '';
    const email = typeof payload?.email === 'string'
        ? payload.email.trim().toLowerCase()
        : '';
    const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
    const avatarUrl = typeof payload?.picture === 'string' ? payload.picture.trim() : null;

    if (!googleId || !email || payload?.email_verified !== true) {
        throw new AppError('Tài khoản Google không có email đã xác minh.', 401);
    }

    return {
        googleId,
        email,
        name: name || email.split('@')[0],
        avatarUrl
    };
};

export const verifyGoogleIdToken = async (idToken) => {
    let googleClientId;

    try {
        googleClientId = getGoogleClientId();
    } catch {
        throw new AppError('Đăng nhập Google chưa được cấu hình.', 503);
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: googleClientId
        });
        return normalizeGooglePayload(ticket.getPayload());
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Google ID token không hợp lệ hoặc đã hết hạn.', 401);
    }
};
