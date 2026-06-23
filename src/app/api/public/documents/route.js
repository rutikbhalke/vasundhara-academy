import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isLocalDevWithoutDatabase } from '@/lib/localDev';
import { listLocalDocuments } from '@/lib/localDocumentStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (isLocalDevWithoutDatabase()) {
    const data = await listLocalDocuments();
    return NextResponse.json(data);
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json([]);
  }
  const data = await prisma.document.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(data);
}
