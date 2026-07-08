interface ValidatableQuestion {
  readonly id: string;
  readonly type: string;
  readonly promptFr: string;
  readonly promptEn: string;
  readonly answers: readonly {
    readonly id: string;
    readonly labelFr: string;
    readonly labelEn: string;
    readonly isCorrect: boolean;
    readonly pairValueFr?: string | null;
    readonly pairValueEn?: string | null;
  }[];
}

export function validateQuestionForPublishing(question: ValidatableQuestion): readonly string[] {
  const issues: string[] = [];
  const promptFr = question.promptFr.trim();
  const promptEn = question.promptEn.trim();
  const answers = question.answers;
  const correctAnswers = answers.filter((answer) => answer.isCorrect);

  if (!promptFr && !promptEn) issues.push('La question doit avoir un énoncé.');

  if (question.type === 'MCQ_SINGLE') {
    if (answers.length < 2)
      issues.push('Une question à choix unique doit avoir au moins deux réponses.');
    if (correctAnswers.length !== 1) {
      issues.push('Une question à choix unique doit avoir exactement une bonne réponse.');
    }
  } else if (question.type === 'MCQ_MULTI') {
    if (answers.length < 2)
      issues.push('Une question à choix multiples doit avoir au moins deux réponses.');
    if (correctAnswers.length < 1) {
      issues.push('Une question à choix multiples doit avoir au moins une bonne réponse.');
    }
  } else if (question.type === 'TRUE_FALSE') {
    if (answers.length !== 2)
      issues.push('Une question vrai/faux doit avoir exactement deux options.');
    if (correctAnswers.length !== 1)
      issues.push('Une question vrai/faux doit avoir exactement une bonne réponse.');
  } else if (question.type === 'MATCHING') {
    const completePairs = answers.filter(
      (answer) =>
        answer.isCorrect &&
        ((answer.pairValueFr ?? '').trim().length > 0 ||
          (answer.pairValueEn ?? '').trim().length > 0),
    );
    if (completePairs.length < 1)
      issues.push('Une question d’association doit avoir au moins une paire complète.');
  } else if (question.type === 'ORDERING') {
    if (answers.length < 2)
      issues.push('Une question de mise en ordre doit avoir au moins deux éléments.');
    if (correctAnswers.length !== answers.length) {
      issues.push('Tous les éléments de mise en ordre doivent être marqués comme attendus.');
    }
  } else if (question.type === 'SHORT_ANSWER' || question.type === 'FILL_IN_THE_BLANK') {
    if (correctAnswers.length < 1)
      issues.push('Une question texte doit avoir au moins une réponse attendue.');
  } else {
    issues.push('Type de question invalide.');
  }

  return issues;
}
