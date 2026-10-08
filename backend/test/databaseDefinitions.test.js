import assert from 'node:assert/strict';
import test from 'node:test';
import { collectionDefinitions } from '../src/database/collectionDefinitions.js';

test('database initialization defines the seven collections in dependency order', () => {
    assert.deepEqual(
        collectionDefinitions.map(({ name }) => name),
        [
            'users',
            'products',
            'heritage_sites',
            'orders',
            'ar_models',
            'game_rules',
            'payments'
        ]
    );
});

test('all collections use strict erroring JSON Schema validation', () => {
    for (const definition of collectionDefinitions) {
        assert.equal(definition.options.validationLevel, 'strict');
        assert.equal(definition.options.validationAction, 'error');
        assert.equal(definition.options.validator.$jsonSchema.bsonType, 'object');
        assert.ok(definition.indexes.length > 0);
    }
});

test('users persist emailVerifiedAt but not the derived isVerified field', () => {
    const users = collectionDefinitions.find(({ name }) => name === 'users');
    const properties = users.options.validator.$jsonSchema.properties;

    assert.ok(properties.emailVerifiedAt);
    assert.equal(Object.hasOwn(properties, 'isVerified'), false);
});

test('payments definition is payOS-only and has idempotency indexes', () => {
    const payments = collectionDefinitions.find(({ name }) => name === 'payments');
    const schema = payments.options.validator.$jsonSchema;
    const indexNames = payments.indexes.map(({ options }) => options.name);

    assert.deepEqual(schema.properties.provider.enum, ['payos']);
    assert.ok(schema.required.includes('providerOrderCode'));
    assert.ok(indexNames.includes('provider_1_providerTransactionId_1'));
    assert.ok(indexNames.includes('providerOrderCode_1'));
});
