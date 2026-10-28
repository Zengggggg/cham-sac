import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductImageUpload } from '../src/services/uploadService.js';

const R2_ENVIRONMENT_VARIABLES = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_BASE_URL'
];

const preserveR2Environment = () => Object.fromEntries(
    R2_ENVIRONMENT_VARIABLES.map((name) => [name, process.env[name]])
);

const restoreR2Environment = (previous) => {
    R2_ENVIRONMENT_VARIABLES.forEach((name) => {
        if (previous[name] === undefined) delete process.env[name];
        else process.env[name] = previous[name];
    });
};

test('R2 product image upload signs a short-lived content-type restricted PUT URL', async () => {
    const previous = preserveR2Environment();
    Object.assign(process.env, {
        R2_ACCOUNT_ID: '0123456789abcdef0123456789abcdef',
        R2_ACCESS_KEY_ID: 'test-access-key',
        R2_SECRET_ACCESS_KEY: 'test-secret-access-key',
        R2_BUCKET_NAME: 'product-assets',
        R2_PUBLIC_BASE_URL: 'https://assets.example.com'
    });

    try {
        const upload = await createProductImageUpload({ contentType: 'image/webp' });
        const signedUrl = new URL(upload.uploadUrl);

        assert.match(upload.objectKey, /^products\/\d{4}\/\d{2}\/[\w-]+\.webp$/);
        assert.equal(upload.publicUrl, `https://assets.example.com/${upload.objectKey}`);
        assert.equal(upload.expiresInSeconds, 300);
        assert.equal(signedUrl.searchParams.get('X-Amz-Expires'), '300');
        assert.equal(signedUrl.searchParams.get('X-Amz-SignedHeaders'), 'content-type;host');
        assert.equal([...signedUrl.searchParams.keys()].some((key) => key.includes('checksum')), false);
    } finally {
        restoreR2Environment(previous);
    }
});

test('R2 product image upload reports unavailable service when server configuration is missing', async () => {
    const previous = preserveR2Environment();
    R2_ENVIRONMENT_VARIABLES.forEach((name) => delete process.env[name]);

    try {
        await assert.rejects(
            () => createProductImageUpload({ contentType: 'image/png' }),
            (error) => error.statusCode === 503
                && error.message.includes('chưa được cấu hình')
        );
    } finally {
        restoreR2Environment(previous);
    }
});
