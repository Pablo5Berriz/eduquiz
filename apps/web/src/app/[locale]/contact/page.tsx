import { getMessages, t } from '@eduquiz/i18n';
import { Card, Container } from '@eduquiz/ui';

import { ContactForm, type ContactFormLabels } from '../../../components/forms/ContactForm';
import { PageHero } from '../../../components/layout/PageHero';
import { resolveLocaleParam, type LocaleRouteParams } from '../../../lib/i18n/locale';

import type { Metadata } from 'next';
import type { JSX } from 'react';

/**
 * Page « Contact » — écran 10.
 *
 * Layout 2 colonnes : formulaire client à gauche, carte « Autres moyens
 * de nous joindre » à droite (courriel général, courriel confidentialité,
 * heures de réponse). Les libellés du formulaire sont résolus côté
 * serveur puis passés au composant client.
 */

export function generateMetadata({ params }: { params: LocaleRouteParams }): Metadata {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);
  return {
    title: t(messages, 'nav.contact'),
    description: t(messages, 'contact.heroSubtitle'),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: {
        fr: '/fr/contact',
        en: '/en/contact',
      },
    },
  };
}

export default function ContactPage({
  params,
}: {
  readonly params: LocaleRouteParams;
}): JSX.Element {
  const locale = resolveLocaleParam(params.locale);
  const messages = getMessages(locale);

  const labels: ContactFormLabels = {
    nameLabel: t(messages, 'contact.form.nameLabel'),
    namePlaceholder: t(messages, 'contact.form.namePlaceholder'),
    emailLabel: t(messages, 'contact.form.emailLabel'),
    emailPlaceholder: t(messages, 'contact.form.emailPlaceholder'),
    topicLabel: t(messages, 'contact.form.topicLabel'),
    topicOptions: [
      { value: 'general', label: t(messages, 'contact.form.topicOptionGeneral') },
      { value: 'support', label: t(messages, 'contact.form.topicOptionSupport') },
      { value: 'billing', label: t(messages, 'contact.form.topicOptionBilling') },
      { value: 'privacy', label: t(messages, 'contact.form.topicOptionPrivacy') },
      { value: 'other', label: t(messages, 'contact.form.topicOptionOther') },
    ],
    messageLabel: t(messages, 'contact.form.messageLabel'),
    messagePlaceholder: t(messages, 'contact.form.messagePlaceholder'),
    submitLabel: t(messages, 'contact.form.submitLabel'),
    sendingLabel: t(messages, 'contact.form.sendingLabel'),
    successTitle: t(messages, 'contact.form.successTitle'),
    successDescription: t(messages, 'contact.form.successDescription'),
    errorGeneric: t(messages, 'contact.form.errorGeneric'),
    errorEmail: t(messages, 'contact.form.errorEmail'),
    errorRequired: t(messages, 'contact.form.errorRequired'),
    errorMessageTooShort: t(messages, 'contact.form.errorMessageTooShort'),
  };

  return (
    <>
      <PageHero
        kicker={t(messages, 'contact.heroKicker')}
        title={t(messages, 'contact.heroTitle')}
        subtitle={t(messages, 'contact.heroSubtitle')}
      />

      <Container width="lg" className="py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <ContactForm labels={labels} />
          </div>

          <Card variant="muted" padding="lg" as="aside" aria-labelledby="contact-alt-title">
            <h2
              id="contact-alt-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              {t(messages, 'contact.altTitle')}
            </h2>
            <dl className="mt-5 flex flex-col gap-5 text-sm">
              <div className="flex flex-col gap-1">
                <dt className="font-semibold text-slate-500 dark:text-slate-400">
                  {t(messages, 'contact.altEmailLabel')}
                </dt>
                <dd>
                  <a
                    href={`mailto:${t(messages, 'contact.altEmailValue')}`}
                    className="text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    {t(messages, 'contact.altEmailValue')}
                  </a>
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="font-semibold text-slate-500 dark:text-slate-400">
                  {t(messages, 'contact.altPrivacyLabel')}
                </dt>
                <dd>
                  <a
                    href={`mailto:${t(messages, 'contact.altPrivacyValue')}`}
                    className="text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-focus focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
                  >
                    {t(messages, 'contact.altPrivacyValue')}
                  </a>
                </dd>
              </div>

              <div className="flex flex-col gap-1">
                <dt className="font-semibold text-slate-500 dark:text-slate-400">
                  {t(messages, 'contact.altHoursLabel')}
                </dt>
                <dd className="text-slate-700 dark:text-slate-200">
                  {t(messages, 'contact.altHoursValue')}
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
              {t(messages, 'footer.madeIn')}
            </p>
            <p className="sr-only">locale: {locale}</p>
          </Card>
        </div>
      </Container>
    </>
  );
}
