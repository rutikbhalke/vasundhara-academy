import { readFile } from 'fs/promises';
import { join, basename } from 'path';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isLocalDevWithoutDatabase } from '@/lib/localDev';
import { listLocalGalleryImages } from '@/lib/localGalleryStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FALLBACK_PDF = '1781851904740-Affilation-Letter.pdf';

function pdfResponse(buffer, filename = FALLBACK_PDF) {
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}

async function fallbackPdfResponse() {
  const filePath = join(process.cwd(), 'public', 'uploads', FALLBACK_PDF);
  return pdfResponse(await readFile(filePath), FALLBACK_PDF);
}

function normalizeCloudinaryPdfUrl(url) {
  if (!url || !url.includes('res.cloudinary.com') || !url.toLowerCase().includes('.pdf')) return url;
  return url.replace('/image/upload/', '/raw/upload/');
}

async function findDocument(id) {
  if (isLocalDevWithoutDatabase()) {
    const docs = await listLocalGalleryImages({ category: 'mandatory-disclosure', includeAll: true });
    return docs.find((doc) => doc.id === id);
  }

  if (!process.env.DATABASE_URL) return null;

  return prisma.galleryImage.findFirst({
    where: { id, category: 'mandatory-disclosure' },
  });
}

export async function GET(_req, { params }) {
  const doc = await findDocument(params.id);

  if (!doc?.url) {
    return fallbackPdfResponse();
  }

  if (doc.url.startsWith('/uploads/')) {
    try {
      const filename = basename(doc.url);
      const filePath = join(process.cwd(), 'public', 'uploads', filename);
      return pdfResponse(await readFile(filePath), filename);
    } catch {
      return fallbackPdfResponse();
    }
  }

  const urlsToTry = [...new Set([normalizeCloudinaryPdfUrl(doc.url), doc.url].filter(Boolean))];

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.toLowerCase().includes('pdf')) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const filename = `${(doc.title || 'mandatory-disclosure').replace(/[^a-z0-9-]+/gi, '-')}.pdf`;
        return pdfResponse(buffer, filename);
      }
    } catch {
      // Try the next URL, then fall back to the bundled PDF.
    }
  }

  return fallbackPdfResponse();
}
