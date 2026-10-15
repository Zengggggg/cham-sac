import mongoose from 'mongoose';
import { E164_PHONE_PATTERN } from './modelValidators.js';

const shippingAddressSchema = new mongoose.Schema({
    addressLine: { type: String, trim: true, maxlength: 500 },
    ward: { type: String, trim: true, maxlength: 200 },
    province: { type: String, trim: true, maxlength: 200 },
    note: { type: String, trim: true, maxlength: 1000 }
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isSafeInteger,
            message: 'quantity phải là số nguyên dương.'
        }
    },
    selected: { type: Boolean, default: true },
    addedAt: { type: Date, default: Date.now }
}, { _id: false });

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
    defaultShippingAddress: { type: shippingAddressSchema, default: undefined },
    cartItems: {
        type: [cartItemSchema],
        default: [],
        select: false
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
            delete returnedObject.cartItems;
            return returnedObject;
        }
    }
});

userSchema.index(
    { phone: 1 },
    { unique: true, partialFilterExpression: { phone: { $type: 'string' } } }
);
userSchema.index({ _id: 1, 'cartItems.productId': 1 });

userSchema.virtual('isVerified').get(function getIsVerified() {
    return Boolean(this.emailVerifiedAt);
});

const User = mongoose.model('User', userSchema);

export default User;
