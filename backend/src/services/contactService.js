import Contact from '../models/contactModel.js';

export const createContact = (payload) => Contact.create(payload);

export const listContacts = async ({ page = 1, pageSize = 6, search = '', status = '', sort = 'newest' } = {}) => {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 6));
    const filter = {};
    if (status === 'pending') filter.isContactted = false;
    if (status === 'done') filter.isContactted = true;
    if (search) {
        const expression = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ receiverName: expression }, { email: expression }, { topic: expression }];
    }
    const [contacts, total] = await Promise.all([
        Contact.find(filter)
            .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
            .skip((safePage - 1) * safePageSize)
            .limit(safePageSize)
            .lean(),
        Contact.countDocuments(filter)
    ]);
    return {
        contacts,
        pagination: { page: safePage, pageSize: safePageSize, total, totalPages: Math.max(1, Math.ceil(total / safePageSize)) }
    };
};

export const updateContactStatus = (id, isContactted) => (
    Contact.findByIdAndUpdate(id, { isContactted }, { new: true, runValidators: true }).lean()
);
