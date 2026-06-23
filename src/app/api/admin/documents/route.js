import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';

export async function GET() {
  const auth = await checkAdminAuth();
  if (auth) return auth;
  const data = await prisma.document.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(data);
}

export async function POST(req) {
  const auth = await checkAdminAuth();
  if (auth) return auth;

  const body = await req.json();
  if (!body.title || !body.category || !body.fileUrl) {
    return NextResponse.json({ error: 'Title, category, and file are required' }, { status: 400 });
  }

  const count = await prisma.document.count({ where: { category: body.category } });
  const data = await prisma.document.create({
    data: {
      title: body.title,
      category: body.category,
      fileUrl: body.fileUrl,
      order: count + 1,
    },
  });

  return NextResponse.json(data);
}

export async function DELETE(req) {
  const auth = await checkAdminAuth();
  if (auth) return auth;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
