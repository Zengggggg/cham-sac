import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrderTransitionIssue } from '../src/services/adminService.js';

test('unpaid order requires an explicit reason to override confirmation', () => {
    assert.equal(
        getOrderTransitionIssue({ orderStatus: 'pending', paymentStatus: 'unpaid' }, {
            status: 'confirmed', forcePaymentOverride: false
        }),
        'PAYMENT_REQUIRED'
    );
    assert.equal(
        getOrderTransitionIssue({ orderStatus: 'pending', paymentStatus: 'unpaid' }, {
            status: 'confirmed', forcePaymentOverride: true, reason: 'Đã đối soát thủ công'
        }),
        null
    );
});
