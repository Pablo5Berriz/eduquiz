import { prisma } from '@eduquiz/db';
import { getMessages, t, tList } from '@eduquiz/i18n';
import { Button, Container, SectionHeading, cn } from '@eduquiz/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SCHOOL_LEVEL_KEYS, getSchoolLevelSlug } from '../../lib/catalog/levels';
import { SUBJECT_KEYS, getSubjectSlug } from '../../lib/catalog/subjects';
import { getCurrentUser } from '../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../lib/i18n/locale';

import type { JSX } from 'react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
//  Static copy (public marketing page — double quotes for FR apostrophes)
// ─────────────────────────────────────────────────────────────────────────────

const FEATURE_ITEMS = [
  {
    titleKey: 'home.features.item1Title',
    descKey: 'home.features.item1Description',
    accent: 'success',
  },
  {
    titleKey: 'home.features.item2Title',
    descKey: 'home.features.item2Description',
    accent: 'brand',
  },
  {
    titleKey: 'home.features.item3Title',
    descKey: 'home.features.item3Description',
    accent: 'warning',
  },
] as const;

const STEP_ITEMS = [
  { titleKey: 'home.howItWorks.step1Title', descKey: 'home.howItWorks.step1Description' },
  { titleKey: 'home.howItWorks.step2Title', descKey: 'home.howItWorks.step2Description' },
  { titleKey: 'home.howItWorks.step3Title', descKey: 'home.howItWorks.step3Description' },
] as const;

const HOME_COPY = {
  fr: {
    heroTitle: 'Réviser le programme du Québec sans perdre le fil.',
    heroSubtitle:
      "EduQuiz transforme les matières de P3 à S5 en parcours clairs : exercices courts, quiz au bon niveau et progression lisible pour l'élève comme pour le parent.",
    proofItems: ['P3 à S5', 'FR/EN', 'sans carte de crédit'],
    preview: {
      label: 'Aperçu élève',
      subject: 'Mathématiques',
      level: 'Secondaire 1',
      question: 'Quel pourcentage représente 18 sur 24 ?',
      answerA: '65 %',
      answerB: '75 %',
      answerC: '80 %',
      feedback: 'Bonne réponse. La compétence "proportions" progresse.',
      mastery: 'Maîtrise',
      next: 'Prochaine action',
      nextValue: 'Réviser les fractions équivalentes',
    },
    trustNote:
      'Des repères concrets avant les promesses : niveau scolaire, langue, confidentialité et démarrage gratuit.',
    product: {
      kicker: 'Le produit, pas seulement la promesse',
      title: "L'élève pratique, le parent comprend quoi faire ensuite",
      description:
        "La page d'accueil montre ce que l'utilisateur gagne. L'expérience est pensée autour de deux vues : action immédiate pour l'élève, lecture rapide pour le parent.",
      learnerTitle: 'Vue élève',
      learnerBody: 'Question courte, rétroaction immédiate, progression par compétence.',
      parentTitle: 'Vue parent',
      parentBody: 'Résumé clair des forces, des blocages et de la prochaine révision utile.',
      learnerStats: ['12 min', '4 quiz', '+8 %'],
      parentStats: ['À consolider', 'Proportions', 'Cette semaine'],
    },
    levelsIntro: 'Primaire',
    levelsOutro: 'Secondaire',
    finalTitle: 'Commencer petit, mesurer vite, progresser vraiment.',
    finalDescription:
      "Le premier objectif n'est pas de tout faire. C'est de lancer une session utile, voir le niveau réel, puis savoir quoi travailler ensuite.",
  },
  en: {
    heroTitle: 'Review the Quebec curriculum without losing the thread.',
    heroSubtitle:
      'EduQuiz turns Grade 3 to Secondary 5 subjects into clear pathways: short exercises, right-level quizzes, and progress both students and parents can read.',
    proofItems: ['Grade 3 to Sec. 5', 'FR/EN', 'no credit card'],
    preview: {
      label: 'Student preview',
      subject: 'Mathematics',
      level: 'Secondary 1',
      question: 'What percentage is 18 out of 24?',
      answerA: '65%',
      answerB: '75%',
      answerC: '80%',
      feedback: 'Correct. The "proportions" skill is improving.',
      mastery: 'Mastery',
      next: 'Next action',
      nextValue: 'Review equivalent fractions',
    },
    trustNote:
      'Concrete signals before big claims: school level, language, privacy, and a free start.',
    product: {
      kicker: 'The product, not just the promise',
      title: 'Students practise, parents know what to do next',
      description:
        'The home page shows the user what they gain. This experience is built around two views: immediate action for the student, quick clarity for the parent.',
      learnerTitle: 'Student view',
      learnerBody: 'Short question, instant feedback, skill-by-skill progress.',
      parentTitle: 'Parent view',
      parentBody: 'A clear summary of strengths, blockers, and the next useful review.',
      learnerStats: ['12 min', '4 quizzes', '+8%'],
      parentStats: ['Needs work', 'Proportions', 'This week'],
    },
    levelsIntro: 'Primary',
    levelsOutro: 'Secondary',
    finalTitle: 'Start small, measure quickly, make real progress.',
    finalDescription:
      'The first goal is not to do everything. It is to launch one useful session, see the real level, then know what to work on next.',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
//  Sub-components (public page only)
// ─────────────────────────────────────────────────────────────────────────────

function ProductPreview({ locale }: { readonly locale: 'fr' | 'en' }): JSX.Element {
  const copy = HOME_COPY[locale].preview;
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div
        aria-hidden="true"
        className="absolute -inset-4 rounded-2xl bg-brand-100/70 blur-2xl dark:bg-brand-900/30"
      />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
              {copy.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {copy.subject} · {copy.level}
            </p>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-right text-xs shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
            <p className="font-semibold text-slate-900 dark:text-slate-100">76%</p>
            <p className="text-slate-500 dark:text-slate-400">{copy.mastery}</p>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:p-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full w-3/4 rounded-full bg-success-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">
              {copy.question}
            </h2>
            <div className="mt-4 grid gap-2">
              {[copy.answerA, copy.answerB, copy.answerC].map((answer) => (
                <div
                  key={answer}
                  className={cn(
                    'rounded-lg border px-4 py-3 text-sm font-medium',
                    answer === copy.answerB
                      ? 'border-success-500 bg-success-50 text-success-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300',
                  )}
                >
                  {answer}
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-500">
              {copy.feedback}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
            <div className="rounded-xl bg-slate-950 p-4 text-white dark:bg-slate-100 dark:text-slate-950">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300 dark:text-slate-600">
                {copy.next}
              </p>
              <p className="mt-2 text-sm font-semibold">{copy.nextValue}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-end justify-between gap-3">
                {[42, 64, 76].map((value) => (
                  <div key={value} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-20 w-full items-end rounded-md bg-slate-100 dark:bg-slate-800">
                      <div
                        className="w-full rounded-md bg-brand-500"
                        style={{ height: `${String(value)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {String(value)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Page entry point
// ─────────────────────────────────────────────────────────────────────────────

export default async function LocalizedHomePage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const user = await getCurrentUser();

  // ── Authenticated — rediriger vers le tableau de bord ou l'onboarding ───────
  if (user) {
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { firstName: true },
    });

    // Nouveau profil sans prénom → onboarding
    if (!profile?.firstName || profile.firstName.trim() === '') {
      redirect(`/${locale}/profil/modifier?welcome=1`);
    }

    // Profil complet → tableau de bord dédié
    redirect(`/${locale}/accueil`);
  }

  // ── Public / visitor ──────────────────────────────────────────────────────
  const messages = getMessages(locale);
  const copy = HOME_COPY[locale];
  const trustItems = tList(messages, 'home.trust.items');

  return (
    <>
      <section
        aria-labelledby="home-hero-title"
        className="relative overflow-hidden border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
      >
        <div
          className="absolute inset-x-0 top-0 h-32 bg-white dark:bg-slate-950"
          aria-hidden="true"
        />
        <Container
          width="xl"
          className="relative grid gap-12 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20"
        >
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
              {t(messages, 'home.heroKicker')}
            </p>
            <h1
              id="home-hero-title"
              className="mt-5 text-balance text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl dark:text-slate-50"
            >
              {copy.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg text-slate-600 dark:text-slate-300">
              {copy.heroSubtitle}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/inscription`} className="inline-flex">
                <Button variant="primary" size="lg">
                  {t(messages, 'home.ctaPrimary')}
                </Button>
              </Link>
              <Link href={`/${locale}/matieres`} className="inline-flex">
                <Button variant="secondary" size="lg">
                  {t(messages, 'home.ctaSecondary')}
                </Button>
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-2">
              {copy.proofItems.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <ProductPreview locale={locale} />
        </Container>
      </section>

      <section
        aria-label={t(messages, 'home.trust.title')}
        className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      >
        <Container width="xl" className="grid gap-5 py-6 lg:grid-cols-[1fr_2fr] lg:items-center">
          <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">{copy.trustNote}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100"
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full bg-success-500"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="home-product-title">
        <Container width="xl" className="py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <SectionHeading
              kicker={copy.product.kicker}
              title={<span id="home-product-title">{copy.product.title}</span>}
              description={copy.product.description}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-5 inline-flex rounded-lg bg-success-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-success-700">
                  {copy.product.learnerTitle}
                </div>
                <p className="text-base font-semibold text-slate-950 dark:text-slate-50">
                  {copy.product.learnerBody}
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {copy.product.learnerStats.map((stat) => (
                    <div
                      key={stat}
                      className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm font-bold text-slate-900 dark:bg-slate-950 dark:text-slate-100"
                    >
                      {stat}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm dark:border-slate-800">
                <div className="mb-5 inline-flex rounded-lg bg-warning-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-warning-500">
                  {copy.product.parentTitle}
                </div>
                <p className="text-base font-semibold">{copy.product.parentBody}</p>
                <div className="mt-6 grid gap-2">
                  {copy.product.parentStats.map((stat) => (
                    <div
                      key={stat}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold"
                    >
                      {stat}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="home-features-title"
        className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <Container width="xl" className="py-20">
          <SectionHeading
            kicker={t(messages, 'home.features.kicker')}
            title={<span id="home-features-title">{t(messages, 'home.features.title')}</span>}
            description={t(messages, 'home.features.description')}
            align="center"
            className="mx-auto max-w-3xl"
          />
          <ul className="mt-12 grid gap-4 lg:grid-cols-3">
            {FEATURE_ITEMS.map((feature) => (
              <li
                key={feature.titleKey}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div
                  className={cn(
                    'mb-5 h-2 w-16 rounded-full',
                    feature.accent === 'success' && 'bg-success-500',
                    feature.accent === 'brand' && 'bg-brand-500',
                    feature.accent === 'warning' && 'bg-warning-500',
                  )}
                  aria-hidden="true"
                />
                <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                  {t(messages, feature.titleKey)}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(messages, feature.descKey)}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="home-levels-title">
        <Container width="xl" className="py-20">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <SectionHeading
              kicker={t(messages, 'home.levels.kicker')}
              title={<span id="home-levels-title">{t(messages, 'home.levels.title')}</span>}
              description={t(messages, 'home.levels.description')}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-4 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                <span>{copy.levelsIntro}</span>
                <span>{copy.levelsOutro}</span>
              </div>
              <ul className="grid gap-2 sm:grid-cols-3">
                {SCHOOL_LEVEL_KEYS.map((key) => {
                  const slug = getSchoolLevelSlug(messages, key);
                  return (
                    <li key={key}>
                      <Link
                        href={`/${locale}/niveaux/${slug}`}
                        className="group flex min-h-20 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700 dark:hover:bg-brand-950/30"
                      >
                        <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                          {t(messages, `levels.list.${key}.title`)}
                        </span>
                        <span className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          {t(messages, `levels.list.${key}.age`)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="home-subjects-title" className="bg-slate-950 text-white">
        <Container width="xl" className="py-20">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <SectionHeading
              kicker={t(messages, 'home.subjects.kicker')}
              title={<span id="home-subjects-title">{t(messages, 'home.subjects.title')}</span>}
              description={t(messages, 'home.subjects.description')}
              className="[&_*]:text-white [&_p:last-child]:text-slate-300"
            />
            <p className="lg:text-right">
              <Link
                href={`/${locale}/matieres`}
                className="inline-flex rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-300"
              >
                {t(messages, 'home.subjects.cta')}
              </Link>
            </p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SUBJECT_KEYS.map((key) => {
              const slug = getSubjectSlug(messages, key);
              const title = t(messages, `subjects.list.${key}.title`);
              const image = t(messages, `subjects.list.${key}.image`);
              return (
                <li
                  key={key}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:bg-white/[0.07]"
                >
                  <Link
                    href={`/${locale}/matieres/${slug}`}
                    className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-300"
                  >
                    <div className="bg-white p-4">
                      <img
                        src={image}
                        alt={title}
                        className="h-24 w-full object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="flex h-full flex-col gap-1 p-4">
                      <h3 className="text-sm font-semibold text-white">{title}</h3>
                      <p className="text-xs text-slate-300">
                        {t(messages, `subjects.list.${key}.levels`)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="home-how-title">
        <Container width="xl" className="py-20">
          <SectionHeading
            kicker={t(messages, 'home.howItWorks.kicker')}
            title={<span id="home-how-title">{t(messages, 'home.howItWorks.title')}</span>}
            align="center"
            className="mx-auto max-w-3xl"
          />
          <ol className="mt-12 grid gap-4 lg:grid-cols-3">
            {STEP_ITEMS.map((step, index) => (
              <li
                key={step.titleKey}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-base font-semibold text-slate-950 dark:text-slate-50">
                  {t(messages, step.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(messages, step.descKey)}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section
        aria-labelledby="home-final-cta-title"
        className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <Container width="lg" className="py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
            {t(messages, 'home.pricingTeaser.kicker')}
          </p>
          <h2
            id="home-final-cta-title"
            className="mx-auto mt-4 max-w-3xl text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-slate-50"
          >
            {copy.finalTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-slate-600 dark:text-slate-300">
            {copy.finalDescription}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={`/${locale}/inscription`} className="inline-flex">
              <Button variant="primary" size="lg">
                {t(messages, 'home.finalCta.ctaPrimary')}
              </Button>
            </Link>
            <Link href={`/${locale}/tarifs`} className="inline-flex">
              <Button variant="secondary" size="lg">
                {t(messages, 'home.pricingTeaser.cta')}
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
