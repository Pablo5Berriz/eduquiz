import { describe, expect, it } from 'vitest';

import { parseLessonContent } from './content';

describe('parseLessonContent', () => {
  it('conserve seulement les blocs supportés et valides', () => {
    const content = parseLessonContent({
      blocks: [
        { type: 'paragraph', text: 'Comparer des parts de même taille.' },
        { type: 'list', items: ['Trouver un dénominateur commun.', '', 42] },
        { type: 'example', title: 'Exemple', text: '5/8 = 25/40.' },
        { type: 'unknown', text: 'ignoré' },
        { type: 'callout', title: '', text: 'ignoré' },
      ],
    });

    expect(content.blocks).toEqual([
      { type: 'paragraph', text: 'Comparer des parts de même taille.' },
      { type: 'list', items: ['Trouver un dénominateur commun.'] },
      { type: 'example', title: 'Exemple', text: '5/8 = 25/40.' },
    ]);
  });

  it('retourne une leçon vide si la structure JSON est invalide', () => {
    expect(parseLessonContent({})).toEqual({ blocks: [] });
    expect(parseLessonContent(null)).toEqual({ blocks: [] });
  });
});
