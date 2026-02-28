import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getPresignedMediaUrl } from '@/lib/aws/s3-publish';

// GET /api/tenants/[tenantId]/brand-kit - Get brand kit
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

    // Verify membership
    const membership = await prisma.tenantUser.findFirst({
      where: { userId: session.user.id, tenantId },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get tenant with brand kit
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        logo: true,
        brandKit: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Generate presigned URL for logo if it exists
    let logoUrl = tenant.logo;
    if (logoUrl && !logoUrl.startsWith('http')) {
      // It's an S3 key, generate presigned URL
      try {
        logoUrl = await getPresignedMediaUrl(logoUrl, 3600);
      } catch (error) {
        console.error('Error generating presigned URL for logo:', error);
      }
    }

    return NextResponse.json({
      brandKit: tenant.brandKit || {},
      logo: logoUrl,
      logoS3Key: tenant.logo, // Also return the S3 key
    });
  } catch (error) {
    console.error('Error fetching brand kit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand kit' },
      { status: 500 }
    );
  }
}

// PUT /api/tenants/[tenantId]/brand-kit - Update brand kit
export async function PUT(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;
    const body = await request.json();

    // Verify membership (owner or admin only)
    const membership = await prisma.tenantUser.findFirst({
      where: { 
        userId: session.user.id, 
        tenantId,
        role: { in: ['OWNER', 'EDITOR'] }
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update brand kit
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        brandKit: body.brandKit,
        logo: body.logo,
      },
      select: {
        id: true,
        brandKit: true,
        logo: true,
      },
    });

    return NextResponse.json({
      success: true,
      brandKit: tenant.brandKit,
      logo: tenant.logo,
    });
  } catch (error) {
    console.error('Error updating brand kit:', error);
    return NextResponse.json(
      { error: 'Failed to update brand kit' },
      { status: 500 }
    );
  }
}
