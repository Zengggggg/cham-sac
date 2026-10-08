import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '../src/config/mongodb.js';
import { getAuthEnvironment } from '../src/config/environment.js';
import { initializeDatabase } from '../src/database/initializeDatabase.js';
import {
    ArModel,
    GameRule,
    HeritageSite,
    Product,
    User
} from '../src/models/index.js';

dotenv.config();

const requireSeedVariable = (name) => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Thiếu biến môi trường dùng cho seed: ${name}`);
    return value;
};

const seedDevelopmentData = async () => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Không được chạy seed development trong production.');
    }

    const adminEmail = requireSeedVariable('DEV_ADMIN_EMAIL').toLowerCase();
    const adminPassword = requireSeedVariable('DEV_ADMIN_PASSWORD');
    const adminName = process.env.DEV_ADMIN_NAME?.trim() || 'Quản trị viên';
    const { bcryptSaltRounds } = getAuthEnvironment();
    const passwordHash = await bcrypt.hash(adminPassword, bcryptSaltRounds);

    await User.findOneAndUpdate(
        { email: adminEmail },
        {
            $set: {
                name: adminName,
                fullName: adminName,
                passwordHash,
                role: 'admin',
                status: 'active',
                emailVerifiedAt: new Date()
            }
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const product = await Product.findOneAndUpdate(
        { name: 'Boardgame Chạm Sắc Việt - Dev' },
        {
            $set: {
                description: 'Dữ liệu mẫu phục vụ phát triển local.',
                price: 350000,
                stock: 20,
                images: ['https://assets.example.com/cham-sac-viet/product-dev.webp'],
                status: 'active'
            }
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const heritageSite = await HeritageSite.findOneAndUpdate(
        { targetImageUrl: 'https://assets.example.com/cham-sac-viet/target-dev.webp' },
        {
            $set: {
                name: 'Địa danh mẫu - Dev',
                shortDescription: 'Dữ liệu mẫu phục vụ phát triển local.',
                content: 'Nội dung địa danh mẫu. Thay thế trước khi xuất bản.'
            }
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await ArModel.findOneAndUpdate(
        { heritageSiteId: heritageSite._id },
        {
            $set: {
                model3dUrl: 'https://assets.example.com/cham-sac-viet/model-dev.v1.glb',
                defaultScale: 1,
                defaultPosition: { x: 0, y: 0, z: 0 },
                defaultRotation: { x: 0, y: 0, z: 0 },
                status: 'draft'
            }
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    await GameRule.findOneAndUpdate(
        { productId: product._id },
        {
            $set: {
                title: 'Luật chơi mẫu - Dev',
                summary: 'Bộ luật mẫu phục vụ phát triển local.',
                content: '# Luật chơi mẫu\n\nThay thế nội dung này trước khi xuất bản.'
            }
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
};

try {
    const connection = await connectDB();
    await initializeDatabase(connection.connection.db);
    await seedDevelopmentData();
    console.log('Đã seed dữ liệu development tối thiểu.');
} catch (error) {
    console.error(`Seed development thất bại: ${error.message}`);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
