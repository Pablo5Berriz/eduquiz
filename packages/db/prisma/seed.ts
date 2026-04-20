/**
 * Seed minimal FR/EN pour EduQuiz.
 *
 * Peuple la base avec de quoi démarrer l'UI en local :
 *
 *   • 1 utilisateur admin (admin@eduquiz.local, mot de passe défini par
 *     la variable SEED_ADMIN_PASSWORD — sinon un marqueur de seed non
 *     utilisable en prod).
 *   • 9 niveaux scolaires (P3 → S5) avec leurs noms FR/EN.
 *   • 3 matières publiées (Mathématiques, Français, Anglais).
 *   • 5 compétences MEQ (2 en maths, 2 en français, 1 en anglais).
 *   • 2 cours d'exemple (maths P5, français P4) avec 1 leçon publiée chacun.
 *   • 1 exercice MCQ_SINGLE et 1 quiz (1 question) par leçon.
 *   • 5 badges de progression.
 *
 * Idempotent : toutes les opérations utilisent `upsert` sur des champs
 * uniques stables (code, slug, email). Rejouer le seed n'introduit pas
 * de doublon et met à jour les champs modifiés.
 */

import { createHash } from 'node:crypto';

import {
  BadgeKind,
  ContentStatus,
  GradeCode,
  Locale,
  PrismaClient,
  SchoolCycle,
  UserRole,
} from '../src/generated/client/index.js';

const prisma = new PrismaClient();

/**
 * Hash placeholder pour les seeds locaux. En production, le mot de passe
 * passe par Argon2id (service `@eduquiz/auth` en phase 1). On accepte ici
 * un simple SHA-256 pour ne pas forcer l'installation d'argon2 au moment
 * du seed ; le compte admin n'est de toute façon pas destiné aux envs de
 * prod (cf. README du paquet).
 */
const placeholderPasswordHash = (plain: string): string =>
  `sha256$${createHash('sha256').update(plain).digest('hex')}`;

async function main(): Promise<void> {
  // ─── 1. Admin ──────────────────────────────────────────────────────────────
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'change-me-in-dev';
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eduquiz.local' },
    update: { role: UserRole.ADMIN },
    create: {
      email: 'admin@eduquiz.local',
      role: UserRole.ADMIN,
      locale: Locale.FR,
      emailVerifiedAt: new Date(),
      passwordHash: placeholderPasswordHash(adminPassword),
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'EduQuiz',
          displayName: 'Admin EduQuiz',
          birthDate: new Date('1990-01-01'),
          preferredLocale: Locale.FR,
        },
      },
    },
  });

  // ─── 2. Niveaux (P3 → S5) ──────────────────────────────────────────────────
  const levelsSpec: Array<{
    code: GradeCode;
    cycle: SchoolCycle;
    ordinal: number;
    nameFr: string;
    nameEn: string;
  }> = [
    {
      code: GradeCode.P3,
      cycle: SchoolCycle.PRIMAIRE,
      ordinal: 1,
      nameFr: '3e année',
      nameEn: 'Grade 3',
    },
    {
      code: GradeCode.P4,
      cycle: SchoolCycle.PRIMAIRE,
      ordinal: 2,
      nameFr: '4e année',
      nameEn: 'Grade 4',
    },
    {
      code: GradeCode.P5,
      cycle: SchoolCycle.PRIMAIRE,
      ordinal: 3,
      nameFr: '5e année',
      nameEn: 'Grade 5',
    },
    {
      code: GradeCode.P6,
      cycle: SchoolCycle.PRIMAIRE,
      ordinal: 4,
      nameFr: '6e année',
      nameEn: 'Grade 6',
    },
    {
      code: GradeCode.S1,
      cycle: SchoolCycle.SECONDAIRE,
      ordinal: 5,
      nameFr: 'Secondaire 1',
      nameEn: 'Secondary 1',
    },
    {
      code: GradeCode.S2,
      cycle: SchoolCycle.SECONDAIRE,
      ordinal: 6,
      nameFr: 'Secondaire 2',
      nameEn: 'Secondary 2',
    },
    {
      code: GradeCode.S3,
      cycle: SchoolCycle.SECONDAIRE,
      ordinal: 7,
      nameFr: 'Secondaire 3',
      nameEn: 'Secondary 3',
    },
    {
      code: GradeCode.S4,
      cycle: SchoolCycle.SECONDAIRE,
      ordinal: 8,
      nameFr: 'Secondaire 4',
      nameEn: 'Secondary 4',
    },
    {
      code: GradeCode.S5,
      cycle: SchoolCycle.SECONDAIRE,
      ordinal: 9,
      nameFr: 'Secondaire 5',
      nameEn: 'Secondary 5',
    },
  ];

  for (const level of levelsSpec) {
    await prisma.level.upsert({
      where: { code: level.code },
      update: {
        cycle: level.cycle,
        ordinal: level.ordinal,
        nameFr: level.nameFr,
        nameEn: level.nameEn,
      },
      create: level,
    });
  }

  const levelP5 = await prisma.level.findUniqueOrThrow({ where: { code: GradeCode.P5 } });
  const levelP4 = await prisma.level.findUniqueOrThrow({ where: { code: GradeCode.P4 } });

  // ─── 3. Matières ───────────────────────────────────────────────────────────
  const subjectsSpec = [
    {
      code: 'math',
      nameFr: 'Mathématiques',
      nameEn: 'Mathematics',
      descriptionFr: 'Nombres, opérations, géométrie et raisonnement logique.',
      descriptionEn: 'Numbers, operations, geometry, and logical reasoning.',
      colorToken: 'primary',
      iconName: 'calculator',
      ordinal: 1,
    },
    {
      code: 'fr',
      nameFr: 'Français',
      nameEn: 'French',
      descriptionFr: 'Lecture, écriture, grammaire et littérature québécoise.',
      descriptionEn: 'Reading, writing, grammar, and Quebec literature.',
      colorToken: 'secondary',
      iconName: 'book',
      ordinal: 2,
    },
    {
      code: 'en',
      nameFr: 'Anglais',
      nameEn: 'English',
      descriptionFr: 'Compréhension orale et écrite, vocabulaire et grammaire.',
      descriptionEn: 'Listening, reading, vocabulary, and grammar.',
      colorToken: 'accent',
      iconName: 'globe',
      ordinal: 3,
    },
  ] as const;

  const subjects: Record<string, { id: string }> = {};
  for (const subject of subjectsSpec) {
    subjects[subject.code] = await prisma.subject.upsert({
      where: { code: subject.code },
      update: {
        nameFr: subject.nameFr,
        nameEn: subject.nameEn,
        descriptionFr: subject.descriptionFr,
        descriptionEn: subject.descriptionEn,
        colorToken: subject.colorToken,
        iconName: subject.iconName,
        ordinal: subject.ordinal,
        isPublished: true,
      },
      create: {
        code: subject.code,
        nameFr: subject.nameFr,
        nameEn: subject.nameEn,
        descriptionFr: subject.descriptionFr,
        descriptionEn: subject.descriptionEn,
        colorToken: subject.colorToken,
        iconName: subject.iconName,
        ordinal: subject.ordinal,
        isPublished: true,
      },
      select: { id: true },
    });
  }

  // ─── 4. Compétences ────────────────────────────────────────────────────────
  const skillsSpec = [
    {
      code: 'math.fractions.compare',
      subjectCode: 'math',
      nameFr: 'Comparer des fractions',
      nameEn: 'Compare fractions',
      gradeCodes: [GradeCode.P5, GradeCode.P6],
      ordinal: 1,
    },
    {
      code: 'math.geo.perimeter',
      subjectCode: 'math',
      nameFr: 'Calculer un périmètre',
      nameEn: 'Compute a perimeter',
      gradeCodes: [GradeCode.P4, GradeCode.P5],
      ordinal: 2,
    },
    {
      code: 'fr.grammar.verbs',
      subjectCode: 'fr',
      nameFr: 'Accorder le verbe avec son sujet',
      nameEn: 'Subject-verb agreement',
      gradeCodes: [GradeCode.P4, GradeCode.P5, GradeCode.P6],
      ordinal: 1,
    },
    {
      code: 'fr.reading.comprehension',
      subjectCode: 'fr',
      nameFr: 'Comprendre un texte narratif',
      nameEn: 'Understand a narrative text',
      gradeCodes: [GradeCode.P3, GradeCode.P4, GradeCode.P5],
      ordinal: 2,
    },
    {
      code: 'en.vocab.basics',
      subjectCode: 'en',
      nameFr: 'Vocabulaire de base',
      nameEn: 'Basic vocabulary',
      gradeCodes: [GradeCode.P3, GradeCode.P4],
      ordinal: 1,
    },
  ] as const;

  const skills: Record<string, { id: string }> = {};
  for (const skill of skillsSpec) {
    const subject = subjects[skill.subjectCode];
    if (!subject) {
      throw new Error(`Subject ${skill.subjectCode} manquant pour le skill ${skill.code}`);
    }
    skills[skill.code] = await prisma.skill.upsert({
      where: { code: skill.code },
      update: {
        subjectId: subject.id,
        nameFr: skill.nameFr,
        nameEn: skill.nameEn,
        gradeCodes: [...skill.gradeCodes],
        ordinal: skill.ordinal,
      },
      create: {
        subjectId: subject.id,
        code: skill.code,
        nameFr: skill.nameFr,
        nameEn: skill.nameEn,
        gradeCodes: [...skill.gradeCodes],
        ordinal: skill.ordinal,
      },
      select: { id: true },
    });
  }

  // ─── 5. Cours + Leçons + Activités + Questions ────────────────────────────
  type CourseSpec = {
    slug: string;
    subjectCode: 'math' | 'fr' | 'en';
    levelId: string;
    titleFr: string;
    titleEn: string;
    lesson: {
      slug: string;
      titleFr: string;
      titleEn: string;
      skillCodes: string[];
      exerciseQuestion: {
        promptFr: string;
        promptEn: string;
        answers: Array<{ labelFr: string; labelEn: string; isCorrect: boolean }>;
      };
      quizQuestion: {
        promptFr: string;
        promptEn: string;
        answers: Array<{ labelFr: string; labelEn: string; isCorrect: boolean }>;
      };
    };
  };

  const coursesSpec: CourseSpec[] = [
    {
      slug: 'math-p5-fractions',
      subjectCode: 'math',
      levelId: levelP5.id,
      titleFr: 'Fractions et décimaux — 5e année',
      titleEn: 'Fractions and decimals — Grade 5',
      lesson: {
        slug: 'math-p5-comparer-fractions',
        titleFr: 'Comparer deux fractions',
        titleEn: 'Comparing two fractions',
        skillCodes: ['math.fractions.compare'],
        exerciseQuestion: {
          promptFr: 'Quelle fraction est la plus grande : 3/4 ou 2/3 ?',
          promptEn: 'Which fraction is larger: 3/4 or 2/3?',
          answers: [
            { labelFr: '3/4', labelEn: '3/4', isCorrect: true },
            { labelFr: '2/3', labelEn: '2/3', isCorrect: false },
            { labelFr: 'Elles sont égales', labelEn: 'They are equal', isCorrect: false },
          ],
        },
        quizQuestion: {
          promptFr: 'Entre 5/8 et 3/5, laquelle est la plus petite ?',
          promptEn: 'Between 5/8 and 3/5, which one is smaller?',
          answers: [
            { labelFr: '3/5', labelEn: '3/5', isCorrect: true },
            { labelFr: '5/8', labelEn: '5/8', isCorrect: false },
          ],
        },
      },
    },
    {
      slug: 'fr-p4-accords',
      subjectCode: 'fr',
      levelId: levelP4.id,
      titleFr: 'Grammaire — 4e année',
      titleEn: 'Grammar — Grade 4',
      lesson: {
        slug: 'fr-p4-accord-sujet-verbe',
        titleFr: 'Accord sujet-verbe',
        titleEn: 'Subject-verb agreement',
        skillCodes: ['fr.grammar.verbs'],
        exerciseQuestion: {
          promptFr: '« Les élèves ___ au tableau. » Quel est le verbe correctement accordé ?',
          promptEn: '"The students ___ to the board." Which verb form is correct?',
          answers: [
            { labelFr: 'vont', labelEn: 'go', isCorrect: true },
            { labelFr: 'va', labelEn: 'goes', isCorrect: false },
            { labelFr: 'allez', labelEn: 'are going (you)', isCorrect: false },
          ],
        },
        quizQuestion: {
          promptFr: 'Choisis la bonne forme : « Le chat et le chien ___ ensemble. »',
          promptEn: 'Pick the right form: "The cat and the dog ___ together."',
          answers: [
            { labelFr: 'jouent', labelEn: 'play', isCorrect: true },
            { labelFr: 'joue', labelEn: 'plays', isCorrect: false },
          ],
        },
      },
    },
  ];

  for (const courseSpec of coursesSpec) {
    const subject = subjects[courseSpec.subjectCode];
    if (!subject) throw new Error(`Subject ${courseSpec.subjectCode} manquant`);

    const course = await prisma.course.upsert({
      where: { slug: courseSpec.slug },
      update: {
        subjectId: subject.id,
        levelId: courseSpec.levelId,
        titleFr: courseSpec.titleFr,
        titleEn: courseSpec.titleEn,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        slug: courseSpec.slug,
        subjectId: subject.id,
        levelId: courseSpec.levelId,
        titleFr: courseSpec.titleFr,
        titleEn: courseSpec.titleEn,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      select: { id: true },
    });

    const lesson = await prisma.lesson.upsert({
      where: { slug: courseSpec.lesson.slug },
      update: {
        courseId: course.id,
        titleFr: courseSpec.lesson.titleFr,
        titleEn: courseSpec.lesson.titleEn,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      create: {
        slug: courseSpec.lesson.slug,
        courseId: course.id,
        titleFr: courseSpec.lesson.titleFr,
        titleEn: courseSpec.lesson.titleEn,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      select: { id: true },
    });

    // Liens lesson ↔ skills
    for (const skillCode of courseSpec.lesson.skillCodes) {
      const skill = skills[skillCode];
      if (!skill) throw new Error(`Skill ${skillCode} manquant`);
      await prisma.lessonSkillLink.upsert({
        where: { lessonId_skillId: { lessonId: lesson.id, skillId: skill.id } },
        update: {},
        create: { lessonId: lesson.id, skillId: skill.id, weight: 1 },
      });
    }

    // Exercise (idempotent via activityId unique + ordinal stable).
    const exerciseActivity = await prisma.activity.upsert({
      where: {
        // Pas d'unique sur (lessonId, ordinal) → on approxime via findFirst
        // puis upsert-by-id. Pour garder la fonction 100% idempotente, on
        // matérialise l'activity via un ID déterministe basé sur le slug.
        id: deterministicUuid(`${courseSpec.lesson.slug}:exercise`),
      },
      update: {
        lessonId: lesson.id,
        kind: 'EXERCISE',
        ordinal: 1,
        status: ContentStatus.PUBLISHED,
      },
      create: {
        id: deterministicUuid(`${courseSpec.lesson.slug}:exercise`),
        lessonId: lesson.id,
        kind: 'EXERCISE',
        ordinal: 1,
        status: ContentStatus.PUBLISHED,
      },
      select: { id: true },
    });

    const exercise = await prisma.exercise.upsert({
      where: { activityId: exerciseActivity.id },
      update: {
        titleFr: courseSpec.lesson.titleFr,
        titleEn: courseSpec.lesson.titleEn,
        instructionsFr: 'Choisis la bonne réponse.',
        instructionsEn: 'Pick the correct answer.',
      },
      create: {
        activityId: exerciseActivity.id,
        type: 'MCQ_SINGLE',
        titleFr: courseSpec.lesson.titleFr,
        titleEn: courseSpec.lesson.titleEn,
        instructionsFr: 'Choisis la bonne réponse.',
        instructionsEn: 'Pick the correct answer.',
      },
      select: { id: true },
    });

    await seedQuestionWithAnswers({
      questionId: deterministicUuid(`${courseSpec.lesson.slug}:exercise:q1`),
      exerciseId: exercise.id,
      quizId: null,
      spec: courseSpec.lesson.exerciseQuestion,
      lessonSlug: `${courseSpec.lesson.slug}:exercise:q1`,
    });

    // Quiz
    const quizActivity = await prisma.activity.upsert({
      where: { id: deterministicUuid(`${courseSpec.lesson.slug}:quiz`) },
      update: {
        lessonId: lesson.id,
        kind: 'QUIZ',
        ordinal: 2,
        status: ContentStatus.PUBLISHED,
      },
      create: {
        id: deterministicUuid(`${courseSpec.lesson.slug}:quiz`),
        lessonId: lesson.id,
        kind: 'QUIZ',
        ordinal: 2,
        status: ContentStatus.PUBLISHED,
      },
      select: { id: true },
    });

    const quiz = await prisma.quiz.upsert({
      where: { activityId: quizActivity.id },
      update: {
        titleFr: `Quiz — ${courseSpec.lesson.titleFr}`,
        titleEn: `Quiz — ${courseSpec.lesson.titleEn}`,
      },
      create: {
        activityId: quizActivity.id,
        titleFr: `Quiz — ${courseSpec.lesson.titleFr}`,
        titleEn: `Quiz — ${courseSpec.lesson.titleEn}`,
      },
      select: { id: true },
    });

    await seedQuestionWithAnswers({
      questionId: deterministicUuid(`${courseSpec.lesson.slug}:quiz:q1`),
      exerciseId: null,
      quizId: quiz.id,
      spec: courseSpec.lesson.quizQuestion,
      lessonSlug: `${courseSpec.lesson.slug}:quiz:q1`,
    });
  }

  // ─── 6. Badges ─────────────────────────────────────────────────────────────
  const badgesSpec: Array<{
    code: string;
    kind: BadgeKind;
    nameFr: string;
    nameEn: string;
    descriptionFr: string;
    descriptionEn: string;
    ordinal: number;
  }> = [
    {
      code: 'first-lesson',
      kind: BadgeKind.PROGRESSION,
      nameFr: 'Première leçon',
      nameEn: 'First lesson',
      descriptionFr: 'Terminer sa première leçon.',
      descriptionEn: 'Complete your first lesson.',
      ordinal: 1,
    },
    {
      code: 'first-quiz',
      kind: BadgeKind.PROGRESSION,
      nameFr: 'Premier quiz',
      nameEn: 'First quiz',
      descriptionFr: 'Réussir son premier quiz.',
      descriptionEn: 'Pass your first quiz.',
      ordinal: 2,
    },
    {
      code: 'streak-3',
      kind: BadgeKind.STREAK,
      nameFr: 'Série de 3 jours',
      nameEn: '3-day streak',
      descriptionFr: 'Se connecter 3 jours d’affilée.',
      descriptionEn: 'Log in 3 days in a row.',
      ordinal: 3,
    },
    {
      code: 'streak-7',
      kind: BadgeKind.STREAK,
      nameFr: 'Série de 7 jours',
      nameEn: '7-day streak',
      descriptionFr: 'Se connecter 7 jours d’affilée.',
      descriptionEn: 'Log in 7 days in a row.',
      ordinal: 4,
    },
    {
      code: 'mastery-fractions',
      kind: BadgeKind.MASTERY,
      nameFr: 'Maître des fractions',
      nameEn: 'Fraction master',
      descriptionFr: 'Atteindre 80 % de maîtrise sur la compétence « Comparer des fractions ».',
      descriptionEn: 'Reach 80% mastery on the "Compare fractions" skill.',
      ordinal: 5,
    },
  ];

  for (const badge of badgesSpec) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {
        kind: badge.kind,
        nameFr: badge.nameFr,
        nameEn: badge.nameEn,
        descriptionFr: badge.descriptionFr,
        descriptionEn: badge.descriptionEn,
        ordinal: badge.ordinal,
        isActive: true,
      },
      create: {
        code: badge.code,
        kind: badge.kind,
        nameFr: badge.nameFr,
        nameEn: badge.nameEn,
        descriptionFr: badge.descriptionFr,
        descriptionEn: badge.descriptionEn,
        ordinal: badge.ordinal,
      },
    });
  }

  console.info(`Seed terminé ✓ — admin ${admin.email}`);
}

/**
 * Insère une question (XOR exerciseId / quizId) et ses réponses, en mode
 * idempotent : ID déterministe par slug.
 */
async function seedQuestionWithAnswers(params: {
  questionId: string;
  exerciseId: string | null;
  quizId: string | null;
  spec: {
    promptFr: string;
    promptEn: string;
    answers: Array<{ labelFr: string; labelEn: string; isCorrect: boolean }>;
  };
  lessonSlug: string;
}): Promise<void> {
  const { questionId, exerciseId, quizId, spec, lessonSlug } = params;
  await prisma.question.upsert({
    where: { id: questionId },
    update: {
      exerciseId,
      quizId,
      promptFr: spec.promptFr,
      promptEn: spec.promptEn,
    },
    create: {
      id: questionId,
      exerciseId,
      quizId,
      type: 'MCQ_SINGLE',
      promptFr: spec.promptFr,
      promptEn: spec.promptEn,
    },
  });

  for (const [index, answer] of spec.answers.entries()) {
    const answerId = deterministicUuid(`${lessonSlug}:a${index}`);
    await prisma.answer.upsert({
      where: { id: answerId },
      update: {
        questionId,
        ordinal: index,
        labelFr: answer.labelFr,
        labelEn: answer.labelEn,
        isCorrect: answer.isCorrect,
      },
      create: {
        id: answerId,
        questionId,
        ordinal: index,
        labelFr: answer.labelFr,
        labelEn: answer.labelEn,
        isCorrect: answer.isCorrect,
      },
    });
  }
}

/**
 * UUID v4-like déterministe dérivé d'un seed string. Suffisant pour les
 * seeds d'exemple (pas de contrainte cryptographique). En prod, les IDs
 * sont générés par `@default(uuid(7))` côté Prisma.
 */
function deterministicUuid(seed: string): string {
  const hex = createHash('sha1').update(seed).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    '8' + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

main()
  .catch((error: unknown) => {
    console.error('Échec du seed :', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
