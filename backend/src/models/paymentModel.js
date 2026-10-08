import mongoose from 'mongoose';
import {
    isNonNegativeSafeInteger,
    nonNegativeMoneyField,
    toPlainObject
} from './modelValidators.js';

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        immutable: true
    },
    provider: {
        type: String,
        enum: ['payos'],
        required: true,
        default: 'payos',
        immutable: true
    },
    providerOrderCode: {
        type: Number,
        required: true,
        immutable: true,
        min: 1,
        validate: {
            validator: (value) => Number.isSafeInteger(value),
            message: 'providerOrderCode phải là số nguyên dương.'
        }
    },
    paymentLinkId: {
        type: String,
        trim: true,
        maxlength: 200
    },
    amount: nonNegativeMoneyField,
    transferContent: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 255
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        required: true,
        default: 'pending'
    },
    webhookPayload: {
        type: mongoose.Schema.Types.Mixed
    },
    providerTransactionId: {
        type: String,
        trim: true,
        maxlength: 255
    },
    paidAt: { type: Date }
}, {
    collection: 'payments',
    timestamps: true,
    toJSON: { virtuals: true, transform: toPlainObject }
});

paymentSchema.pre('validate', function validatePaymentState(next) {
    if (!isNonNegativeSafeInteger(this.amount)) return next();
    if (this.status === 'success' && !this.paidAt) {
        this.invalidate('paidAt', 'paidAt là bắt buộc khi thanh toán thành công.');
    }
    return next();
});

paymentSchema.index({ orderId: 1, createdAt: -1 });
paymentSchema.index(
    { provider: 1, providerTransactionId: 1 },
    {
        unique: true,
        partialFilterExpression: { providerTransactionId: { $type: 'string' } }
    }
);
paymentSchema.index({ transferContent: 1 });
paymentSchema.index({ providerOrderCode: 1 }, { unique: true });
paymentSchema.index(
    { paymentLinkId: 1 },
    { unique: true, partialFilterExpression: { paymentLinkId: { $type: 'string' } } }
);

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
