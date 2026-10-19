import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductImageUpload } from '../src/services/uploadService.js';

test('R2 product image upload signs a short-lived content-type restricted PUT URL', async () => {
    const names = [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME',
        'R2_PUBLIC_BASE_URL'
    ];
    const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
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
        names.forEach((name) => {
            if (previous[name] === undefined) delete process.env[name];
            else process.env[name] = previous[name];
        });
    }
});
