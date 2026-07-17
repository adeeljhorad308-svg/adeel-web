import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { PageHeader, StatCard } from '@/components/admin/page-primitives';

/**
 * Dashboard home (Stage 4 §2). The full widget suite (analytics graphs, activity
 * feed, recent contacts, tasks) is assembled as those modules come online in later
 * phases. This Phase 1 version shows the authenticated shell and the counts that
 * genuinely exist now (users, activity events) — no fabricated metrics, and
 * Revenue is intentionally omitted until the billing module exists.
 */
export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const user = await requirePermissionOrRedirect('DASHBOARD', 'VIEW', '/admin');

  const [userCount, activityCount] = await Promise.all([
    prisma.user.count(),
    prisma.activityLog.count(),
  ]);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${(user.name ?? user.email).split(' ')[0]}`}
        description="Your platform overview. More insights appear as content and leads are added."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team members" value={String(userCount)} hint="Accounts with dashboard access" />
        <StatCard label="Activity events" value={String(activityCount)} hint="Logged actions to date" />
      </div>
    </>
  );
}
