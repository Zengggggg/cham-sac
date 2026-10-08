import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import {
    createTokenPair,
    hashToken,
    verifyRefreshToken
} from './tokenService.js';
import { getAuthEnvironment, getEmailEnvironment } from '../config/environment.js';
import { verifyGoogleIdToken } from '../providers/googleAuthProvider.js';
import { sendVerificationOtpEmail } from '../providers/emailProvider.js';
import { createEmailOtp, verifyEmailOtpHash } from '../utils/emailOtp.js';

const getUserWithSecrets = (filter) => User.findOne(filter)
    .select(`
        +passwordHash
        +googleId
        +refreshTokenHash
        +refreshTokenExpiresAt
        +emailVerificationOtpHash
        +emailVerificationOtpExpiresAt
        +emailVerificationOtpAttempts
        +emailVerificationOtpSentAt
    `);

const saveRefreshToken = async (user, tokenPair) => {
    user.refreshTokenHash = tokenPair.refreshTokenHash;
    user.refreshTokenExpiresAt = tokenPair.refreshTokenExpiresAt;
    await user.save({ validateBeforeSave: false });
};

const buildAuthResponse = (user, tokenPair) => ({
    user: user.toJSON(),
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken
});

const issueEmailVerificationOtp = async (user) => {
    const { bcryptSaltRounds } = getAuthEnvironment();
    const emailEnvironment = getEmailEnvironment();
    const otpData = await createEmailOtp({
        saltRounds: bcryptSaltRounds,
        expiresInMinutes: emailEnvironment.otpExpiresInMinutes
    });

    user.emailVerificationOtpHash = otpData.hash;
    user.emailVerificationOtpExpiresAt = otpData.expiresAt;
    user.emailVerificationOtpAttempts = 0;
    user.emailVerificationOtpSentAt = otpData.issuedAt;
    await user.save({ validateBeforeSave: false });

    await sendVerificationOtpEmail({
        to: user.email,
        name: user.name,
        otp: otpData.otp,
        expiresInMinutes: emailEnvironment.otpExpiresInMinutes,
        idempotencyKey: `email-verification/${user.id}/${otpData.issuedAt.getTime()}`
    });

    return {
        email: user.email,
        verificationRequired: true,
        expiresInSeconds: emailEnvironment.otpExpiresInMinutes * 60
    };
};

export const registerUser = async ({ name, email, password }) => {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
        if (existingUser.status === 'pending_verification') {
            throw new AppError(
                'Tài khoản đang chờ xác minh email. Hãy yêu cầu gửi lại OTP.',
                409
            );
        }
        throw new AppError('Email đã được sử dụng.', 409);
    }

    const { bcryptSaltRounds } = getAuthEnvironment();
    const passwordHash = await bcrypt.hash(password, bcryptSaltRounds);

    try {
        const user = await User.create({
            name,
            fullName: name,
            email,
            passwordHash,
            role: 'user',
            status: 'pending_verification'
        });
        return issueEmailVerificationOtp(user);
    } catch (error) {
        if (error?.code === 11000) {
            throw new AppError('Email đã được sử dụng.', 409);
        }
        throw error;
    }
};

export const verifyUserEmail = async ({ email, otp }) => {
    const user = await getUserWithSecrets({ email });
    const { otpMaxAttempts } = getEmailEnvironment();

    if (!user || user.status !== 'pending_verification') {
        throw new AppError('OTP không hợp lệ hoặc tài khoản đã được xác minh.', 400);
    }
    if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
        throw new AppError('OTP không tồn tại. Vui lòng yêu cầu gửi lại OTP.', 400);
    }
    if (user.emailVerificationOtpAttempts >= otpMaxAttempts) {
        throw new AppError('OTP đã bị khóa do nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.', 429);
    }
    if (user.emailVerificationOtpExpiresAt <= new Date()) {
        throw new AppError('OTP đã hết hạn. Vui lòng yêu cầu gửi lại OTP.', 410);
    }

    const isOtpValid = await verifyEmailOtpHash(otp, user.emailVerificationOtpHash);
    if (!isOtpValid) {
        user.emailVerificationOtpAttempts += 1;
        await user.save({ validateBeforeSave: false });

        if (user.emailVerificationOtpAttempts >= otpMaxAttempts) {
            throw new AppError(
                'OTP đã bị khóa do nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.',
                429
            );
        }
        throw new AppError('OTP không đúng.', 400);
    }

    user.status = 'active';
    user.emailVerifiedAt = new Date();
    user.emailVerificationOtpHash = null;
    user.emailVerificationOtpExpiresAt = null;
    user.emailVerificationOtpAttempts = 0;
    user.emailVerificationOtpSentAt = null;

    const tokenPair = createTokenPair(user);
    user.refreshTokenHash = tokenPair.refreshTokenHash;
    user.refreshTokenExpiresAt = tokenPair.refreshTokenExpiresAt;
    await user.save({ validateBeforeSave: false });

    return buildAuthResponse(user, tokenPair);
};

export const resendUserEmailVerificationOtp = async (email) => {
    const user = await getUserWithSecrets({ email });
    const emailEnvironment = getEmailEnvironment();

    if (!user || user.status !== 'pending_verification') {
        return { email, verificationRequired: true };
    }

    const cooldownMilliseconds = emailEnvironment.otpResendCooldownSeconds * 1000;
    const nextAllowedAt = user.emailVerificationOtpSentAt
        ? user.emailVerificationOtpSentAt.getTime() + cooldownMilliseconds
        : 0;

    if (nextAllowedAt > Date.now()) {
        const retryAfterSeconds = Math.ceil((nextAllowedAt - Date.now()) / 1000);
        throw new AppError(
            `Vui lòng đợi ${retryAfterSeconds} giây trước khi yêu cầu OTP mới.`,
            429
        );
    }

    return issueEmailVerificationOtp(user);
};

export const loginUser = async ({ email, password }) => {
    const user = await getUserWithSecrets({ email });
    const isPasswordValid = user?.passwordHash
        ? await bcrypt.compare(password, user.passwordHash)
        : false;

    if (!user || !isPasswordValid) {
        throw new AppError('Email hoặc mật khẩu không đúng.', 401);
    }

    if (user.status === 'pending_verification') {
        throw new AppError('Tài khoản chưa xác minh email.', 403);
    }
    if (user.status !== 'active') {
        throw new AppError('Tài khoản đã bị khóa.', 403);
    }

    const tokenPair = createTokenPair(user);
    await saveRefreshToken(user, tokenPair);
    return buildAuthResponse(user, tokenPair);
};

export const loginWithGoogle = async (idToken) => {
    const googleProfile = await verifyGoogleIdToken(idToken);
    let user = await getUserWithSecrets({ googleId: googleProfile.googleId });

    if (!user) {
        const userWithEmail = await getUserWithSecrets({ email: googleProfile.email });

        if (userWithEmail) {
            throw new AppError(
                'Email đã có tài khoản. Hãy đăng nhập bằng mật khẩu rồi liên kết Google.',
                409
            );
        }

        try {
            user = await User.create({
                name: googleProfile.name,
                fullName: googleProfile.name,
                email: googleProfile.email,
                googleId: googleProfile.googleId,
                avatarUrl: googleProfile.avatarUrl,
                role: 'user',
                status: 'active',
                emailVerifiedAt: new Date()
            });
        } catch (error) {
            if (error?.code !== 11000) throw error;

            user = await getUserWithSecrets({ googleId: googleProfile.googleId });
            if (!user) {
                throw new AppError('Email đã được sử dụng.', 409);
            }
        }
    }

    if (user.status !== 'active') {
        throw new AppError('Tài khoản đã bị khóa.', 403);
    }

    const tokenPair = createTokenPair(user);
    await saveRefreshToken(user, tokenPair);
    return buildAuthResponse(user, tokenPair);
};

export const linkGoogleAccount = async (userId, idToken) => {
    const googleProfile = await verifyGoogleIdToken(idToken);
    const existingGoogleUser = await User.findOne({ googleId: googleProfile.googleId });

    if (existingGoogleUser && existingGoogleUser.id !== userId) {
        throw new AppError('Tài khoản Google đã được liên kết với người dùng khác.', 409);
    }

    const user = await getUserWithSecrets({ _id: userId });
    if (!user) {
        throw new AppError('Tài khoản không tồn tại.', 404);
    }
    if (user.googleId && user.googleId !== googleProfile.googleId) {
        throw new AppError('Tài khoản đã liên kết với một Google Account khác.', 409);
    }

    user.googleId = googleProfile.googleId;
    user.avatarUrl = googleProfile.avatarUrl || user.avatarUrl;
    await user.save({ validateBeforeSave: false });
    return user.toJSON();
};

export const refreshUserToken = async (refreshToken) => {
    const payload = verifyRefreshToken(refreshToken);
    const user = await getUserWithSecrets({ _id: payload.sub });

    if (!user || user.status !== 'active') {
        throw new AppError('Phiên đăng nhập không hợp lệ.', 401);
    }

    const hasValidStoredToken = user.refreshTokenHash
        && user.refreshTokenExpiresAt > new Date()
        && user.refreshTokenHash === hashToken(refreshToken);

    if (!hasValidStoredToken) {
        throw new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 401);
    }

    const tokenPair = createTokenPair(user);
    await saveRefreshToken(user, tokenPair);
    return buildAuthResponse(user, tokenPair);
};

export const logoutUser = async (refreshToken) => {
    const payload = verifyRefreshToken(refreshToken);
    const user = await getUserWithSecrets({ _id: payload.sub });

    if (!user || user.refreshTokenHash !== hashToken(refreshToken)) return;

    user.refreshTokenHash = null;
    user.refreshTokenExpiresAt = null;
    await user.save({ validateBeforeSave: false });
};
