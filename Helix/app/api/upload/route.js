import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file found.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure the uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Create a unique filename
        const uniqueFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadDir, uniqueFileName);

        // Write the actual file locally
        fs.writeFileSync(filePath, buffer);

        // Return the relative public URL
        const publicUrl = `/uploads/${uniqueFileName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: file.name
        });

    } catch (error) {
        console.error('File Upload Error:', error);
        return NextResponse.json({ error: 'Upload Failed', details: error.message }, { status: 500 });
    }
}
