'use server';

import { AuditEventKind, withUser } from '@eduquiz/db';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireApiUser } from '../auth/server';
import { safeResolveLocale } from '../i18n/locale';

import { getPublishedQuizForScoringByActivityId } from './catalog';
import { computeMastery } from './mastery';
import { scoreSingleAnswerQuiz } from './scoring';

import type { SubmittedQuizAnswer } from './scoring';
import type { RlsRole } from '@eduquiz/db';

const hiddenFieldSchema = z.object({
  activityId: z.string().uuid(),
  locale: z.enum(['fr', 'en']),
  startedAt: z.string().datetime().optional(),
});

export type SubmitQuizErrorCode = 'invalid' | 'notFound' | 'incomplete' | 'unknown';

export type SubmitQuizResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly error: SubmitQuizErrorCode;
      readonly missingQuestionIds?: readonly string[];
    };

export async function submitQuizAttempt(formData: FormData): Promise<SubmitQuizResult> {
  const user = await requireApiUser();
  const rawLocale = formData.get('locale');
  const parsed = hiddenFieldSchema.safeParse({
    activityId: formData.get('activityId'),
    locale: safeResolveLocale(typeof rawLocale === 'string' ? rawLocale : undefined),
    startedAt: formData.get('startedAt') ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: 'invalid' };
  }

  const quiz = await getPublishedQuizForScoringByActivityId(
    parsed.data.activityId,
    parsed.data.locale,
  );
  if (!quiz) {
    return { ok: false, error: 'notFound' };
  }

  const submittedAnswers = new Map<string, SubmittedQuizAnswer>();
  const missingQuestionIds: string[] = [];
  for (const question of quiz.questions) {
    if (question.type === 'ORDERING') {
      const orderedAnswerIds = formData
        .getAll(`ordering:${question.id}`)
        .filter((answerId): answerId is string => typeof answerId === 'string')
        .filter((answerId) => answerId.trim().length > 0);
      if (
        !isExactAnswerIdSet(
          orderedAnswerIds,
          question.answers.map((answer) => answer.id),
        )
      ) {
        missingQuestionIds.push(question.id);
        continue;
      }
      submittedAnswers.set(question.id, { orderedAnswerIds });
      continue;
    }

    if (question.type === 'MATCHING') {
      const leftAnswerIds = question.answers
        .filter((answer) => typeof answer.pairId === 'string' && answer.pairId.length > 0)
        .map((answer) => answer.id);
      const rightAnswerIds = new Set(
        question.answers.flatMap((answer) => (answer.pairId ? [answer.pairId] : [])),
      );
      const matches = question.answers.flatMap((answer) => {
        const rawRightId = formData.get(`matching:${question.id}:${answer.id}`);
        return leftAnswerIds.includes(answer.id) &&
          typeof rawRightId === 'string' &&
          rightAnswerIds.has(rawRightId)
          ? [{ leftId: answer.id, rightId: rawRightId }]
          : [];
      });

      if (matches.length > 0 && matches.length === leftAnswerIds.length) {
        submittedAnswers.set(question.id, { matches });
      } else {
        missingQuestionIds.push(question.id);
      }
      continue;
    }

    if (question.type === 'FILL_IN_THE_BLANK' || question.type === 'SHORT_ANSWER') {
      const rawText = formData.get(`question:${question.id}`);
      if (typeof rawText === 'string' && rawText.trim().length > 0) {
        submittedAnswers.set(question.id, { text: rawText });
      } else {
        missingQuestionIds.push(question.id);
      }
      continue;
    }

    const rawAnswerIds =
      question.type === 'MCQ_MULTI'
        ? formData.getAll(`question:${question.id}`)
        : [formData.get(`question:${question.id}`)];
    const validAnswerIds = new Set(question.answers.map((answer) => answer.id));
    const answerIds = rawAnswerIds.filter(
      (answerId): answerId is string =>
        typeof answerId === 'string' && validAnswerIds.has(answerId),
    );
    if (answerIds.length > 0 && answerIds.length === rawAnswerIds.length) {
      submittedAnswers.set(question.id, answerIds);
    } else {
      missingQuestionIds.push(question.id);
    }
  }
  if (missingQuestionIds.length > 0) {
    return { ok: false, error: 'incomplete', missingQuestionIds };
  }

  const score = scoreSingleAnswerQuiz(quiz.questions, submittedAnswers, quiz.passingScore);
  const submittedAt = new Date();
  const startedAt = parsed.data.startedAt ? new Date(parsed.data.startedAt) : submittedAt;
  const durationMs = Math.max(0, submittedAt.getTime() - startedAt.getTime());

  let attemptId: string;
  try {
    const attempt = await withUser({ userId: user.id, role: user.role as RlsRole }).$transaction(
      async (tx) => {
        const createdAttempt = await tx.attempt.create({
          data: {
            userId: user.id,
            activityId: quiz.id,
            score: score.score,
            rawScore: score.rawScore,
            maxScore: score.maxScore,
            durationMs,
            passed: score.passed,
            startedAt,
            submittedAt,
            metadata: { source: 'web-learning-flow' } as never,
          },
        });

        await tx.attemptAnswer.createMany({
          data: score.answers.map((answer) => ({
            attemptId: createdAttempt.id,
            questionId: answer.questionId,
            response:
              answer.orderedAnswerIds !== undefined
                ? ({ orderedAnswerIds: answer.orderedAnswerIds } as never)
                : answer.matches !== undefined
                  ? ({ matches: answer.matches } as never)
                  : answer.text !== undefined
                    ? ({ text: answer.text } as never)
                    : ({
                        answerId: answer.answerId,
                        answerIds: answer.answerIds,
                      } as never),
            isCorrect: answer.isCorrect,
            pointsEarned: answer.pointsEarned,
            durationMs: 0,
          })),
        });

        const existingProgress = await tx.progress.findMany({
          where: { userId: user.id, skillId: { in: quiz.lesson.skillIds } },
        });
        const existingBySkillId = new Map(
          existingProgress.map((progress) => [progress.skillId, progress]),
        );
        const scoreRatio = score.maxScore > 0 ? score.rawScore / score.maxScore : 0;

        for (const skillId of quiz.lesson.skillIds) {
          const existing = existingBySkillId.get(skillId);
          const attemptsCount = existing ? existing.attemptsCount + 1 : 1;
          const mastery = computeMastery(scoreRatio, existing?.mastery);

          await tx.progress.upsert({
            where: { userId_skillId: { userId: user.id, skillId } },
            update: {
              mastery,
              attemptsCount,
              lastAttemptAt: submittedAt,
            },
            create: {
              userId: user.id,
              skillId,
              mastery,
              attemptsCount,
              lastAttemptAt: submittedAt,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            kind: AuditEventKind.ATTEMPT_SUBMITTED,
            actorId: user.id,
            targetId: createdAttempt.id,
            targetType: 'attempt',
            payload: {
              activityId: quiz.id,
              score: score.score,
              passed: score.passed,
            } as never,
          },
        });

        return createdAttempt;
      },
    );

    attemptId = attempt.id;
  } catch {
    return { ok: false, error: 'unknown' };
  }

  redirect(`/${parsed.data.locale}/quiz/${quiz.id}/resultat/${attemptId}`);
}

function isExactAnswerIdSet(
  submittedAnswerIds: readonly string[],
  validAnswerIds: readonly string[],
): boolean {
  if (submittedAnswerIds.length === 0 || submittedAnswerIds.length !== validAnswerIds.length) {
    return false;
  }

  if (new Set(submittedAnswerIds).size !== submittedAnswerIds.length) return false;

  const validAnswerIdSet = new Set(validAnswerIds);
  return submittedAnswerIds.every((answerId) => validAnswerIdSet.has(answerId));
}
