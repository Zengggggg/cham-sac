import express from 'express';
import {
    createPayOSPayment,
    getPaymentStatus,
    handlePayOSWebhook
} from '../controllers/paymentController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateCreatePayment, validateObjectIdParam } from '../validations/shopValidation.js';

const paymentRouter = express.Router();
paymentRouter.post('/payos/webhook', handlePayOSWebhook);
paymentRouter.post('/payos', authenticate, authorizeRoles('user'), validateCreatePayment, createPayOSPayment);
paymentRouter.get(
    '/:orderId/status',
    authenticate,
    authorizeRoles('user'),
    validateObjectIdParam('orderId'),
    getPaymentStatus
);

export default paymentRouter;
