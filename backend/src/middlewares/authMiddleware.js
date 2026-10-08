import User from '../models/userModel.js';
import { verifyAccessToken } from '../services/tokenService.js';
import AppError from '../utils/appError.js';

export const authenticate = async (req, _res, next) => {
    try {
        const authorization = req.get('authorization');

        if (!authorization?.startsWith('Bearer ')) {
            throw new AppError('Bạn cần đăng nhập để tiếp tục.', 401);
        }

        const token = authorization.slice('Bearer '.length).trim();
        const payload = verifyAccessToken(token);
        const user = await User.findById(payload.sub);

        if (!user) {
            throw new AppError('Tài khoản không tồn tại.', 401);
        }
        if (user.status !== 'active') {
            throw new AppError('Tài khoản đã bị khóa.', 403);
        }

        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
};

export const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
        return next(new AppError('Bạn không có quyền thực hiện thao tác này.', 403));
    }

    return next();
};
