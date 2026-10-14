import mongoose from 'mongoose';
import {
    HTTPS_URL_PATTERN,
    isNonNegativeSafeInteger,
    nonNegativeMoneyField,
    toPlainObject
} from './modelValidators.js';

const productChangeSchema = new mongoose.Schema({
    field: { type: String, required: true },
    from: { type: mongoose.Schema.Types.Mixed },
    to: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const productChangeEventSchema = new mongoose.Schema({
    changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    changedAt: { type: Date, required: true, default: Date.now },
    changes: { type: [productChangeSchema], required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 5000
    },
    price: nonNegativeMoneyField,
    stock: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: isNonNegativeSafeInteger,
            message: 'stock phải là số nguyên không âm.'
        }
    },
    images: {
        type: [{
            type: String,
            trim: true,
            match: HTTPS_URL_PATTERN
        }],
        default: []
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'sold_out'],
        required: true,
        default: 'inactive'
    },
    changeHistory: {
        type: [productChangeEventSchema],
        default: [],
        select: false
    }
}, {
    collection: 'products',
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: { virtuals: true, transform: toPlainObject }
});

productSchema.index({ status: 1, createdAt: -1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
