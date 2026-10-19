import express from 'express';
import { addCartItem, getCart, removeCartItem, updateCartItem } from '../controllers/cartController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
    validateAddCartItem,
    validateObjectIdParam,
    validateUpdateCartItem
} from '../validations/shopValidation.js';

const cartRouter = express.Router();
cartRouter.use(authenticate, authorizeRoles('user'));
cartRouter.get('/', getCart);
cartRouter.post('/items', validateAddCartItem, addCartItem);
cartRouter.patch(
    '/items/:productId',
    validateObjectIdParam('productId'),
    validateUpdateCartItem,
    updateCartItem
);
cartRouter.delete('/items/:productId', validateObjectIdParam('productId'), removeCartItem);

export default cartRouter;
