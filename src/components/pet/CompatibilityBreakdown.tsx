import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { CompatibilityResult } from '@/types';
import { compatibilityBand } from '@/utils/compatibility';

const BAND_COLORS = {
  high: colors.success,
  medium: colors.warning,
  low: colors.inkFaint,
} as const;

/**
 * Explains the Pet Connect Score factor by factor.
 *
 * Showing the reasoning keeps the score trustworthy instead of magical.
 */
export function CompatibilityBreakdown({ result }: { result: CompatibilityResult }) {
  return (
    <View style={styles.container}>
      {result.factors.map((factor) => {
        const percent = Math.round(factor.score * 100);
        const tint = BAND_COLORS[compatibilityBand(percent)];

        return (
          <View key={factor.label} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{factor.label}</Text>
              <Text style={styles.detail} numberOfLines={1}>
                {factor.detail}
              </Text>
            </View>

            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${percent}%`, backgroundColor: tint }]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.ink },
  detail: { fontSize: 12, color: colors.inkFaint, flexShrink: 1 },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
