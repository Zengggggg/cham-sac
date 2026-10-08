import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

export const createEmailOtp = async ({ saltRounds, expiresInMinutes, now = new Date() }) => {
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hash = await bcrypt.hash(otp, saltRounds);
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

    return { otp, hash, issuedAt: now, expiresAt };
};

export const verifyEmailOtpHash = (otp, hash) => bcrypt.compare(otp, hash);
