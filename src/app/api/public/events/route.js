import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await prisma.event.findMany({ orderBy: { date: 'desc' } });
  return NextResponse.json(data);
}
