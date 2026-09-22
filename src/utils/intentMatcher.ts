/**
 * Client-side intent scraping — mirrors backend/ai_assistant/agent/intent.py
 * so offline answers stay aligned with the Agno service.
 */

import {
  KNOWLEDGE_ENTRIES,
  SCOPE_REFUSAL,
  type KnowledgeDomain,
  type KnowledgeEntry,
} from '@/data/knowledge/entries';

export type AssistantIntent =
  | 'greeting'
  | 'farewell'
  | 'thanks'
  | 'help'
  | 'app_faq'
  | 'dog_breed'
  | 'cat_breed'
  | 'out_of_scope'
  | 'unknown';

export interface IntentMatch {
  intent: AssistantIntent;
  confidence: number;
  domain: KnowledgeDomain | 'none';
  cleanedQuery: string;
  matchedTerms: string[];
}

const OUT_OF_SCOPE =
  /\b(stock|crypto|bitcoin|nft|politics|election|hack|exploit|malware|phishing|bomb|weapon|prescribe|dosage|homework|exam cheat|weather in|sports score|python script|javascript)\b/i;

const TYPOS: Record<string, string> = {
  helo: 'hello',
  hallo: 'hello',
  hii: 'hi',
  hiii: 'hi',
  thanx: 'thanks',
  thnx: 'thanks',
  doggo: 'dog',
  kitty: 'cat',
  kittie: 'cat',
  labradorr: 'labrador',
  retriver: 'retriever',
  shepard: 'shepherd',
  sheperd: 'shepherd',
};

export function normalizeQuery(text: string): string {
  let cleaned = text.toLowerCase().trim().replace(/’/g, "'");
  cleaned = cleaned.replace(/[^\w\s'#./+-]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned
    .split(' ')
    .map((tok) => TYPOS[tok] ?? tok)
    .join(' ');
}

function domainFor(intent: AssistantIntent): KnowledgeDomain | 'none' {
  switch (intent) {
    case 'greeting':
    case 'farewell':
    case 'thanks':
    case 'help':
      return 'greetings';
    case 'app_faq':
    case 'unknown':
      return 'general_faq';
    case 'dog_breed':
      return 'dogs';
    case 'cat_breed':
      return 'cats';
    case 'out_of_scope':
      return 'none';
  }
}

const INTENT_PHRASES: { intent: AssistantIntent; phrases: string[] }[] = [
  {
    intent: 'greeting',
    phrases: [
      'good morning',
      'good afternoon',
      'good evening',
      'namaste',
      'hello',
      'hey',
      'hi',
      'yo',
      'how are you',
      "how's it going",
    ],
  },
  { intent: 'farewell', phrases: ['goodbye', 'good bye', 'see you', 'talk later', 'bye'] },
  { intent: 'thanks', phrases: ['thank you', 'thanks', 'thx', 'appreciate'] },
  {
    intent: 'help',
    phrases: ['what can you do', 'how can you help', 'what do you know', 'help me', 'help'],
  },
  {
    intent: 'app_faq',
    phrases: [
      'pet connect',
      'compatibility',
      'matching',
      'mutual interest',
      'breeding availability',
      'availability',
      'swipe',
      'discover',
      'nearby',
      'listing',
      'adopt',
      'sell',
      'chat',
      'notification',
      'filter',
      'vaccination',
      'spayed',
      'neutered',
      'location',
      'privacy',
      'profile',
      'support',
      'how does',
      'how do i',
      'what is',
    ],
  },
  {
    intent: 'dog_breed',
    phrases: [
      'labrador',
      'golden retriever',
      'german shepherd',
      'beagle',
      'pug',
      'indie dog',
      'pariah',
      'desi dog',
      'pomeranian',
      'husky',
      'bulldog',
      'rottweiler',
      'shih tzu',
      'dachshund',
      'boxer',
      'cocker spaniel',
      'doberman',
      'dog breed',
      'dogs',
      'puppy',
      'dog',
    ],
  },
  {
    intent: 'cat_breed',
    phrases: [
      'persian',
      'siamese',
      'maine coon',
      'british shorthair',
      'indie cat',
      'desi cat',
      'bengal',
      'ragdoll',
      'sphynx',
      'scottish fold',
      'american shorthair',
      'cat breed',
      'kitten',
      'cats',
      'cat',
    ],
  },
];

export function scrapeIntent(raw: string): IntentMatch {
  const cleanedQuery = normalizeQuery(raw);

  if (!cleanedQuery) {
    return {
      intent: 'unknown',
      confidence: 0,
      domain: 'general_faq',
      cleanedQuery,
      matchedTerms: [],
    };
  }

  if (OUT_OF_SCOPE.test(cleanedQuery)) {
    return {
      intent: 'out_of_scope',
      confidence: 0.95,
      domain: 'none',
      cleanedQuery,
      matchedTerms: ['out_of_scope'],
    };
  }

  let best: AssistantIntent | null = null;
  let bestScore = 0;
  let matchedTerms: string[] = [];

  for (const { intent, phrases } of INTENT_PHRASES) {
    const hits = phrases.filter((p) => cleanedQuery.includes(p));
    if (hits.length === 0) continue;
    const score = hits.reduce((sum, h) => sum + h.length, 0) + 0.15 * hits.length;
    if (score > bestScore) {
      bestScore = score;
      best = intent;
      matchedTerms = hits;
    }
  }

  if (!best) {
    if (/\b(pet|breed|owner|match|animal)\b/.test(cleanedQuery)) {
      return {
        intent: 'app_faq',
        confidence: 0.4,
        domain: 'general_faq',
        cleanedQuery,
        matchedTerms: ['pet'],
      };
    }
    return {
      intent: 'unknown',
      confidence: 0.2,
      domain: 'general_faq',
      cleanedQuery,
      matchedTerms: [],
    };
  }

  return {
    intent: best,
    confidence: Math.min(0.99, 0.35 + bestScore / 40),
    domain: domainFor(best),
    cleanedQuery,
    matchedTerms,
  };
}

function scoreEntry(entry: KnowledgeEntry, query: string): number {
  const triggers = entry.triggers.split('|');
  let score = 0;
  for (const t of triggers) {
    if (!t) continue;
    if (query.includes(t)) score += t.length + 2;
    else {
      // Token overlap for partial typing
      const parts = t.split(' ');
      const overlap = parts.filter((p) => p.length > 2 && query.includes(p)).length;
      if (overlap) score += overlap * 1.5;
    }
  }
  return score;
}

export function answerFromLocalKb(raw: string): {
  reply: string;
  blocked: boolean;
  intent: AssistantIntent;
  domain: KnowledgeDomain | 'none';
  confidence: number;
  matchedTerms: string[];
  entryId: string | null;
  source: 'local' | 'guardrail';
} {
  const intent = scrapeIntent(raw);

  if (intent.intent === 'out_of_scope') {
    return {
      reply: SCOPE_REFUSAL,
      blocked: true,
      intent: intent.intent,
      domain: intent.domain,
      confidence: intent.confidence,
      matchedTerms: intent.matchedTerms,
      entryId: null,
      source: 'guardrail',
    };
  }

  const pool =
    intent.domain === 'none'
      ? KNOWLEDGE_ENTRIES
      : KNOWLEDGE_ENTRIES.filter(
          (e) => e.domain === intent.domain || e.domain === 'greetings',
        );

  let bestEntry: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of pool) {
    const s = scoreEntry(entry, intent.cleanedQuery);
    if (s > bestScore) {
      bestScore = s;
      bestEntry = entry;
    }
  }

  // Global fallback search if domain pool missed
  if (!bestEntry || bestScore < 3) {
    for (const entry of KNOWLEDGE_ENTRIES) {
      const s = scoreEntry(entry, intent.cleanedQuery);
      if (s > bestScore) {
        bestScore = s;
        bestEntry = entry;
      }
    }
  }

  if (!bestEntry || bestScore < 2) {
    return {
      reply:
        "I'm not sure about that yet. Try asking about a dog or cat breed, how matching works, listings, or breeding availability — or open Support from the menu.",
      blocked: false,
      intent: intent.intent,
      domain: intent.domain,
      confidence: intent.confidence,
      matchedTerms: intent.matchedTerms,
      entryId: null,
      source: 'local',
    };
  }

  return {
    reply: bestEntry.answer,
    blocked: false,
    intent: intent.intent,
    domain: intent.domain,
    confidence: intent.confidence,
    matchedTerms: intent.matchedTerms,
    entryId: bestEntry.id,
    source: 'local',
  };
}
