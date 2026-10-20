import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import Order from '../src/models/orderModel.js';
import Product from '../src/models/productModel.js';
import User from '../src/models/userModel.js';
import { buildCartSummary } from '../src/services/cartService.js';
import { createUserOrder } from '../src/services/orderService.js';

test('checkout orders the same consolidated quantity shown for mixed-selection duplicate cart rows', async (t) => {
    const productId = new mongoose.Types.ObjectId();
    const otherProductId = new mongoose.Types.ObjectId();
    const product = { _id: productId, name: 'Boardgame', price: 100000, stock: 5, status: 'active' };
    const user = {
        _id: new mongoose.Types.ObjectId(),
        cartItems: [
            { productId, quantity: 1, selected: true },
            { productId, quantity: 2, selected: false },
            { productId: otherProductId, quantity: 1, selected: false }
        ],
        save: t.mock.fn(async () => {})
    };
    const expectedCart = buildCartSummary(user.cartItems, [product]);
    const session = {
        withTransaction: t.mock.fn(async (action) => action()),
        endSession: t.mock.fn(async () => {})
    };
    t.mock.method(mongoose, 'startSession', async () => session);
    t.mock.method(User, 'findById', () => ({
        select() { return this; },
        session: async () => user
    }));
    t.mock.method(Order, 'findOne', async () => null);
    t.mock.method(Order, 'create', async ([order]) => [{ _id: new mongoose.Types.ObjectId(), ...order }]);
    t.mock.method(Product, 'find', () => ({ session: async () => [product] }));
    const stockChange = t.mock.method(Product, 'findOneAndUpdate', async (filter, update) => {
        assert.ok(product.stock >= filter.stock.$gte);
        product.stock += update.$inc.stock;
        return product;
    });

    const result = await createUserOrder(user._id.toHexString(), 'duplicate-checkout', {
        customer: { fullName: 'Nguyen An', phone: '+84901234567' },
        shippingAddress: { addressLine: '1 Nguyen Hue', ward: 'Sai Gon', province: 'Ho Chi Minh' }
    });

    assert.equal(result.reused, false);
    assert.equal(result.order.items.length, 1);
    assert.equal(result.order.items[0].quantity, expectedCart.items[0].quantity);
    assert.equal(result.order.items[0].quantity, 3);
    assert.equal(result.order.items[0].unitPrice * result.order.items[0].quantity,
        expectedCart.selectedSubtotalAmount);
    assert.equal(product.stock, 2);
    assert.equal(stockChange.mock.callCount(), 1);
    assert.equal(stockChange.mock.calls[0].arguments[1].$inc.stock, -3);
    assert.equal(stockChange.mock.calls[0].arguments[2].session, session);
    assert.equal(user.cartItems.length, 1);
    assert.equal(user.cartItems[0].productId.toHexString(), otherProductId.toHexString());
    assert.equal(user.save.mock.calls[0].arguments[0].session, session);
    assert.equal(session.endSession.mock.callCount(), 1);
});
