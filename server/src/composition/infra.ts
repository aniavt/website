import mongoose from "mongoose";
import { S3Client } from "@aws-sdk/client-s3";

import { ArgonIdSecureHasher } from "@infrastructure/ArgonIdSecureHasher";
import { CryptoIdGenerator } from "@infrastructure/CryptoIdGenerator";
import { S3Service } from "@infrastructure/S3Service";

const mongoUri = Bun.env.MONGO_URI;
if (mongoUri === undefined) {
    throw new Error("MONGO_URI is not set");
}

export const mongoClient = mongoose.createConnection(mongoUri);
export const passwordHasher = new ArgonIdSecureHasher();
export const idGenerator = new CryptoIdGenerator();

const s3Region = Bun.env.S3_REGION;
const s3Bucket = Bun.env.S3_BUCKET;
const s3Endpoint = Bun.env.S3_ENDPOINT;
const s3PublicEndpoint = Bun.env.S3_PUBLIC_ENDPOINT ?? s3Endpoint;
const s3AccessKeyId = Bun.env.AWS_ACCESS_KEY_ID;
const s3SecretAccessKey = Bun.env.AWS_SECRET_ACCESS_KEY;

if (!s3Region || !s3Bucket || !s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey) {
    throw new Error("S3_REGION, S3_BUCKET, S3_ENDPOINT, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set");
}

const s3Client = new S3Client({
    region: s3Region,
    endpoint: s3Endpoint,
    forcePathStyle: true,
    credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
    },
});
const s3SigningClient = new S3Client({
    region: s3Region,
    endpoint: s3PublicEndpoint,
    forcePathStyle: true,
    credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
    },
});

export const mediaService = new S3Service(s3Client, s3SigningClient, s3Bucket, idGenerator);
