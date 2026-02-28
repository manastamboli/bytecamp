import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createCloudFrontTenant } from "@/lib/aws/cf-tenants";

/**
 * POST /api/cloudfront/create-tenant
 * 
 * Creates a new tenant in the CloudFront multi-tenant distribution.
 * This API endpoint handles the complete tenant provisioning process:
 * - Validates authentication and permissions
 * - Creates tenant in CloudFront distribution
 * - Associates with connection group
 * - Updates Key-Value Store for routing
 * - Returns tenant metadata
 * 
 * Request body:
 * {
 *   "tenantName": "my-site",       // Unique tenant identifier (site slug)
 *   "siteId": "uuid",              // Site ID from database
 *   "domains": ["my-site.sitepilot.devally.in"]  // Optional custom domains
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "tenant": {
 *     "tenantId": "E2RGM009VMVUBY:my-site",
 *     "distributionId": "E2RGM009VMVUBY",
 *     "connectionGroupId": "cg_39y9v6TFZ1MRXBQCCkKEqN9FIil",
 *     "domain": "my-site.sitepilot.devally.in",
 *     "status": "LIVE",
 *     "kvsKey": "my-site",
 *     "createdAt": "2026-02-21T10:30:00Z"
 *   }
 * }
 */
export async function POST(request) {
  try {
    // ── Authentication check ───────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ── Parse request body ─────────────────────────────────────────────────
    const { tenantName, siteId, domains } = await request.json();

    if (!tenantName) {
      return NextResponse.json(
        { error: "tenantName is required" },
        { status: 400 }
      );
    }

    // Validate tenant name format (alphanumeric and hyphens only)
    const validNamePattern = /^[a-z0-9-]+$/;
    if (!validNamePattern.test(tenantName)) {
      return NextResponse.json(
        { error: "Invalid tenant name. Use lowercase letters, numbers, and hyphens only." },
        { status: 400 }
      );
    }

    console.log(`[API] Creating CloudFront tenant: ${tenantName}`);
    console.log(`[API] Site ID: ${siteId || 'N/A'}`);
    console.log(`[API] Custom domains: ${domains?.join(', ') || 'None'}`);

    // ── Create CloudFront Tenant ───────────────────────────────────────────
    const tenant = await createCloudFrontTenant({
      tenantName,
      siteId,
      domains: domains || [`${tenantName}.sitepilot.devally.in`],
      userId: session.user.id,
    });

    if (!tenant.success) {
      console.error(`[API] Tenant creation failed:`, tenant.error);
      return NextResponse.json(
        {
          error: "Failed to create CloudFront tenant",
          details: tenant.error
        },
        { status: 500 }
      );
    }

    console.log(`[API] ✓ Tenant created successfully: ${tenant.tenantId}`);

    // ── Return success response ────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        tenant: {
          tenantId: tenant.tenantId,
          distributionId: tenant.distributionId,
          distributionArn: tenant.distributionArn,
          connectionGroupId: tenant.connectionGroupId,
          domain: tenant.domain,
          domains: tenant.domains,
          status: tenant.status,
          kvsKey: tenant.kvsKey,
          kvsValue: tenant.kvsValue,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[API] CloudFront tenant creation error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cloudfront/create-tenant
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/cloudfront/create-tenant",
    description: "Create a new tenant in the CloudFront multi-tenant distribution",
    requiredFields: {
      tenantName: "string (lowercase, alphanumeric, hyphens)",
    },
    optionalFields: {
      siteId: "string (UUID)",
      domains: "array of strings",
    },
    example: {
      tenantName: "my-site",
      siteId: "123e4567-e89b-12d3-a456-426614174000",
      domains: ["my-site.sitepilot.devally.in"],
    },
  });
}
