import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isLocalDevWithoutDatabase } from '@/lib/localDev';
import { listLocalGalleryImages } from '@/lib/localGalleryStore';
import { EXCLUDED_FROM_PUBLIC_GALLERY, filterGalleryImages, getStaticGalleryImages, mergeGalleryImages } from '@/lib/staticGallery';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const includeAll = searchParams.get('all') === 'true';

  const staticImages = await getStaticGalleryImages();

  const where = {};
  if (category) where.category = category;
  else if (!includeAll) where.NOT = { category: { in: EXCLUDED_FROM_PUBLIC_GALLERY } };

  if (isLocalDevWithoutDatabase()) {
    const localImages = await listLocalGalleryImages({ includeAll: true });
    return NextResponse.json(filterGalleryImages(mergeGalleryImages(localImages, staticImages), { category, includeAll }));
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(filterGalleryImages(staticImages, { category, includeAll }));
  }

  const data = await prisma.galleryImage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(filterGalleryImages(mergeGalleryImages(data, staticImages), { category, includeAll }));
}
