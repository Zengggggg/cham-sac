const getRequiredEnvironmentVariable = (name) => {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

const getSecret = (name) => {
    const value = getRequiredEnvironmentVariable(name);

    if (value.length < 32) {
        throw new Error(`${name} must contain at least 32 characters`);
    }

    return value;
};

const getPositiveInteger = (name, fallback) => {
    const value = Number.parseInt(process.env[name] || fallback, 10);

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer`);
    }

    return value;
};

export const getAuthEnvironment = () => {
    const jwtSecret = getSecret('JWT_SECRET');
    const refreshTokenSecret = getSecret('REFRESH_TOKEN_SECRET');

    if (jwtSecret === refreshTokenSecret) {
        throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be different');
    }

    return {
        jwtSecret,
        refreshTokenSecret,
        accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN?.trim() || '15m',
        refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN?.trim() || '30d',
        bcryptSaltRounds: getPositiveInteger('BCRYPT_SALT_ROUNDS', '12')
    };
};

export const getMongoEnvironment = () => ({
    uri: getRequiredEnvironmentVariable('MONGODB_URI'),
    dbName: process.env.MONGODB_DB_NAME?.trim() || 'cham_sac_viet'
});

export const getGoogleClientId = () => getRequiredEnvironmentVariable('GOOGLE_CLIENT_ID');

export const getEmailEnvironment = () => ({
    resendApiKey: getRequiredEnvironmentVariable('RESEND_API_KEY'),
    resendFromEmail: getRequiredEnvironmentVariable('RESEND_FROM_EMAIL'),
    resendFromName: process.env.RESEND_FROM_NAME?.trim() || 'Chạm Sắc Việt',
    otpExpiresInMinutes: getPositiveInteger('EMAIL_OTP_EXPIRES_MINUTES', '10'),
    otpMaxAttempts: getPositiveInteger('EMAIL_OTP_MAX_ATTEMPTS', '5'),
    otpResendCooldownSeconds: getPositiveInteger('EMAIL_OTP_RESEND_COOLDOWN_SECONDS', '60')
});

export const getPayOSEnvironment = () => ({
    clientId: getRequiredEnvironmentVariable('PAYOS_CLIENT_ID'),
    apiKey: getRequiredEnvironmentVariable('PAYOS_API_KEY'),
    checksumKey: getRequiredEnvironmentVariable('PAYOS_CHECKSUM_KEY'),
    returnUrl: getRequiredEnvironmentVariable('PAYOS_RETURN_URL'),
    cancelUrl: getRequiredEnvironmentVariable('PAYOS_CANCEL_URL'),
    webhookUrl: process.env.PAYOS_WEBHOOK_URL?.trim() || null
});
