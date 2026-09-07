import { COMPATIBILITY_WEIGHTS } from '@/constants/config';
import type { CompatibilityFactor, CompatibilityResult, Pet } from '@/types';
import { ageInYears } from './date';

/**
 * Pet Connect Score.
 *
 * Combines five simple, explainable factors into a 0-100 number. Every factor
 * returns a 0..1 score plus a human-readable reason, so the UI can always show
 * *why* a pair scored the way it did rather than presenting a black box.
 */
export function calculateCompatibility(
  viewer: Pet | null,
  candidate: Pet,
  distanceKm: number,
): CompatibilityResult {
  // Without a pet of their own, the user still deserves a meaningful signal, so
  // score the candidate on its own merits (health, proximity, breeding readiness).
  if (!viewer) {
    return scoreWithoutViewer(candidate, distanceKm);
  }

  const factors: CompatibilityFactor[] = [
    scoreBreed(viewer, candidate),
    scoreAge(viewer, candidate),
    scoreGender(viewer, candidate),
    scoreDistance(distanceKm),
    scoreHealth(candidate),
  ];

  return { score: weightedScore(factors), factors };
}

function weightedScore(factors: CompatibilityFactor[]): number {
  const total = factors.reduce((sum, f) => sum + f.weight, 0);
  if (total === 0) return 0;
  const weighted = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return Math.round((weighted / total) * 100);
}

function scoreBreed(viewer: Pet, candidate: Pet): CompatibilityFactor {
  const base = { label: 'Breed', weight: COMPATIBILITY_WEIGHTS.breed };

  if (viewer.species !== candidate.species) {
    return { ...base, score: 0, detail: 'Different species' };
  }
  if (viewer.breed.toLowerCase() === candidate.breed.toLowerCase()) {
    return { ...base, score: 1, detail: `Both ${candidate.breed}` };
  }
  return { ...base, score: 0.55, detail: `${viewer.breed} · ${candidate.breed}` };
}

function scoreAge(viewer: Pet, candidate: Pet): CompatibilityFactor {
  const base = { label: 'Age', weight: COMPATIBILITY_WEIGHTS.age };
  const gap = Math.abs(ageInYears(viewer.dateOfBirth) - ageInYears(candidate.dateOfBirth));

  // A gap of 4+ years scores zero; anything closer scales linearly.
  const score = Math.max(0, 1 - gap / 4);
  const rounded = gap < 1 ? 'Similar age' : `${gap.toFixed(1)} year gap`;
  return { ...base, score, detail: rounded };
}

function scoreGender(viewer: Pet, candidate: Pet): CompatibilityFactor {
  const base = { label: 'Gender', weight: COMPATIBILITY_WEIGHTS.gender };

  if (viewer.gender !== candidate.gender) {
    return { ...base, score: 1, detail: 'Complementary pair' };
  }
  return { ...base, score: 0.15, detail: 'Same gender' };
}

function scoreDistance(distanceKm: number): CompatibilityFactor {
  const base = { label: 'Distance', weight: COMPATIBILITY_WEIGHTS.distance };
  // Full marks under 2 km, tapering to zero at 30 km.
  const score = distanceKm <= 2 ? 1 : Math.max(0, 1 - (distanceKm - 2) / 28);
  return { ...base, score, detail: `${distanceKm.toFixed(1)} km apart` };
}

function scoreHealth(candidate: Pet): CompatibilityFactor {
  const base = { label: 'Health', weight: COMPATIBILITY_WEIGHTS.health };

  if (candidate.vaccination === 'vaccinated') {
    return { ...base, score: 1, detail: 'Fully vaccinated' };
  }
  if (candidate.vaccination === 'partial') {
    return { ...base, score: 0.5, detail: 'Partially vaccinated' };
  }
  return { ...base, score: 0.1, detail: 'Not vaccinated' };
}

function scoreWithoutViewer(candidate: Pet, distanceKm: number): CompatibilityResult {
  const factors: CompatibilityFactor[] = [
    scoreDistance(distanceKm),
    scoreHealth(candidate),
    {
      label: 'Availability',
      weight: 0.2,
      score: candidate.availableForBreeding ? 1 : 0.4,
      detail: candidate.availableForBreeding ? 'Open to matches' : 'Not seeking matches',
    },
  ];
  return { score: weightedScore(factors), factors };
}

/** Colour band for a score, so the UI reads consistently everywhere. */
export function compatibilityBand(score: number): 'high' | 'medium' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}
