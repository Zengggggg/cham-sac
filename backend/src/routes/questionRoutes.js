import { Router } from 'express';
import {
    createMyQuestion,
    createMyQuestionList,
    deleteMyQuestion,
    deleteMyQuestionList,
    getPublicQuestions,
    listMyQuestionLists,
    listPublicQuestions,
    updateMyQuestion,
    updateMyQuestionList
} from '../controllers/questionController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validateObjectIdParam } from '../validations/shopValidation.js';
import {
    validatePrivateQuestionListWrite,
    validateQuestionWrite
} from '../validations/questionValidation.js';

const questionRouter = Router();

questionRouter.get('/public', listPublicQuestions);
questionRouter.get(
    '/public/:heritageSiteId',
    validateObjectIdParam('heritageSiteId'),
    getPublicQuestions
);

questionRouter.use(authenticate, authorizeRoles('user'));
questionRouter.get('/lists', listMyQuestionLists);
questionRouter.post('/lists', validatePrivateQuestionListWrite, createMyQuestionList);
questionRouter.patch(
    '/lists/:listId',
    validateObjectIdParam('listId'),
    validatePrivateQuestionListWrite,
    updateMyQuestionList
);
questionRouter.delete(
    '/lists/:listId',
    validateObjectIdParam('listId'),
    deleteMyQuestionList
);
questionRouter.post(
    '/lists/:listId/items',
    validateObjectIdParam('listId'),
    validateQuestionWrite,
    createMyQuestion
);
questionRouter.patch(
    '/lists/:listId/items/:questionId',
    validateObjectIdParam('listId'),
    validateObjectIdParam('questionId'),
    validateQuestionWrite,
    updateMyQuestion
);
questionRouter.delete(
    '/lists/:listId/items/:questionId',
    validateObjectIdParam('listId'),
    validateObjectIdParam('questionId'),
    deleteMyQuestion
);

export default questionRouter;
