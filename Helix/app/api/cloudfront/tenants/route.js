import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { listAllCloudFrontTenants } from '@/lib/aws/cf-tenants';

/**
 * GET /api/cloudfront/tenants
 * List all CloudFront tenants and their database status
 * 
 * Requires authentication (admin-level)
 */
export async function GET(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CloudFront Tenants] Fetching all tenants...');

    // Fetch CloudFront tenants
    const cloudFrontTenants = await listAllCloudFrontTenants();

    // Fetch database sites
    const sites = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        cfTenantId: true,
        cfTenantArn: true,
        cfStatus: true,
      },
    });

    // Create a map of slug -> site for quick lookup
    const siteMap = new Map();
    sites.forEach(site => {
      siteMap.set(site.slug, site);
    });

    // Match CloudFront tenants with database sites
    const tenants = cloudFrontTenants.map(cfTenant => {
      const site = siteMap.get(cfTenant.name);

      return {
        cloudfront: {
          identifier: cfTenant.identifier || cfTenant.id,
          name: cfTenant.name,
          arn: cfTenant.arn,
          domains: cfTenant.domains || [],
        },
        database: site ? {
          siteId: site.id,
          siteName: site.name,
          slug: site.slug,
          cfTenantId: site.cfTenantId,
          cfTenantArn: site.cfTenantArn,
          cfStatus: site.cfStatus,
          needsUpdate: !site.cfTenantId ||
            site.cfTenantId.startsWith('PLACEHOLDER-') ||
            site.cfTenantId.startsWith('tenant-') ||
            site.cfTenantId !== cfTenant.identifier,
        } : null,
      };
    });

    // Find sites that don't have a CloudFront tenant
    const sitesWithoutTenant = sites.filter(site => {
      return !cloudFrontTenants.some(cft => cft.name === site.slug);
    });

    return NextResponse.json({
      success: true,
      summary: {
        cloudFrontTenants: cloudFrontTenants.length,
        databaseSites: sites.length,
        matched: tenants.filter(t => t.database).length,
        needsUpdate: tenants.filter(t => t.database?.needsUpdate).length,
        sitesWithoutTenant: sitesWithoutTenant.length,
      },
      tenants,
      sitesWithoutTenant: sitesWithoutTenant.map(s => ({
        siteId: s.id,
        siteName: s.name,
        slug: s.slug,
        cfTenantId: s.cfTenantId,
      })),
    });

  } catch (error) {
    console.error('[CloudFront Tenants] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cloudfront/tenants/backfill
 * Backfill cfTenantId for a specific site
 * 
 * Body: { siteId: string }
 */
export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    // Fetch site
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        name: true,
        slug: true,
        cfTenantId: true,
        tenantId: true,
      },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check if user has access
    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId: site.tenantId },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch CloudFront tenants
    const cloudFrontTenants = await listAllCloudFrontTenants();
    const cfTenant = cloudFrontTenants.find(t => t.name === site.slug);

    if (!cfTenant) {
      return NextResponse.json(
        { error: `No CloudFront tenant found for slug: ${site.slug}` },
        { status: 404 }
      );
    }

    // Update site with correct cfTenantId
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        cfTenantId: cfTenant.identifier || cfTenant.id,
        cfTenantArn: cfTenant.arn,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Site updated successfully',
      site: {
        id: updatedSite.id,
        name: updatedSite.name,
        slug: updatedSite.slug,
        cfTenantId: updatedSite.cfTenantId,
        cfTenantArn: updatedSite.cfTenantArn,
      },
      cloudfront: {
        identifier: cfTenant.identifier || cfTenant.id,
        name: cfTenant.name,
        arn: cfTenant.arn,
      },
    });

  } catch (error) {
    console.error('[CloudFront Backfill] Error:', error);
    return NextResponse.json(
      { error: 'Failed to backfill cfTenantId', details: error.message },
      { status: 500 }
    );
  }
}
