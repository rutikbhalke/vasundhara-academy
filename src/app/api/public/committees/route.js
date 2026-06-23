import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await prisma.committee.findMany({ include: { members: { orderBy: { order: 'asc' } } }, orderBy: { name: 'asc' } });
  return NextResponse.json(data);
}
