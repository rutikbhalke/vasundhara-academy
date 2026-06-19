import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';
import { isLocalDevWithoutDatabase } from '@/lib/localDev';
import { listLocalGalleryImages } from '@/lib/localGalleryStore';

// Returns unread/pending counts for sidebar badges
export async function GET() {
  const auth = await checkAdminAuth();
  if (auth) return auth;

  if (isLocalDevWithoutDatabase()) {
    const gallery = await listLocalGalleryImages({ includeAll: true });
    return NextResponse.json({
      admissions: 0,
      enquiries: 0,
      notifications: 0,
      staff: 0,
      events: 0,
      gallery: gallery.length,
    });
  }

  const [pendingAdmissions, newEnquiries, activeNotifications, totalStaff, totalEvents, totalGallery] = await Promise.all([
    prisma.admission.count({ where: { status: 'pending' } }),
    prisma.enquiry.count({ where: { status: 'new' } }),
    prisma.notification.count({ where: { active: true } }),
    prisma.staff.count(),
    prisma.event.count(),
    prisma.galleryImage.count(),
  ]);

  return NextResponse.json({
    admissions: pendingAdmissions,
    enquiries: newEnquiries,
    notifications: activeNotifications,
    staff: totalStaff,
    events: totalEvents,
    gallery: totalGallery,
  });
}
