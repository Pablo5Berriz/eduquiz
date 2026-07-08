import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContentStatus, prismaService as prisma } from '@eduquiz/db';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../../lib/i18n/locale';
import {
  updateCourse,
  setCourseStatus,
  createLesson,
  setLessonStatus,
} from '../../../../../../lib/admin/actions';

import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

type CoursePageParams = LocaleRouteParams & { readonly courseId: string };

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  DRAFT: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  ARCHIVED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default async function AdminCoursDetailPage({
  params,
}: {
  readonly params: CoursePageParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const { courseId } = params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      subject: { select: { nameFr: true } },
      level: { select: { nameFr: true } },
      lessons: {
        orderBy: [{ ordinal: 'asc' }, { titleFr: 'asc' }],
        select: {
          id: true,
          titleFr: true,
          slug: true,
          status: true,
          ordinal: true,
          estimatedMinutes: true,
          _count: { select: { activities: true } },
        },
      },
    },
  });

  if (!course) notFound();

  const updateCourseAction = updateCourse.bind(null, locale, courseId);
  const createLessonAction = createLesson.bind(null, locale, courseId);

  // Status transition helpers
  const publishCourse = setCourseStatus.bind(null, locale, courseId, ContentStatus.PUBLISHED);
  const unpublishCourse = setCourseStatus.bind(null, locale, courseId, ContentStatus.DRAFT);
  const archiveCourse = setCourseStatus.bind(null, locale, courseId, ContentStatus.ARCHIVED);

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 dark:text-slate-400">
        <Link href={`/${locale}/admin/cours`} className="hover:text-brand-700">
          Cours
        </Link>
        {' / '}
        <span className="text-slate-900 dark:text-slate-100">{course.titleFr}</span>
      </nav>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {course.titleFr}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {course.subject.nameFr} · {course.level.nameFr} · slug :{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
              {course.slug}
            </code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[course.status] ?? STATUS_BADGE.DRAFT}`}
          >
            {course.status}
          </span>
          {course.status !== ContentStatus.PUBLISHED ? (
            <form action={publishCourse}>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Publier
              </button>
            </form>
          ) : (
            <form action={unpublishCourse}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Dépublier
              </button>
            </form>
          )}
          {course.status !== ContentStatus.ARCHIVED ? (
            <form action={archiveCourse}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400"
              >
                Archiver
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {/* Edit course form */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Modifier le cours
        </h2>
        <form action={updateCourseAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titre FR *
              <input
                name="titleFr"
                required
                defaultValue={course.titleFr}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titre EN
              <input
                name="titleEn"
                defaultValue={course.titleEn}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description FR
              <textarea
                name="descriptionFr"
                rows={2}
                defaultValue={course.descriptionFr ?? ''}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ordre (ordinal)
              <input
                name="ordinal"
                type="number"
                defaultValue={course.ordinal}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Durée estimée (min)
              <input
                name="estimatedMinutes"
                type="number"
                defaultValue={course.estimatedMinutes}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      {/* Lesson list */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Leçons ({String(course.lessons.length)})
        </h2>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {course.lessons.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">Aucune leçon.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Titre FR
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Slug
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Activités
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Statut
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {course.lessons.map((lesson) => {
                  const publishLesson = setLessonStatus.bind(
                    null,
                    locale,
                    lesson.id,
                    courseId,
                    ContentStatus.PUBLISHED,
                  );
                  const unpublishLesson = setLessonStatus.bind(
                    null,
                    locale,
                    lesson.id,
                    courseId,
                    ContentStatus.DRAFT,
                  );

                  return (
                    <tr
                      key={lesson.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {lesson.titleFr}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 dark:text-slate-500">
                        {lesson.slug}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {String(lesson._count.activities)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[lesson.status] ?? STATUS_BADGE.DRAFT}`}
                          >
                            {lesson.status}
                          </span>
                          {lesson.status !== ContentStatus.PUBLISHED ? (
                            <form action={publishLesson}>
                              <button
                                type="submit"
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                              >
                                Publier
                              </button>
                            </form>
                          ) : (
                            <form action={unpublishLesson}>
                              <button
                                type="submit"
                                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                              >
                                Dépublier
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/${locale}/admin/cours/${courseId}/lecons/${lesson.id}`}
                          className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300"
                        >
                          Éditer →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create lesson form */}
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Ajouter une leçon
        </h2>
        <form action={createLessonAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titre FR *
              <input
                name="titleFr"
                required
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Les fractions équivalentes"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titre EN
              <input
                name="titleEn"
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Equivalent fractions"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Slug
              <input
                name="slug"
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="fractions-equivalentes (auto si vide)"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ordre
              <input
                name="ordinal"
                type="number"
                defaultValue={course.lessons.length}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Résumé FR
              <textarea
                name="summaryFr"
                rows={2}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Courte description affichée dans le catalogue..."
              />
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Ajouter la leçon →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
