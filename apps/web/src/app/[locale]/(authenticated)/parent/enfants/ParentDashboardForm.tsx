'use client';

/**
 * Formulaire client du tableau de bord parent (Tâche 2.2).
 *
 * Deux sections :
 *   1. `AddChildForm` — saisie de l'email de l'élève + affichage du code généré.
 *   2. `ChildrenList` — liste des liens existants passée depuis le Server Component.
 */

import { Alert, Button, FormField, Input } from '@eduquiz/ui';
import { useState, useTransition } from 'react';

import { createParentInvitation, type InvitationErrorCode } from '../../../../../lib/family/actions';

import type { JSX } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChildLink {
  readonly id: string;
  readonly childEmail: string;
  readonly state: 'PENDING' | 'VERIFIED' | 'REVOKED';
}

export interface ParentDashboardFormCopy {
  readonly addChild: string;
  readonly childEmailLabel: string;
  readonly childEmailHint: string;
  readonly submit: string;
  readonly submitting: string;
  readonly codeGenerated: string;
  readonly codeInstruction: string;
  readonly codeExpiry: string;
  readonly close: string;
  readonly children: string;
  readonly noChildren: string;
  readonly statePending: string;
  readonly stateVerified: string;
  readonly stateRevoked: string;
  readonly errors: Record<InvitationErrorCode, string>;
}

export interface ParentDashboardFormProps {
  readonly initialLinks: readonly ChildLink[];
  readonly copy: ParentDashboardFormCopy;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ParentDashboardForm({ initialLinks, copy }: ParentDashboardFormProps): JSX.Element {
  const [links] = useState<readonly ChildLink[]>(initialLinks);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);
    setGeneratedCode(null);
    startTransition(async () => {
      const result = await createParentInvitation(email);
      if (result.ok) {
        setGeneratedCode(result.code);
        setEmail('');
        return;
      }
      setError(copy.errors[result.error]);
    });
  }

  function stateBadge(state: ChildLink['state']): JSX.Element {
    const classes =
      state === 'VERIFIED'
        ? 'inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-800 dark:bg-success-900/30 dark:text-success-300'
        : state === 'PENDING'
          ? 'inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
          : 'inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    const label =
      state === 'VERIFIED' ? copy.stateVerified : state === 'PENDING' ? copy.statePending : copy.stateRevoked;
    return <span className={classes}>{label}</span>;
  }

  return (
    <div className="flex flex-col gap-10">
      {/* ── Formulaire d'invitation ─────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{copy.addChild}</h2>

        {generatedCode ? (
          <div className="mt-4 flex flex-col gap-4">
            <Alert tone="success">
              <p className="font-semibold">{copy.codeGenerated}</p>
              <p className="mt-1 text-sm">{copy.codeInstruction}</p>
            </Alert>
            <div className="flex items-center gap-4">
              <span className="rounded-lg border border-brand-200 bg-brand-50 px-5 py-3 font-mono text-3xl font-bold tracking-widest text-brand-800 dark:border-brand-800 dark:bg-brand-950/30 dark:text-brand-200">
                {generatedCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{copy.codeExpiry}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setGeneratedCode(null)}
            >
              {copy.close}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-4 flex flex-col gap-5">
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <FormField
              id="childEmail"
              label={copy.childEmailLabel}
              hint={copy.childEmailHint}
              required
            >
              <Input
                id="childEmail"
                name="childEmail"
                type="email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={!!error}
              />
            </FormField>
            <Button type="submit" variant="primary" size="md" isLoading={pending}>
              {pending ? copy.submitting : copy.submit}
            </Button>
          </form>
        )}
      </section>

      {/* ── Liste des enfants rattachés ──────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{copy.children}</h2>
        {links.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{copy.noChildren}</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {links.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {link.childEmail}
                </span>
                {stateBadge(link.state)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
