import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';
import { isLocalDevWithoutDatabase } from '@/lib/localDev';
import { createLocalGalleryImage, deleteLocalGalleryImages, listLocalGalleryImages } from '@/lib/localGalleryStore';
import { getStaticGalleryImages, mergeGalleryImages } from '@/lib/staticGallery';

export async function GET() {
  const auth = await checkAdminAuth();
  if (auth) return auth;
  const staticImages = await getStaticGalleryImages();
  if (isLocalDevWithoutDatabase()) {
    const data = await listLocalGalleryImages({ includeAll: true });
    return NextResponse.json(mergeGalleryImages(data, staticImages));
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(staticImages);
  }
  const data = await prisma.galleryImage.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(mergeGalleryImages(data, staticImages));
}

export async function POST(req) {
  const auth = await checkAdminAuth();
  if (auth) return auth;
  const { url, title, category } = await req.json();
  if (isLocalDevWithoutDatabase()) {
    const newImage = await createLocalGalleryImage({ url, title, category });
    return NextResponse.json(newImage);
  }
  const newImage = await prisma.galleryImage.create({
    data: { url, title, category }
  });
  return NextResponse.json(newImage);
}

export async function DELETE(req) {
  const auth = await checkAdminAuth();
  if (auth) return auth;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const ids = searchParams.get('ids');
  const requestedIds = (ids ? ids.split(',') : id ? [id] : []).filter(Boolean);
  const deletableIds = requestedIds.filter((itemId) => !itemId.startsWith('static-'));
  if (requestedIds.length > 0 && deletableIds.length === 0) {
    return NextResponse.json({ ok: true });
  }
  if (isLocalDevWithoutDatabase()) {
    await deleteLocalGalleryImages({ id: deletableIds[0] || null, ids: deletableIds.length > 1 ? deletableIds : null });
    return NextResponse.json({ ok: true });
  }
  if (deletableIds.length > 1) {
    await prisma.galleryImage.deleteMany({ where: { id: { in: deletableIds } } });
  } else if (deletableIds.length === 1) {
    await prisma.galleryImage.delete({ where: { id: deletableIds[0] } });
  }
  return NextResponse.json({ ok: true });
}
