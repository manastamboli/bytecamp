import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { uploadFile, getPresignedMediaUrl } from '@/lib/aws/s3-publish';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

/**
 * POST /api/upload/tenant-logo
 * Upload a tenant logo before tenant creation
 * Stores in: sites/[userId]/tenant-logos/[filename]
 */
export async function POST(request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${randomUUID()}.${fileExtension}`;

    // Upload to S3 in user's tenant-logos folder
    const s3Key = `sites/${session.user.id}/tenant-logos/${uniqueFileName}`;

    await uploadFile(s3Key, buffer, file.type);

    // Generate presigned URL for immediate preview
    const presignedUrl = await getPresignedMediaUrl(s3Key, 3600);

    return NextResponse.json({
      success: true,
      s3Key,
      url: presignedUrl,
      fileName: file.name,
    });

  } catch (error) {
    console.error('Tenant logo upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}
