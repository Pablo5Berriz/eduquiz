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
  /** Slug de la leçon (ex. "math-p5-comparer-fractions"). */
  lessonSlug: string;
  /** Titre FR attendu (pour assertion de navigation). */
  lessonTitleFr: string;
  /**
   * Pour chaque question du quiz, le labelFr de la bonne réponse.
   * L'ordre correspond à l'ordre d'affichage (ordinal ASC).
   */
  correctAnswerLabelsFr: string[];
}

async function globalSetup(): Promise<void> {
  loadEnvFile(resolve(process.cwd(), '../..', '.env'));
  loadEnvFile(resolve(process.cwd(), '.env'));

  const [{ hashPassword }, { ActivityKind, Locale, UserRole, prismaService }] = await Promise.all([
    import('@eduquiz/auth/password'),
    import('@eduquiz/db'),
  ]);

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
  await prismaService.attempt.deleteMany({ where: { userId: user.id } });

  // ── Résoudre dynamiquement la première leçon/quiz disponible ─────────────────
  //
  // On cherche la première leçon publiée qui possède une activité de type QUIZ
  // avec au moins une question et ses réponses. On persiste les données dans un
  // fichier JSON pour que les specs puissent les consommer sans requête DB.
  //
  const firstQuizActivity = await prismaService.activity.findFirst({
    where: {
      kind: ActivityKind.QUIZ,
      publishedAt: { not: null },
      lesson: { publishedAt: { not: null } },
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
        },
      },
      quiz: {
        select: {
          questions: {
            orderBy: { ordinal: 'asc' },
            select: {
              answers: {
                where: { isCorrect: true },
                select: { labelFr: true },
                take: 1,
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

  const fixture: E2EQuizFixture = {
    lessonSlug: firstQuizActivity.lesson.slug,
    lessonTitleFr: firstQuizActivity.lesson.titleFr,
    correctAnswerLabelsFr: firstQuizActivity.quiz.questions.map(
      (q) => q.answers[0]?.labelFr ?? '',
    ),
  };

  // Écrire dans e2e/.cache/ (ignoré par git via .gitignore de apps/web)
  const cacheDir = resolve(process.cwd(), 'e2e', '.cache');
  mkdirSync(cacheDir, { recursive: true });
  writeFileSync(resolve(cacheDir, 'quiz-fixture.json'), JSON.stringify(fixture, null, 2), 'utf8');
}

export default globalSetup;
