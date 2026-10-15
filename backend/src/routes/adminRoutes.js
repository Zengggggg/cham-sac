import express from 'express';
import {
    createArModel,
    createGameRule,
    createHeritageSite,
    createProduct,
    deleteArModel,
    deleteGameRule,
    deleteHeritageSite,
    getArModel,
    getDashboard,
    getGameRule,
    getHeritageSite,
    getOrder,
    getProduct,
    getUser,
    listArModels,
    listGameRules,
    listHeritageSites,
    listOrders,
    listProducts,
    listUsers,
    updateArModel,
    updateGameRule,
    updateHeritageSite,
    updateOrderStatus,
    updateProduct,
    updateUserStatus
} from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import {
    validateObjectIdParam,
    validateOrderStatusUpdate,
    validateProductWrite
} from '../validations/shopValidation.js';
import {
    validateArModelWrite,
    validateGameRuleWrite,
    validateHeritageSiteWrite,
    validateUserStatusUpdate,
    validateVersionedDelete
} from '../validations/adminValidation.js';

const adminRouter = express.Router();
adminRouter.use(authenticate, authorizeRoles('admin'));
adminRouter.get('/dashboard', getDashboard);
adminRouter.get('/products', listProducts);
adminRouter.post('/products', validateProductWrite, createProduct);
adminRouter.get('/products/:id', validateObjectIdParam('id'), getProduct);
adminRouter.patch('/products/:id', validateObjectIdParam('id'), validateProductWrite, updateProduct);
adminRouter.get('/orders', listOrders);
adminRouter.get('/orders/:id', validateObjectIdParam('id'), getOrder);
adminRouter.patch(
    '/orders/:id/status',
    validateObjectIdParam('id'),
    validateOrderStatusUpdate,
    updateOrderStatus
);
adminRouter.get('/users', listUsers);
adminRouter.get('/users/:id', validateObjectIdParam('id'), getUser);
adminRouter.patch(
    '/users/:id/status',
    validateObjectIdParam('id'),
    validateUserStatusUpdate,
    updateUserStatus
);
adminRouter.get('/posts', listGameRules);
adminRouter.post('/posts', validateGameRuleWrite, createGameRule);
adminRouter.get('/posts/:id', validateObjectIdParam('id'), getGameRule);
adminRouter.patch(
    '/posts/:id',
    validateObjectIdParam('id'),
    validateGameRuleWrite,
    updateGameRule
);
adminRouter.delete(
    '/posts/:id',
    validateObjectIdParam('id'),
    validateVersionedDelete,
    deleteGameRule
);
adminRouter.get('/heritage-sites', listHeritageSites);
adminRouter.post('/heritage-sites', validateHeritageSiteWrite, createHeritageSite);
adminRouter.get('/heritage-sites/:id', validateObjectIdParam('id'), getHeritageSite);
adminRouter.patch(
    '/heritage-sites/:id',
    validateObjectIdParam('id'),
    validateHeritageSiteWrite,
    updateHeritageSite
);
adminRouter.delete(
    '/heritage-sites/:id',
    validateObjectIdParam('id'),
    validateVersionedDelete,
    deleteHeritageSite
);
adminRouter.get('/models', listArModels);
adminRouter.post('/models', validateArModelWrite, createArModel);
adminRouter.get('/models/:id', validateObjectIdParam('id'), getArModel);
adminRouter.patch(
    '/models/:id',
    validateObjectIdParam('id'),
    validateArModelWrite,
    updateArModel
);
adminRouter.delete(
    '/models/:id',
    validateObjectIdParam('id'),
    validateVersionedDelete,
    deleteArModel
);

export default adminRouter;
