import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { Order, Payment, Product, User } from '../src/models/index.js';

test('user embeds a validated cart without exposing it by default', () => {
    const user = new User({
        name: 'Nguyễn An',
        email: 'an@example.com',
        role: 'user',
        status: 'active',
        cartItems: [{ productId: new mongoose.Types.ObjectId(), quantity: 2 }]
    });

    assert.equal(user.validateSync(), undefined);
    assert.equal(user.cartItems[0].selected, true);
    assert.equal(User.schema.path('cartItems').options.select, false);
});

test('shop entities persist audit, expiry and reconciliation fields', () => {
    assert.ok(Product.schema.path('changeHistory'));
    assert.ok(Order.schema.path('checkoutKey'));
    assert.ok(Order.schema.path('expiresAt'));
    assert.ok(Order.schema.path('statusHistory'));
    assert.ok(Payment.schema.path('checkoutUrl'));
    assert.ok(Payment.schema.path('requiresManualReview'));
});
