'use client';

/**
 * Bouton « Renvoyer le courriel » avec cooldown 60s côté UI.
 *
 * Le cooldown est purement client (anti-clic compulsif) — la vraie
 * limitation de débit serveur viendra en 1.7 (bucket Redis).
 */

import { Button } from '@eduquiz/ui';
import { useEffect, useState, useTransition } from 'react';

import { resendVerification } from '../../../lib/auth/actions/verify-email';

import type { JSX } from 'react';

const COOLDOWN_SECONDS = 60;

export interface ResendVerificationButtonProps {
  readonly email: string;
  readonly locale: 'fr' | 'en';
  readonly resendCta: string;
  readonly resendCooldownTemplate: string; // contient « {seconds} »
  readonly resendSuccess: string;
}

export function ResendVerificationButton({
  email,
  locale,
  resendCta,
  resendCooldownTemplate,
  resendSuccess,
}: ResendVerificationButtonProps): JSX.Element {
  const [pending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => {
      clearTimeout(t);
    };
  }, [cooldown]);

  function onClick(): void {
    startTransition(async () => {
      await resendVerification({ email, locale });
      setSuccess(true);
      setCooldown(COOLDOWN_SECONDS);
      // Le succès s'efface après le cooldown.
      setTimeout(() => {
        setSuccess(false);
      }, COOLDOWN_SECONDS * 1000);
    });
  }

  const disabled = pending || cooldown > 0;
  const label =
    cooldown > 0 ? resendCooldownTemplate.replace('{seconds}', String(cooldown)) : resendCta;

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="secondary"
        size="md"
        onClick={onClick}
        disabled={disabled}
        isLoading={pending}
      >
        {label}
      </Button>
      {success && cooldown > 0 ? (
        <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
          {resendSuccess}
        </p>
      ) : null}
    </div>
  );
}
