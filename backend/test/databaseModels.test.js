import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import {
    ArModel,
    Order,
    Payment,
    Product
} from '../src/models/index.js';

const productId = new mongoose.Types.ObjectId();

test('product accepts integer VND and rejects fractional or negative values', () => {
    const validProduct = new Product({
        name: 'Boardgame Chạm Sắc Việt',
        price: 350000,
        stock: 10,
        status: 'active'
    });
    assert.equal(validProduct.validateSync(), undefined);

    const invalidProduct = new Product({
        name: 'Boardgame Chạm Sắc Việt',
        price: 10.5,
        stock: -1,
        status: 'active'
    });
    const error = invalidProduct.validateSync();
    assert.ok(error.errors.price);
    assert.ok(error.errors.stock);
});

test('guest order embeds snapshots and enforces the server total invariant', async () => {
    const order = new Order({
        orderCode: 'CSV-TEST-001',
        customer: {
            fullName: 'Nguyễn An',
            phone: '+84901234567',
            email: 'AN@EXAMPLE.COM'
        },
        shippingAddress: {
            addressLine: '01 Đường Mẫu',
            province: 'TP. Hồ Chí Minh'
        },
        items: [{
            productId,
            productName: 'Boardgame Chạm Sắc Việt',
            quantity: 2,
            unitPrice: 350000
        }],
        shippingFee: 30000,
        totalAmount: 730000
    });

    await order.validate();
    assert.equal(order.userId, undefined);
    assert.equal(order.customer.email, 'an@example.com');

    order.totalAmount = 1;
    await assert.rejects(() => order.validate(), /totalAmount/);
});

test('AR model requires an HTTPS GLB URL and a positive scale', () => {
    const invalidModel = new ArModel({
        heritageSiteId: new mongoose.Types.ObjectId(),
        model3dUrl: 'https://assets.example.com/model.fbx',
        defaultScale: 0,
        defaultPosition: { x: 0, y: 0, z: 0 },
        status: 'published'
    });

    const error = invalidModel.validateSync();
    assert.ok(error.errors.model3dUrl);
    assert.ok(error.errors.defaultScale);
});

test('payment is payOS-only and requires paidAt for successful payments', async () => {
    const payment = new Payment({
        orderId: new mongoose.Types.ObjectId(),
        providerOrderCode: 123456,
        amount: 730000,
        transferContent: 'CSV123456',
        status: 'success'
    });

    await assert.rejects(() => payment.validate(), /paidAt/);
    payment.paidAt = new Date();
    await payment.validate();
    assert.equal(payment.provider, 'payos');

    payment.provider = 'sepay';
    const error = payment.validateSync();
    assert.ok(error.errors.provider);
});

test('payment schema declares webhook and payOS identifiers as unique indexes', () => {
    const indexes = Payment.schema.indexes();
    const serialized = JSON.stringify(indexes);

    assert.match(serialized, /providerTransactionId/);
    assert.match(serialized, /providerOrderCode/);
    assert.match(serialized, /paymentLinkId/);
    assert.ok(indexes.filter(([, options]) => options.unique).length >= 3);
});
