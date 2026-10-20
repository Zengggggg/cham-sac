import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import Product from '../src/models/productModel.js';
import User from '../src/models/userModel.js';
import {
    addUserCartItem,
    buildCartSummary,
    removeUserCartItem,
    updateUserCartItem
} from '../src/services/cartService.js';

test('cart summary uses current product price and flags stale stock', () => {
    const summary = buildCartSummary(
        [{ productId: 'p1', quantity: 3, selected: true }],
        [{ id: 'p1', name: 'Boardgame', price: 100000, stock: 2, status: 'active', images: [] }]
    );
    assert.equal(summary.subtotalAmount, 300000);
    assert.equal(summary.items[0].isAvailable, false);
    assert.equal(summary.items[0].issue, 'INSUFFICIENT_STOCK');
});

test('cart summary matches ObjectId references to the exact product and returns string IDs', () => {
    const firstId = new mongoose.Types.ObjectId('669100000000000000000001');
    const secondId = new mongoose.Types.ObjectId('669100000000000000000002');
    const summary = buildCartSummary([
        { productId: firstId, quantity: 2, selected: true },
        { productId: secondId, quantity: 1, selected: false }
    ], [
        { _id: secondId, name: 'Expansion', price: 50000, stock: 4, status: 'active' },
        { _id: firstId, name: 'Boardgame', price: 100000, stock: 5, status: 'active' }
    ]);

    assert.deepEqual(summary.items.map(({ productId, product }) => ({
        productId,
        id: product?.id,
        name: product?.name
    })), [
        { productId: firstId.toHexString(), id: firstId.toHexString(), name: 'Boardgame' },
        { productId: secondId.toHexString(), id: secondId.toHexString(), name: 'Expansion' }
    ]);
    assert.equal(summary.subtotalAmount, 250000);
    assert.equal(summary.selectedSubtotalAmount, 200000);
});

test('cart lines reject inactive products and report deleted products safely', () => {
    const summary = buildCartSummary([
        { productId: 'p1', quantity: 1, selected: true },
        { productId: 'deleted', quantity: 1, selected: true }
    ], [
        { id: 'p1', name: 'Boardgame', price: 100000, stock: 0, status: 'inactive' }
    ]);

    assert.equal(summary.items[0].issue, 'PRODUCT_INACTIVE');
    assert.equal(summary.items[1].issue, 'PRODUCT_NOT_FOUND');
    assert.equal(summary.items[1].product, null);
});

test('cart summary consolidates legacy duplicate rows by product with combined quantity and selection', () => {
    const productId = new mongoose.Types.ObjectId('669100000000000000000001');
    const summary = buildCartSummary([
        { productId, quantity: 1, selected: false },
        { productId: productId.toHexString(), quantity: 2, selected: true }
    ], [
        { _id: productId, name: 'Boardgame', price: 100000, stock: 10, status: 'active' }
    ]);

    assert.equal(summary.items.length, 1);
    assert.equal(summary.items[0].productId, productId.toHexString());
    assert.equal(summary.items[0].quantity, 3);
    assert.equal(summary.items[0].selected, true);
    assert.equal(summary.items[0].lineTotal, 300000);
    assert.equal(summary.subtotalAmount, 300000);
    assert.equal(summary.selectedSubtotalAmount, 300000);
});

const mockUserCart = (t, { quantity = 2, stock = 5, duplicateQuantity = 0 } = {}) => {
    const productId = new mongoose.Types.ObjectId('669abcdef000000000000001');
    const product = { _id: productId, name: 'Boardgame', price: 100000, stock, status: 'active' };
    const user = {
        cartItems: [{ productId, quantity, selected: false }],
        save: t.mock.fn(async () => {})
    };
    if (duplicateQuantity) {
        user.cartItems.push({ productId, quantity: duplicateQuantity, selected: true });
    }
    t.mock.method(User, 'findById', () => ({ select: async () => user }));
    t.mock.method(Product, 'findOne', async () => product);
    t.mock.method(Product, 'find', async () => [product]);
    return { productId, user };
};

test('adding the same product by hexadecimal ID increments its existing ObjectId cart row', async (t) => {
    const { productId, user } = mockUserCart(t);
    const summary = await addUserCartItem('user-id', {
        productId: productId.toHexString().toUpperCase(),
        quantity: 1
    });

    assert.equal(user.cartItems.length, 1);
    assert.equal(user.cartItems[0].quantity, 3);
    assert.equal(user.cartItems[0].selected, true);
    assert.equal(summary.items[0].product.name, 'Boardgame');
    assert.equal(summary.items[0].quantity, 3);
    assert.equal(user.save.mock.callCount(), 1);
});

test('adding more of an existing product enforces the combined stock limit', async (t) => {
    const { productId, user } = mockUserCart(t, { quantity: 2, stock: 2 });

    await assert.rejects(addUserCartItem('user-id', {
        productId: productId.toHexString(), quantity: 1
    }), (error) => error.statusCode === 409);

    assert.equal(user.cartItems.length, 1);
    assert.equal(user.cartItems[0].quantity, 2);
    assert.equal(user.save.mock.callCount(), 0);
});

test('updating a legacy duplicate product applies the requested quantity to one persisted row', async (t) => {
    const { productId, user } = mockUserCart(t, { quantity: 1, duplicateQuantity: 2 });
    const summary = await updateUserCartItem('user-id', productId.toHexString(), { quantity: 4 });

    assert.equal(user.cartItems.length, 1);
    assert.equal(user.cartItems[0].quantity, 4);
    assert.equal(user.cartItems[0].selected, true);
    assert.equal(summary.items[0].lineTotal, 400000);
    assert.equal(user.save.mock.callCount(), 1);
});

test('removing a product by string ID removes its matching ObjectId cart row', async (t) => {
    const { productId, user } = mockUserCart(t);
    const summary = await removeUserCartItem('user-id', productId.toHexString());

    assert.equal(user.cartItems.length, 0);
    assert.equal(summary.items.length, 0);
    assert.equal(user.save.mock.callCount(), 1);
});

test('cart mutations load and save only the authenticated user cart', async (t) => {
    const productId = new mongoose.Types.ObjectId();
    const firstUserId = new mongoose.Types.ObjectId().toHexString();
    const secondUserId = new mongoose.Types.ObjectId().toHexString();
    const firstUser = {
        cartItems: [{ productId, quantity: 1, selected: true }],
        save: t.mock.fn(async () => {})
    };
    const secondUser = {
        cartItems: [{ productId, quantity: 4, selected: true }],
        save: t.mock.fn(async () => {})
    };
    const users = new Map([[firstUserId, firstUser], [secondUserId, secondUser]]);
    const lookup = t.mock.method(User, 'findById', (id) => ({ select: async () => users.get(id) }));
    const product = { _id: productId, name: 'Boardgame', price: 100000, stock: 5, status: 'active' };
    t.mock.method(Product, 'findOne', async () => product);
    t.mock.method(Product, 'find', async () => [product]);

    await updateUserCartItem(firstUserId, productId.toHexString(), { quantity: 2 });
    assert.equal(firstUser.cartItems[0].quantity, 2);
    assert.equal(secondUser.cartItems[0].quantity, 4);
    assert.equal(secondUser.save.mock.callCount(), 0);

    await removeUserCartItem(firstUserId, productId.toHexString());
    assert.equal(firstUser.cartItems.length, 0);
    assert.equal(secondUser.cartItems[0].quantity, 4);
    assert.deepEqual(lookup.mock.calls.map(({ arguments: args }) => args[0]), [firstUserId, firstUserId]);
});

test('another user having a product does not make it removable from the current user cart', async (t) => {
    const { user } = mockUserCart(t);
    const otherProductId = new mongoose.Types.ObjectId();

    await assert.rejects(
        removeUserCartItem('current-user', otherProductId.toHexString()),
        (error) => error.statusCode === 404
    );
    assert.equal(user.cartItems.length, 1);
    assert.equal(user.save.mock.callCount(), 0);
});
