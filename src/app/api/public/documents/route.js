import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const STATIC_DOCUMENTS = [
  {
    id: 'static-affiliation-letter',
    title: 'Period of Affiliation',
    category: 'affiliation',
    fileUrl: '/api/public/mandatory-disclosure/static-affiliation-letter',
    order: 0,
    createdAt: null,
    static: true,
  },
];

function withStaticDocuments(documents = []) {
  const existingKeys = new Set(
    documents.map((doc) => `${doc.category}:${doc.title}`.toLowerCase())
  );
  const missingStaticDocuments = STATIC_DOCUMENTS.filter((doc) => {
    return !existingKeys.has(`${doc.category}:${doc.title}`.toLowerCase());
  });

  return [...missingStaticDocuments, ...documents].sort((a, b) => {
    return (a.order || 0) - (b.order || 0);
  });
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(STATIC_DOCUMENTS);
  }

  const data = await prisma.document.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(withStaticDocuments(data));
}
