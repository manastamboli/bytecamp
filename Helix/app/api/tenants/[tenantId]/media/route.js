import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { uploadFile, getPresignedMediaUrl, listMediaFromS3 } from '@/lib/aws/s3-publish';
import { buildSiteUrl } from '@/lib/aws/s3-publish';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

// GET /api/tenants/[tenantId]/media
export async function GET(request, { params }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tenantId } = await params;

        // Verify membership and fetch tenant owner id automatically
        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId },
            include: { tenant: true }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const ownerId = membership.tenant.ownerId;

        const dbMedia = await prisma.media.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });

        const prefix = `sites/${ownerId}/${tenantId}/media/`;
        let s3Objects = [];
        try {
            s3Objects = await listMediaFromS3(prefix);
        } catch (e) {
            console.error("Failed to list S3 media natively", e);
        }

        // Merge S3 and DB
        const mediaMap = new Map();

        // Include everything discovered physically on S3
        s3Objects.forEach(obj => {
            const fileName = obj.Key.split('/').pop();
            // Skip directory keys
            if (!fileName) return;

            mediaMap.set(obj.Key, {
                id: obj.Key,
                url: obj.Key,
                name: fileName,
                createdAt: obj.LastModified
            });
        });

        // Overlay specific db entries
        dbMedia.forEach(m => {
            let s3Key = m.url;
            if (s3Key.startsWith('http')) {
                const match = s3Key.match(/\.amazonaws\.com\/(.+)$/);
                if (match && match[1]) {
                    s3Key = match[1];
                } else {
                    const startIdx = s3Key.indexOf('sites/');
                    if (startIdx !== -1) {
                        s3Key = s3Key.substring(startIdx);
                    }
                }
            }

            mediaMap.set(s3Key, {
                id: m.id,
                url: s3Key,           // Treat the true url inside the map as S3Key
                name: m.name,
                createdAt: m.createdAt
            });
        });

        const mergedMedia = Array.from(mediaMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Map media url (which acts as the s3Key) to short-lived S3 Signed URLs (expires in 1hr)
        const mediaWithSignedUrls = await Promise.all(
            mergedMedia.map(async (m) => {
                try {
                    const signedUrl = await getPresignedMediaUrl(m.url, 3600);
                    return { ...m, url: signedUrl, originalKey: m.url };
                } catch (e) {
                    console.error(`Failed to generate signed url for ${m.url}`, e);
                    return m;
                }
            })
        );

        return NextResponse.json({ success: true, media: mediaWithSignedUrls });
    } catch (error) {
        console.error('Fetch Media Error:', error);
        return NextResponse.json({ error: 'Failed to fetch media', details: error.message }, { status: 500 });
    }
}

// POST /api/tenants/[tenantId]/media
export async function POST(request, { params }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tenantId } = await params;

        // Verify membership and get tenant owner
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { tenantUsers: { where: { userId: session.user.id } } },
        });

        if (!tenant || tenant.tenantUsers.length === 0) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file found.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to S3
        // Key format: sites/[userId]/[businessId]/media/[fileName]
        // userId = tenant.ownerId, businessId = tenantId
        const uniqueFileName = `${Date.now()}-${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const s3Key = `sites/${tenant.ownerId}/${tenantId}/media/${uniqueFileName}`;

        await uploadFile(s3Key, buffer, file.type);

        // Public URL - assuming domain is mapped to S3 bucket or CloudFront distribution fronting the bucket
        // If there's no generic CloudFront for the bucket, we might need the raw S3 URL.
        const BUCKET = process.env.AWS_S3_BUCKET;
        const REGION = process.env.AWS_REGION || 'us-east-1';
        let publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;

        // Alternatively if there is a global CDN... but for now direct S3 URL is fine as the bucket should be public or CF-fronted.

        // Save to DB storing s3Key in `url` field
        const mediaRecord = await prisma.media.create({
            data: {
                url: s3Key,
                name: file.name,
                tenantId: tenantId,
            }
        });

        const presignedUrl = await getPresignedMediaUrl(s3Key, 3600);

        return NextResponse.json({
            success: true,
            url: presignedUrl, // Presigned URL for immediate display
            s3Key: s3Key, // S3 key for permanent storage
            media: {
                ...mediaRecord,
                url: presignedUrl,
                s3Key: s3Key
            }
        });

    } catch (error) {
        console.error('File Upload Error:', error);
        return NextResponse.json({ error: 'Upload Failed', details: error.message }, { status: 500 });
    }
}
