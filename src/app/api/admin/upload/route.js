import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createUploadFileName, writeUploadFile } from '@/lib/uploadStorage';

const hasNamedCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
const canUseCloudinary = hasCloudinaryUrl || hasNamedCloudinaryConfig;

// CLOUDINARY_URL is read automatically by the SDK. Only override config when all named vars exist.
if (hasNamedCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function uploadToCloudinary(buffer, isPdf) {
  return new Promise((resolve, reject) => {
    let uploadStream;
    try {
      uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'vasundhara-academy',
          resource_type: isPdf ? 'raw' : 'image',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    } catch (error) {
      reject(error);
      return;
    }

    uploadStream.on('error', reject);
    uploadStream.end(buffer);
  });
}

async function saveLocalUpload(file, buffer) {
  const name = createUploadFileName(file.name);
  const upload = await writeUploadFile(name, buffer);

  return {
    url: upload.url,
    name: upload.filename,
    size: file.size,
  };
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
    if (canUseCloudinary) {
      try {
        const result = await uploadToCloudinary(buffer, isPdf);
        return NextResponse.json({
          url: result.secure_url,
          id: result.public_id,
          size: result.bytes,
          format: result.format,
          resourceType: result.resource_type,
        });
      } catch (error) {
        console.error('Cloudinary Upload Error, falling back to local upload:', error.message);
      }
    }

    // 2. LOCAL UPLOAD (Development Fallback)
    return NextResponse.json(await saveLocalUpload(file, buffer));
  } catch (error) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: 'Server error during upload' }, { status: 500 });
  }
}
