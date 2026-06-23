import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await prisma.boardMember.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(data);
}
