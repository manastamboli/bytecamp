import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    CloudFrontKeyValueStoreClient,
    PutKeyCommand,
    DeleteKeyCommand,
    DescribeKeyValueStoreCommand,
} from "@aws-sdk/client-cloudfront-keyvaluestore";

// ─── IMPORTANT: REGISTRATION FOR SigV4A ─────────────────────────────────────
// Importing this package registers the pure-JS SigV4a implementation globally.
// This is required for CloudFront KVS as it uses multi-region signing.
import "@aws-sdk/signature-v4a";

// ─── S3 Client ───────────────────────────────────────────────────────────────

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// ─── CloudFront KVS Client ───────────────────────────────────────────────────
// With "@aws-sdk/signature-v4a" imported above, the client will automatically
// find and use the JS implementation for multi-region signing.

const kvsClient = new CloudFrontKeyValueStoreClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.AWS_S3_BUCKET;
const KVS_ARN = process.env.CLOUDFRONT_KVS_ARN; // e.g. arn:aws:cloudfront::123456789:key-value-store/abc-def

// ─── Build S3 key paths ───────────────────────────────────────────────────────

/**
 * Returns the S3 key prefix for a specific deployment.
 * Structure: sites/{userId}/{businessId}/{siteId}/deployments/{deploymentId}/
 */
export function buildDeploymentPrefix(userId, businessId, siteId, deploymentId) {
    return `sites/${userId}/${businessId}/${siteId}/deployments/${deploymentId}`;
}

/**
 * Returns the public CloudFront URL base for a site.
 */
export function buildSiteUrl(siteSlug) {
    return `https://${siteSlug}.sitepilot.devally.in`;
}

// ─── S3 Upload ────────────────────────────────────────────────────────────────

/**
 * Upload a single file to S3.
 * Idempotent — S3 PutObject is inherently idempotent (same key = overwrite,
 * but since deploymentId is unique per publish no previous version is touched).
 *
 * @param {string} key         - Full S3 object key
 * @param {Buffer|string} body - File content
 * @param {string} contentType - MIME type
 */
export async function uploadFile(key, body, contentType) {
    if (!BUCKET) throw new Error("AWS_S3_BUCKET env var is not set");

    const cmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable", // versioned paths are immutable
    });

    await s3.send(cmd);
    return key;
}

/**
 * Generate a presigned URL for a secure media download from S3.
 *
 * @param {string} key - S3 Key
 * @param {number} expiresIn - Expiration in seconds
 */
export async function getPresignedMediaUrl(key, expiresIn = 3600) {
    if (!BUCKET) throw new Error("AWS_S3_BUCKET env var is not set");

    const cmd = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    return await getSignedUrl(s3, cmd, { expiresIn });
}

/**
 * Delete a single file from S3.
 *
 * @param {string} key - S3 Key to delete
 */
export async function deleteFile(key) {
    if (!BUCKET) throw new Error("AWS_S3_BUCKET env var is not set");

    const cmd = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
    });

    await s3.send(cmd);
    return true;
}

/**
 * List items from S3 directly via a prefix
 * 
 * @param {string} prefix
 */
export async function listMediaFromS3(prefix) {
    if (!BUCKET) throw new Error("AWS_S3_BUCKET env var is not set");

    const cmd = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
    });

    const result = await s3.send(cmd);
    return result.Contents || [];
}

/**
 * Upload all site files for a deployment.
 * Uploads each file and returns the S3 prefix used.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.businessId
 * @param {string} params.siteId
 * @param {string} params.deploymentId  - UUID for this deployment
 * @param {Array} params.files          - Array of { path, content, contentType }
 * @returns {{ s3Prefix: string, keys: string[] }}
 */
export async function uploadDeploymentToS3({
    userId,
    businessId,
    siteId,
    deploymentId,
    files,
}) {
    if (!userId || !businessId || !siteId || !deploymentId || !files) {
        throw new Error("Missing required upload parameters");
    }

    const prefix = buildDeploymentPrefix(userId, businessId, siteId, deploymentId);

    // Upload all files concurrently
    const uploadPromises = files.map(f =>
        uploadFile(`${prefix}/${f.path}`, f.content, f.contentType)
    );
    const uploads = await Promise.all(uploadPromises);

    return {
        s3Prefix: prefix,
        keys: uploads,
    };
}

// ─── CloudFront KVS ───────────────────────────────────────────────────────────

/**
 * Update the CloudFront Key Value Store to point a site slug to a deployment.
 *
 * KVS key   = siteSlug  (e.g. "my-site")
 * KVS value = s3Prefix  (e.g. "sites/userId/businessId/siteId/deployments/deploymentId")
 *
 * The CloudFront Function reads this KV pair and rewrites the origin request
 * to the correct S3 path automatically.
 *
 * @param {string} siteSlug    - The site's slug (subdomain)
 * @param {string} s3Prefix    - The S3 key prefix for the target deployment
 */
export async function updateKVS(siteSlug, s3Prefix) {
    if (!KVS_ARN) {
        console.warn("[KVS] CLOUDFRONT_KVS_ARN not set — skipping KVS update");
        return { skipped: true };
    }

    console.log(`[KVS] Updating Key-Value Store: "${siteSlug}" -> "${s3Prefix}"`);
    console.log(`[KVS] Using KVS ARN: ${KVS_ARN}`);

    try {
        // Step 1: Get the current ETag of the KV store (required for optimistic locking)
        console.log("[KVS] Step 1: Fetching current ETag for optimistic locking");
        const describeCmd = new DescribeKeyValueStoreCommand({ KvsARN: KVS_ARN });
        const describeResult = await kvsClient.send(describeCmd);
        const etag = describeResult.ETag;
        console.log(`[KVS] Current ETag: ${etag}`);

        // Step 2: Put the key
        console.log("[KVS] Step 2: Updating key-value pair");
        const putCmd = new PutKeyCommand({
            KvsARN: KVS_ARN,
            Key: siteSlug,
            Value: s3Prefix,
            IfMatch: etag, // Optimistic locking to prevent race conditions
        });

        const putResult = await kvsClient.send(putCmd);

        console.log(`[KVS] ✓ Successfully updated KVS`);
        console.log(`[KVS] New ETag: ${putResult.ETag}`);
        console.log(`[KVS] Site ${siteSlug} is now routed to: ${s3Prefix}`);

        return {
            updated: true,
            key: siteSlug,
            value: s3Prefix,
            etag: putResult.ETag,
        };
    } catch (error) {
        console.error("[KVS] Failed to update Key-Value Store:", {
            slug: siteSlug,
            prefix: s3Prefix,
            error: error.message,
            code: error.name,
            stack: error.stack,
        });
        throw error;
    }
}

/**
 * Delete a key from the CloudFront Key-Value Store.
 * Used when removing a custom domain or deleting a tenant.
 * 
 * @param {string} key - The key to delete (domain or site slug)
 * @returns {Promise<object>} Deletion result
 */
export async function deleteFromKVS(key) {
    if (!KVS_ARN) {
        console.warn("[KVS] CLOUDFRONT_KVS_ARN not set — skipping KVS deletion");
        return { skipped: true };
    }

    console.log(`[KVS] Deleting key from Key-Value Store: "${key}"`);
    console.log(`[KVS] Using KVS ARN: ${KVS_ARN}`);

    try {
        // Step 1: Get the current ETag of the KV store (required for optimistic locking)
        console.log("[KVS] Step 1: Fetching current ETag for optimistic locking");
        const describeCmd = new DescribeKeyValueStoreCommand({ KvsARN: KVS_ARN });
        const describeResult = await kvsClient.send(describeCmd);
        const etag = describeResult.ETag;
        console.log(`[KVS] Current ETag: ${etag}`);

        // Step 2: Delete the key
        console.log("[KVS] Step 2: Deleting key");
        const deleteCmd = new DeleteKeyCommand({
            KvsARN: KVS_ARN,
            Key: key,
            IfMatch: etag, // Optimistic locking
        });

        const deleteResult = await kvsClient.send(deleteCmd);

        console.log(`[KVS] ✓ Successfully deleted key from KVS`);
        console.log(`[KVS] New ETag: ${deleteResult.ETag}`);

        return {
            deleted: true,
            key,
            etag: deleteResult.ETag,
        };
    } catch (error) {
        // If key doesn't exist, that's fine - it's already gone
        if (error.name === "ResourceNotFoundException" || error.message.includes("not found")) {
            console.log(`[KVS] ℹ️  Key "${key}" not found in KVS (already deleted or never existed)`);
            return {
                deleted: true,
                key,
                alreadyDeleted: true,
            };
        }

        console.error("[KVS] Failed to delete from Key-Value Store:", {
            key,
            error: error.message,
            code: error.name,
            stack: error.stack,
        });
        throw error;
    }
}

// ─── Verify deployment exists in S3 ─────────────────────────────────────────

/**
 * Verify that a deployment's index.html exists in S3 before pointing KVS to it.
 * Used during rollback to ensure the target version is still valid.
 *
 * @param {string} s3Prefix
 * @returns {boolean}
 */
export async function verifyDeploymentExists(s3Prefix) {
    if (!BUCKET) throw new Error("AWS_S3_BUCKET env var is not set");
    try {
        await s3.send(
            new HeadObjectCommand({ Bucket: BUCKET, Key: `${s3Prefix}/index.html` })
        );
        return true;
    } catch {
        return false;
    }
}

// ─── Delete deployment from S3 ────────────────────────────────────────────────


/**
 * Delete all files for a deployment from S3.
 * Used when rolling back from a deployment to completely remove it.
 *
 * @param {string} s3Prefix
 */
export async function deleteDeploymentFromS3(s3Prefix) {
    if (!BUCKET) throw new Error("AWS_S3_BUCKET env var is not set");
    if (!s3Prefix || s3Prefix.length < 10) throw new Error("Invalid S3 prefix for deletion");

    try {
        // List all objects under the prefix
        const listCmd = new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: s3Prefix + "/",
        });
        const listedObjects = await s3.send(listCmd);

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            return;
        }

        // Delete them
        const deleteParams = {
            Bucket: BUCKET,
            Delete: { Objects: [] },
        };

        listedObjects.Contents.forEach(({ Key }) => {
            deleteParams.Delete.Objects.push({ Key });
        });

        const deleteCmd = new DeleteObjectsCommand(deleteParams);
        await s3.send(deleteCmd);

        // If list was truncated, we would need to recurse, but deployments are small here.
    } catch (error) {
        console.error("[S3] Failed to delete deployment:", error);
        throw error;
    }
}
