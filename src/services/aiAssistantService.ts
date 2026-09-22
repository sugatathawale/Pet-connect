import Constants from 'expo-constants';

import { answerFromLocalKb } from '@/utils/intentMatcher';

export interface AssistantReply {
  reply: string;
  blocked: boolean;
  intent: string;
  domain: string;
  confidence: number;
  matchedTerms: string[];
  source: 'agno' | 'local' | 'guardrail' | 'config' | 'error';
}

function apiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_AI_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  // Expo Go on a device: try hostUri from the bundler.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { debuggerHost?: string }).debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8787`;
    }
  }

  return 'http://localhost:8787';
}

/**
 * Ask the Agno backend when available; otherwise answer from the local KB.
 */
export const aiAssistantService = {
  async ask(message: string, userId?: string): Promise<AssistantReply> {
    const trimmed = message.trim();
    if (!trimmed) {
      return {
        reply: 'Please type a question about Pet Connect or pet breeds.',
        blocked: false,
        intent: 'unknown',
        domain: 'general_faq',
        confidence: 0,
        matchedTerms: [],
        source: 'local',
      };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${apiBaseUrl()}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, user_id: userId ?? null }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as AssistantReply;
      // If the API is up but has no OpenAI key, prefer richer local KB answers.
      if (data.source === 'config') {
        const local = answerFromLocalKb(trimmed);
        return { ...local, source: local.source };
      }
      return {
        reply: data.reply,
        blocked: Boolean(data.blocked),
        intent: data.intent,
        domain: data.domain,
        confidence: data.confidence ?? 0,
        matchedTerms: data.matchedTerms ?? [],
        source: data.source ?? 'agno',
      };
    } catch {
      const local = answerFromLocalKb(trimmed);
      return { ...local, source: local.source };
    }
  },
};
