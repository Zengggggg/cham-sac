import mongoose from 'mongoose';
import { HTTPS_URL_PATTERN, toPlainObject } from './modelValidators.js';

const publicQuestionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 500
    },
    options: {
        type: [{
            type: String,
            trim: true,
            minlength: 1,
            maxlength: 500
        }],
        default: undefined,
        validate: {
            validator: (options) => options === undefined
                || (options.length >= 2 && options.length <= 4),
            message: 'Câu hỏi trắc nghiệm phải có từ 2 đến 4 lựa chọn.'
        }
    },
    correctOptionIndex: {
        type: Number,
        min: 0,
        max: 3,
        validate: {
            validator(value) {
                if (this.options === undefined) return value === undefined;
                return Number.isInteger(value) && value < this.options.length;
            },
            message: 'Đáp án đúng phải trỏ đến một lựa chọn hợp lệ.'
        }
    }
}, { timestamps: true });

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
    },
    publicQuestions: {
        type: [publicQuestionSchema],
        default: [],
        validate: {
            validator: (questions) => questions.length <= 100,
            message: 'Mỗi địa danh chỉ được có tối đa 100 câu hỏi public.'
        }
    }
}, {
    collection: 'heritage_sites',
    timestamps: true,
    toJSON: { virtuals: true, transform: toPlainObject }
});

const HeritageSite = mongoose.models.HeritageSite
    || mongoose.model('HeritageSite', heritageSiteSchema);

export default HeritageSite;
