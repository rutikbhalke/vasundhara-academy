import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createUploadFileName, writeUploadFile } from '@/lib/uploadStorage';

// Configure Cloudinary if env vars are present
if (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // 1. CLOUDINARY UPLOAD (Production)
    if (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY) {
      return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'vasundhara-academy',
            resource_type: isPdf ? 'raw' : 'image',
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary Upload Error:', error);
              resolve(NextResponse.json({ error: 'Cloudinary upload failed' }, { status: 500 }));
            } else {
              resolve(NextResponse.json({
                url: result.secure_url,
                id: result.public_id,
                size: result.bytes,
                format: result.format,
                resourceType: result.resource_type,
              }));
            }
          }
        );
        uploadStream.end(buffer);
      });
    }

    // 2. LOCAL UPLOAD (Development Fallback)
    const name = createUploadFileName(file.name);
    const upload = await writeUploadFile(name, buffer);

    return NextResponse.json({
      url: upload.url,
      name: upload.filename,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'Server error during upload' }, { status: 500 });
  }
}
