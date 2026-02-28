import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { uploadHtmlToS3 } from "@/lib/aws/s3-upload";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Ensure Node.js runtime for file system access
export const runtime = "nodejs";

/**
 * POST /api/publish-demo-site
 * Publishes a demo site by uploading index.html to S3 with multi-tenant structure
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Static demo values (later these will come from database)
    const userId = session.user.id; // Use actual user ID
    const businessId = "999";
    const siteId = "1";
    const siteSlug = "demo-site";

    // Path to the HTML file in public folder
    const htmlFilePath = join(process.cwd(), "public", "index.html");

    // Read the HTML file
    let fileBuffer;
    try {
      fileBuffer = await readFile(htmlFilePath);
    } catch (error) {
      console.error("File read error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to read index.html file. Please ensure the file exists in /public/index.html",
        },
        { status: 404 }
      );
    }

    // Upload to S3 using the reusable service
    try {
      const uploadResult = await uploadHtmlToS3(fileBuffer, {
        userId,
        businessId,
        siteId,
        fileName: "index.html",
      });

      // Construct preview URL based on siteSlug
      const previewUrl = `https://${siteSlug}.sitepilot.devally.in`;

      // Return success response
      return NextResponse.json({
        success: true,
        siteSlug,
        previewUrl,
        s3Path: uploadResult.fullPath,
      });
    } catch (error) {
      console.error("Upload error:", error);

      // Check for specific AWS errors
      if (error.message.includes("AWS_S3_BUCKET")) {
        return NextResponse.json(
          {
            success: false,
            error: "AWS S3 bucket configuration is missing. Please check environment variables.",
          },
          { status: 500 }
        );
      }

      if (error.message.includes("credentials") || error.message.includes("access")) {
        return NextResponse.json(
          {
            success: false,
            error: "AWS credentials error. Please check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
          },
          { status: 403 }
        );
      }

      // Generic upload failure
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to upload to S3",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while publishing the site",
      },
      { status: 500 }
    );
  }
}
