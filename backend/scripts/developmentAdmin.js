import bcrypt from 'bcryptjs';
import { getAuthEnvironment } from '../src/config/environment.js';
import { User } from '../src/models/index.js';

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

const requireDevelopmentVariable = (name) => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Thiếu biến môi trường dùng cho admin development: ${name}`);
    return value;
};

export const upsertDevelopmentAdmin = async () => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Không được tạo admin development trong production.');
    }

    const email = requireDevelopmentVariable('DEV_ADMIN_EMAIL').toLowerCase();
    const password = requireDevelopmentVariable('DEV_ADMIN_PASSWORD');
    const name = process.env.DEV_ADMIN_NAME?.trim() || 'Quản trị viên';

    if (password.length < 8 || password.length > 72 || !PASSWORD_PATTERN.test(password)) {
        throw new Error('DEV_ADMIN_PASSWORD phải có 8-72 ký tự, gồm ít nhất một chữ cái và một chữ số.');
    }

    const { bcryptSaltRounds } = getAuthEnvironment();
    const passwordHash = await bcrypt.hash(password, bcryptSaltRounds);

    return User.findOneAndUpdate(
        { email },
        {
            $set: {
                name,
                fullName: name,
                passwordHash,
                role: 'admin',
                status: 'active',
                emailVerifiedAt: new Date(),
                emailVerificationOtpHash: null,
                emailVerificationOtpExpiresAt: null,
                emailVerificationOtpAttempts: 0,
                emailVerificationOtpSentAt: null,
                refreshTokenHash: null,
                refreshTokenExpiresAt: null
            }
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
};
