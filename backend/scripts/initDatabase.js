import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/mongodb.js';
import { initializeDatabase } from '../src/database/initializeDatabase.js';

dotenv.config();

try {
    const connection = await connectDB();
    const collections = await initializeDatabase(connection.connection.db);
    console.log(`Đã khởi tạo/đồng bộ ${collections.length} collections: ${collections.join(', ')}`);
} catch (error) {
    console.error(`Khởi tạo MongoDB thất bại: ${error.message}`);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
