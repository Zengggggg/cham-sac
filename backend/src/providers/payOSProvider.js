import { PayOS } from '@payos/node';
import { getPayOSEnvironment } from '../config/environment.js';

let payOSClient;

const assertPositiveSafeInteger = (value, fieldName) => {
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw new TypeError(`${fieldName} phải là số nguyên dương.`);
    }
};

export const getPayOSClient = () => {
    if (!payOSClient) {
        const environment = getPayOSEnvironment();
        payOSClient = new PayOS({
            clientId: environment.clientId,
            apiKey: environment.apiKey,
            checksumKey: environment.checksumKey,
            logLevel: 'error'
        });
    }
    return payOSClient;
};

export const createPayOSPaymentLink = async ({
    providerOrderCode,
    amount,
    transferContent,
    items,
    buyer,
    expiredAt,
    returnUrl,
    cancelUrl
}, client = getPayOSClient()) => {
    assertPositiveSafeInteger(providerOrderCode, 'providerOrderCode');
    assertPositiveSafeInteger(amount, 'amount');

    if (typeof transferContent !== 'string' || !transferContent.trim()) {
        throw new TypeError('transferContent là bắt buộc.');
    }

    const environment = returnUrl && cancelUrl ? {} : getPayOSEnvironment();
    const paymentData = {
        orderCode: providerOrderCode,
        amount,
        description: transferContent.trim(),
        returnUrl: returnUrl || environment.returnUrl,
        cancelUrl: cancelUrl || environment.cancelUrl,
        ...(Array.isArray(items) && items.length > 0 ? { items } : {}),
        ...(buyer?.fullName ? { buyerName: buyer.fullName } : {}),
        ...(buyer?.email ? { buyerEmail: buyer.email } : {}),
        ...(buyer?.phone ? { buyerPhone: buyer.phone } : {}),
        ...(Number.isSafeInteger(expiredAt) ? { expiredAt } : {})
    };

    return client.paymentRequests.create(paymentData);
};

export const verifyPayOSWebhook = (payload, client = getPayOSClient()) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new TypeError('Payload webhook payOS không hợp lệ.');
    }
    return client.webhooks.verify(payload);
};

export const confirmPayOSWebhook = (webhookUrl, client = getPayOSClient()) => {
    if (typeof webhookUrl !== 'string' || !webhookUrl.startsWith('https://')) {
        throw new TypeError('Webhook URL payOS phải sử dụng HTTPS.');
    }
    return client.webhooks.confirm(webhookUrl);
};
