import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JWT_SECRET = 'test-access-secret-that-is-long-enough';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-that-is-different';
process.env.ACCESS_TOKEN_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '30d';

const {
    createTokenPair,
    hashToken,
    verifyAccessToken,
    verifyRefreshToken
} = await import('../src/services/tokenService.js');

test('token pair contains typed access and refresh tokens', () => {
    const user = { id: '507f1f77bcf86cd799439011', role: 'user' };
    const tokens = createTokenPair(user);

    assert.equal(verifyAccessToken(tokens.accessToken).sub, user.id);
    assert.equal(verifyRefreshToken(tokens.refreshToken).sub, user.id);
    assert.equal(tokens.refreshTokenHash, hashToken(tokens.refreshToken));
    assert.ok(tokens.refreshTokenExpiresAt > new Date());
});

test('access token cannot be used as a refresh token', () => {
    const tokens = createTokenPair({
        id: '507f1f77bcf86cd799439011',
        role: 'admin'
    });

    assert.throws(
        () => verifyRefreshToken(tokens.accessToken),
        /không hợp lệ/
    );
});
