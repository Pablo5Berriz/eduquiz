import { NextResponse } from 'next/server';

/**
 * API route `POST /api/contact` — stub V1.
 *
 * Point d'entrée du formulaire de contact. À ce stade (Phase 1.2), on
 * valide la payload et on journalise. Le branchement à un MTA
 * (Mailgun / SMTP interne via la file BullMQ) arrivera en Phase 2 avec
 * le reste du flux courriel transactionnel.
 */

interface ContactPayload {
  readonly name: string;
  readonly email: string;
  readonly topic: string;
  readonly message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_TOPICS = new Set(['general', 'support', 'billing', 'privacy', 'other']);

function isContactPayload(value: unknown): value is ContactPayload {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === 'string' &&
    typeof record.email === 'string' &&
    typeof record.topic === 'string' &&
    typeof record.message === 'string'
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!isContactPayload(body)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const { name, email, topic, message } = body;

  if (!name.trim() || !email.trim() || !message.trim()) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  if (!ALLOWED_TOPICS.has(topic)) {
    return NextResponse.json({ error: 'invalid_topic' }, { status: 400 });
  }

  if (message.trim().length < 10) {
    return NextResponse.json({ error: 'message_too_short' }, { status: 400 });
  }

  // eslint-disable-next-line no-console
  console.info('[contact] nouvelle demande reçue', {
    name: name.trim(),
    email: email.trim(),
    topic,
    length: message.trim().length,
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
