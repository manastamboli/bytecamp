import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Initialize S3 Client with credentials from environment variables
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload HTML file to S3 with multi-tenant folder structure
 * 
 * @param {Buffer} fileBuffer - The HTML file content as a Buffer
 * @param {Object} params - Upload parameters
 * @param {string} params.userId - User ID for folder structure
 * @param {string} params.businessId - Business ID for folder structure
 * @param {string} params.siteId - Site ID for folder structure
 * @param {string} params.fileName - File name (e.g., "index.html")
 * @returns {Promise<Object>} Upload result with bucket and key
 */
export async function uploadHtmlToS3(fileBuffer, params) {
  const { userId, businessId, siteId, fileName } = params;

  // Validate required parameters
  if (!userId || !businessId || !siteId || !fileName) {
    throw new Error("Missing required parameters: userId, businessId, siteId, or fileName");
  }

  // Validate fileBuffer
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error("Invalid file buffer provided");
  }

  // Get bucket name from environment
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  // Construct the S3 key with multi-tenant structure
  const key = `${userId}/${businessId}/${siteId}/live/${fileName}`;

  // Prepare upload command
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: "text/html",
    CacheControl: "no-cache",
  });

  try {
    // Execute upload
    await s3Client.send(command);

    return {
      success: true,
      bucket,
      key,
      fullPath: `/${key}`,
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}
