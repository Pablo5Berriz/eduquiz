export type LessonContentBlock =
  | {
      readonly type: 'paragraph';
      readonly text: string;
    }
  | {
      readonly type: 'list';
      readonly items: readonly string[];
    }
  | {
      readonly type: 'example';
      readonly title: string;
      readonly text: string;
    }
  | {
      readonly type: 'callout';
      readonly title: string;
      readonly text: string;
    };

export interface LessonContent {
  readonly blocks: readonly LessonContentBlock[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function parseBlock(value: unknown): LessonContentBlock | null {
  if (!isRecord(value)) return null;
  const type = value.type;

  if (type === 'paragraph') {
    const text = nonEmptyString(value.text);
    return text ? { type, text } : null;
  }

  if (type === 'list') {
    if (!Array.isArray(value.items)) return null;
    const items = value.items.flatMap((item) => {
      const text = nonEmptyString(item);
      return text ? [text] : [];
    });
    return items.length > 0 ? { type, items } : null;
  }

  if (type === 'example' || type === 'callout') {
    const title = nonEmptyString(value.title);
    const text = nonEmptyString(value.text);
    return title && text ? { type, title, text } : null;
  }

  return null;
}

export function parseLessonContent(value: unknown): LessonContent {
  if (!isRecord(value) || !Array.isArray(value.blocks)) {
    return { blocks: [] };
  }

  return {
    blocks: value.blocks.flatMap((block) => {
      const parsed = parseBlock(block);
      return parsed ? [parsed] : [];
    }),
  };
}
