import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Environment } from '../config/environment.js';

const UPLOAD_URL_EXPIRES_IN_SECONDS = 300;

let cachedClient = null;
let cachedAccountId = null;

const getR2Client = (environment) => {
    if (cachedClient && cachedAccountId === environment.accountId) return cachedClient;

    cachedClient = new S3Client({
        region: 'auto',
        endpoint: `https://${environment.accountId}.r2.cloudflarestorage.com`,
        requestChecksumCalculation: 'WHEN_REQUIRED',
        credentials: {
            accessKeyId: environment.accessKeyId,
            secretAccessKey: environment.secretAccessKey
        }
    });
    cachedAccountId = environment.accountId;
    return cachedClient;
};

export const createPresignedProductImageUpload = async ({ objectKey, contentType }) => {
    const environment = getR2Environment();
    const command = new PutObjectCommand({
        Bucket: environment.bucketName,
        Key: objectKey,
        ContentType: contentType
    });
    const uploadUrl = await getSignedUrl(getR2Client(environment), command, {
        expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
        signableHeaders: new Set(['content-type'])
    });

    return {
        uploadUrl,
        publicUrl: `${environment.publicBaseUrl}/${objectKey}`,
        expiresInSeconds: UPLOAD_URL_EXPIRES_IN_SECONDS
    };
};
