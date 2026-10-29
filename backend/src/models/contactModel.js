import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    receiverName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    topic: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    isContactted: { type: Boolean, default: false }
}, { timestamps: true });

contactSchema.index({ createdAt: -1 });
contactSchema.index({ isContactted: 1, createdAt: -1 });

export default mongoose.models.Contact || mongoose.model('Contact', contactSchema);
