import assert from 'node:assert/strict';
import test from 'node:test';
import { getOrderTransitionIssue } from '../src/services/adminService.js';
import { canTransitionOrder } from '../src/services/orderService.js';

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

test('paid orders can advance through confirmation, shipping, and completion', () => {
    const paidOrder = { paymentStatus: 'paid' };
    assert.equal(canTransitionOrder('pending', 'confirmed'), true);
    assert.equal(getOrderTransitionIssue({ ...paidOrder, orderStatus: 'pending' }, {
        status: 'confirmed'
    }), null);
    assert.equal(canTransitionOrder('confirmed', 'shipping'), true);
    assert.equal(getOrderTransitionIssue({ ...paidOrder, orderStatus: 'confirmed' }, {
        status: 'shipping'
    }), null);
    assert.equal(canTransitionOrder('shipping', 'done'), true);
    assert.equal(getOrderTransitionIssue({ ...paidOrder, orderStatus: 'shipping' }, {
        status: 'done'
    }), null);
});

test('orders cannot skip required fulfillment stages or confirm before payment', () => {
    assert.equal(canTransitionOrder('pending', 'shipping'), false);
    assert.equal(canTransitionOrder('confirmed', 'done'), false);
    assert.equal(
        getOrderTransitionIssue({ orderStatus: 'pending', paymentStatus: 'unpaid' }, {
            status: 'confirmed'
        }),
        'PAYMENT_REQUIRED'
    );
});
