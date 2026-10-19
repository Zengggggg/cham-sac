import assert from 'node:assert/strict';
import test from 'node:test';
import { getUserStatusTransitionIssue } from '../src/services/adminManagementService.js';

test('admin user management protects administrators and verification state', () => {
    const actorId = '507f1f77bcf86cd799439011';

    assert.equal(getUserStatusTransitionIssue({
        _id: actorId,
        role: 'admin',
        emailVerifiedAt: new Date()
    }, 'blocked', actorId), 'SELF_MANAGEMENT');

    assert.equal(getUserStatusTransitionIssue({
        _id: '507f1f77bcf86cd799439012',
        role: 'admin',
        emailVerifiedAt: new Date()
    }, 'blocked', actorId), 'ADMIN_MANAGEMENT');

    assert.equal(getUserStatusTransitionIssue({
        _id: '507f1f77bcf86cd799439013',
        role: 'user',
        emailVerifiedAt: null
    }, 'active', actorId), 'EMAIL_NOT_VERIFIED');

    assert.equal(getUserStatusTransitionIssue({
        _id: '507f1f77bcf86cd799439014',
        role: 'user',
        emailVerifiedAt: new Date()
    }, 'pending_verification', actorId), 'ALREADY_VERIFIED');
});

test('admin may block a different verified user', () => {
    assert.equal(getUserStatusTransitionIssue({
        _id: '507f1f77bcf86cd799439013',
        role: 'user',
        emailVerifiedAt: new Date()
    }, 'blocked', '507f1f77bcf86cd799439011'), null);
});
