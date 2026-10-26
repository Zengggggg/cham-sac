import assert from 'node:assert/strict';
import test from 'node:test';
import HeritageSite from '../src/models/heritageSiteModel.js';
import User from '../src/models/userModel.js';
import {
    createPrivateQuestionList,
    listPublicQuestionGroups
} from '../src/services/questionService.js';

test('public question groups return heritage sites that contain public questions', async (context) => {
    const query = {
        sort() { return this; },
        async lean() {
            return [{
                _id: '507f1f77bcf86cd799439011',
                name: 'Văn Miếu',
                shortDescription: 'Di tích tại Hà Nội.',
                publicQuestions: [{
                    _id: '507f1f77bcf86cd799439012',
                    content: 'Địa danh được xây dựng khi nào?',
                    options: ['Năm 1010', 'Năm 1070', 'Năm 1076', 'Năm 1802'],
                    correctOptionIndex: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }]
            }];
        }
    };
    let filter;
    context.mock.method(HeritageSite, 'find', (input) => {
        filter = input;
        return query;
    });

    const groups = await listPublicQuestionGroups();
    assert.deepEqual(filter, { 'publicQuestions.0': { $exists: true } });
    assert.equal(groups.length, 1);
    assert.equal(groups[0].name, 'Văn Miếu');
    assert.equal(groups[0].questions[0].content, 'Địa danh được xây dựng khi nào?');
    assert.deepEqual(groups[0].questions[0].options, [
        'Năm 1010', 'Năm 1070', 'Năm 1076', 'Năm 1802'
    ]);
    assert.equal(groups[0].questions[0].correctOptionIndex, 1);
});

test('private question lists are created only under the authenticated user', async (context) => {
    const user = new User({
        name: 'Nguyễn An',
        email: 'an@example.com',
        role: 'user',
        status: 'active'
    });
    user.save = async () => user;
    const site = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Văn Miếu',
        shortDescription: 'Di tích tại Hà Nội.'
    };
    let queriedUserId;

    context.mock.method(User, 'findById', (userId) => {
        queriedUserId = userId;
        return { select: async () => user };
    });
    context.mock.method(HeritageSite, 'findById', () => ({ select: async () => site }));

    const list = await createPrivateQuestionList('authenticated-user-id', {
        name: 'Chuyến đi Hà Nội',
        heritageSiteId: String(site._id)
    });

    assert.equal(queriedUserId, 'authenticated-user-id');
    assert.equal(user.privateQuestionLists.length, 1);
    assert.equal(list.name, 'Chuyến đi Hà Nội');
    assert.equal(list.heritageSite.name, 'Văn Miếu');
});
