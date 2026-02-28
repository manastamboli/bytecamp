import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * DELETE /api/tenants/[tenantId]/logo
 * Delete tenant logo from S3 and database
 */
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await params;

    // Check if user is owner
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (tenant.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!tenant.logo) {
      return NextResponse.json({ error: 'No logo to delete' }, { status: 400 });
    }

    // Delete from S3
    const bucket = process.env.AWS_S3_BUCKET;
    if (bucket && tenant.logo) {
      try {
        const deleteCmd = new DeleteObjectCommand({
          Bucket: bucket,
          Key: tenant.logo,
        });
        await s3.send(deleteCmd);
        console.log(`[S3] Deleted logo: ${tenant.logo}`);
      } catch (error) {
        console.error('[S3] Failed to delete logo:', error);
        // Continue anyway to clear database
      }
    }

    // Update tenant in database
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { logo: null },
    });

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error('Error deleting tenant logo:', error);
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    );
  }
}
