import ArModel from '../models/arModel.js';
import GameRule from '../models/gameRuleModel.js';
import HeritageSite from '../models/heritageSiteModel.js';
import Order from '../models/orderModel.js';
import Payment from '../models/paymentModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';

const normalizePagination = (query = {}) => ({
    currentPage: Math.max(Number.parseInt(query.page, 10) || 1, 1),
    limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100)
});

const paginationMeta = (currentPage, limit, totalItems) => ({
    currentPage,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit)
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const duplicateError = (message) => new AppError(message, 409);

const saveWithDuplicateMapping = async (document, message) => {
    try {
        await document.save();
        return document;
    } catch (error) {
        if (error?.code === 11000) throw duplicateError(message);
        throw error;
    }
};

const findVersioned = async (Model, id, expectedUpdatedAt, label, select = null) => {
    let query = Model.findOne({ _id: id, updatedAt: expectedUpdatedAt });
    if (select) query = query.select(select);
    const document = await query;
    if (document) return document;

    const exists = await Model.exists({ _id: id });
    if (exists) {
        throw new AppError(`${label} đã được cập nhật bởi người khác. Hãy tải lại.`, 409);
    }
    throw new AppError(`${label} không tồn tại.`, 404);
};

const countByKey = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));

const paidPaymentStages = [
    { $match: { status: 'success' } },
    {
        $lookup: {
            from: 'orders',
            localField: 'orderId',
            foreignField: '_id',
            as: 'order'
        }
    },
    { $match: { 'order.paymentStatus': 'paid' } }
];

const revenueSeries = (from, format) => Payment.aggregate([
    { $match: { status: 'success', paidAt: { $gte: from } } },
    ...paidPaymentStages.slice(1),
    {
        $group: {
            _id: {
                $dateToString: {
                    date: '$paidAt',
                    format,
                    timezone: 'Asia/Ho_Chi_Minh'
                }
            },
            revenue: { $sum: '$amount' },
            orders: { $sum: 1 }
        }
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, period: '$_id', revenue: 1, orders: 1 } }
]);

export const getAdminDashboard = async (now = new Date()) => {
    const dailyFrom = new Date(now);
    dailyFrom.setDate(dailyFrom.getDate() - 29);
    const monthlyFrom = new Date(now);
    monthlyFrom.setMonth(monthlyFrom.getMonth() - 11);
    const yearlyFrom = new Date(now);
    yearlyFrom.setFullYear(yearlyFrom.getFullYear() - 4);

    const [
        totalUsers,
        totalProducts,
        totalOrders,
        revenueRows,
        orderStatusRows,
        userStatusRows,
        productStatusRows,
        daily,
        monthly,
        yearly
    ] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Payment.aggregate([
            ...paidPaymentStages,
            { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
        ]),
        Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
        User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Product.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        revenueSeries(dailyFrom, '%Y-%m-%d'),
        revenueSeries(monthlyFrom, '%Y-%m'),
        revenueSeries(yearlyFrom, '%Y')
    ]);

    const ordersByStatus = countByKey(orderStatusRows);
    return {
        summary: {
            totalRevenue: revenueRows[0]?.totalRevenue || 0,
            totalOrders,
            pendingOrders: ordersByStatus.pending || 0,
            totalUsers,
            totalProducts
        },
        ordersByStatus,
        usersByStatus: countByKey(userStatusRows),
        productsByStatus: countByKey(productStatusRows),
        revenue: { daily, monthly, yearly },
        traffic: {
            available: false,
            message: 'Chưa có nguồn analytics để thống kê lượt truy cập.'
        }
    };
};

export const listAdminUsers = async (query = {}) => {
    const { currentPage, limit } = normalizePagination(query);
    const filter = {};
    if (['user', 'admin'].includes(query.role)) filter.role = query.role;
    if (['pending_verification', 'active', 'blocked'].includes(query.status)) {
        filter.status = query.status;
    }
    if (typeof query.search === 'string' && query.search.trim()) {
        const pattern = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
        filter.$or = [
            { name: pattern },
            { fullName: pattern },
            { email: pattern },
            { phone: pattern }
        ];
    }

    const [users, totalItems] = await Promise.all([
        User.find(filter)
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit),
        User.countDocuments(filter)
    ]);
    return { users, meta: paginationMeta(currentPage, limit, totalItems) };
};

export const getAdminUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError('Tài khoản không tồn tại.', 404);

    const [summaryRows, recentOrders] = await Promise.all([
        Order.aggregate([
            { $match: { userId: user._id } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    paidOrders: {
                        $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
                    },
                    totalSpent: {
                        $sum: {
                            $cond: [
                                { $eq: ['$paymentStatus', 'paid'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    }
                }
            },
            { $project: { _id: 0, totalOrders: 1, paidOrders: 1, totalSpent: 1 } }
        ]),
        Order.find({ userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    return {
        user,
        orderSummary: summaryRows[0] || { totalOrders: 0, paidOrders: 0, totalSpent: 0 },
        recentOrders
    };
};

export const getUserStatusTransitionIssue = (user, status, actorId) => {
    if (String(user._id) === String(actorId)) return 'SELF_MANAGEMENT';
    if (user.role === 'admin') return 'ADMIN_MANAGEMENT';
    if (status === 'active' && !user.emailVerifiedAt) return 'EMAIL_NOT_VERIFIED';
    if (status === 'pending_verification' && user.emailVerifiedAt) return 'ALREADY_VERIFIED';
    return null;
};

export const updateAdminUserStatus = async (adminId, userId, input) => {
    const user = await findVersioned(
        User,
        userId,
        input.expectedUpdatedAt,
        'Tài khoản',
        '+refreshTokenHash +refreshTokenExpiresAt'
    );
    const issue = getUserStatusTransitionIssue(user, input.status, adminId);
    const issueMessage = {
        SELF_MANAGEMENT: 'Không thể thay đổi trạng thái tài khoản đang đăng nhập.',
        ADMIN_MANAGEMENT: 'Không thể thay đổi trạng thái quản trị viên qua endpoint này.',
        EMAIL_NOT_VERIFIED: 'Không thể kích hoạt tài khoản chưa xác minh email.',
        ALREADY_VERIFIED: 'Không thể đưa tài khoản đã xác minh về trạng thái chờ xác minh.'
    }[issue];
    if (issue) throw new AppError(issueMessage, 409);

    user.status = input.status;
    if (input.status !== 'active') {
        user.refreshTokenHash = null;
        user.refreshTokenExpiresAt = null;
    }
    await user.save();
    return user;
};

const listDocuments = async (Model, query, filter = {}, populate = null) => {
    const { currentPage, limit } = normalizePagination(query);
    let findQuery = Model.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * limit)
        .limit(limit);
    if (populate) findQuery = findQuery.populate(...populate);
    const [items, totalItems] = await Promise.all([
        findQuery,
        Model.countDocuments(filter)
    ]);
    return { items, meta: paginationMeta(currentPage, limit, totalItems) };
};

export const listAdminGameRules = async (query = {}) => {
    const filter = {};
    if (mongooseObjectId(query.productId)) filter.productId = query.productId;
    if (typeof query.search === 'string' && query.search.trim()) {
        filter.title = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
    }
    const result = await listDocuments(GameRule, query, filter, ['productId', 'name status']);
    return { rules: result.items, meta: result.meta };
};

const mongooseObjectId = (value) => (
    typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
);

export const getAdminGameRule = async (ruleId) => {
    const rule = await GameRule.findById(ruleId).populate('productId', 'name status');
    if (!rule) throw new AppError('Luật chơi không tồn tại.', 404);
    return rule;
};

export const createAdminGameRule = async (input) => {
    const productExists = await Product.exists({ _id: input.productId });
    if (!productExists) throw new AppError('Sản phẩm không tồn tại.', 404);
    return saveWithDuplicateMapping(
        new GameRule(input),
        'Sản phẩm này đã có luật chơi.'
    );
};

export const updateAdminGameRule = async (ruleId, input) => {
    const { expectedUpdatedAt, ...updates } = input;
    const rule = await findVersioned(GameRule, ruleId, expectedUpdatedAt, 'Luật chơi');
    Object.assign(rule, updates);
    return saveWithDuplicateMapping(rule, 'Dữ liệu luật chơi bị trùng.');
};

export const deleteAdminGameRule = async (ruleId, expectedUpdatedAt) => {
    const rule = await findVersioned(GameRule, ruleId, expectedUpdatedAt, 'Luật chơi');
    await rule.deleteOne();
};

export const listAdminHeritageSites = async (query = {}) => {
    const filter = {};
    if (typeof query.search === 'string' && query.search.trim()) {
        filter.name = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
    }
    const result = await listDocuments(HeritageSite, query, filter);
    return { heritageSites: result.items, meta: result.meta };
};

export const getAdminHeritageSite = async (heritageSiteId) => {
    const heritageSite = await HeritageSite.findById(heritageSiteId);
    if (!heritageSite) throw new AppError('Địa danh không tồn tại.', 404);
    return heritageSite;
};

export const createAdminHeritageSite = (input) => saveWithDuplicateMapping(
    new HeritageSite(input),
    'Ảnh target đã được dùng cho địa danh khác.'
);

export const updateAdminHeritageSite = async (heritageSiteId, input) => {
    const { expectedUpdatedAt, ...updates } = input;
    const heritageSite = await findVersioned(
        HeritageSite,
        heritageSiteId,
        expectedUpdatedAt,
        'Địa danh'
    );
    Object.assign(heritageSite, updates);
    return saveWithDuplicateMapping(
        heritageSite,
        'Ảnh target đã được dùng cho địa danh khác.'
    );
};

export const deleteAdminHeritageSite = async (heritageSiteId, expectedUpdatedAt) => {
    const heritageSite = await findVersioned(
        HeritageSite,
        heritageSiteId,
        expectedUpdatedAt,
        'Địa danh'
    );
    const hasArModel = await ArModel.exists({ heritageSiteId });
    if (hasArModel) {
        throw new AppError('Không thể xóa địa danh đang có model AR.', 409);
    }
    await heritageSite.deleteOne();
};

export const listAdminArModels = async (query = {}) => {
    const filter = {};
    if (['draft', 'published', 'hidden', 'deleted'].includes(query.status)) {
        filter.status = query.status;
    }
    if (mongooseObjectId(query.heritageSiteId)) filter.heritageSiteId = query.heritageSiteId;
    const result = await listDocuments(
        ArModel,
        query,
        filter,
        ['heritageSiteId', 'name shortDescription']
    );
    return { models: result.items, meta: result.meta };
};

export const getAdminArModel = async (modelId) => {
    const model = await ArModel.findById(modelId)
        .populate('heritageSiteId', 'name shortDescription');
    if (!model) throw new AppError('Model AR không tồn tại.', 404);
    return model;
};

export const createAdminArModel = async (input) => {
    const heritageSiteExists = await HeritageSite.exists({ _id: input.heritageSiteId });
    if (!heritageSiteExists) throw new AppError('Địa danh không tồn tại.', 404);
    return saveWithDuplicateMapping(
        new ArModel(input),
        'Địa danh hoặc targetIndex này đã có model AR.'
    );
};

export const updateAdminArModel = async (modelId, input) => {
    const { expectedUpdatedAt, ...updates } = input;
    const model = await findVersioned(ArModel, modelId, expectedUpdatedAt, 'Model AR');
    Object.assign(model, updates);
    return saveWithDuplicateMapping(model, 'Địa danh hoặc targetIndex này đã có model AR.');
};

export const deleteAdminArModel = async (modelId, expectedUpdatedAt) => {
    const model = await findVersioned(ArModel, modelId, expectedUpdatedAt, 'Model AR');
    model.status = 'deleted';
    await model.save();
    return model;
};
