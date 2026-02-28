import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const runtime = "nodejs";

/**
 * POST /api/sites/[siteId]/pages/[pageId]/set-home
 *
 * Sets this page as the home page (slug: "/")
 * - Updates the current home page to use a different slug
 * - Updates this page to use "/" slug
 * - Renames published files accordingly
 */
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, pageId } = await params;

    // Fetch site
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Verify tenant membership
    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the page to be set as home
    const newHomePage = await prisma.page.findFirst({
      where: { id: pageId, siteId },
    });
    if (!newHomePage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // If already home page, nothing to do
    if (newHomePage.slug === "/") {
      return NextResponse.json({
        success: true,
        message: "This page is already the home page",
      });
    }

    // Find current home page
    const currentHomePage = await prisma.page.findFirst({
      where: { siteId, slug: "/" },
    });

    // Generate new slug for old home page (use its name)
    const oldHomeNewSlug = currentHomePage
      ? `/${currentHomePage.name.toLowerCase().replace(/\s+/g, "-")}`
      : "/old-home";

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Update old home page to new slug
      if (currentHomePage) {
        await tx.page.update({
          where: { id: currentHomePage.id },
          data: { slug: oldHomeNewSlug },
        });
      }

      // Update new home page to "/"
      await tx.page.update({
        where: { id: pageId },
        data: { slug: "/" },
      });
    });

    // Handle published files if they exist
    const siteSlug = site.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const siteDir = join(process.cwd(), "public", "published", siteSlug);

    try {
      // If old home was published, rename index.html to its new slug
      if (currentHomePage?.isPublished) {
        const oldIndexPath = join(siteDir, "index.html");
        const newOldHomePath = join(
          siteDir,
          `${oldHomeNewSlug.replace(/^\//, "")}.html`,
        );
        try {
          await unlink(oldIndexPath);
          // Note: The old home page will need to be re-published to generate its new file
        } catch (err) {
          console.log("No index.html to rename:", err.message);
        }
      }

      // If new home was published, rename its file to index.html
      if (newHomePage.isPublished) {
        const oldPagePath = join(
          siteDir,
          `${newHomePage.slug.replace(/^\//, "")}.html`,
        );
        const newIndexPath = join(siteDir, "index.html");
        try {
          await unlink(oldPagePath);
          // Note: The new home page will need to be re-published to generate index.html
        } catch (err) {
          console.log("No old page file to rename:", err.message);
        }
      }
    } catch (fileError) {
      console.error("Error handling published files:", fileError);
      // Continue anyway - files will be regenerated on next publish
    }

    return NextResponse.json({
      success: true,
      message: "Home page updated successfully! Re-publish both pages to update files.",
      needsRepublish: true,
    });
  } catch (error) {
    console.error("Set home page error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to set home page" },
      { status: 500 },
    );
  }
}
