import assert from 'node:assert/strict';
import test from 'node:test';
import {
    calculateOrderAmounts,
    canTransitionOrder,
    createOrderCode,
    createProviderOrderCode
} from '../src/services/orderService.js';

test('order totals are calculated from trusted integer values', () => {
    assert.deepEqual(calculateOrderAmounts([
        { quantity: 2, unitPrice: 350000 },
        { quantity: 1, unitPrice: 100000 }
    ], 30000), { subtotalAmount: 800000, shippingFee: 30000, totalAmount: 830000 });
});

test('order state machine only accepts documented transitions', () => {
    assert.equal(canTransitionOrder('pending', 'confirmed'), true);
    assert.equal(canTransitionOrder('confirmed', 'shipping'), true);
    assert.equal(canTransitionOrder('shipping', 'done'), true);
    assert.equal(canTransitionOrder('shipping', 'cancelled'), false);
    assert.equal(canTransitionOrder('done', 'pending'), false);
});

test('generated business and provider order codes are safe', () => {
    assert.match(createOrderCode(), /^CSV-[A-Z0-9]+-[A-Z0-9]+$/);
    assert.equal(Number.isSafeInteger(createProviderOrderCode()), true);
});
