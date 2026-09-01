import type { AiBuilderAction, AiBuilderResponse } from './types';
import { normalizeAiBuilderActions } from './normalize-actions';

export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return trimmed;
}

export function parseAiBuilderResponse(raw: string): AiBuilderResponse {
  const jsonText = extractJsonObject(raw);
  const parsed = JSON.parse(jsonText) as Partial<AiBuilderResponse>;

  if (!parsed || typeof parsed.summary !== 'string' || !Array.isArray(parsed.actions)) {
    throw new Error('AI response must include summary and actions array.');
  }

  return {
    summary: parsed.summary,
    actions: normalizeAiBuilderActions(parsed.actions),
    followUp: typeof parsed.followUp === 'string' ? parsed.followUp : undefined,
  };
}
