import ArModel from '../models/arModel.js';

const toVector = (vector, fallback) => ({
    x: Number.isFinite(vector?.x) ? vector.x : fallback.x,
    y: Number.isFinite(vector?.y) ? vector.y : fallback.y,
    z: Number.isFinite(vector?.z) ? vector.z : fallback.z
});

export const toPublicArExperience = (model) => {
    const heritageSite = model?.heritageSiteId;
    if (!heritageSite || typeof heritageSite !== 'object') return null;

    return {
        id: String(heritageSite._id),
        modelId: String(model._id),
        targetIndex: model.targetIndex,
        name: heritageSite.name,
        shortDescription: heritageSite.shortDescription,
        content: heritageSite.content,
        targetImageUrl: heritageSite.targetImageUrl,
        model: {
            url: model.model3dUrl,
            scale: model.defaultScale,
            position: toVector(model.defaultPosition, { x: 0, y: 0, z: 0 }),
            rotation: toVector(model.defaultRotation, { x: 0, y: 0, z: 0 }),
            thumbnail: model.thumbnail || null
        }
    };
};

export const listPublishedArExperiences = async () => {
    const models = await ArModel.find({
        status: 'published',
        targetIndex: { $gte: 0, $lte: 8 }
    })
        .sort({ targetIndex: 1 })
        .populate('heritageSiteId', 'name shortDescription content targetImageUrl')
        .lean();

    return models.map(toPublicArExperience).filter(Boolean);
};
