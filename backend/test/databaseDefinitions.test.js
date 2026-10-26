import assert from 'node:assert/strict';
import test from 'node:test';
import { collectionDefinitions } from '../src/database/collectionDefinitions.js';
import { isEquivalentIndex } from '../src/database/initializeDatabase.js';
import {
    invalidProductHistoryActorFilter,
    productHistoryActorMigrationFilter,
    productHistoryActorMigrationPipeline
} from '../src/database/productHistoryMigration.js';

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
    assert.ok(properties.passwordResetOtpHash);
    assert.ok(properties.passwordResetOtpExpiresAt);
    assert.ok(properties.passwordResetOtpAttempts);
    assert.equal(properties.privateQuestionLists.maxItems, 20);
    assert.equal(Object.hasOwn(properties, 'isVerified'), false);
});

test('question data stays embedded in the existing user and heritage collections', () => {
    const users = collectionDefinitions.find(({ name }) => name === 'users');
    const heritageSites = collectionDefinitions.find(({ name }) => name === 'heritage_sites');

    assert.equal(users.options.validator.$jsonSchema.properties.privateQuestionLists.maxItems, 20);
    assert.equal(
        users.options.validator.$jsonSchema.properties.privateQuestionLists.items
            .properties.questions.maxItems,
        100
    );
    assert.equal(
        heritageSites.options.validator.$jsonSchema.properties.publicQuestions.maxItems,
        100
    );
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

test('database initialization accepts an equivalent index with a legacy name', () => {
    const payments = collectionDefinitions.find(({ name }) => name === 'payments');
    const pendingIndex = payments.indexes.find(
        ({ options }) => options.name === 'orderId_1_pending_status_1'
    );

    assert.equal(isEquivalentIndex({
        name: 'orderId_1_status_1',
        key: { orderId: 1, status: 1 },
        unique: true,
        partialFilterExpression: { status: 'pending' }
    }, pendingIndex), true);
});

test('database initialization does not treat indexes with different constraints as equivalent', () => {
    const payments = collectionDefinitions.find(({ name }) => name === 'payments');
    const pendingIndex = payments.indexes.find(
        ({ options }) => options.name === 'orderId_1_pending_status_1'
    );

    assert.equal(isEquivalentIndex({
        name: 'orderId_1_status_1',
        key: { orderId: 1, status: 1 },
        unique: false
    }, pendingIndex), false);
    assert.equal(isEquivalentIndex({
        name: 'orderId_1_status_1',
        key: { status: 1, orderId: 1 },
        unique: true,
        partialFilterExpression: { status: 'pending' }
    }, pendingIndex), false);
});

test('product history migration converts legacy actor IDs before strict validation', () => {
    assert.deepEqual(productHistoryActorMigrationFilter, {
        'changeHistory.changedBy': { $type: 'string' }
    });
    assert.deepEqual(invalidProductHistoryActorFilter, {
        'changeHistory.changedBy': {
            $type: 'string',
            $not: /^[0-9a-f]{24}$/i
        }
    });
    assert.deepEqual(
        productHistoryActorMigrationPipeline[0].$set.changeHistory.$map.input,
        { $ifNull: ['$changeHistory', []] }
    );
    assert.deepEqual(
        productHistoryActorMigrationPipeline[0].$set.changeHistory.$map.in.$mergeObjects[1].changedBy.$cond[1],
        {
            $convert: {
                input: '$$event.changedBy',
                to: 'objectId',
                onError: null,
                onNull: null
            }
        }
    );
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
