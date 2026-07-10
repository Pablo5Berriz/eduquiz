import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const email = process.env.E2E_USER_EMAIL ?? 'e2e.learner@eduquiz.local';
const password = process.env.E2E_USER_PASSWORD ?? 'EduQuiz-e2e-Password-2026!';

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (process.env[key] !== undefined) continue;

    process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
  }
}

/**
 * Données extraites de la DB et partagées avec les specs via un fichier JSON.
 * Le fichier est écrit dans e2e/.cache/ (ignoré par git).
 */
export interface E2EQuizFixture {
  /** Email de l'utilisateur E2E créé par global-setup. */
  email: string;
  /** Mot de passe de l'utilisateur E2E créé par global-setup. */
  password: string;
  /** Slug de la leçon (ex. "math-p5-comparer-fractions"). */
  lessonSlug: string;
  /** Titre FR attendu (pour assertion de navigation). */
  lessonTitleFr: string;
  /** Nom FR de la matière attendue dans le catalogue. */
  subjectNameFr: string;
  /** Nom FR du niveau attendu dans le catalogue. */
  levelNameFr: string;
  /** Titre FR d'une leçon brouillon, si le seed en contient une. */
  draftLessonTitleFr?: string;
  /** Questions du quiz et réponses attendues, résolues côté setup depuis la DB. */
  quizQuestions: E2EQuizQuestionFixture[];
}

export interface E2EQuizQuestionFixture {
  readonly id: string;
  readonly type: string;
  readonly promptFr: string;
  readonly correctAnswerLabelsFr: string[];
  readonly textAnswerFr?: string;
  readonly matchingPairsFr?: readonly {
    readonly leftLabel: string;
    readonly rightLabel: string;
  }[];
  readonly orderingLabelsFr?: readonly string[];
}

async function globalSetup(): Promise<void> {
  loadEnvFile(resolve(process.cwd(), '../..', '.env'));
  loadEnvFile(resolve(process.cwd(), '.env'));

  const [{ hashPassword }, { ActivityKind, ContentStatus, Locale, UserRole, prismaService }] =
    await Promise.all([import('@eduquiz/auth/password'), import('@eduquiz/db')]);

  // ── Créer / réinitialiser l'utilisateur E2E ──────────────────────────────────
  const passwordHash = await hashPassword(password);
  const user = await prismaService.user.upsert({
    where: { email },
    update: {
      emailVerifiedAt: new Date(),
      passwordHash,
      role: UserRole.LEARNER_ADULT,
      locale: Locale.FR,
      disabledAt: null,
      deletedAt: null,
      sessionVersion: { increment: 1 },
      profile: {
        upsert: {
          update: {
            firstName: 'E2E',
            lastName: 'Learner',
            displayName: 'E2E Learner',
            birthDate: new Date('1990-01-01'),
            preferredLocale: Locale.FR,
            province: 'QC',
          },
          create: {
            firstName: 'E2E',
            lastName: 'Learner',
            displayName: 'E2E Learner',
            birthDate: new Date('1990-01-01'),
            preferredLocale: Locale.FR,
            province: 'QC',
          },
        },
      },
    },
    create: {
      email,
      emailVerifiedAt: new Date(),
      passwordHash,
      role: UserRole.LEARNER_ADULT,
      locale: Locale.FR,
      profile: {
        create: {
          firstName: 'E2E',
          lastName: 'Learner',
          displayName: 'E2E Learner',
          birthDate: new Date('1990-01-01'),
          preferredLocale: Locale.FR,
          province: 'QC',
        },
      },
    },
    select: { id: true },
  });

  await prismaService.progress.deleteMany({ where: { userId: user.id } });

  // ── Résoudre dynamiquement la première leçon/quiz disponible ─────────────────
  //
  // On cherche la première leçon publiée qui possède une activité de type QUIZ
  // avec au moins une question et ses réponses. On persiste les données dans un
  // fichier JSON pour que les specs puissent les consommer sans requête DB.
  //
  const firstQuizActivity = await prismaService.activity.findFirst({
    where: {
      kind: ActivityKind.QUIZ,
      status: ContentStatus.PUBLISHED,
      lesson: {
        status: ContentStatus.PUBLISHED,
        publishedAt: { not: null },
      },
      quiz: {
        questions: {
          some: {
            answers: { some: { isCorrect: true } },
          },
        },
      },
    },
    orderBy: { lesson: { slug: 'asc' } },
    select: {
      lesson: {
        select: {
          slug: true,
          titleFr: true,
          course: {
            select: {
              subject: { select: { nameFr: true } },
              level: { select: { nameFr: true } },
            },
          },
        },
      },
      quiz: {
        select: {
          questions: {
            orderBy: { ordinal: 'asc' },
            select: {
              id: true,
              type: true,
              promptFr: true,
              answers: {
                orderBy: { ordinal: 'asc' },
                select: {
                  labelFr: true,
                  isCorrect: true,
                  pairValueFr: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!firstQuizActivity?.lesson || !firstQuizActivity.quiz) {
    throw new Error(
      '[E2E global-setup] Aucune leçon publiée avec un quiz valide trouvée dans la DB. ' +
        'Assurez-vous que `pnpm db:seed` a été exécuté.',
    );
  }

  const draftLesson = await prismaService.lesson.findFirst({
    where: { status: ContentStatus.DRAFT },
    orderBy: { titleFr: 'asc' },
    select: { titleFr: true },
  });

  const fixture: E2EQuizFixture = {
    email,
    password,
    lessonSlug: firstQuizActivity.lesson.slug,
    lessonTitleFr: firstQuizActivity.lesson.titleFr,
    subjectNameFr: firstQuizActivity.lesson.course.subject.nameFr,
    levelNameFr: firstQuizActivity.lesson.course.level.nameFr,
    ...(draftLesson?.titleFr !== undefined ? { draftLessonTitleFr: draftLesson.titleFr } : {}),
    quizQuestions: firstQuizActivity.quiz.questions.map((question) => {
      const correctAnswerLabelsFr = question.answers
        .filter((answer) => answer.isCorrect)
        .map((answer) => answer.labelFr);
      const matchingPairsFr = question.answers.flatMap((answer) =>
        answer.pairValueFr && answer.pairValueFr.length > 0
          ? [{ leftLabel: answer.labelFr, rightLabel: answer.pairValueFr }]
          : [],
      );

      const [firstCorrectLabel] = correctAnswerLabelsFr;

      return {
        id: question.id,
        type: question.type,
        promptFr: question.promptFr,
        correctAnswerLabelsFr,
        ...(firstCorrectLabel !== undefined ? { textAnswerFr: firstCorrectLabel } : {}),
        matchingPairsFr,
        orderingLabelsFr: correctAnswerLabelsFr,
      };
    }),
  };

  // Écrire dans e2e/.cache/ (ignoré par git via .gitignore de apps/web)
  const cacheDir = resolve(process.cwd(), 'e2e', '.cache');
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(resolve(cacheDir, 'quiz-fixture.json'), JSON.stringify(fixture, null, 2), 'utf8');
}

export default globalSetup;
