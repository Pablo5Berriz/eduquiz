import { ActivityKind, ContentStatus, prismaService as prisma, withUser } from '@eduquiz/db';

import { parseLessonContent } from './content';

import type { RlsRole } from '@eduquiz/db';
import type { Locale } from '../i18n/locale';

const localized = (
  locale: Locale,
  valueFr: string | null | undefined,
  valueEn: string | null | undefined,
): string => (locale === 'fr' ? valueFr : valueEn) ?? valueFr ?? valueEn ?? '';

export async function getPublishedLearningCatalog(locale: Locale) {
  const courses = await prisma.course.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      lessons: { some: { status: ContentStatus.PUBLISHED } },
    },
    orderBy: [{ ordinal: 'asc' }, { titleFr: 'asc' }],
    include: {
      subject: true,
      level: true,
      lessons: {
        where: { status: ContentStatus.PUBLISHED },
        orderBy: [{ ordinal: 'asc' }, { titleFr: 'asc' }],
        include: {
          activities: {
            where: { status: ContentStatus.PUBLISHED, kind: ActivityKind.QUIZ },
            include: { quiz: { include: { questions: true } } },
          },
          skillLinks: { include: { skill: true } },
        },
      },
    },
  });

  return courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: localized(locale, course.titleFr, course.titleEn),
    description: localized(locale, course.descriptionFr, course.descriptionEn),
    subject: localized(locale, course.subject.nameFr, course.subject.nameEn),
    level: localized(locale, course.level.nameFr, course.level.nameEn),
    estimatedMinutes: course.estimatedMinutes,
    lessons: course.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: localized(locale, lesson.titleFr, lesson.titleEn),
      summary: localized(locale, lesson.summaryFr, lesson.summaryEn),
      estimatedMinutes: lesson.estimatedMinutes,
      skills: lesson.skillLinks.map((link) =>
        localized(locale, link.skill.nameFr, link.skill.nameEn),
      ),
      quizActivityId: lesson.activities[0]?.id ?? null,
      questionCount: lesson.activities[0]?.quiz?.questions.length ?? 0,
    })),
  }));
}

export async function getLearnerLearningOverview(userId: string, role: RlsRole, locale: Locale) {
  const [progressItems, recentAttempts] = await withUser({ userId, role }).$transaction(
    async (tx) =>
      Promise.all([
        tx.progress.findMany({
          where: { userId },
          orderBy: [{ mastery: 'desc' }, { updatedAt: 'desc' }],
          take: 8,
          include: { skill: { include: { subject: true } } },
        }),
        tx.attempt.findMany({
          where: { userId },
          orderBy: { submittedAt: 'desc' },
          take: 6,
          include: {
            activity: {
              include: {
                lesson: { include: { course: { include: { subject: true, level: true } } } },
                quiz: true,
              },
            },
          },
        }),
      ]),
  );

  return {
    progressItems: progressItems.map((progress) => ({
      id: progress.id,
      skillId: progress.skillId,
      skillName: localized(locale, progress.skill.nameFr, progress.skill.nameEn),
      subjectName: localized(locale, progress.skill.subject.nameFr, progress.skill.subject.nameEn),
      masteryPercent: Math.round(progress.mastery * 100),
      attemptsCount: progress.attemptsCount,
      lastAttemptAt: progress.lastAttemptAt,
    })),
    recentAttempts: recentAttempts.map((attempt) => ({
      id: attempt.id,
      activityId: attempt.activityId,
      score: attempt.score,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
      lessonSlug: attempt.activity.lesson.slug,
      lessonTitle: localized(
        locale,
        attempt.activity.lesson.titleFr,
        attempt.activity.lesson.titleEn,
      ),
      quizTitle: attempt.activity.quiz
        ? localized(locale, attempt.activity.quiz.titleFr, attempt.activity.quiz.titleEn)
        : localized(locale, attempt.activity.lesson.titleFr, attempt.activity.lesson.titleEn),
      subjectName: localized(
        locale,
        attempt.activity.lesson.course.subject.nameFr,
        attempt.activity.lesson.course.subject.nameEn,
      ),
      levelName: localized(
        locale,
        attempt.activity.lesson.course.level.nameFr,
        attempt.activity.lesson.course.level.nameEn,
      ),
    })),
  };
}

export async function getPublishedLessonBySlug(slug: string, locale: Locale) {
  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    include: {
      course: { include: { subject: true, level: true } },
      skillLinks: { include: { skill: true }, orderBy: { skill: { ordinal: 'asc' } } },
      activities: {
        where: { status: ContentStatus.PUBLISHED },
        orderBy: { ordinal: 'asc' },
        include: {
          exercise: {
            include: {
              questions: {
                orderBy: { ordinal: 'asc' },
                include: { answers: { orderBy: { ordinal: 'asc' } } },
              },
            },
          },
          quiz: {
            include: {
              questions: {
                orderBy: { ordinal: 'asc' },
                include: { answers: { orderBy: { ordinal: 'asc' } } },
              },
            },
          },
        },
      },
    },
  });

  if (
    lesson?.status !== ContentStatus.PUBLISHED ||
    lesson.course.status !== ContentStatus.PUBLISHED
  ) {
    return null;
  }

  const quizActivity = lesson.activities.find(
    (activity) => activity.kind === ActivityKind.QUIZ && activity.quiz,
  );
  const exerciseActivity = lesson.activities.find(
    (activity) => activity.kind === ActivityKind.EXERCISE && activity.exercise,
  );

  return {
    id: lesson.id,
    slug: lesson.slug,
    title: localized(locale, lesson.titleFr, lesson.titleEn),
    summary: localized(locale, lesson.summaryFr, lesson.summaryEn),
    content: parseLessonContent(locale === 'fr' ? lesson.bodyFr : lesson.bodyEn),
    objectives: locale === 'fr' ? lesson.objectivesFr : lesson.objectivesEn,
    estimatedMinutes: lesson.estimatedMinutes,
    course: {
      title: localized(locale, lesson.course.titleFr, lesson.course.titleEn),
      subject: localized(locale, lesson.course.subject.nameFr, lesson.course.subject.nameEn),
      level: localized(locale, lesson.course.level.nameFr, lesson.course.level.nameEn),
    },
    skills: lesson.skillLinks.map((link) => ({
      id: link.skill.id,
      name: localized(locale, link.skill.nameFr, link.skill.nameEn),
      weight: link.weight,
    })),
    exercise: exerciseActivity?.exercise
      ? {
          id: exerciseActivity.exercise.id,
          activityId: exerciseActivity.id,
          title: localized(
            locale,
            exerciseActivity.exercise.titleFr,
            exerciseActivity.exercise.titleEn,
          ),
          instructions: localized(
            locale,
            exerciseActivity.exercise.instructionsFr,
            exerciseActivity.exercise.instructionsEn,
          ),
          hint: localized(
            locale,
            exerciseActivity.exercise.hintFr,
            exerciseActivity.exercise.hintEn,
          ),
          explanation: localized(
            locale,
            exerciseActivity.exercise.explanationFr,
            exerciseActivity.exercise.explanationEn,
          ),
          questions: exerciseActivity.exercise.questions.map((question) => ({
            id: question.id,
            type: question.type,
            prompt: localized(locale, question.promptFr, question.promptEn),
            explanation: localized(locale, question.explanationFr, question.explanationEn),
            points: question.points,
            answers: question.answers.map((answer) => ({
              id: answer.id,
              label: localized(locale, answer.labelFr, answer.labelEn),
              isCorrect: answer.isCorrect,
              feedback: localized(locale, answer.feedbackFr, answer.feedbackEn),
            })),
          })),
        }
      : null,
    quizActivityId: quizActivity?.id ?? null,
    quizQuestionCount: quizActivity?.quiz?.questions.length ?? 0,
  };
}

export async function getQuizAttemptHistory(params: {
  readonly activityId: string;
  readonly userId: string;
  readonly role: RlsRole;
}) {
  const attempts = await withUser({ userId: params.userId, role: params.role }).$transaction(
    async (tx) =>
      tx.attempt.findMany({
        where: { activityId: params.activityId, userId: params.userId },
        orderBy: { submittedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          activityId: true,
          score: true,
          rawScore: true,
          maxScore: true,
          passed: true,
          durationMs: true,
          submittedAt: true,
        },
      }),
  );

  return attempts.map((attempt) => ({
    id: attempt.id,
    activityId: attempt.activityId,
    score: attempt.score,
    rawScore: attempt.rawScore,
    maxScore: attempt.maxScore,
    passed: attempt.passed,
    durationMs: attempt.durationMs,
    submittedAt: attempt.submittedAt,
  }));
}

export async function getPublishedQuizByActivityId(activityId: string, locale: Locale) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      lesson: {
        include: {
          course: { include: { subject: true, level: true } },
          skillLinks: { include: { skill: true } },
        },
      },
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

  if (
    activity?.kind !== ActivityKind.QUIZ ||
    activity.status !== ContentStatus.PUBLISHED ||
    !activity.quiz ||
    activity.lesson.status !== ContentStatus.PUBLISHED ||
    activity.lesson.course.status !== ContentStatus.PUBLISHED
  ) {
    return null;
  }

  return {
    id: activity.id,
    passingScore: activity.passingScore,
    lesson: {
      id: activity.lesson.id,
      slug: activity.lesson.slug,
      title: localized(locale, activity.lesson.titleFr, activity.lesson.titleEn),
      subject: localized(
        locale,
        activity.lesson.course.subject.nameFr,
        activity.lesson.course.subject.nameEn,
      ),
      level: localized(
        locale,
        activity.lesson.course.level.nameFr,
        activity.lesson.course.level.nameEn,
      ),
      skillIds: activity.lesson.skillLinks.map((link) => link.skillId),
    },
    title: localized(locale, activity.quiz.titleFr, activity.quiz.titleEn),
    introduction: localized(locale, activity.quiz.introductionFr, activity.quiz.introductionEn),
    questions: activity.quiz.questions.map((question) => ({
      id: question.id,
      prompt: localized(locale, question.promptFr, question.promptEn),
      explanation: localized(locale, question.explanationFr, question.explanationEn),
      type: question.type,
      points: question.points,
      // NOTE: isCorrect est volontairement exposé ici.
      // Le quiz est soumis via Server Action (submitQuizAttempt) : le scoring
      // s'effectue entièrement côté serveur. isCorrect n'est utilisé côté client
      // que pour afficher le feedback post-soumission dans QuizForm.
      // Retirer ce champ casserait le feedback sans améliorer la sécurité,
      // puisque la valeur authoritative reste celle enregistrée en base par le serveur.
      answers: question.answers.map((answer) => ({
        id: answer.id,
        label: localized(locale, answer.labelFr, answer.labelEn),
        isCorrect: answer.isCorrect,
      })),
    })),
  };
}

export async function getAttemptResult(params: {
  readonly activityId: string;
  readonly attemptId: string;
  readonly userId: string;
  readonly role: RlsRole;
  readonly locale: Locale;
}) {
  const attempt = await withUser({ userId: params.userId, role: params.role }).$transaction(
    async (tx) =>
      tx.attempt.findFirst({
        where: { id: params.attemptId, activityId: params.activityId, userId: params.userId },
        include: {
          activity: {
            include: {
              lesson: { include: { course: { include: { subject: true, level: true } } } },
              quiz: true,
            },
          },
          answers: {
            include: { question: { include: { answers: { orderBy: { ordinal: 'asc' } } } } },
          },
        },
      }),
  );

  if (!attempt?.activity.quiz) return null;

  return {
    id: attempt.id,
    score: attempt.score,
    rawScore: attempt.rawScore,
    maxScore: attempt.maxScore,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt,
    lesson: {
      slug: attempt.activity.lesson.slug,
      title: localized(
        params.locale,
        attempt.activity.lesson.titleFr,
        attempt.activity.lesson.titleEn,
      ),
      subject: localized(
        params.locale,
        attempt.activity.lesson.course.subject.nameFr,
        attempt.activity.lesson.course.subject.nameEn,
      ),
      level: localized(
        params.locale,
        attempt.activity.lesson.course.level.nameFr,
        attempt.activity.lesson.course.level.nameEn,
      ),
    },
    quizTitle: localized(
      params.locale,
      attempt.activity.quiz.titleFr,
      attempt.activity.quiz.titleEn,
    ),
    answers: attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      prompt: localized(params.locale, answer.question.promptFr, answer.question.promptEn),
      selectedAnswerId:
        typeof answer.response === 'object' &&
        answer.response !== null &&
        !Array.isArray(answer.response) &&
        'answerId' in answer.response &&
        typeof answer.response.answerId === 'string'
          ? answer.response.answerId
          : null,
      correctAnswerLabel: localized(
        params.locale,
        answer.question.answers.find((choice) => choice.isCorrect)?.labelFr,
        answer.question.answers.find((choice) => choice.isCorrect)?.labelEn,
      ),
      isCorrect: answer.isCorrect,
      pointsEarned: answer.pointsEarned,
    })),
  };
}
