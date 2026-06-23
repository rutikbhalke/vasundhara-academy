import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isLocalDevWithoutDatabase } from '@/lib/localDev';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (isLocalDevWithoutDatabase()) {
    return NextResponse.json([]);
  }

  const data = await prisma.notification.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  return NextResponse.json(data);
}
