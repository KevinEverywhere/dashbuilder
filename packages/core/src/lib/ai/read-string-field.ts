/** Safely read a trimmed non-empty string from model output. */
export function readAiStringField(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if ('id' in record) {
      return readAiStringField(record['id']);
    }
    if ('name' in record) {
      return readAiStringField(record['name']);
    }
  }

  return null;
}
