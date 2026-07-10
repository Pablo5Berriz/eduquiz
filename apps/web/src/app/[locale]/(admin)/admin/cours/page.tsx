import { prismaService as prisma } from '@eduquiz/db';
import Link from 'next/link';

import { createCourse } from '../../../../../lib/admin/actions';
import { discardResult } from '../../../../../lib/admin/form-action';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';

import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  DRAFT: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  ARCHIVED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};
const DEFAULT_STATUS_BADGE = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';

export default async function AdminCoursListPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);

  const [courses, subjects, levels] = await Promise.all([
    prisma.course.findMany({
      orderBy: [{ status: 'asc' }, { ordinal: 'asc' }, { titleFr: 'asc' }],
      include: {
        subject: { select: { nameFr: true } },
        level: { select: { nameFr: true } },
        _count: { select: { lessons: true } },
      },
    }),
    prisma.subject.findMany({ orderBy: { ordinal: 'asc' }, select: { id: true, nameFr: true } }),
    prisma.level.findMany({ orderBy: { ordinal: 'asc' }, select: { id: true, nameFr: true } }),
  ]);

  const createCourseAction = discardResult(createCourse.bind(null, locale));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Cours</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {String(courses.length)} cours
        </span>
      </div>

      {/* Course list */}
      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {courses.length === 0 ? (
          <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Aucun cours.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Titre (FR)
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Matière · Niveau
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Leçons
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                  Statut
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {course.titleFr}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {course.subject.nameFr} · {course.level.nameFr}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    {String(course._count.lessons)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[course.status] ?? DEFAULT_STATUS_BADGE}`}
                    >
                      {course.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${locale}/admin/cours/${course.id}`}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
                    >
                      Éditer →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create course form */}
      <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Créer un cours
        </h2>
        <form action={createCourseAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titre FR *
              <input
                name="titleFr"
                required
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Introduction aux fractions"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titre EN
              <input
                name="titleEn"
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Introduction to fractions"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Slug *
              <input
                name="slug"
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="introduction-fractions (auto si vide)"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Matière *
              <select
                name="subjectId"
                required
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">— Choisir —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameFr}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Niveau *
              <select
                name="levelId"
                required
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">— Choisir —</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nameFr}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              Créer le cours →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
