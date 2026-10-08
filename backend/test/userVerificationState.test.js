import assert from 'node:assert/strict';
import test from 'node:test';

import User from '../src/models/userModel.js';

test('isVerified is a virtual derived from emailVerifiedAt', () => {
  assert.equal(User.schema.path('isVerified'), undefined);
  assert.ok(User.schema.virtualpath('isVerified'));

  const pendingUser = new User({ emailVerifiedAt: null });
  assert.equal(pendingUser.isVerified, false);
  assert.equal(pendingUser.toJSON().isVerified, false);

  const verifiedUser = new User({ emailVerifiedAt: new Date() });
  assert.equal(verifiedUser.isVerified, true);
  assert.equal(verifiedUser.toJSON().isVerified, true);
});
