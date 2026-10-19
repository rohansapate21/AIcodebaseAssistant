// Lightweight structured logger that redacts sensitive API key patterns.
// Redacts strings matching: sk-, AIza, ghp_ to prevent accidental key leakage.

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const SENSITIVE_PATTERNS = [/sk-[A-Za-z0-9]+/g, /AIza[A-Za-z0-9_-]+/g, /ghp_[A-Za-z0-9]+/g];

function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    let result = value;
    for (const pattern of SENSITIVE_PATTERNS) {
      result = result.replace(pattern, '[REDACTED]');
    }
    return result;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, redact(v)])
    );
  }
  return value;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: redact(meta) } : {}),
  };
  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
};
