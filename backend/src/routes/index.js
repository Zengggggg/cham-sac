/**
* Anh em Twobars: Giang Dam, Louis, Antonie was here
* All our efforts are for a brighter future, where we can freely eat bread and drink bubble tea without worrying about someone stealing it.
* Updated by Louis on 2026-06-16
*/
import express from 'express';
import { API_STATUS_MESSAGE } from '../config/api.js';
import authRouter from './authRoutes.js';
import adminRouter from './adminRoutes.js';
import arRouter from './arRoutes.js';
import cartRouter from './cartRoutes.js';
import orderRouter from './orderRoutes.js';
import paymentRouter from './paymentRoutes.js';
import shopRouter from './shopRoutes.js';
import { sendSuccess } from '../utils/apiResponse.js';

const router = express.Router();

router.get('/status', (req, res) => {
    void req;
    return sendSuccess(res, {
        statusCode: 200,
        message: API_STATUS_MESSAGE,
        data: { status: 'healthy' }
    });
});

router.use('/auth', authRouter);
router.use('/shop', shopRouter);
router.use('/cart', cartRouter);
router.use('/orders', orderRouter);
router.use('/payments', paymentRouter);
router.use('/ar', arRouter);
router.use('/admin', adminRouter);

export default router;
