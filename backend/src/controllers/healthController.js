import { getReadiness } from '../services/healthService.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

export const getHealthReadiness = async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
        const readiness = await getReadiness();
        return sendSuccess(res, {
            message: 'Hệ thống sẵn sàng phục vụ.',
            data: readiness
        });
    } catch {
        return sendError(res, {
            statusCode: 503,
            message: 'Hệ thống chưa sẵn sàng phục vụ.'
        });
    }
};
