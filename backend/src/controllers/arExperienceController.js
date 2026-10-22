import { listPublishedArExperiences } from '../services/arExperienceService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const listArExperiences = async (_req, res, next) => {
    try {
        const experiences = await listPublishedArExperiences();
        return sendSuccess(res, {
            message: 'Lấy danh sách trải nghiệm AR thành công.',
            data: { experiences }
        });
    } catch (error) {
        return next(error);
    }
};
