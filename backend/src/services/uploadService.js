import { randomUUID } from 'node:crypto';
import { createPresignedProductImageUpload } from '../providers/r2Provider.js';

const EXTENSIONS_BY_CONTENT_TYPE = Object.freeze({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif'
});

export const createProductImageUpload = async ({ contentType }) => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const extension = EXTENSIONS_BY_CONTENT_TYPE[contentType];
    const objectKey = `products/${year}/${month}/${randomUUID()}.${extension}`;
    const signedUpload = await createPresignedProductImageUpload({ objectKey, contentType });

    return {
        ...signedUpload,
        objectKey,
        contentType,
        headers: { 'Content-Type': contentType }
    };
};
