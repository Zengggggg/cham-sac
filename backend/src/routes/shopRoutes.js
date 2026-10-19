import express from 'express';
import { getProduct, listProducts } from '../controllers/shopController.js';
import { validateObjectIdParam } from '../validations/shopValidation.js';

const shopRouter = express.Router();
shopRouter.get('/boxes', listProducts);
shopRouter.get('/boxes/:id', validateObjectIdParam('id'), getProduct);

export default shopRouter;
