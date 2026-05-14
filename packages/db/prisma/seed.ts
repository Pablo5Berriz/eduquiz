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
 *   • 1 exercice MCQ_SINGLE et 1 quiz multi-question par leçon.
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
  ExerciseType,
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
  type QuestionSpec = {
    type?: ExerciseType;
    promptFr: string;
    promptEn: string;
    answers: Array<{ labelFr: string; labelEn: string; isCorrect: boolean }>;
  };

  type LessonBody = {
    blocks: Array<
      | { type: 'paragraph'; text: string }
      | { type: 'list'; items: string[] }
      | { type: 'example'; title: string; text: string }
      | { type: 'callout'; title: string; text: string }
    >;
  };

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
      summaryFr: string;
      summaryEn: string;
      objectivesFr: string[];
      objectivesEn: string[];
      bodyFr: LessonBody;
      bodyEn: LessonBody;
      exerciseHintFr: string;
      exerciseHintEn: string;
      exerciseExplanationFr: string;
      exerciseExplanationEn: string;
      skillCodes: string[];
      exerciseQuestion: QuestionSpec;
      quizQuestions: QuestionSpec[];
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
        summaryFr:
          'Apprends à comparer deux fractions avec des dénominateurs différents sans te fier seulement à leur apparence.',
        summaryEn:
          'Learn how to compare two fractions with different denominators without relying only on how they look.',
        objectivesFr: [
          'Comprendre que le dénominateur indique le nombre de parts égales.',
          'Comparer deux fractions en les mettant sur un dénominateur commun.',
          'Vérifier une réponse avec un produit croisé simple.',
        ],
        objectivesEn: [
          'Understand that the denominator shows how many equal parts are used.',
          'Compare two fractions by rewriting them with a common denominator.',
          'Check an answer with a simple cross product.',
        ],
        bodyFr: {
          blocks: [
            {
              type: 'paragraph',
              text: 'Une fraction représente une partie d’un tout. Pour comparer deux fractions, il faut comparer des parts de même taille. Si les dénominateurs sont différents, les parts ne sont pas directement comparables.',
            },
            {
              type: 'list',
              items: [
                'Trouve un dénominateur commun.',
                'Transforme chaque fraction sans changer sa valeur.',
                'Compare ensuite les numérateurs.',
              ],
            },
            {
              type: 'example',
              title: 'Exemple',
              text: 'Pour comparer 5/8 et 3/5, utilise 40 comme dénominateur commun. 5/8 devient 25/40 et 3/5 devient 24/40. Donc 3/5 est la plus petite.',
            },
            {
              type: 'callout',
              title: 'Point de vigilance',
              text: 'Un plus grand dénominateur ne signifie pas automatiquement une plus grande fraction. 1/8 est plus petit que 1/5, car le tout est coupé en plus de parts.',
            },
          ],
        },
        bodyEn: {
          blocks: [
            {
              type: 'paragraph',
              text: 'A fraction represents part of a whole. To compare two fractions, you need to compare parts of the same size. If the denominators are different, the parts cannot be compared directly.',
            },
            {
              type: 'list',
              items: [
                'Find a common denominator.',
                'Rewrite each fraction without changing its value.',
                'Compare the numerators.',
              ],
            },
            {
              type: 'example',
              title: 'Example',
              text: 'To compare 5/8 and 3/5, use 40 as the common denominator. 5/8 becomes 25/40 and 3/5 becomes 24/40. So 3/5 is smaller.',
            },
            {
              type: 'callout',
              title: 'Watch out',
              text: 'A bigger denominator does not automatically mean a bigger fraction. 1/8 is smaller than 1/5 because the whole is split into more parts.',
            },
          ],
        },
        exerciseHintFr: 'Mets les deux fractions sur le même dénominateur avant de comparer.',
        exerciseHintEn: 'Rewrite both fractions with the same denominator before comparing.',
        exerciseExplanationFr:
          '3/4 et 2/3 sont plus grandes que 1/2. 1/3 et 2/5 sont plus petites que 1/2.',
        exerciseExplanationEn: '3/4 and 2/3 are greater than 1/2. 1/3 and 2/5 are less than 1/2.',
        skillCodes: ['math.fractions.compare'],
        exerciseQuestion: {
          type: ExerciseType.MCQ_MULTI,
          promptFr: 'Sélectionne toutes les fractions plus grandes que 1/2.',
          promptEn: 'Select all fractions greater than 1/2.',
          answers: [
            { labelFr: '3/4', labelEn: '3/4', isCorrect: true },
            { labelFr: '2/3', labelEn: '2/3', isCorrect: true },
            { labelFr: '1/3', labelEn: '1/3', isCorrect: false },
            { labelFr: '2/5', labelEn: '2/5', isCorrect: false },
          ],
        },
        quizQuestions: [
          {
            promptFr: 'Entre 5/8 et 3/5, laquelle est la plus petite ?',
            promptEn: 'Between 5/8 and 3/5, which one is smaller?',
            answers: [
              { labelFr: '3/5', labelEn: '3/5', isCorrect: true },
              { labelFr: '5/8', labelEn: '5/8', isCorrect: false },
            ],
          },
          {
            type: ExerciseType.TRUE_FALSE,
            promptFr: 'Vrai ou faux : 1/8 est plus grand que 1/5.',
            promptEn: 'True or false: 1/8 is greater than 1/5.',
            answers: [
              { labelFr: 'Vrai', labelEn: 'True', isCorrect: false },
              { labelFr: 'Faux', labelEn: 'False', isCorrect: true },
            ],
          },
          {
            type: ExerciseType.MCQ_MULTI,
            promptFr: 'Sélectionne toutes les fractions équivalentes à 1/2.',
            promptEn: 'Select all fractions equivalent to 1/2.',
            answers: [
              { labelFr: '2/4', labelEn: '2/4', isCorrect: true },
              { labelFr: '3/6', labelEn: '3/6', isCorrect: true },
              { labelFr: '4/6', labelEn: '4/6', isCorrect: false },
              { labelFr: '5/10', labelEn: '5/10', isCorrect: true },
            ],
          },
        ],
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
        summaryFr:
          'Repère le sujet d’une phrase et choisis la forme du verbe qui correspond à ce sujet.',
        summaryEn:
          'Find the subject of a sentence and choose the verb form that matches that subject.',
        objectivesFr: [
          'Identifier le sujet dans une phrase simple.',
          'Distinguer un sujet singulier d’un sujet pluriel.',
          'Choisir une terminaison verbale cohérente avec le sujet.',
        ],
        objectivesEn: [
          'Identify the subject in a simple sentence.',
          'Tell whether a subject is singular or plural.',
          'Choose a verb ending that matches the subject.',
        ],
        bodyFr: {
          blocks: [
            {
              type: 'paragraph',
              text: 'Dans une phrase, le verbe doit s’accorder avec son sujet. Pour bien accorder, commence par poser la question “qui est-ce qui ?” devant le verbe.',
            },
            {
              type: 'list',
              items: [
                'Trouve le verbe conjugué.',
                'Pose la question pour trouver le sujet.',
                'Regarde si le sujet est singulier ou pluriel.',
                'Choisis la forme du verbe qui convient.',
              ],
            },
            {
              type: 'example',
              title: 'Exemple',
              text: 'Dans “Le chat et le chien jouent ensemble”, le sujet est “Le chat et le chien”. Il y a deux animaux : le sujet est pluriel, donc on écrit “jouent”.',
            },
            {
              type: 'callout',
              title: 'Point de vigilance',
              text: 'Le sujet peut être loin du verbe. Ne choisis pas la forme du verbe seulement avec le mot placé juste avant.',
            },
          ],
        },
        bodyEn: {
          blocks: [
            {
              type: 'paragraph',
              text: 'In a sentence, the verb must agree with its subject. To choose the right form, first ask who or what is doing the action.',
            },
            {
              type: 'list',
              items: [
                'Find the conjugated verb.',
                'Ask who or what is doing the action.',
                'Check whether the subject is singular or plural.',
                'Choose the matching verb form.',
              ],
            },
            {
              type: 'example',
              title: 'Example',
              text: 'In “The cat and the dog play together”, the subject is “The cat and the dog”. There are two animals, so the subject is plural and the verb is “play”.',
            },
            {
              type: 'callout',
              title: 'Watch out',
              text: 'The subject can be far from the verb. Do not choose the verb form only from the word that appears just before it.',
            },
          ],
        },
        exerciseHintFr: 'Cherche d’abord le sujet : qui fait l’action ?',
        exerciseHintEn: 'Find the subject first: who is doing the action?',
        exerciseExplanationFr:
          'Le sujet est “Les élèves”, donc il est pluriel. Le verbe doit aussi être au pluriel : “vont”.',
        exerciseExplanationEn:
          'The subject is “The students”, so it is plural. The verb must also be plural: “go”.',
        exerciseQuestion: {
          promptFr: '« Les élèves ___ au tableau. » Quel est le verbe correctement accordé ?',
          promptEn: '"The students ___ to the board." Which verb form is correct?',
          answers: [
            { labelFr: 'vont', labelEn: 'go', isCorrect: true },
            { labelFr: 'va', labelEn: 'goes', isCorrect: false },
            { labelFr: 'allez', labelEn: 'are going (you)', isCorrect: false },
          ],
        },
        quizQuestions: [
          {
            promptFr: 'Choisis la bonne forme : « Le chat et le chien ___ ensemble. »',
            promptEn: 'Pick the right form: "The cat and the dog ___ together."',
            answers: [
              { labelFr: 'jouent', labelEn: 'play', isCorrect: true },
              { labelFr: 'joue', labelEn: 'plays', isCorrect: false },
            ],
          },
          {
            type: ExerciseType.TRUE_FALSE,
            promptFr: 'Vrai ou faux : dans « Les élèves vont », le sujet est pluriel.',
            promptEn: 'True or false: in "The students go", the subject is plural.',
            answers: [
              { labelFr: 'Vrai', labelEn: 'True', isCorrect: true },
              { labelFr: 'Faux', labelEn: 'False', isCorrect: false },
            ],
          },
          {
            type: ExerciseType.MCQ_MULTI,
            promptFr: 'Sélectionne tous les sujets pluriels.',
            promptEn: 'Select all plural subjects.',
            answers: [
              { labelFr: 'Les élèves', labelEn: 'The students', isCorrect: true },
              {
                labelFr: 'Le chat et le chien',
                labelEn: 'The cat and the dog',
                isCorrect: true,
              },
              { labelFr: 'Ma sœur', labelEn: 'My sister', isCorrect: false },
              { labelFr: 'Un enfant', labelEn: 'A child', isCorrect: false },
            ],
          },
        ],
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
        summaryFr: courseSpec.lesson.summaryFr,
        summaryEn: courseSpec.lesson.summaryEn,
        objectivesFr: courseSpec.lesson.objectivesFr,
        objectivesEn: courseSpec.lesson.objectivesEn,
        bodyFr: courseSpec.lesson.bodyFr,
        bodyEn: courseSpec.lesson.bodyEn,
        publishedAt: new Date(),
      },
      create: {
        slug: courseSpec.lesson.slug,
        courseId: course.id,
        titleFr: courseSpec.lesson.titleFr,
        titleEn: courseSpec.lesson.titleEn,
        status: ContentStatus.PUBLISHED,
        summaryFr: courseSpec.lesson.summaryFr,
        summaryEn: courseSpec.lesson.summaryEn,
        objectivesFr: courseSpec.lesson.objectivesFr,
        objectivesEn: courseSpec.lesson.objectivesEn,
        bodyFr: courseSpec.lesson.bodyFr,
        bodyEn: courseSpec.lesson.bodyEn,
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
        type: courseSpec.lesson.exerciseQuestion.type ?? ExerciseType.MCQ_SINGLE,
        instructionsFr: 'Choisis la bonne réponse.',
        instructionsEn: 'Pick the correct answer.',
        hintFr: courseSpec.lesson.exerciseHintFr,
        hintEn: courseSpec.lesson.exerciseHintEn,
        explanationFr: courseSpec.lesson.exerciseExplanationFr,
        explanationEn: courseSpec.lesson.exerciseExplanationEn,
      },
      create: {
        activityId: exerciseActivity.id,
        type: courseSpec.lesson.exerciseQuestion.type ?? ExerciseType.MCQ_SINGLE,
        titleFr: courseSpec.lesson.titleFr,
        titleEn: courseSpec.lesson.titleEn,
        instructionsFr: 'Choisis la bonne réponse.',
        instructionsEn: 'Pick the correct answer.',
        hintFr: courseSpec.lesson.exerciseHintFr,
        hintEn: courseSpec.lesson.exerciseHintEn,
        explanationFr: courseSpec.lesson.exerciseExplanationFr,
        explanationEn: courseSpec.lesson.exerciseExplanationEn,
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

    for (const [index, question] of courseSpec.lesson.quizQuestions.entries()) {
      const questionKey = `${courseSpec.lesson.slug}:quiz:q${index + 1}`;
      await seedQuestionWithAnswers({
        questionId: deterministicUuid(questionKey),
        exerciseId: null,
        quizId: quiz.id,
        spec: question,
        lessonSlug: questionKey,
        ordinal: index,
      });
    }
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
    type?: ExerciseType;
    promptFr: string;
    promptEn: string;
    answers: Array<{ labelFr: string; labelEn: string; isCorrect: boolean }>;
  };
  lessonSlug: string;
  ordinal?: number;
}): Promise<void> {
  const { questionId, exerciseId, quizId, spec, lessonSlug, ordinal = 0 } = params;
  await prisma.question.upsert({
    where: { id: questionId },
    update: {
      exerciseId,
      quizId,
      type: spec.type ?? ExerciseType.MCQ_SINGLE,
      ordinal,
      promptFr: spec.promptFr,
      promptEn: spec.promptEn,
    },
    create: {
      id: questionId,
      exerciseId,
      quizId,
      type: spec.type ?? ExerciseType.MCQ_SINGLE,
      ordinal,
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
