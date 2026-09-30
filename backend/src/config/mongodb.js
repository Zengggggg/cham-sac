/**
* Anh em Twobars: Giang Dam, Louis, Antonie was here
* All our efforts are for a brighter future, where we can freely eat bread and drink bubble tea without worrying about someone stealing it.
* Updated by Louis on 2026-06-16
*/
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB is connected successfully at host: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connect to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;