import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requestCertificate, describeCertificate } from "@/lib/aws/acm-ssl";

/**
 * POST /api/sites/[siteId]/domains/[domainId]/ssl
 * Request SSL certificate from AWS ACM
 */
export async function POST(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, domainId } = await params;

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

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find domain
    const customDomain = await prisma.customDomain.findFirst({
      where: { id: domainId, siteId },
    });

    if (!customDomain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    // Check if domain is verified
    if (customDomain.status !== "VERIFIED" && !customDomain.verifiedAt) {
      return NextResponse.json(
        { error: "Domain must be verified before requesting SSL certificate" },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    if (customDomain.certificateArn) {
      // Check current status
      try {
        const certDetails = await describeCertificate(customDomain.certificateArn);

        return NextResponse.json({
          success: true,
          alreadyRequested: true,
          certificate: {
            arn: certDetails.certificateArn,
            status: certDetails.status,
            validationRecords: certDetails.validationRecords,
          },
          domain: customDomain,
        });
      } catch (error) {
        console.error("Existing certificate not found, requesting new one");
        // Continue to request new certificate
      }
    }

    // Update status
    await prisma.customDomain.update({
      where: { id: domainId },
      data: { status: "SSL_PENDING" },
    });

    // Request certificate from ACM
    const certResult = await requestCertificate(customDomain.domain);

    // Update domain with certificate details
    const updatedDomain = await prisma.customDomain.update({
      where: { id: domainId },
      data: {
        certificateArn: certResult.certificateArn,
        certificateStatus: certResult.status,
        certificateValidation: certResult.validationRecords,
        status: certResult.status === "ISSUED" ? "SSL_ISSUED" : "SSL_VALIDATING",
      },
    });

    return NextResponse.json({
      success: true,
      certificate: {
        arn: certResult.certificateArn,
        status: certResult.status,
        validationRecords: certResult.validationRecords,
      },
      domain: updatedDomain,
      message: "SSL certificate requested. Add DNS validation records to complete issuance.",
    });

  } catch (error) {
    console.error("POST /api/sites/[siteId]/domains/[domainId]/ssl error:", error);

    // Update domain status to failed
    const { domainId } = await params;
    try {
      await prisma.customDomain.update({
        where: { id: domainId },
        data: { status: "FAILED" },
      });
    } catch (updateError) {
      console.error("Failed to update domain status:", updateError);
    }

    return NextResponse.json(
      { error: "Failed to request SSL certificate", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sites/[siteId]/domains/[domainId]/ssl
 * Check SSL certificate status
 */
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { siteId, domainId } = await params;

    // Verify access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find domain
    const customDomain = await prisma.customDomain.findFirst({
      where: { id: domainId, siteId },
    });

    if (!customDomain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (!customDomain.certificateArn) {
      return NextResponse.json({
        success: false,
        message: "No certificate requested for this domain",
      });
    }

    // Get current certificate status from ACM
    const certDetails = await describeCertificate(customDomain.certificateArn);

    // Update database with latest status
    const isIssued = certDetails.status === "ISSUED";

    const updatedDomain = await prisma.customDomain.update({
      where: { id: domainId },
      data: {
        certificateStatus: certDetails.status,
        status: isIssued ? "SSL_ISSUED" : customDomain.status,
        certificateIssuedAt: isIssued && !customDomain.certificateIssuedAt
          ? new Date()
          : customDomain.certificateIssuedAt,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      certificate: {
        arn: certDetails.certificateArn,
        status: certDetails.status,
        issuedAt: certDetails.issuedAt,
        validationRecords: certDetails.validationRecords,
      },
      domain: updatedDomain,
    });

  } catch (error) {
    console.error("GET /api/sites/[siteId]/domains/[domainId]/ssl error:", error);
    return NextResponse.json(
      { error: "Failed to check SSL status", details: error.message },
      { status: 500 }
    );
  }
}
