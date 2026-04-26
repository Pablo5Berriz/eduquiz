/**
 * Logger structuré minimaliste — wrapper `console` qui sérialise en
 * JSON sur une ligne (jsonl). Pas de dépendance externe en V1 ; on
 * intègrera `pino` + transport si le volume le justifie en V2.
 *
 * Format :
 *   {"ts":"2026-04-26T12:34:56.789Z","level":"info","msg":"...",
 *    "reqId":"...","userId":"...", ...meta}
 *
 * Niveau via `LOG_LEVEL` env (`debug`/`info`/`warn`/`error`). Défaut
 * `info` en dev, `warn` en prod.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(): Level {
  const raw = (process.env.LOG_LEVEL ?? '').toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw;
  return process.env.NODE_ENV === 'production' ? 'warn' : 'info';
}

const minLevel = LEVEL_ORDER[resolveLevel()];

interface BaseFields {
  readonly reqId?: string;
  readonly userId?: string;
}

function emit(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  if (LEVEL_ORDER[level] < minLevel) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  };
  // stdout pour info/debug, stderr pour warn/error — pratique pour
  // séparer les flux côté Docker/observability.
  const target = level === 'warn' || level === 'error' ? console.error : console.log;
  // eslint-disable-next-line no-console
  target(JSON.stringify(record));
}

/**
 * API publique : `logger.info('user.signed_in', { userId, reqId })`.
 * Tout champ supplémentaire est ajouté tel quel dans la ligne JSON.
 * Préférer des verbes d'action en `domain.event` plutôt que des
 * phrases — facilite le grep et l'agrégation.
 */
export const logger = {
  debug(msg: string, fields: BaseFields & Record<string, unknown> = {}): void {
    emit('debug', msg, fields);
  },
  info(msg: string, fields: BaseFields & Record<string, unknown> = {}): void {
    emit('info', msg, fields);
  },
  warn(msg: string, fields: BaseFields & Record<string, unknown> = {}): void {
    emit('warn', msg, fields);
  },
  error(msg: string, fields: BaseFields & Record<string, unknown> = {}): void {
    emit('error', msg, fields);
  },
};

/**
 * Crée un sous-logger qui injecte automatiquement des champs (reqId,
 * userId, route, ...). Pratique dans les Server Actions et les Route
 * Handlers pour ne pas répéter ces champs à chaque appel.
 */
export function childLogger(base: Record<string, unknown>): typeof logger {
  return {
    debug(msg, fields = {}) {
      logger.debug(msg, { ...base, ...fields });
    },
    info(msg, fields = {}) {
      logger.info(msg, { ...base, ...fields });
    },
    warn(msg, fields = {}) {
      logger.warn(msg, { ...base, ...fields });
    },
    error(msg, fields = {}) {
      logger.error(msg, { ...base, ...fields });
    },
  };
}
