import { NextResponse } from 'next/server';
import { contentTypeForUpload, readUploadFile } from '@/lib/uploadStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function serveUpload(params) {
  const filename = params.path?.at(-1);
  if (!filename) {
    return NextResponse.json({ error: 'Missing file name' }, { status: 400 });
  }

  try {
    const file = await readUploadFile(filename);
    return new NextResponse(file.buffer, {
      headers: {
        'Content-Type': contentTypeForUpload(file.filename),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function GET(_req, { params }) {
  return serveUpload(params);
}

export async function HEAD(_req, { params }) {
  const response = await serveUpload(params);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
