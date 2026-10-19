import assert from 'node:assert/strict';
import test from 'node:test';
import { collectProductChanges } from '../src/services/adminService.js';

test('admin product audit only captures changed managed fields', () => {
    const changes = collectProductChanges(
        { name: 'Old', price: 100000, stock: 2, status: 'active' },
        { name: 'Old', price: 120000, stock: 2, status: 'inactive' }
    );
    assert.deepEqual(changes.map(({ field }) => field), ['price', 'status']);
});
