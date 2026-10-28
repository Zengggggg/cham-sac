import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createPayOSTransferContent,
    isLatePayment,
    isRecoverableExpiredOrder,
    normalizeVerifiedPayment,
    processPayOSWebhook
} from '../src/services/paymentService.js';

test('payOS transfer content stays within the nine-character bank limit', () => {
    assert.equal(createPayOSTransferContent(1792465572100348), 'CSV100348');
    assert.equal(createPayOSTransferContent(123), 'CSV123');
    assert.throws(() => createPayOSTransferContent(1.5), /providerOrderCode/);
});

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

test('a timely payment can recover an order cancelled by the expiry worker', () => {
    const order = {
        orderStatus: 'cancelled',
        cancellationReason: 'Đơn hàng hết thời hạn thanh toán.',
        expiresAt: new Date('2026-10-14T10:15:00.000Z'),
        statusHistory: [{
            to: 'cancelled',
            actorRole: 'system',
            reason: 'Đơn hàng hết thời hạn thanh toán.'
        }]
    };

    assert.equal(isRecoverableExpiredOrder(order, new Date('2026-10-14T10:14:00.000Z')), true);
    assert.equal(isRecoverableExpiredOrder(order, new Date('2026-10-14T10:16:00.000Z')), false);
    assert.equal(isRecoverableExpiredOrder({
        ...order,
        statusHistory: [{ ...order.statusHistory[0], actorRole: 'admin' }]
    }, new Date('2026-10-14T10:14:00.000Z')), false);
});

test('a payment at the exact expiry timestamp is not considered late', () => {
    const expiresAt = new Date('2026-10-28T22:26:12.000Z');
    const order = { orderStatus: 'pending', expiresAt };

    assert.equal(isLatePayment(order, new Date(expiresAt)), false);
    assert.equal(isLatePayment(order, new Date(expiresAt.getTime() + 1)), true);
    assert.equal(isLatePayment({ ...order, orderStatus: 'cancelled' }, new Date(expiresAt)), true);
});

test('valid payOS registration sample is acknowledged when it has no matching payment', async (t) => {
    const warning = t.mock.method(console, 'warn', () => {});
    const result = await processPayOSWebhook(
        { signature: 'valid-signature' },
        {
            verifyWebhook: async () => ({
                orderCode: 123,
                amount: 3000,
                reference: 'sample-reference',
                paymentLinkId: 'sample-link',
                transactionDateTime: '2026-10-20T10:00:00+07:00',
                code: '00'
            }),
            findPayment: async () => null
        }
    );

    assert.deepEqual(result, {
        payment: null,
        duplicate: false,
        ignored: true
    });
    assert.deepEqual(warning.mock.calls[0].arguments, [
        'Ignoring payOS webhook without a matching payment',
        { providerOrderCode: 123 }
    ]);
});

test('payOS webhook with an invalid signature is still rejected', async () => {
    await assert.rejects(
        () => processPayOSWebhook(
            { signature: 'invalid-signature' },
            {
                verifyWebhook: async () => {
                    throw new Error('Invalid signature');
                },
                findPayment: async () => {
                    throw new Error('Database lookup must not run');
                }
            }
        ),
        (error) => error.statusCode === 400 && /Chữ ký webhook không hợp lệ/.test(error.message)
    );
});
