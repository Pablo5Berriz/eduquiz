import { getMessages, t } from '@eduquiz/i18n';
import { Container } from '@eduquiz/ui';
import { ParentLinkState, UserRole, prismaService as prisma } from '@eduquiz/db';

import { requireRoleOrRedirect } from '../../../../../lib/auth/server';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../../../lib/i18n/locale';
import { LinkParentForm } from './LinkParentForm';

import type { Metadata } from 'next';
import type { JSX } from 'react';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'family.linkParent.title'),
    robots: { index: false, follow: false },
  };
}

export default async function LinkParentPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): Promise<JSX.Element> {
  const locale = resolveLocaleParam(params.locale);
  const user = await requireRoleOrRedirect(locale, UserRole.LEARNER_MINOR, '/apprendre/relier-parent');
  const messages = getMessages(locale);

  // Si un lien VERIFIED existe déjà, afficher un message sans le formulaire.
  const verifiedLink = await prisma.parentChildLink.findFirst({
    where: { childId: user.id, state: ParentLinkState.VERIFIED },
    select: { id: true },
  });

  const skipHref = `/${locale}/apprendre`;

  if (verifiedLink) {
    return (
      <Container width="sm" className="py-12 sm:py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {t(messages, 'family.linkParent.title')}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t(messages, 'family.linkParent.alreadyLinked')}
          </p>
          <a
            href={skipHref}
            className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
          >
            {t(messages, 'family.linkParent.skipCta')} →
          </a>
        </div>
      </Container>
    );
  }

  const copy = {
    codeLabel: t(messages, 'family.linkParent.codeLabel'),
    codeHint: t(messages, 'family.linkParent.codeHint'),
    submit: t(messages, 'family.linkParent.submit'),
    submitting: t(messages, 'family.linkParent.submitting'),
    success: t(messages, 'family.linkParent.success'),
    skipCta: t(messages, 'family.linkParent.skipCta'),
    errors: {
      codeInvalid: t(messages, 'family.linkParent.errors.codeInvalid'),
      codeNotForYou: t(messages, 'family.linkParent.errors.codeNotForYou'),
      alreadyRedeemed: t(messages, 'family.linkParent.errors.alreadyRedeemed'),
      unknown: t(messages, 'family.linkParent.errors.unknown'),
      rateLimited: t(messages, 'family.linkParent.errors.rateLimited'),
    },
  };

  return (
    <Container width="sm" className="py-12 sm:py-16">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          {locale === 'fr' ? 'Loi 25' : 'Privacy'}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
          {t(messages, 'family.linkParent.title')}
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
          {t(messages, 'family.linkParent.subtitle')}
        </p>
      </div>

      <LinkParentForm locale={locale} copy={copy} skipHref={skipHref} />
    </Container>
  );
}
