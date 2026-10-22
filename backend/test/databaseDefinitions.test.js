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

test('AR models define a unique target index for image tracking', () => {
    const arModels = collectionDefinitions.find(({ name }) => name === 'ar_models');
    const targetIndex = arModels.options.validator.$jsonSchema.properties.targetIndex;
    const targetIndexDefinition = arModels.indexes.find(
        ({ options }) => options.name === 'targetIndex_1'
    );

    assert.equal(targetIndex.minimum, 0);
    assert.equal(targetIndex.maximum, 8);
    assert.equal(targetIndex.multipleOf, 1);
    assert.equal(targetIndexDefinition.options.unique, true);
    assert.deepEqual(
        targetIndexDefinition.options.partialFilterExpression,
        { targetIndex: { $type: 'number' } }
    );
});
