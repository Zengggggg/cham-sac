import assert from 'node:assert/strict';
import test from 'node:test';
import { API_PREFIX } from '../src/config/api.js';
import swaggerSpec from '../src/config/swagger.js';

test('Swagger spec exposes the current API routes and Bearer authentication', () => {
    assert.equal(API_PREFIX, '/chamsacviet');
    assert.equal(swaggerSpec.openapi, '3.0.3');
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/status`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/auth/register`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/auth/verify-email`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/auth/resend-verification-otp`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/auth/me`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/shop/boxes`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/cart/items`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/orders`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/payments/payos/webhook`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/admin/products`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/admin/uploads/product-images/presign`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/admin/orders/{id}/status`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/admin/dashboard`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/admin/users/{id}/status`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/admin/posts/{id}`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/admin/heritage-sites/{id}`]);
    assert.ok(swaggerSpec.paths[`${API_PREFIX}/admin/models/{id}`]);
    assert.equal(swaggerSpec.components.securitySchemes.bearerAuth.scheme, 'bearer');
});

test('Swagger response schemas enforce the backend-to-frontend contract', () => {
    const requiredFields = ['success', 'statusCode', 'message', 'data', 'meta', 'errors'];
    const schemaNames = [
        'AuthResponse',
        'VerificationRequiredResponse',
        'UserResponse',
        'StatusResponse',
        'EmptySuccessResponse',
        'ErrorResponse',
        'ShopObjectResponse',
        'ShopListResponse'
    ];

    for (const schemaName of schemaNames) {
        assert.deepEqual(
            swaggerSpec.components.schemas[schemaName].required,
            requiredFields,
            `${schemaName} must require the shared response fields`
        );
    }

    assert.equal(
        swaggerSpec.paths[`${API_PREFIX}/status`].get.responses[200]
            .content['application/json'].schema.$ref,
        '#/components/schemas/StatusResponse'
    );
});
