import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getAuthEnvironment } from '../config/environment.js';
import AppError from '../utils/appError.js';

const TOKEN_TYPES = {
    ACCESS: 'access',
    REFRESH: 'refresh'
};

const parseDurationToMilliseconds = (duration) => {
    const match = /^(\d+)(s|m|h|d)$/.exec(duration);

    if (!match) {
        throw new Error('REFRESH_TOKEN_EXPIRES_IN must use s, m, h, or d units');
    }

    const amount = Number.parseInt(match[1], 10);
    const unitMilliseconds = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    return amount * unitMilliseconds[match[2]];
};

export const hashToken = (token) => crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

export const createTokenPair = (user) => {
    const environment = getAuthEnvironment();
    const basePayload = {
        sub: user.id,
        role: user.role
    };

    const accessToken = jwt.sign(
        { ...basePayload, tokenType: TOKEN_TYPES.ACCESS },
        environment.jwtSecret,
        { expiresIn: environment.accessTokenExpiresIn }
    );
    const refreshToken = jwt.sign(
        { ...basePayload, tokenType: TOKEN_TYPES.REFRESH },
        environment.refreshTokenSecret,
        { expiresIn: environment.refreshTokenExpiresIn }
    );

    return {
        accessToken,
        refreshToken,
        refreshTokenHash: hashToken(refreshToken),
        refreshTokenExpiresAt: new Date(
            Date.now() + parseDurationToMilliseconds(environment.refreshTokenExpiresIn)
        )
    };
};

const verifyToken = (token, secret, expectedType) => {
    try {
        const payload = jwt.verify(token, secret);

        if (payload.tokenType !== expectedType || !payload.sub) {
            throw new AppError('Token không hợp lệ.', 401);
        }

        return payload;
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Token không hợp lệ hoặc đã hết hạn.', 401);
    }
};

export const verifyAccessToken = (token) => {
    const { jwtSecret } = getAuthEnvironment();
    return verifyToken(token, jwtSecret, TOKEN_TYPES.ACCESS);
};

export const verifyRefreshToken = (token) => {
    const { refreshTokenSecret } = getAuthEnvironment();
    return verifyToken(token, refreshTokenSecret, TOKEN_TYPES.REFRESH);
};
