import mongoose from 'mongoose';
import {
    E164_PHONE_PATTERN,
    isNonNegativeSafeInteger,
    nonNegativeMoneyField,
    toPlainObject
} from './modelValidators.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const customerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: E164_PHONE_PATTERN
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 254,
        match: EMAIL_PATTERN
    }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
    addressLine: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    ward: {
        type: String,
        trim: true,
        maxlength: 200
    },
    province: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    note: {
        type: String,
        trim: true,
        maxlength: 1000
    }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        immutable: true
    },
    productName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: (value) => Number.isSafeInteger(value),
            message: 'quantity phải là số nguyên dương.'
        }
    },
    unitPrice: nonNegativeMoneyField,
    isBox: { type: Boolean }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        minlength: 3,
        maxlength: 50,
        immutable: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: false
    },
    customer: { type: customerSchema, required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: (items) => Array.isArray(items) && items.length > 0,
            message: 'Đơn hàng phải có ít nhất một sản phẩm.'
        }
    },
    shippingFee: nonNegativeMoneyField,
    totalAmount: nonNegativeMoneyField,
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        required: true,
        default: 'unpaid'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'done', 'cancelled'],
        required: true,
        default: 'pending'
    }
}, {
    collection: 'orders',
    timestamps: true,
    toJSON: { virtuals: true, transform: toPlainObject }
});

orderSchema.pre('validate', function validateOrderTotal(next) {
    if (!Array.isArray(this.items) || !isNonNegativeSafeInteger(this.shippingFee)) {
        return next();
    }

    const itemTotal = this.items.reduce((total, item) => {
        if (!Number.isSafeInteger(item.quantity) || !isNonNegativeSafeInteger(item.unitPrice)) {
            return Number.NaN;
        }
        return total + item.quantity * item.unitPrice;
    }, 0);
    const expectedTotal = itemTotal + this.shippingFee;

    if (!Number.isSafeInteger(expectedTotal) || this.totalAmount !== expectedTotal) {
        this.invalidate(
            'totalAmount',
            'totalAmount phải bằng tổng quantity × unitPrice cộng shippingFee.'
        );
    }
    return next();
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
