import { readFile } from 'node:fs/promises';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/mongodb.js';
import { getR2Environment } from '../src/config/environment.js';
import { HeritageSite } from '../src/models/index.js';
import heritageSiteSeeds from './data/heritageSites.js';
import publicQuestionSeeds from './data/publicQuestions.js';

dotenv.config();

const MAX_QUESTIONS_PER_SITE = 100;
const heritageSeedByName = new Map(heritageSiteSeeds.map((site) => [site.name, site]));

const questionSignature = (question) => JSON.stringify({
    content: question.content.trim(),
    options: question.options || [],
    correctOptionIndex: Number.isInteger(question.correctOptionIndex)
        ? question.correctOptionIndex
        : null
});

const uploadHeritageImage = async (site, environment, client) => {
    const objectKey = `seed/heritage-sites/${site.slug}.jpg`;
    const imagePath = new URL(
        `../../frontend/src/assets/landmarks/${site.imageFile}`,
        import.meta.url
    );
    const body = await readFile(imagePath);

    await client.send(new PutObjectCommand({
        Bucket: environment.bucketName,
        Key: objectKey,
        Body: body,
        ContentType: 'image/jpeg'
    }));

    return `${environment.publicBaseUrl}/${objectKey}`;
};

const seedPublicQuestions = async () => {
    const summary = {
        createdSites: 0,
        uploadedImages: 0,
        matchedSites: 0,
        seededQuestions: 0,
        replacedSites: 0,
        unchangedSites: 0,
        missingSites: []
    };
    let r2Environment;
    let r2Client;

    for (const seed of publicQuestionSeeds) {
        let heritageSite = await HeritageSite.findOne({
            name: { $in: seed.siteNames }
        }).select('+publicQuestions');

        if (!heritageSite) {
            const siteSeed = heritageSeedByName.get(seed.siteNames[0]);
            if (!siteSeed) {
                summary.missingSites.push(seed.siteNames[0]);
                continue;
            }

            r2Environment ||= getR2Environment();
            r2Client ||= new S3Client({
                region: 'auto',
                endpoint: `https://${r2Environment.accountId}.r2.cloudflarestorage.com`,
                requestChecksumCalculation: 'WHEN_REQUIRED',
                credentials: {
                    accessKeyId: r2Environment.accessKeyId,
                    secretAccessKey: r2Environment.secretAccessKey
                }
            });
            const targetImageUrl = await uploadHeritageImage(siteSeed, r2Environment, r2Client);
            summary.uploadedImages += 1;
            heritageSite = await HeritageSite.create({
                name: siteSeed.name,
                shortDescription: siteSeed.shortDescription,
                content: siteSeed.content,
                targetImageUrl,
                publicQuestions: []
            });
            summary.createdSites += 1;
        }

        summary.matchedSites += 1;
        const canonicalQuestions = seed.questions.slice(0, MAX_QUESTIONS_PER_SITE);
        const currentSignature = heritageSite.publicQuestions
            .map(questionSignature)
            .join('|');
        const canonicalSignature = canonicalQuestions
            .map(questionSignature)
            .join('|');

        if (currentSignature === canonicalSignature) {
            summary.unchangedSites += 1;
            continue;
        }

        heritageSite.publicQuestions = canonicalQuestions;
        await heritageSite.save();
        summary.seededQuestions += canonicalQuestions.length;
        summary.replacedSites += 1;
    }

    return summary;
};

try {
    await connectDB();
    const summary = await seedPublicQuestions();

    console.log(
        `Đã tạo ${summary.createdSites} địa danh, tải ${summary.uploadedImages} ảnh và seed `
        + `${summary.seededQuestions} câu hỏi public cho ${summary.replacedSites} địa danh; `
        + `${summary.unchangedSites} địa danh không đổi.`
    );

    if (summary.missingSites.length > 0) {
        console.warn(
            `Không tìm thấy ${summary.missingSites.length} địa danh: `
            + summary.missingSites.join(', ')
        );
    }
} catch (error) {
    console.error(`Seed câu hỏi public thất bại: ${error.message}`);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
