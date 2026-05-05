import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

import type { E2EQuizFixture } from './global-setup';

// ── Credentials E2E ───────────────────────────────────────────────────────────

const email = process.env.E2E_USER_EMAIL ?? 'e2e.learner@eduquiz.local';
const password = process.env.E2E_USER_PASSWORD ?? 'EduQuiz-e2e-Password-2026!';

// ── Fixture dynamique résolu par global-setup ─────────────────────────────────
//
// global-setup.ts requête la DB et écrit les données dans e2e/.cache/quiz-fixture.json.
// On les lit ici plutôt que de coder en dur un slug ou des labels de réponse.
//
function loadQuizFixture(): E2EQuizFixture {
  const path = resolve(__dirname, '.cache', 'quiz-fixture.json');
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as E2EQuizFixture;
  } catch {
    throw new Error(
      `[E2E] Impossible de lire e2e/.cache/quiz-fixture.json.\n` +
        `Assurez-vous que global-setup.ts s'est bien exécuté (pnpm db:seed requis).`,
    );
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('un apprenant peut se connecter, ouvrir une leçon et enregistrer un quiz avec 100 %', async ({
  page,
}) => {
  const fixture = loadQuizFixture();
  const lessonPath = `/fr/apprendre/${fixture.lessonSlug}`;

  // ── Connexion avec redirection directe vers la leçon ────────────────────────
  await page.goto(`/fr/connexion?next=${encodeURIComponent(lessonPath)}`);

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form').evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });

  // La connexion réussie redirige vers la leçon.
  await expect(page).toHaveURL(new RegExp(`${fixture.lessonSlug}$`));
  await expect(page.getByRole('heading', { name: fixture.lessonTitleFr })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Exercice guidé' })).toBeVisible();

  // ── Lancer le quiz ────────────────────────────────────────────────────────────
  await page.getByRole('link', { name: 'Lancer le quiz' }).click();
  await expect(page).toHaveURL(/\/fr\/quiz\/[^/]+$/);

  // ── Répondre correctement à chaque question ───────────────────────────────────
  //
  // Les labels corrects sont fournis par le fixture, dans l'ordre d'affichage
  // (ordinal ASC). On cherche chaque label via getByLabel avec exact:true pour
  // couvrir aussi bien les <input type="radio"> que les futurs boutons Vrai/Faux.
  //
  for (const labelFr of fixture.correctAnswerLabelsFr) {
    const control = page.getByLabel(labelFr, { exact: true });
    // Certains contrôles sont des <input> (radio), d'autres peuvent être des
    // <button> avec role="radio". On tente les deux.
    const tag = await control.evaluate((el) => el.tagName.toLowerCase()).catch(() => null);
    if (tag === 'input') {
      await control.check();
    } else {
      await control.click();
    }
  }

  // ── Soumettre et vérifier le résultat ────────────────────────────────────────
  await page.getByRole('button', { name: 'Corriger et enregistrer' }).click();

  await expect(page).toHaveURL(/\/fr\/quiz\/[^/]+\/resultat\/[^/]+$/);
  await expect(page.getByRole('heading', { name: 'Résultat enregistré' })).toBeVisible();
  await expect(page.getByText('100 %')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Correction' })).toBeVisible();
});
