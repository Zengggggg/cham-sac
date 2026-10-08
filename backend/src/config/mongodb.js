/**
* Anh em Twobars: Giang Dam, Louis, Antonie was here
* All our efforts are for a brighter future, where we can freely eat bread and drink bubble tea without worrying about someone stealing it.
* Updated by Louis on 2026-06-16
*/
import mongoose from 'mongoose';
import { getMongoEnvironment } from './environment.js';

const connectDB = async () => {
    try {
        const { uri, dbName } = getMongoEnvironment();
        const conn = await mongoose.connect(uri, { dbName });
        console.log(`MongoDB is connected successfully at host: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error connect to MongoDB: ${error.message}`);
        throw error;
    }
};

export default connectDB;
