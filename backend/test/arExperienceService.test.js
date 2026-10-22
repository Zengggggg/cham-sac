import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { toPublicArExperience } from '../src/services/arExperienceService.js';

test('public AR mapper exposes only the fields needed by the scanner', () => {
    const siteId = new mongoose.Types.ObjectId();
    const modelId = new mongoose.Types.ObjectId();
    const result = toPublicArExperience({
        _id: modelId,
        targetIndex: 5,
        model3dUrl: 'https://assets.example.com/thap-rua.glb',
        defaultScale: 1.2,
        defaultPosition: { x: 0, y: 0.1, z: 0.02 },
        defaultRotation: { x: 0, y: 0, z: 0 },
        thumbnail: null,
        status: 'published',
        heritageSiteId: {
            _id: siteId,
            name: 'Hồ Gươm',
            shortDescription: 'Di sản giữa lòng Hà Nội.',
            content: 'Nội dung công khai.',
            targetImageUrl: 'https://assets.example.com/ho-guom.webp'
        }
    });

    assert.deepEqual(result, {
        id: String(siteId),
        modelId: String(modelId),
        targetIndex: 5,
        name: 'Hồ Gươm',
        shortDescription: 'Di sản giữa lòng Hà Nội.',
        content: 'Nội dung công khai.',
        targetImageUrl: 'https://assets.example.com/ho-guom.webp',
        model: {
            url: 'https://assets.example.com/thap-rua.glb',
            scale: 1.2,
            position: { x: 0, y: 0.1, z: 0.02 },
            rotation: { x: 0, y: 0, z: 0 },
            thumbnail: null
        }
    });
    assert.equal(Object.hasOwn(result.model, 'status'), false);
});
