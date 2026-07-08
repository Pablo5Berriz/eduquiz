import { ActivityKind, ContentStatus, prismaService as prisma } from '@eduquiz/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  setActivityStatus,
  setLessonStatus,
  updateLesson,
} from '../../../../../../../../lib/admin/actions';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../../../../lib/i18n/locale';

import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

type LessonPageParams = LocaleRouteParams & {
  readonly courseId: string;
  readonly lessonId: string;
};

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  DRAFT: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  ARCHIVED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function statusBadge(status: string): string {
  return STATUS_BADGE[status] ?? STATUS_BADGE.DRAFT ?? '';
}

export default async function AdminLessonDetailPage({
  params,
}: {
  readonly params: LessonPageParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const { courseId, lessonId } = params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        select: { id: true, titleFr: true },
      },
      activities: {
        orderBy: [{ ordinal: 'asc' }],
        select: {
          id: true,
          kind: true,
          status: true,
          ordinal: true,
          passingScore: true,
          quiz: { select: { titleFr: true, titleEn: true } },
          exercise: { select: { titleFr: true, type: true } },
        },
      },
    },
  });

  if (lesson?.course.id !== courseId) notFound();

  const updateLessonAction = updateLesson.bind(null, locale, lessonId, courseId);
  const publishLesson = setLessonStatus.bind(null, locale, lessonId, courseId, ContentStatus.PUBLISHED);
  const unpublishLesson = setLessonStatus.bind(null, locale, lessonId, courseId, ContentStatus.DRAFT);

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 dark:text-slate-400">
        <Link href={`/${locale}/admin/cours`} className="hover:text-brand-700">
          Cours
        </Link>
        {' / '}
        <Link
          href={`/${locale}/admin/cours/${courseId}`}
          className="hover:text-brand-700"
        >
          {lesson.course.titleFr}
        </Link>
        {' / '}
        <span className="text-slate-900 dark:text-slate-100">{lesson.titleFr}</span>
      </nav>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {lesson.titleFr}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            slug :{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
              {lesson.slug}
            </code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${statusBadge(lesson.status)}`}
          >
            {lesson.status}
          </span>
          {lesson.status !== ContentStatus.PUBLISHED ? (
            <form action={publishLesson}>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Publier
              </button>
            </form>
          ) : (
            <form action={unpublishLesson}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Dépublier
              </button>
            </form>
          )}
          <Link
            href={`/${locale}/apprendre/${lesson.slug}`}
            target="_blank"
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400"
          >
            Voir ↗
          </Link>
        </div>
      </div>

      {/* Edit lesson */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Modifier la leçon
        </h2>
        <form action={updateLessonAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titre FR *
              <input
                name="titleFr"
                required
                defaultValue={lesson.titleFr}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Titre EN
              <input
                name="titleEn"
                defaultValue={lesson.titleEn}
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
                defaultValue={lesson.summaryFr ?? ''}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Résumé EN
              <textarea
                name="summaryEn"
                rows={2}
                defaultValue={lesson.summaryEn ?? ''}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Ordre
              <input
                name="ordinal"
                type="number"
                defaultValue={lesson.ordinal}
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
                defaultValue={lesson.estimatedMinutes}
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

      {/* Activities */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Activités ({String(lesson.activities.length)})
        </h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {lesson.activities.length === 0 ? (
            <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
              Aucune activité. Les quiz et exercices seront ajoutés ici prochainement.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Titre
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Seuil
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lesson.activities.map((activity) => {
                  const title =
                    activity.kind === ActivityKind.QUIZ
                      ? (activity.quiz?.titleFr ?? '—')
                      : (activity.exercise?.titleFr ?? '—');
                  const kind =
                    activity.kind === ActivityKind.QUIZ
                      ? 'Quiz'
                      : `Exercice · ${activity.exercise?.type ?? ''}`;
                  const publishActivity = setActivityStatus.bind(
                    null,
                    locale,
                    activity.id,
                    lessonId,
                    ContentStatus.PUBLISHED,
                  );
                  const unpublishActivity = setActivityStatus.bind(
                    null,
                    locale,
                    activity.id,
                    lessonId,
                    ContentStatus.DRAFT,
                  );

                  return (
                    <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {title}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{kind}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {activity.passingScore !== null ? `${String(activity.passingScore)} %` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${statusBadge(activity.status)}`}
                        >
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {activity.status !== ContentStatus.PUBLISHED ? (
                          <form action={publishActivity}>
                            <button
                              type="submit"
                              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Publier
                            </button>
                          </form>
                        ) : (
                          <form action={unpublishActivity}>
                            <button
                              type="submit"
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                            >
                              Dépublier
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
