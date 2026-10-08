import express from 'express';
import {
    getCurrentUser,
    googleLogin,
    linkGoogle,
    login,
    logout,
    refreshToken,
    register,
    resendEmailVerificationOtp,
    verifyEmail
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import {
    authRateLimit,
    emailOtpResendRateLimit,
    emailOtpVerificationRateLimit
} from '../middlewares/authRateLimit.js';
import {
    validateEmailOtp,
    validateGoogleIdToken,
    validateLogin,
    validateRefreshToken,
    validateRegistration,
    validateVerificationEmail
} from '../validations/authValidation.js';

const authRouter = express.Router();

authRouter.post('/register', authRateLimit, validateRegistration, register);
authRouter.post('/verify-email', emailOtpVerificationRateLimit, validateEmailOtp, verifyEmail);
authRouter.post(
    '/resend-verification-otp',
    emailOtpResendRateLimit,
    validateVerificationEmail,
    resendEmailVerificationOtp
);
authRouter.post('/login', authRateLimit, validateLogin, login);
authRouter.post('/google', authRateLimit, validateGoogleIdToken, googleLogin);
authRouter.post('/google/link', authRateLimit, authenticate, validateGoogleIdToken, linkGoogle);
authRouter.post('/refresh-token', authRateLimit, validateRefreshToken, refreshToken);
authRouter.post('/logout', validateRefreshToken, logout);
authRouter.get('/me', authenticate, getCurrentUser);

export default authRouter;
