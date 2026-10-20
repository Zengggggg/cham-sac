import {
    createUserPayment,
    getUserPaymentStatus,
    processPayOSWebhook
} from '../services/paymentService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createPayOSPayment = async (req, res, next) => {
    try {
        const result = await createUserPayment(req.user.id, req.body.orderId);
        return sendSuccess(res, {
            statusCode: 200,
            message: result.alreadyPaid
                ? 'Đơn hàng đã được thanh toán.'
                : 'Tạo thông tin thanh toán thành công.',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};

export const getPaymentStatus = async (req, res, next) => {
    try {
        const status = await getUserPaymentStatus(req.user.id, req.params.orderId);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy trạng thái thanh toán thành công.',
            data: status
        });
    } catch (error) {
        return next(error);
    }
};

export const handlePayOSWebhook = async (req, res, next) => {
    try {
        const result = await processPayOSWebhook(req.body);
        return sendSuccess(res, {
            statusCode: 200,
            message: result.ignored
                ? 'Webhook hợp lệ không khớp giao dịch và đã được bỏ qua.'
                : result.duplicate
                    ? 'Webhook đã được xử lý trước đó.'
                    : 'Đã xử lý webhook thanh toán.',
            data: { acknowledged: true }
        });
    } catch (error) {
        return next(error);
    }
};
