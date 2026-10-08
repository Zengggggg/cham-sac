import mongoose from 'mongoose';
import { E164_PHONE_PATTERN } from './modelValidators.js';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 254
    },
    phone: {
        type: String,
        trim: true,
        match: E164_PHONE_PATTERN
    },
    fullName: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    passwordHash: {
        type: String,
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        select: false
    },
    avatarUrl: {
        type: String,
        default: null,
        maxlength: 2048
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true
    },
    status: {
        type: String,
        enum: ['pending_verification', 'active', 'blocked'],
        default: 'active',
        required: true
    },
    emailVerifiedAt: {
        type: Date,
        default: null
    },
    emailVerificationOtpHash: {
        type: String,
        select: false,
        default: null
    },
    emailVerificationOtpExpiresAt: {
        type: Date,
        select: false,
        default: null
    },
    emailVerificationOtpAttempts: {
        type: Number,
        select: false,
        default: 0,
        min: 0
    },
    emailVerificationOtpSentAt: {
        type: Date,
        select: false,
        default: null
    },
    refreshTokenHash: {
        type: String,
        select: false,
        default: null
    },
    refreshTokenExpiresAt: {
        type: Date,
        select: false,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_document, returnedObject) => {
            delete returnedObject._id;
            delete returnedObject.__v;
            delete returnedObject.passwordHash;
            delete returnedObject.googleId;
            delete returnedObject.emailVerificationOtpHash;
            delete returnedObject.emailVerificationOtpExpiresAt;
            delete returnedObject.emailVerificationOtpAttempts;
            delete returnedObject.emailVerificationOtpSentAt;
            delete returnedObject.refreshTokenHash;
            delete returnedObject.refreshTokenExpiresAt;
            return returnedObject;
        }
    }
});

userSchema.index(
    { phone: 1 },
    { unique: true, partialFilterExpression: { phone: { $type: 'string' } } }
);

userSchema.virtual('isVerified').get(function getIsVerified() {
    return Boolean(this.emailVerifiedAt);
});

const User = mongoose.model('User', userSchema);

export default User;
