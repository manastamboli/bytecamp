import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { deleteFile } from '@/lib/aws/s3-publish';

export const runtime = 'nodejs';

// DELETE /api/tenants/[tenantId]/media/[mediaId]
export async function DELETE(request, { params }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tenantId, mediaId } = await params;

        // Verify membership
        const membership = await prisma.tenantUser.findFirst({
            where: { userId: session.user.id, tenantId },
        });

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get media record
        const media = await prisma.media.findUnique({
            where: { id: mediaId },
        });

        if (!media) {
            return NextResponse.json({ error: 'Media not found' }, { status: 404 });
        }

        // Verify media belongs to this tenant
        if (media.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete from S3
        try {
            await deleteFile(media.url); // media.url contains the S3 key
        } catch (error) {
            console.error('Error deleting from S3:', error);
            // Continue to delete from DB even if S3 delete fails
        }

        // Delete from database
        await prisma.media.delete({
            where: { id: mediaId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete media error:', error);
        return NextResponse.json(
            { error: 'Failed to delete media' },
            { status: 500 }
        );
    }
}
