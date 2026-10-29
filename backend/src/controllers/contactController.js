import { createContact, listContacts, updateContactStatus } from '../services/contactService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import AppError from '../utils/appError.js';

export const createContactMessage = async (req, res, next) => {
    try {
        const contact = await createContact(req.body);
        return sendSuccess(res, { statusCode: 201, message: 'Gửi liên hệ thành công.', data: { contact } });
    } catch (error) {
        return next(error);
    }
};

export const listAdminContacts = async (req, res, next) => {
    try {
        const result = await listContacts(req.query);
        return sendSuccess(res, { statusCode: 200, message: 'Lấy danh sách liên hệ thành công.', data: result });
    } catch (error) {
        return next(error);
    }
};

export const changeContactStatus = async (req, res, next) => {
    try {
        const contact = await updateContactStatus(req.params.id, req.body.isContactted);
        if (!contact) throw new AppError('Không tìm thấy liên hệ.', 404);
        return sendSuccess(res, { statusCode: 200, message: 'Cập nhật trạng thái liên hệ thành công.', data: { contact } });
    } catch (error) {
        return next(error);
    }
};
