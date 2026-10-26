import {
    createAdminPublicQuestion,
    createPrivateQuestion,
    createPrivateQuestionList,
    deleteAdminPublicQuestion,
    deletePrivateQuestion,
    deletePrivateQuestionList,
    getAdminPublicQuestions,
    getPublicQuestionGroup,
    listPrivateQuestionLists,
    listPublicQuestionGroups,
    updateAdminPublicQuestion,
    updatePrivateQuestion,
    updatePrivateQuestionList
} from '../services/questionService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const listPublicQuestions = async (_req, res, next) => {
    try {
        const groups = await listPublicQuestionGroups();
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách câu hỏi public thành công.',
            data: groups
        });
    } catch (error) {
        return next(error);
    }
};

export const getPublicQuestions = async (req, res, next) => {
    try {
        const group = await getPublicQuestionGroup(req.params.heritageSiteId);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy câu hỏi của địa danh thành công.',
            data: { group }
        });
    } catch (error) {
        return next(error);
    }
};

export const listMyQuestionLists = async (req, res, next) => {
    try {
        const lists = await listPrivateQuestionLists(req.user.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy danh sách câu hỏi private thành công.',
            data: lists
        });
    } catch (error) {
        return next(error);
    }
};

export const createMyQuestionList = async (req, res, next) => {
    try {
        const list = await createPrivateQuestionList(req.user.id, req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Tạo danh sách câu hỏi private thành công.',
            data: { list }
        });
    } catch (error) {
        return next(error);
    }
};

export const updateMyQuestionList = async (req, res, next) => {
    try {
        const list = await updatePrivateQuestionList(
            req.user.id,
            req.params.listId,
            req.body
        );
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật danh sách câu hỏi private thành công.',
            data: { list }
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteMyQuestionList = async (req, res, next) => {
    try {
        await deletePrivateQuestionList(req.user.id, req.params.listId);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Xóa danh sách câu hỏi private thành công.'
        });
    } catch (error) {
        return next(error);
    }
};

export const createMyQuestion = async (req, res, next) => {
    try {
        const question = await createPrivateQuestion(
            req.user.id,
            req.params.listId,
            req.body
        );
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Thêm câu hỏi private thành công.',
            data: { question }
        });
    } catch (error) {
        return next(error);
    }
};

export const updateMyQuestion = async (req, res, next) => {
    try {
        const question = await updatePrivateQuestion(
            req.user.id,
            req.params.listId,
            req.params.questionId,
            req.body
        );
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật câu hỏi private thành công.',
            data: { question }
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteMyQuestion = async (req, res, next) => {
    try {
        await deletePrivateQuestion(
            req.user.id,
            req.params.listId,
            req.params.questionId
        );
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Xóa câu hỏi private thành công.'
        });
    } catch (error) {
        return next(error);
    }
};

export const getAdminQuestions = async (req, res, next) => {
    try {
        const group = await getAdminPublicQuestions(req.params.id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Lấy câu hỏi public của địa danh thành công.',
            data: { group }
        });
    } catch (error) {
        return next(error);
    }
};

export const createAdminQuestion = async (req, res, next) => {
    try {
        const result = await createAdminPublicQuestion(req.params.id, req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Tạo câu hỏi public thành công.',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};

export const updateAdminQuestion = async (req, res, next) => {
    try {
        const result = await updateAdminPublicQuestion(
            req.params.id,
            req.params.questionId,
            req.body
        );
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Cập nhật câu hỏi public thành công.',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};

export const deleteAdminQuestion = async (req, res, next) => {
    try {
        const result = await deleteAdminPublicQuestion(
            req.params.id,
            req.params.questionId,
            req.body.expectedUpdatedAt
        );
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Xóa câu hỏi public thành công.',
            data: result
        });
    } catch (error) {
        return next(error);
    }
};
