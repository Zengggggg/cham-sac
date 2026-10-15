import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeVerifiedPayment } from '../src/services/paymentService.js';

test('verified payOS data is normalized to trusted payment fields', () => {
    const normalized = normalizeVerifiedPayment({
        orderCode: 123,
        amount: 350000,
        reference: 'FT-001',
        paymentLinkId: 'link-1',
        transactionDateTime: '2026-10-14T10:00:00+07:00',
        code: '00'
    });
    assert.equal(normalized.providerOrderCode, 123);
    assert.equal(normalized.providerTransactionId, 'FT-001');
    assert.equal(normalized.isSuccessful, true);
    assert.ok(normalized.paidAt instanceof Date);
});
