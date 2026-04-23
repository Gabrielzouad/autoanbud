const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}

export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'CONFLICT';

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(message: string, code: ErrorCode = 'NOT_FOUND') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}
