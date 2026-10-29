import {
    linkGoogleAccount,
    loginWithGoogle,
    loginUser,
    logoutUser,
    refreshUserToken,
    registerUser,
    requestPasswordResetOtp,
    resetUserPassword,
    resendUserEmailVerificationOtp,
    updateUserProfile,
    verifyUserEmail
} from '../services/authService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const googleLogin = async (req, res, next) => {
    try {
        const auth = await loginWithGoogle(req.body.idToken);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Đăng nhập bằng Google thành công.',
            data: auth
        });
    } catch (error) {
        return next(error);
    }
};

export const linkGoogle = async (req, res, next) => {
    try {
        const user = await linkGoogleAccount(req.user.id, req.body.idToken);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Liên kết tài khoản Google thành công.',
            data: { user }
        });
    } catch (error) {
        return next(error);
    }
};

export const register = async (req, res, next) => {
    try {
        const verification = await registerUser(req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Đã gửi OTP xác minh đến email của bạn.',
            data: verification
        });
    } catch (error) {
        return next(error);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const auth = await verifyUserEmail(req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Xác minh email và kích hoạt tài khoản thành công.',
            data: auth
        });
    } catch (error) {
        return next(error);
    }
};

export const resendEmailVerificationOtp = async (req, res, next) => {
    try {
        const verification = await resendUserEmailVerificationOtp(req.body.email);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Nếu tài khoản đang chờ xác minh, OTP mới đã được gửi đến email.',
            data: verification
        });
    } catch (error) {
        return next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const auth = await loginUser(req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Đăng nhập thành công.',
            data: auth
        });
    } catch (error) {
        return next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const passwordReset = await requestPasswordResetOtp(req.body.email);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Đã gửi OTP đặt lại mật khẩu đến email của bạn.',
            data: passwordReset
        });
    } catch (error) {
        return next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        await resetUserPassword(req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Đặt lại mật khẩu thành công.'
        });
    } catch (error) {
        return next(error);
    }
};

export const refreshToken = async (req, res, next) => {
    try {
        const auth = await refreshUserToken(req.body.refreshToken);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Làm mới phiên đăng nhập thành công.',
            data: auth
        });
    } catch (error) {
        return next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        await logoutUser(req.body.refreshToken);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Đăng xuất thành công.'
        });
    } catch (error) {
        return next(error);
    }
};

export const getCurrentUser = (req, res) => sendSuccess(res, {
    statusCode: 200,
    message: 'Lấy thông tin người dùng thành công.',
    data: { user: req.user.toJSON() }
});

export const updateCurrentUser = async (req, res, next) => {
    try {
        const user = await updateUserProfile(req.user.id, req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật hồ sơ thành công.',
            data: { user }
        });
    } catch (error) {
        return next(error);
    }
};
