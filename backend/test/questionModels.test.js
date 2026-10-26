import assert from 'node:assert/strict';
import test from 'node:test';
import HeritageSite from '../src/models/heritageSiteModel.js';
import User from '../src/models/userModel.js';

test('heritage sites embed validated public questions', () => {
    const site = new HeritageSite({
        name: 'Văn Miếu - Quốc Tử Giám',
        shortDescription: 'Di tích lịch sử tại Hà Nội.',
        content: 'Nội dung địa danh.',
        targetImageUrl: 'https://cdn.example.com/van-mieu.jpg',
        publicQuestions: [{
            content: 'Văn Miếu được xây dựng vào năm nào?',
            options: ['1010', '1070', '1076', '1802'],
            correctOptionIndex: 1
        }]
    });

    assert.equal(site.validateSync(), undefined);
    assert.equal(site.publicQuestions.length, 1);
    assert.ok(site.publicQuestions[0]._id);
    assert.equal(site.publicQuestions[0].options.length, 4);
    assert.equal(site.publicQuestions[0].correctOptionIndex, 1);

    site.publicQuestions[0].correctOptionIndex = 4;
    assert.ok(site.validateSync().errors['publicQuestions.0.correctOptionIndex']);
});

test('users embed private question lists without exposing them in auth JSON', () => {
    const user = new User({
        name: 'Nguyễn An',
        email: 'an@example.com',
        role: 'user',
        status: 'active',
        privateQuestionLists: [{
            name: 'Câu hỏi chuyến đi',
            heritageSiteId: '507f1f77bcf86cd799439011',
            questions: [{ content: 'Địa danh có điểm gì nổi bật?' }]
        }]
    });

    assert.equal(user.validateSync(), undefined);
    assert.equal(user.privateQuestionLists.length, 1);
    assert.equal(user.privateQuestionLists[0].questions.length, 1);
    assert.equal(user.toJSON().privateQuestionLists, undefined);
});
