import Link from 'next/link';

import { ContentStatus, prismaService as prisma } from '@eduquiz/db';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../lib/i18n/locale';

import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);

  const [courseCounts, lessonCounts, userCount] = await Promise.all([
    prisma.course.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.lesson.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.user.count(),
  ]);

  const byStatus = (groups: { status: string; _count: { id: number } }[], status: ContentStatus) =>
    groups.find((g) => g.status === status)?._count.id ?? 0;

  const stats = [
    {
      label: 'Cours publiés',
      value: byStatus(courseCounts, ContentStatus.PUBLISHED),
      sub: `${byStatus(courseCounts, ContentStatus.DRAFT)} brouillons`,
      href: `/${locale}/admin/cours`,
    },
    {
      label: 'Leçons publiées',
      value: byStatus(lessonCounts, ContentStatus.PUBLISHED),
      sub: `${byStatus(lessonCounts, ContentStatus.DRAFT)} brouillons`,
      href: `/${locale}/admin/cours`,
    },
    {
      label: 'Utilisateurs',
      value: userCount,
      sub: null,
      href: null,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Vue d&apos;ensemble</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Tableau de bord administrateur EduQuiz.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-50">
              {String(stat.value)}
            </p>
            {stat.sub ? (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{stat.sub}</p>
            ) : null}
            {stat.href ? (
              <Link
                href={stat.href}
                className="mt-3 inline-block text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
              >
                Gérer →
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Actions rapides
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/admin/cours`}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Gérer les cours
          </Link>
          <Link
            href={`/${locale}/apprendre`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Vue apprenant
          </Link>
        </div>
      </div>
    </div>
  );
}
