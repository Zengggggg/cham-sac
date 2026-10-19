import express from 'express';
import { createOrder, getMyOrder, listMyOrders } from '../controllers/orderController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateCheckout, validateObjectIdParam } from '../validations/shopValidation.js';

const orderRouter = express.Router();
orderRouter.use(authenticate, authorizeRoles('user'));
orderRouter.post('/', validateCheckout, createOrder);
orderRouter.get('/me', listMyOrders);
orderRouter.get('/:id', validateObjectIdParam('id'), getMyOrder);

export default orderRouter;
