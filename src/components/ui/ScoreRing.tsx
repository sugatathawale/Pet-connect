import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/theme';
import { compatibilityBand } from '@/utils/compatibility';

const BAND_COLORS = {
  high: colors.success,
  medium: colors.warning,
  low: colors.inkFaint,
} as const;

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'lg';
}

/** Compact "92% Compatible" chip used on cards and detail headers. */
export function ScoreRing({ score, size = 'sm' }: ScoreRingProps) {
  const tint = BAND_COLORS[compatibilityBand(score)];
  const isLarge = size === 'lg';

  return (
    <View
      accessibilityLabel={`${score} percent compatible`}
      style={[
        styles.chip,
        isLarge && styles.chipLarge,
        { backgroundColor: tint },
      ]}
    >
      <Text style={[styles.score, isLarge && styles.scoreLarge]}>{score}%</Text>
      {isLarge && <Text style={styles.caption}>Compatible</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  chipLarge: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  score: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  scoreLarge: { fontSize: 17 },
  caption: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', opacity: 0.95 },
});
