import mongoose from 'mongoose';
import {
    GLB_URL_PATTERN,
    HTTPS_URL_PATTERN,
    toPlainObject
} from './modelValidators.js';

const vectorSchema = new mongoose.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true }
}, { _id: false });

const arModelSchema = new mongoose.Schema({
    heritageSiteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HeritageSite',
        required: true,
        unique: true,
        immutable: true
    },
    model3dUrl: {
        type: String,
        required: true,
        trim: true,
        match: GLB_URL_PATTERN
    },
    defaultScale: {
        type: Number,
        required: true,
        min: Number.EPSILON,
        default: 1
    },
    defaultPosition: {
        type: vectorSchema,
        required: true,
        default: () => ({ x: 0, y: 0, z: 0 })
    },
    defaultRotation: {
        type: vectorSchema,
        default: () => ({ x: 0, y: 0, z: 0 })
    },
    thumbnail: {
        type: String,
        trim: true,
        match: HTTPS_URL_PATTERN
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'hidden', 'deleted'],
        required: true,
        default: 'draft'
    }
}, {
    collection: 'ar_models',
    timestamps: true,
    toJSON: { virtuals: true, transform: toPlainObject }
});

arModelSchema.index({ status: 1 });

const ArModel = mongoose.models.ArModel || mongoose.model('ArModel', arModelSchema);

export default ArModel;
