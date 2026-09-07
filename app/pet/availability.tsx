import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { AvailabilityVisibility } from '@/types';
import { formatDateRange } from '@/utils/date';
import { VISIBILITY_HINTS, VISIBILITY_LABELS } from '@/utils/privacy';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const VISIBILITY_OPTIONS: AvailabilityVisibility[] = [
  'private',
  'matches_only',
  'nearby_owners',
];

/**
 * Availability / heat-status editor.
 *
 * The visibility picker is the centrepiece: an owner decides exactly who can see
 * these dates, and the default stays private.
 */
export default function AvailabilityScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const { petById, updatePet } = useApp();

  const pet = petId ? petById(petId) : undefined;

  const [enabled, setEnabled] = useState(pet?.availability.enabled ?? false);
  const [startDate, setStartDate] = useState(pet?.availability.startDate ?? '');
  const [endDate, setEndDate] = useState(pet?.availability.endDate ?? '');
  const [visibility, setVisibility] = useState<AvailabilityVisibility>(
    pet?.availability.visibility ?? 'private',
  );
  const [notes, setNotes] = useState(pet?.availability.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!pet) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>That pet could not be found.</Text>
      </View>
    );
  }

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    // Dates only matter while availability is on.
    if (enabled) {
      if (!DATE_PATTERN.test(startDate)) next.startDate = 'Use the format YYYY-MM-DD.';
      if (!DATE_PATTERN.test(endDate)) next.endDate = 'Use the format YYYY-MM-DD.';

      if (!next.startDate && !next.endDate && endDate < startDate) {
        next.endDate = 'The end date must be on or after the start date.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    await updatePet(pet.id, {
      availableForBreeding: enabled,
      availability: {
        enabled,
        startDate: enabled ? startDate : null,
        endDate: enabled ? endDate : null,
        visibility,
        notes: notes.trim() || undefined,
      },
    });
    setSaving(false);
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.notice}>
        <Ionicons name="shield-checkmark-outline" size={19} color={colors.accent} />
        <Text style={styles.noticeText}>
          Reproductive details stay private unless you choose to share them. You can
          change this at any time.
        </Text>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchLabel}>Breeding availability</Text>
          <Text style={styles.switchHint}>
            Turn this on to let compatible owners know {pet.name} is available.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor="#FFFFFF"
        />
      </View>

      {enabled && (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Availability period"
              subtitle={
                DATE_PATTERN.test(startDate) && DATE_PATTERN.test(endDate)
                  ? formatDateRange(startDate, endDate)
                  : 'Set the dates this window is open'
              }
            />
            <Field
              label="Start date"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-09-10"
              error={errors.startDate}
              keyboardType="numbers-and-punctuation"
            />
            <Field
              label="End date"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2026-09-15"
              error={errors.endDate}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Who can see this?"
              subtitle="You control exactly who sees these dates"
            />

            {VISIBILITY_OPTIONS.map((option) => {
              const selected = visibility === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setVisibility(option)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={21}
                    color={selected ? colors.primary : colors.inkFaint}
                  />
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{VISIBILITY_LABELS[option]}</Text>
                    <Text style={styles.optionHint}>{VISIBILITY_HINTS[option]}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.section}>
            <Field
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Prefer meeting at a park first…"
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
          </View>

          <View style={styles.reminder}>
            <Ionicons name="alarm-outline" size={17} color={colors.inkMuted} />
            <Text style={styles.reminderText}>
              We'll remind you the day before this window opens.
            </Text>
          </View>
        </>
      )}

      <Button label="Save" onPress={handleSave} loading={saving} style={styles.save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + 20 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontSize: 14, color: colors.inkMuted },
  notice: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  noticeText: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 19 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  switchText: { flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  switchHint: {
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 2,
    lineHeight: 17,
  },
  section: { marginTop: spacing.xxl },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm + 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: { borderColor: colors.primary },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  optionHint: { fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  textArea: { minHeight: 84, textAlignVertical: 'top' },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  reminderText: { flex: 1, fontSize: 12, color: colors.inkMuted },
  save: { marginTop: spacing.xxl },
});
