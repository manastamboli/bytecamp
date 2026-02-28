import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { deleteCertificate } from "@/lib/aws/acm-ssl";
import { removeDomainFromTenant } from "@/lib/aws/cf-domain-attach";
import { deleteFromKVS } from "@/lib/aws/s3-publish";

/**
 * DELETE /api/sites/[siteId]/domains/[domainId]
 * Remove a custom domain and clean up all associated resources
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, domainId } = await params;

    console.log(`[Domain Delete] Starting deletion for domainId: ${domainId}`);

    // Verify site exists and user has access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "EDITOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find domain
    const customDomain = await prisma.customDomain.findFirst({
      where: { id: domainId, siteId },
    });

    if (!customDomain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    console.log(`[Domain Delete] Found domain: ${customDomain.domain}`);

    const cleanupResults = {
      domain: customDomain.domain,
      cloudfront: null,
      kvs: null,
      ssl: null,
      database: false,
    };

    // Step 1: Remove from CloudFront if attached
    if (customDomain.attachedToCF) {
      console.log(`[Domain Delete] Removing from CloudFront...`);
      try {
        await removeDomainFromTenant({
          tenantName: site.slug,
          domain: customDomain.domain,
        });
        cleanupResults.cloudfront = "removed";
        console.log(`[Domain Delete] ✓ Removed from CloudFront`);
      } catch (error) {
        console.error("[Domain Delete] Failed to remove from CloudFront:", error);
        cleanupResults.cloudfront = `failed: ${error.message}`;
        // Continue with deletion
      }
    }

    // Step 2: Remove from KVS if active
    if (customDomain.status === "ACTIVE") {
      console.log(`[Domain Delete] Removing from KVS...`);
      try {
        await deleteFromKVS(customDomain.domain);
        cleanupResults.kvs = "removed";
        console.log(`[Domain Delete] ✓ Removed from KVS`);
      } catch (error) {
        console.error("[Domain Delete] Failed to remove from KVS:", error);
        cleanupResults.kvs = `failed: ${error.message}`;
        // Continue with deletion
      }
    }

    // Step 3: Delete SSL certificate if issued
    if (customDomain.certificateArn) {
      console.log(`[Domain Delete] Deleting SSL certificate...`);
      try {
        const result = await deleteCertificate(customDomain.certificateArn);
        if (result.deleted) {
          cleanupResults.ssl = "deleted";
          console.log(`[Domain Delete] ✓ SSL certificate deleted`);
        } else {
          cleanupResults.ssl = `skipped: ${result.reason}`;
          console.log(`[Domain Delete] ℹ️  SSL certificate not deleted: ${result.reason}`);
        }
      } catch (error) {
        console.error("[Domain Delete] Failed to delete SSL certificate:", error);
        cleanupResults.ssl = `failed: ${error.message}`;
        // Don't throw - SSL cleanup is non-critical for domain deletion
        // The certificate can be manually deleted later if needed
      }
    }

    // Step 4: Delete domain record from database
    console.log(`[Domain Delete] Deleting from database...`);
    await prisma.customDomain.delete({
      where: { id: domainId },
    });
    cleanupResults.database = true;

    console.log(`[Domain Delete] ✓ Domain deleted successfully`);
    console.log(`[Domain Delete] Cleanup results:`, cleanupResults);

    return NextResponse.json({
      success: true,
      message: "Domain and associated resources removed successfully",
      cleanup: cleanupResults,
    });

  } catch (error) {
    console.error("DELETE /api/sites/[siteId]/domains/[domainId] error:", error);
    return NextResponse.json(
      { error: "Failed to remove domain", details: error.message },
      { status: 500 }
    );
  }
}
