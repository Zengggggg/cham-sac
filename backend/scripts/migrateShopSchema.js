import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/mongodb.js';
import { getShopEnvironment } from '../src/config/environment.js';
import { initializeDatabase } from '../src/database/initializeDatabase.js';
import {
    invalidProductHistoryActorFilter,
    productHistoryActorMigrationFilter,
    productHistoryActorMigrationPipeline
} from '../src/database/productHistoryMigration.js';

dotenv.config();

const migrateShopSchema = async (database) => {
    const { paymentExpiresInMinutes } = getShopEnvironment();
    const expiryMilliseconds = paymentExpiresInMinutes * 60 * 1000;
    const invalidProductHistoryActors = await database.collection('products')
        .countDocuments(invalidProductHistoryActorFilter);
    if (invalidProductHistoryActors > 0) {
        throw new Error(
            `Có ${invalidProductHistoryActors} sản phẩm chứa changedBy không phải ObjectId hợp lệ.`
        );
    }

    const [users, products, heritageSites, orders, payments] = await Promise.all([
        database.collection('users').updateMany(
            {
                $or: [
                    { cartItems: { $exists: false } },
                    { privateQuestionLists: { $exists: false } }
                ]
            },
            [{
                $set: {
                    cartItems: { $ifNull: ['$cartItems', []] },
                    privateQuestionLists: { $ifNull: ['$privateQuestionLists', []] }
                }
            }]
        ),
        database.collection('products').updateMany(
            {
                $or: [
                    { changeHistory: { $exists: false } },
                    productHistoryActorMigrationFilter
                ]
            },
            productHistoryActorMigrationPipeline
        ),
        database.collection('heritage_sites').updateMany(
            { publicQuestions: { $exists: false } },
            { $set: { publicQuestions: [] } }
        ),
        database.collection('orders').updateMany(
            {
                $or: [
                    { expiresAt: { $exists: false } },
                    { refundRequired: { $exists: false } },
                    { statusHistory: { $exists: false } }
                ]
            },
            [{
                $set: {
                    expiresAt: {
                        $ifNull: ['$expiresAt', { $add: ['$createdAt', expiryMilliseconds] }]
                    },
                    refundRequired: { $ifNull: ['$refundRequired', false] },
                    statusHistory: { $ifNull: ['$statusHistory', []] }
                }
            }]
        ),
        database.collection('payments').updateMany(
            { requiresManualReview: { $exists: false } },
            { $set: { requiresManualReview: false } }
        )
    ]);

    return {
        users: users.modifiedCount,
        products: products.modifiedCount,
        heritageSites: heritageSites.modifiedCount,
        orders: orders.modifiedCount,
        payments: payments.modifiedCount
    };
};

try {
    const connection = await connectDB();
    const result = await migrateShopSchema(connection.connection.db);
    await initializeDatabase(connection.connection.db);
    console.log(`Shop migration completed: ${JSON.stringify(result)}`);
} catch (error) {
    console.error(`Shop migration failed: ${error.message}`);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
