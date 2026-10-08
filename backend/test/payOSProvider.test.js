import assert from 'node:assert/strict';
import test from 'node:test';
import {
    confirmPayOSWebhook,
    createPayOSPaymentLink,
    verifyPayOSWebhook
} from '../src/providers/payOSProvider.js';

test('payOS provider creates payment links from trusted payment data', async () => {
    let received;
    const client = {
        paymentRequests: {
            create: async (payload) => {
                received = payload;
                return { paymentLinkId: 'link-id', checkoutUrl: 'https://pay.payos.vn/link-id' };
            }
        }
    };

    const result = await createPayOSPaymentLink({
        providerOrderCode: 123456,
        amount: 730000,
        transferContent: 'CSV123456',
        returnUrl: 'https://example.com/payment/success',
        cancelUrl: 'https://example.com/payment/cancel',
        buyer: {
            fullName: 'Nguyễn An',
            email: 'an@example.com',
            phone: '+84901234567'
        },
        items: [{ name: 'Boardgame Chạm Sắc Việt', quantity: 2, price: 350000 }]
    }, client);

    assert.equal(result.paymentLinkId, 'link-id');
    assert.equal(received.orderCode, 123456);
    assert.equal(received.amount, 730000);
    assert.equal(received.description, 'CSV123456');
    assert.equal(received.buyerEmail, 'an@example.com');
});

test('payOS provider rejects unsafe order codes and amounts before calling SDK', async () => {
    const client = {
        paymentRequests: {
            create: async () => assert.fail('SDK must not be called')
        }
    };

    await assert.rejects(() => createPayOSPaymentLink({
        providerOrderCode: 1.5,
        amount: 1000,
        transferContent: 'CSV1',
        returnUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
    }, client), /providerOrderCode/);
});

test('payOS webhook verification delegates signature checks to the official SDK', async () => {
    const payload = { code: '00', data: {}, signature: 'signed' };
    const client = {
        webhooks: {
            verify: async (received) => ({ ...received.data, verified: true })
        }
    };

    const result = await verifyPayOSWebhook(payload, client);
    assert.equal(result.verified, true);
});

test('payOS webhook confirmation requires HTTPS', async () => {
    const client = { webhooks: { confirm: async (url) => ({ webhookUrl: url }) } };

    assert.throws(
        () => confirmPayOSWebhook('http://localhost/webhook', client),
        /HTTPS/
    );
    const result = await confirmPayOSWebhook('https://example.com/webhook', client);
    assert.equal(result.webhookUrl, 'https://example.com/webhook');
});
