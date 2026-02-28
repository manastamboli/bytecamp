import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { convertJsonToHtml } from "@/lib/publish/jsonToHtml";

export const runtime = "nodejs";

/**
 * POST /api/publish
 *
 * Receives the builder layout JSON, converts it to HTML/CSS/JS,
 * and writes the files to /public/published/<siteName>/
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { layoutJSON, pageId } = body;

    if (!layoutJSON || !layoutJSON.pages?.length) {
      return NextResponse.json(
        { success: false, error: "Invalid layout JSON — no pages found." },
        { status: 400 },
      );
    }

    // Convert JSON → HTML/CSS/JS
    const { html, css, js } = convertJsonToHtml(layoutJSON, pageId);

    // Determine output directory
    const slug =
      layoutJSON.site?.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "site";

    const outDir = join(process.cwd(), "public", "published", slug);

    // Ensure directory exists
    await mkdir(outDir, { recursive: true });

    // Write files
    await Promise.all([
      writeFile(join(outDir, "index.html"), html, "utf-8"),
      writeFile(join(outDir, "styles.css"), css, "utf-8"),
      writeFile(join(outDir, "script.js"), js, "utf-8"),
    ]);

    const previewPath = `/published/${slug}/index.html`;

    return NextResponse.json({
      success: true,
      message: `Site published successfully! Preview at ${previewPath}`,
      previewUrl: previewPath,
      files: ["index.html", "styles.css", "script.js"],
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to publish site." },
      { status: 500 },
    );
  }
}
