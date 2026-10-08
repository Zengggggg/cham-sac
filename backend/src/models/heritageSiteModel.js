import mongoose from 'mongoose';
import { HTTPS_URL_PATTERN, toPlainObject } from './modelValidators.js';

const heritageSiteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200
    },
    shortDescription: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100000
    },
    targetImageUrl: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: HTTPS_URL_PATTERN
    }
}, {
    collection: 'heritage_sites',
    timestamps: true,
    toJSON: { virtuals: true, transform: toPlainObject }
});

const HeritageSite = mongoose.models.HeritageSite
    || mongoose.model('HeritageSite', heritageSiteSchema);

export default HeritageSite;
