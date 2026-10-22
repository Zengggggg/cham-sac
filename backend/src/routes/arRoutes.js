import { Router } from 'express';
import { listArExperiences } from '../controllers/arExperienceController.js';

const router = Router();

router.get('/experiences', listArExperiences);

export default router;
