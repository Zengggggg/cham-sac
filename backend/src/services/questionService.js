import HeritageSite from '../models/heritageSiteModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';

const MAX_PUBLIC_QUESTIONS = 100;
const MAX_PRIVATE_LISTS = 20;
const MAX_PRIVATE_QUESTIONS = 100;

const toQuestion = (question) => ({
    id: String(question._id),
    content: question.content,
    options: question.options || [],
    correctOptionIndex: Number.isInteger(question.correctOptionIndex)
        ? question.correctOptionIndex
        : null,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt
});

const toPublicQuestionGroup = (heritageSite) => ({
    heritageSiteId: String(heritageSite._id),
    name: heritageSite.name,
    shortDescription: heritageSite.shortDescription,
    questions: (heritageSite.publicQuestions || []).map(toQuestion)
});

const toPrivateQuestionList = (list, heritageSite = null) => {
    const populatedSite = list.heritageSiteId && typeof list.heritageSiteId === 'object'
        && list.heritageSiteId.name
        ? list.heritageSiteId
        : heritageSite;
    const heritageSiteId = populatedSite?._id || list.heritageSiteId;

    return {
        id: String(list._id),
        name: list.name,
        heritageSite: {
            id: String(heritageSiteId),
            name: populatedSite?.name || 'Địa danh',
            shortDescription: populatedSite?.shortDescription || ''
        },
        questions: (list.questions || []).map(toQuestion),
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
    };
};

const getUserWithPrivateLists = async (userId) => {
    const user = await User.findById(userId).select('+privateQuestionLists');
    if (!user) throw new AppError('Tài khoản không tồn tại.', 404);
    return user;
};

const getHeritageSite = async (heritageSiteId) => {
    const heritageSite = await HeritageSite.findById(heritageSiteId)
        .select('name shortDescription');
    if (!heritageSite) throw new AppError('Địa danh không tồn tại.', 404);
    return heritageSite;
};

const getAdminHeritageSite = async (heritageSiteId, expectedUpdatedAt = null) => {
    const filter = { _id: heritageSiteId };
    if (expectedUpdatedAt) filter.updatedAt = expectedUpdatedAt;
    const heritageSite = await HeritageSite.findOne(filter);
    if (heritageSite) return heritageSite;

    const exists = await HeritageSite.exists({ _id: heritageSiteId });
    if (exists && expectedUpdatedAt) {
        throw new AppError('Địa danh đã được cập nhật bởi người khác. Hãy tải lại.', 409);
    }
    throw new AppError('Địa danh không tồn tại.', 404);
};

export const listPublicQuestionGroups = async () => {
    const heritageSites = await HeritageSite.find({
        'publicQuestions.0': { $exists: true }
    })
        .sort({ name: 1 })
        .lean();

    return heritageSites.map(toPublicQuestionGroup);
};

export const getPublicQuestionGroup = async (heritageSiteId) => {
    const heritageSite = await HeritageSite.findById(heritageSiteId)
        .select('name shortDescription publicQuestions')
        .lean();
    if (!heritageSite) throw new AppError('Địa danh không tồn tại.', 404);
    return toPublicQuestionGroup(heritageSite);
};

export const listPrivateQuestionLists = async (userId) => {
    const user = await User.findById(userId)
        .select('+privateQuestionLists')
        .populate('privateQuestionLists.heritageSiteId', 'name shortDescription');
    if (!user) throw new AppError('Tài khoản không tồn tại.', 404);
    return user.privateQuestionLists.map((list) => toPrivateQuestionList(list));
};

export const createPrivateQuestionList = async (userId, input) => {
    const [user, heritageSite] = await Promise.all([
        getUserWithPrivateLists(userId),
        getHeritageSite(input.heritageSiteId)
    ]);
    if (user.privateQuestionLists.length >= MAX_PRIVATE_LISTS) {
        throw new AppError(`Mỗi tài khoản chỉ được có tối đa ${MAX_PRIVATE_LISTS} danh sách.`, 409);
    }

    const list = user.privateQuestionLists.create({
        name: input.name,
        heritageSiteId: heritageSite._id,
        questions: []
    });
    user.privateQuestionLists.push(list);
    await user.save();
    return toPrivateQuestionList(list, heritageSite);
};

export const updatePrivateQuestionList = async (userId, listId, input) => {
    const user = await getUserWithPrivateLists(userId);
    const list = user.privateQuestionLists.id(listId);
    if (!list) throw new AppError('Danh sách câu hỏi không tồn tại.', 404);

    let heritageSite = await HeritageSite.findById(list.heritageSiteId)
        .select('name shortDescription');
    if (input.heritageSiteId) {
        heritageSite = await getHeritageSite(input.heritageSiteId);
        list.heritageSiteId = heritageSite._id;
    }
    if (input.name) list.name = input.name;
    await user.save();
    return toPrivateQuestionList(list, heritageSite);
};

export const deletePrivateQuestionList = async (userId, listId) => {
    const user = await getUserWithPrivateLists(userId);
    const list = user.privateQuestionLists.id(listId);
    if (!list) throw new AppError('Danh sách câu hỏi không tồn tại.', 404);
    list.deleteOne();
    await user.save();
};

export const createPrivateQuestion = async (userId, listId, input) => {
    const user = await getUserWithPrivateLists(userId);
    const list = user.privateQuestionLists.id(listId);
    if (!list) throw new AppError('Danh sách câu hỏi không tồn tại.', 404);
    if (list.questions.length >= MAX_PRIVATE_QUESTIONS) {
        throw new AppError(`Mỗi danh sách chỉ được có tối đa ${MAX_PRIVATE_QUESTIONS} câu hỏi.`, 409);
    }

    const question = list.questions.create({ content: input.content });
    list.questions.push(question);
    list.updatedAt = new Date();
    await user.save();
    return toQuestion(question);
};

export const updatePrivateQuestion = async (userId, listId, questionId, input) => {
    const user = await getUserWithPrivateLists(userId);
    const list = user.privateQuestionLists.id(listId);
    const question = list?.questions.id(questionId);
    if (!list || !question) throw new AppError('Câu hỏi private không tồn tại.', 404);
    question.content = input.content;
    question.updatedAt = new Date();
    list.updatedAt = new Date();
    await user.save();
    return toQuestion(question);
};

export const deletePrivateQuestion = async (userId, listId, questionId) => {
    const user = await getUserWithPrivateLists(userId);
    const list = user.privateQuestionLists.id(listId);
    const question = list?.questions.id(questionId);
    if (!list || !question) throw new AppError('Câu hỏi private không tồn tại.', 404);
    question.deleteOne();
    list.updatedAt = new Date();
    await user.save();
};

export const getAdminPublicQuestions = async (heritageSiteId) => {
    const heritageSite = await getAdminHeritageSite(heritageSiteId);
    return {
        ...toPublicQuestionGroup(heritageSite),
        updatedAt: heritageSite.updatedAt
    };
};

export const createAdminPublicQuestion = async (heritageSiteId, input) => {
    const heritageSite = await getAdminHeritageSite(heritageSiteId);
    if (heritageSite.publicQuestions.length >= MAX_PUBLIC_QUESTIONS) {
        throw new AppError(`Mỗi địa danh chỉ được có tối đa ${MAX_PUBLIC_QUESTIONS} câu hỏi public.`, 409);
    }
    const question = heritageSite.publicQuestions.create({ content: input.content });
    heritageSite.publicQuestions.push(question);
    await heritageSite.save();
    return { question: toQuestion(question), updatedAt: heritageSite.updatedAt };
};

export const updateAdminPublicQuestion = async (
    heritageSiteId,
    questionId,
    input
) => {
    const heritageSite = await getAdminHeritageSite(
        heritageSiteId,
        input.expectedUpdatedAt
    );
    const question = heritageSite.publicQuestions.id(questionId);
    if (!question) throw new AppError('Câu hỏi public không tồn tại.', 404);
    question.content = input.content;
    question.updatedAt = new Date();
    await heritageSite.save();
    return { question: toQuestion(question), updatedAt: heritageSite.updatedAt };
};

export const deleteAdminPublicQuestion = async (
    heritageSiteId,
    questionId,
    expectedUpdatedAt
) => {
    const heritageSite = await getAdminHeritageSite(heritageSiteId, expectedUpdatedAt);
    const question = heritageSite.publicQuestions.id(questionId);
    if (!question) throw new AppError('Câu hỏi public không tồn tại.', 404);
    question.deleteOne();
    await heritageSite.save();
    return { updatedAt: heritageSite.updatedAt };
};
