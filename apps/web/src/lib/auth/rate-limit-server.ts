import 'server-only';

import { createHash } from 'node:crypto';

import { clientIpFrom, withRateLimit } from '@eduquiz/rate-limit';
import { headers } from 'next/headers';

import { logger } from '../logger';
import { type CheckRateLimitInput, RateLimits } from './rate-limit';

export interface CheckRateLimitResult {
  readonly allowed: boolean;
  readonly bypassed: boolean;
  readonly keyHash: string;
}

export interface ServerCheckRateLimitInput extends CheckRateLimitInput {
  readonly failClosedOnBypass?: boolean;
}

const CRITICAL_BUCKETS = new Set<keyof typeof RateLimits>([
  'signin',
  'register',
  'forgotPassword',
  'accountDeletion',
  'redeemParentCode',
]);

export function hashRateLimitKey(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 12);
}

/** Récupère l'IP cliente depuis les headers de la requête courante. */
export function currentClientIp(): string {
  return clientIpFrom(headers());
}

export function currentRequestId(): string | undefined {
  const hdrs = headers();
  return hdrs.get('x-request-id') ?? hdrs.get('x-vercel-id') ?? undefined;
}

export function logRateLimitBypass(input: {
  readonly bucket: keyof typeof RateLimits;
  readonly keyHash: string;
  readonly reqId?: string;
}): void {
  logger.warn('rate_limit.bypassed', {
    bucket: input.bucket,
    keyHash: input.keyHash,
    ...(input.reqId ? { reqId: input.reqId } : {}),
  });
}

function logUnexpectedRedisBypass(input: {
  readonly bucket: keyof typeof RateLimits;
  readonly keyHash: string;
  readonly reqId?: string;
}): void {
  logger.warn('rate_limit.redis_bypass_unexpected', {
    bucket: input.bucket,
    keyHash: input.keyHash,
    ...(input.reqId ? { reqId: input.reqId } : {}),
  });
}

function shouldFailClosedOnBypass(input: ServerCheckRateLimitInput): boolean {
  return input.failClosedOnBypass ?? CRITICAL_BUCKETS.has(input.bucket);
}

export async function checkRateLimit(input: ServerCheckRateLimitInput): Promise<CheckRateLimitResult> {
  const config = RateLimits[input.bucket];
  const keyHash = hashRateLimitKey(input.key);
  const result = await withRateLimit({
    bucket: input.bucket,
    key: input.key,
    limit: config.limit,
    windowMs: config.windowMs,
  });

  if (result.bypassed) {
    const reqId = currentRequestId();
    const fields = {
      bucket: input.bucket,
      keyHash,
      ...(reqId ? { reqId } : {}),
    };

    if (process.env.REDIS_URL && shouldFailClosedOnBypass(input)) {
      logUnexpectedRedisBypass(fields);
      return { allowed: false, bypassed: true, keyHash };
    }

    logRateLimitBypass(fields);
  }

  return { allowed: result.allowed, bypassed: result.bypassed, keyHash };
}
