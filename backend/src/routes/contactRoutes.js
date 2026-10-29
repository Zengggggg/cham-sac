import { Router } from 'express';
import { createContactMessage } from '../controllers/contactController.js';
import { validateContactWrite } from '../validations/contactValidation.js';

const contactRouter = Router();
contactRouter.post('/', validateContactWrite, createContactMessage);

export default contactRouter;
