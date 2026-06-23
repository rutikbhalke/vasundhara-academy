import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';
import { isLocalDevWithoutDatabase } from '@/lib/localDev';
import { createLocalDocument, deleteLocalDocument, listLocalDocuments } from '@/lib/localDocumentStore';

export async function GET() {
  const auth = await checkAdminAuth();
  if (auth) return auth;
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

export async function POST(req) {
  const auth = await checkAdminAuth();
  if (auth) return auth;

  const body = await req.json();
  const title = body.title?.trim();
  const category = body.category || 'affiliation';
  const fileUrl = body.fileUrl?.trim();

  if (!title) {
    return NextResponse.json({ error: 'Document title is required' }, { status: 400 });
  }
  if (!fileUrl) {
    return NextResponse.json({ error: 'Please upload a document file first' }, { status: 400 });
  }

  const data = { title, category, fileUrl };

  if (isLocalDevWithoutDatabase()) {
    const document = await createLocalDocument(data);
    return NextResponse.json(document);
  }

  const document = await prisma.document.create({ data });
  return NextResponse.json(document);
}

export async function DELETE(req) {
  const auth = await checkAdminAuth();
  if (auth) return auth;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Document id is required' }, { status: 400 });
  }
  if (isLocalDevWithoutDatabase()) {
    await deleteLocalDocument(id);
    return NextResponse.json({ ok: true });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true });
  }
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
