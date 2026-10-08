import mongoose from 'mongoose';
import { HTTPS_URL_PATTERN, toPlainObject } from './modelValidators.js';

const gameRuleSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true,
        immutable: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    summary: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100000
    },
    coverImageUrl: {
        type: String,
        trim: true,
        match: HTTPS_URL_PATTERN
    }
}, {
    collection: 'game_rules',
    timestamps: true,
    toJSON: { virtuals: true, transform: toPlainObject }
});

const GameRule = mongoose.models.GameRule || mongoose.model('GameRule', gameRuleSchema);

export default GameRule;
