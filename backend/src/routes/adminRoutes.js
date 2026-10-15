import express from 'express';
import {
    createProduct,
    getOrder,
    listOrders,
    listProducts,
    updateOrderStatus,
    updateProduct
} from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
    validateObjectIdParam,
    validateOrderStatusUpdate,
    validateProductWrite
} from '../validations/shopValidation.js';

const adminRouter = express.Router();
adminRouter.use(authenticate, authorizeRoles('admin'));
adminRouter.get('/products', listProducts);
adminRouter.post('/products', validateProductWrite, createProduct);
adminRouter.patch('/products/:id', validateObjectIdParam('id'), validateProductWrite, updateProduct);
adminRouter.get('/orders', listOrders);
adminRouter.get('/orders/:id', validateObjectIdParam('id'), getOrder);
adminRouter.patch(
    '/orders/:id/status',
    validateObjectIdParam('id'),
    validateOrderStatusUpdate,
    updateOrderStatus
);

export default adminRouter;
