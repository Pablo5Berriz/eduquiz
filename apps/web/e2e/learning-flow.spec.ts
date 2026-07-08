import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Locator } from '@playwright/test';

import type { E2EQuizFixture } from './global-setup';

const e2eDir = dirname(fileURLToPath(import.meta.url));

// ── Fixture dynamique résolu par global-setup ─────────────────────────────────
//
// global-setup.ts requête la DB et écrit les données dans e2e/.cache/quiz-fixture.json.
// On les lit ici plutôt que de coder en dur un slug ou des labels de réponse.
//
function loadQuizFixture(): E2EQuizFixture {
  const path = resolve(e2eDir, '.cache', 'quiz-fixture.json');
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

test('un apprenant peut suivre le parcours B2C solo MVP complet', async ({ page }) => {
  const fixture = loadQuizFixture();
  const lessonPath = `/fr/apprendre/${fixture.lessonSlug}`;

  // ── Connexion avec redirection vers le catalogue ────────────────────────────
  await page.goto('/fr/connexion?next=%2Ffr%2Fapprendre');

  await page.locator('input[name="email"]').fill(fixture.email);
  await page.locator('input[name="password"]').fill(fixture.password);
  await page.locator('form').evaluate((form) => {
    (form as HTMLFormElement).requestSubmit();
  });

  await expect(page).toHaveURL(/\/fr\/apprendre$/);
  await expect(page.getByText(fixture.levelNameFr, { exact: false }).first()).toBeVisible();
  await expect(page.getByText(fixture.subjectNameFr, { exact: false }).first()).toBeVisible();
  await expect(page.getByText(fixture.lessonTitleFr, { exact: true })).toBeVisible();
  if (fixture.draftLessonTitleFr) {
    await expect(page.getByText(fixture.draftLessonTitleFr, { exact: true })).toHaveCount(0);
  }

  await page
    .getByTestId('learning-lesson')
    .filter({ hasText: fixture.lessonTitleFr })
    .getByRole('link')
    .click();

  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(lessonPath)}$`));
  await expect(page.getByRole('heading', { name: fixture.lessonTitleFr })).toBeVisible();
  await expect(page.getByTestId('lesson-exercise')).toContainText('Exercice guidé');

  // ── Lancer le quiz ────────────────────────────────────────────────────────────
  await page.getByTestId('lesson-start-quiz').click();
  await expect(page).toHaveURL(/\/fr\/quiz\/[^/]+$/);
  await expect(page.getByTestId('quiz-form')).toBeVisible();
  await expect(page.getByText('Bonne réponse', { exact: true })).toHaveCount(0);

  // ── Répondre correctement à chaque question ───────────────────────────────────
  for (const question of fixture.quizQuestions) {
    const questionBlock = page.locator(`[data-question-id="${question.id}"]`);
    await expect(questionBlock).toBeVisible();

    if (question.type === 'FILL_IN_THE_BLANK' || question.type === 'SHORT_ANSWER') {
      await questionBlock.locator('textarea, input[type="text"]').fill(question.textAnswerFr ?? '');
      continue;
    }

    if (question.type === 'MATCHING') {
      for (const pair of question.matchingPairsFr ?? []) {
        await questionBlock.getByLabel(pair.leftLabel, { exact: true }).selectOption({
          label: pair.rightLabel,
        });
      }
      continue;
    }

    if (question.type === 'ORDERING') {
      await orderQuestionByLabels(questionBlock, question.orderingLabelsFr ?? []);
      continue;
    }

    for (const labelFr of question.correctAnswerLabelsFr) {
      await chooseAnswerByLabel(questionBlock, labelFr);
    }
  }

  // ── Soumettre et vérifier le résultat ────────────────────────────────────────
  await page.getByTestId('quiz-submit').click();

  await expect(page).toHaveURL(/\/fr\/quiz\/[^/]+\/resultat\/[^/]+$/);
  await expect(page.getByTestId('quiz-result')).toContainText('Résultat enregistré');
  await expect(page.getByTestId('quiz-result')).toContainText('100 %');
  await expect(page.getByRole('heading', { name: 'Correction' })).toBeVisible();
  await expect(page.getByTestId('quiz-result-correction')).toContainText('Bonne réponse');
  await expect(page.getByTestId('quiz-result-correction')).toContainText('Pourquoi ?');

  // ── Reprise et progression ──────────────────────────────────────────────────
  await page.getByRole('link', { name: 'Reprendre la leçon' }).click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(lessonPath)}$`));
  await expect(page.getByTestId('lesson-attempt-history')).toContainText('100 %');

  await page.goto('/fr/accueil');
  await expect(page.getByTestId('learning-progress')).toContainText('Progression par compétence');
  await expect(page.getByTestId('recent-attempts')).toContainText(fixture.lessonTitleFr);
  await expect(page.getByTestId('recent-attempts')).toContainText('100 %');

  await page.goto('/fr/apprendre');
  await expect(
    page.getByTestId('learning-lesson').filter({ hasText: fixture.lessonTitleFr }),
  ).toContainText('100 %');
});

async function chooseAnswerByLabel(questionBlock: Locator, label: string): Promise<void> {
  const control = questionBlock.getByLabel(label, { exact: true });
  const tag = await control.evaluate((element) => element.tagName.toLowerCase()).catch(() => null);

  if (tag === 'input') {
    await control.check();
    return;
  }

  await control.click();
}

async function orderQuestionByLabels(
  questionBlock: Locator,
  expectedLabels: readonly string[],
): Promise<void> {
  for (let targetIndex = 0; targetIndex < expectedLabels.length; targetIndex += 1) {
    const expectedLabel = expectedLabels[targetIndex];
    if (!expectedLabel) continue;

    for (;;) {
      const items = questionBlock.getByTestId('quiz-ordering-item');
      const labels = await getOrderingLabels(items);
      const currentIndex = labels.indexOf(expectedLabel);
      if (currentIndex === -1) {
        throw new Error(`[E2E] Réponse ORDERING introuvable: ${expectedLabel}`);
      }
      if (currentIndex <= targetIndex) break;

      await items.nth(currentIndex).getByTestId('quiz-ordering-move-up').click();
    }
  }
}

async function getOrderingLabels(items: Locator): Promise<string[]> {
  return items.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('data-answer-label') ?? ''),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
