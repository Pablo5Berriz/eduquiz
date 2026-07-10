'use server';

/**
 * Server Actions — admin contenu MVP.
 *
 * Le modèle de rôles actuel expose seulement `ADMIN`. Tant que les rôles
 * CONTENT_ADMIN / SUPER_ADMIN n'existent pas en DB, `ADMIN` porte ce périmètre.
 */

import { AuditEventKind, ContentStatus, UserRole, prismaService as prisma } from '@eduquiz/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireRoleOrRedirect } from '../auth/server';
import { parseLessonContent } from '../learning/content';
import { logger } from '../logger';

import { validateQuestionForPublishing } from './validation';

import type { AuthSessionUser } from '@eduquiz/auth/permissions';
export type AdminActionCode = 'forbidden' | 'invalid' | 'notFound' | 'conflict' | 'unknown';

export type AdminActionResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly code: AdminActionCode;
      readonly message: string;
      readonly issues?: readonly string[];
    };

const VALID_CONTENT_STATUSES = new Set<string>(Object.values(ContentStatus));

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function str(fd: FormData, key: string): string {
  return (fd.get(key) as string | null)?.trim() ?? '';
}

function numOrUndefined(fd: FormData, key: string): number | undefined {
  const v = str(fd, key);
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

function validationError(message: string, issues: readonly string[]): AdminActionResult {
  return { ok: false, code: 'invalid', message, issues };
}

function unknownError(scope: string, error: unknown): AdminActionResult {
  logger.error('admin.content_mutation.failed', {
    scope,
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : undefined,
  });
  return {
    ok: false,
    code: 'unknown',
    message: "L'opération n'a pas pu être enregistrée. Réessaie dans un instant.",
  };
}

async function requireContentAdmin(locale: string, nextPath: string): Promise<AuthSessionUser> {
  return requireRoleOrRedirect(locale, UserRole.ADMIN, nextPath);
}

async function auditAdminMutation(input: {
  readonly actorId: string;
  readonly action: string;
  readonly resource: string;
  readonly resourceId: string;
  readonly before?: unknown;
  readonly after?: unknown;
  readonly context?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      kind: AuditEventKind.ADMIN_ACTION,
      actorId: input.actorId,
      targetId: input.resourceId,
      targetType: input.resource,
      payload: {
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        ...(input.context ? { context: input.context } : {}),
        ...(input.before !== undefined ? { before: input.before } : {}),
        ...(input.after !== undefined ? { after: input.after } : {}),
      } as never,
    },
  });
}

function validateStatus(status: ContentStatus): readonly string[] {
  return VALID_CONTENT_STATUSES.has(status) ? [] : ['Statut de contenu invalide.'];
}

async function validateQuizActivityForPublishing(activityId: string): Promise<readonly string[]> {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      lesson: { include: { course: true } },
      quiz: {
        include: {
          questions: {
            orderBy: { ordinal: 'asc' },
            include: { answers: { orderBy: { ordinal: 'asc' } } },
          },
        },
      },
    },
  });

  if (!activity) return ['Activité introuvable.'];
  if (activity.lesson.status !== ContentStatus.PUBLISHED) {
    return ["L'activité doit appartenir à une leçon publiée."];
  }
  if (activity.lesson.course.status !== ContentStatus.PUBLISHED) {
    return ["L'activité doit appartenir à un cours publié."];
  }
  if (!activity.quiz) return ["L'activité publiée doit avoir un quiz."];
  if (activity.quiz.questions.length < 1)
    return ['Un quiz publié doit avoir au moins une question.'];

  return activity.quiz.questions.flatMap((question, index) =>
    validateQuestionForPublishing(question).map(
      (issue) => `Question ${String(index + 1)} : ${issue}`,
    ),
  );
}

async function validateCourseForPublishing(courseId: string): Promise<readonly string[]> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      titleFr: true,
      titleEn: true,
      subjectId: true,
      levelId: true,
      status: true,
    },
  });

  if (!course) return ['Cours introuvable.'];
  return [
    ...validateStatus(course.status),
    ...(!course.titleFr.trim() && !course.titleEn.trim() ? ['Le cours doit avoir un titre.'] : []),
    ...(!course.subjectId ? ['Le cours doit avoir une matière.'] : []),
    ...(!course.levelId ? ['Le cours doit avoir un niveau.'] : []),
  ];
}

async function validateLessonForPublishing(lessonId: string): Promise<readonly string[]> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: true,
      skillLinks: true,
      activities: {
        where: { status: ContentStatus.PUBLISHED },
        select: { id: true },
      },
    },
  });

  if (!lesson) return ['Leçon introuvable.'];
  const bodyFr = parseLessonContent(lesson.bodyFr).blocks;
  const bodyEn = parseLessonContent(lesson.bodyEn).blocks;

  return [
    ...(lesson.course.status !== ContentStatus.PUBLISHED
      ? ['Une leçon publiée doit appartenir à un cours publié.']
      : []),
    ...(!lesson.titleFr.trim() && !lesson.titleEn.trim() ? ['La leçon doit avoir un titre.'] : []),
    ...(!lesson.slug.trim() ? ['La leçon doit avoir un slug.'] : []),
    ...(bodyFr.length === 0 && bodyEn.length === 0
      ? ['La leçon doit avoir un contenu minimal.']
      : []),
    ...(lesson.skillLinks.length === 0 ? ['La leçon doit avoir au moins une compétence.'] : []),
  ];
}

export async function createCourse(locale: string, formData: FormData): Promise<AdminActionResult> {
  const actor = await requireContentAdmin(locale, `/${locale}/admin/cours`);

  const titleFr = str(formData, 'titleFr');
  const titleEn = str(formData, 'titleEn');
  const slug = str(formData, 'slug') || toSlug(titleFr);
  const subjectId = str(formData, 'subjectId');
  const levelId = str(formData, 'levelId');

  if (!titleFr || !subjectId || !levelId || !slug) {
    return validationError('Le cours est incomplet.', [
      'Titre, slug, matière et niveau sont obligatoires.',
    ]);
  }

  const course = await prisma.course.create({
    data: {
      titleFr,
      titleEn: titleEn || titleFr,
      slug,
      subjectId,
      levelId,
      status: ContentStatus.DRAFT,
    },
    select: { id: true, titleFr: true, slug: true, status: true },
  });

  await auditAdminMutation({
    actorId: actor.id,
    action: 'course.create',
    resource: 'course',
    resourceId: course.id,
    after: course,
  });

  redirect(`/${locale}/admin/cours/${course.id}`);
}

export async function updateCourse(
  locale: string,
  courseId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const actor = await requireContentAdmin(locale, `/${locale}/admin/cours/${courseId}`);

  const before = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, titleFr: true, titleEn: true, status: true, ordinal: true },
  });
  if (!before) return { ok: false, code: 'notFound', message: 'Cours introuvable.' };

  const titleFr = str(formData, 'titleFr');
  const titleEn = str(formData, 'titleEn');
  const ordinal = numOrUndefined(formData, 'ordinal');
  const estimatedMinutes = numOrUndefined(formData, 'estimatedMinutes');

  try {
    const after = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(titleFr ? { titleFr } : {}),
        ...(titleEn ? { titleEn } : {}),
        descriptionFr: str(formData, 'descriptionFr') || null,
        descriptionEn: str(formData, 'descriptionEn') || null,
        ...(ordinal !== undefined ? { ordinal } : {}),
        ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
      },
      select: { id: true, titleFr: true, titleEn: true, status: true, ordinal: true },
    });

    await auditAdminMutation({
      actorId: actor.id,
      action: 'course.update',
      resource: 'course',
      resourceId: courseId,
      before,
      after,
    });
  } catch (error) {
    return unknownError('course.update', error);
  }

  revalidatePath(`/${locale}/admin/cours/${courseId}`);
  revalidatePath(`/${locale}/admin/cours`);
  return { ok: true };
}

export async function setCourseStatus(
  locale: string,
  courseId: string,
  status: ContentStatus,
): Promise<AdminActionResult> {
  const actor = await requireContentAdmin(locale, `/${locale}/admin/cours/${courseId}`);
  const issues =
    status === ContentStatus.PUBLISHED
      ? await validateCourseForPublishing(courseId)
      : validateStatus(status);
  if (issues.length > 0) return validationError('Le cours ne peut pas être publié.', issues);

  const before = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true, publishedAt: true, archivedAt: true },
  });
  if (!before) return { ok: false, code: 'notFound', message: 'Cours introuvable.' };

  const now = new Date();
  const after = await prisma.course.update({
    where: { id: courseId },
    data: {
      status,
      ...(status === ContentStatus.PUBLISHED ? { publishedAt: now } : {}),
      ...(status === ContentStatus.ARCHIVED ? { archivedAt: now } : {}),
    },
    select: { id: true, status: true, publishedAt: true, archivedAt: true },
  });

  await auditAdminMutation({
    actorId: actor.id,
    action: status === ContentStatus.ARCHIVED ? 'course.archive' : 'course.status.update',
    resource: 'course',
    resourceId: courseId,
    before,
    after,
  });

  revalidatePath(`/${locale}/admin/cours`);
  revalidatePath(`/${locale}/admin/cours/${courseId}`);
  return { ok: true };
}

export async function createLesson(
  locale: string,
  courseId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const actor = await requireContentAdmin(locale, `/${locale}/admin/cours/${courseId}`);

  const titleFr = str(formData, 'titleFr');
  const titleEn = str(formData, 'titleEn');
  const slug = str(formData, 'slug') || toSlug(titleFr);

  if (!titleFr || !slug) {
    return validationError('La leçon est incomplète.', ['Titre et slug sont obligatoires.']);
  }

  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      titleFr,
      titleEn: titleEn || titleFr,
      slug,
      summaryFr: str(formData, 'summaryFr') || null,
      summaryEn: str(formData, 'summaryEn') || null,
      ordinal: numOrUndefined(formData, 'ordinal') ?? 0,
      status: ContentStatus.DRAFT,
    },
    select: { id: true, titleFr: true, slug: true, status: true },
  });

  await auditAdminMutation({
    actorId: actor.id,
    action: 'lesson.create',
    resource: 'lesson',
    resourceId: lesson.id,
    after: lesson,
    context: { courseId },
  });

  revalidatePath(`/${locale}/admin/cours/${courseId}`);
  redirect(`/${locale}/admin/cours/${courseId}/lecons/${lesson.id}`);
}

export async function updateLesson(
  locale: string,
  lessonId: string,
  courseId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const actor = await requireContentAdmin(
    locale,
    `/${locale}/admin/cours/${courseId}/lecons/${lessonId}`,
  );

  const before = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, titleFr: true, titleEn: true, status: true, ordinal: true },
  });
  if (!before) return { ok: false, code: 'notFound', message: 'Leçon introuvable.' };

  const titleFr = str(formData, 'titleFr');
  const titleEn = str(formData, 'titleEn');
  const ordinal = numOrUndefined(formData, 'ordinal');
  const estimatedMinutes = numOrUndefined(formData, 'estimatedMinutes');

  try {
    const after = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(titleFr ? { titleFr } : {}),
        ...(titleEn ? { titleEn } : {}),
        summaryFr: str(formData, 'summaryFr') || null,
        summaryEn: str(formData, 'summaryEn') || null,
        ...(ordinal !== undefined ? { ordinal } : {}),
        ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
      },
      select: { id: true, titleFr: true, titleEn: true, status: true, ordinal: true },
    });

    await auditAdminMutation({
      actorId: actor.id,
      action: 'lesson.update',
      resource: 'lesson',
      resourceId: lessonId,
      before,
      after,
      context: { courseId },
    });
  } catch (error) {
    return unknownError('lesson.update', error);
  }

  revalidatePath(`/${locale}/admin/cours/${courseId}/lecons/${lessonId}`);
  revalidatePath(`/${locale}/admin/cours/${courseId}`);
  return { ok: true };
}

export async function setLessonStatus(
  locale: string,
  lessonId: string,
  courseId: string,
  status: ContentStatus,
): Promise<AdminActionResult> {
  const actor = await requireContentAdmin(locale, `/${locale}/admin/cours/${courseId}`);
  const issues =
    status === ContentStatus.PUBLISHED
      ? await validateLessonForPublishing(lessonId)
      : validateStatus(status);
  if (issues.length > 0) return validationError('La leçon ne peut pas être publiée.', issues);

  const before = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, status: true, publishedAt: true, archivedAt: true },
  });
  if (!before) return { ok: false, code: 'notFound', message: 'Leçon introuvable.' };

  const now = new Date();
  const after = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      status,
      ...(status === ContentStatus.PUBLISHED ? { publishedAt: now } : {}),
      ...(status === ContentStatus.ARCHIVED ? { archivedAt: now } : {}),
    },
    select: { id: true, status: true, publishedAt: true, archivedAt: true },
  });

  await auditAdminMutation({
    actorId: actor.id,
    action: status === ContentStatus.ARCHIVED ? 'lesson.archive' : 'lesson.status.update',
    resource: 'lesson',
    resourceId: lessonId,
    before,
    after,
    context: { courseId },
  });

  revalidatePath(`/${locale}/admin/cours/${courseId}`);
  revalidatePath(`/${locale}/admin/cours/${courseId}/lecons/${lessonId}`);
  return { ok: true };
}

export async function setActivityStatus(
  locale: string,
  activityId: string,
  lessonId: string,
  status: ContentStatus,
): Promise<AdminActionResult> {
  const actor = await requireContentAdmin(locale, `/${locale}/admin`);
  const issues =
    status === ContentStatus.PUBLISHED
      ? await validateQuizActivityForPublishing(activityId)
      : validateStatus(status);
  if (issues.length > 0) return validationError("L'activité ne peut pas être publiée.", issues);

  const before = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, kind: true, status: true },
  });
  if (!before) return { ok: false, code: 'notFound', message: 'Activité introuvable.' };

  const after = await prisma.activity.update({
    where: { id: activityId },
    data: { status },
    select: { id: true, kind: true, status: true },
  });

  await auditAdminMutation({
    actorId: actor.id,
    action: status === ContentStatus.ARCHIVED ? 'activity.archive' : 'activity.status.update',
    resource: 'activity',
    resourceId: activityId,
    before,
    after,
    context: { lessonId, kind: before.kind },
  });

  revalidatePath(`/${locale}/admin`);
  return { ok: true };
}
