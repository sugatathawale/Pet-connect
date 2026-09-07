import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { colors, radius, spacing } from '@/constants/theme';
import type { Pet } from '@/types';
import { formatDateRange, isWithinWindow } from '@/utils/date';
import { VISIBILITY_LABELS } from '@/utils/privacy';

interface AvailabilityCardProps {
  pet: Pet;
  /** Result of `canViewAvailability` — the caller owns that decision. */
  canView: boolean;
  isOwner: boolean;
}

/**
 * Breeding availability panel.
 *
 * When `canView` is false this renders a privacy notice instead of the dates, so
 * reproductive details never leak to a viewer who was not granted access.
 */
export function AvailabilityCard({ pet, canView, isOwner }: AvailabilityCardProps) {
  const { availability } = pet;

  if (!canView) {
    return (
      <View style={[styles.card, styles.privateCard]}>
        <Ionicons name="lock-closed-outline" size={18} color={colors.inkMuted} />
        <Text style={styles.privateText}>
          This owner keeps availability details private.
        </Text>
      </View>
    );
  }

  const isActiveNow = isWithinWindow(availability.startDate, availability.endDate);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Breeding availability</Text>
          <Text style={styles.range}>
            {formatDateRange(availability.startDate, availability.endDate)}
          </Text>
        </View>
        <Badge
          label={isActiveNow ? 'Available now' : 'Scheduled'}
          tone={isActiveNow ? 'success' : 'neutral'}
        />
      </View>

      {availability.notes ? <Text style={styles.notes}>{availability.notes}</Text> : null}

      {isOwner && (
        <View style={styles.visibilityRow}>
          <Ionicons name="eye-outline" size={14} color={colors.inkFaint} />
          <Text style={styles.visibility}>
            Visible to: {VISIBILITY_LABELS[availability.visibility]}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  privateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  privateText: { flex: 1, fontSize: 13, color: colors.inkMuted, lineHeight: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  range: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 2 },
  notes: { fontSize: 13, color: colors.inkMuted, lineHeight: 19 },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  visibility: { fontSize: 12, color: colors.inkFaint, fontWeight: '500' },
});
