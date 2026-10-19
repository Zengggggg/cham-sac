import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/mongodb.js';
import { upsertDevelopmentAdmin } from './developmentAdmin.js';

dotenv.config();

try {
    await connectDB();
    const admin = await upsertDevelopmentAdmin();
    console.log(`Đã tạo/cập nhật admin development: ${admin.email}`);
} catch (error) {
    console.error(`Tạo admin development thất bại: ${error.message}`);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
