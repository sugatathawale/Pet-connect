import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { DEFAULT_FILTERS, DISTANCE_OPTIONS } from '@/constants/config';
import { colors, radius, spacing } from '@/constants/theme';
import type { PetFilters, PetSpecies } from '@/types';

interface FilterSheetProps {
  visible: boolean;
  filters: PetFilters;
  breeds: string[];
  onApply: (filters: PetFilters) => void;
  onClose: () => void;
}

const SPECIES: { value: PetSpecies | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'dog', label: '🐕 Dogs' },
  { value: 'cat', label: '🐈 Cats' },
  { value: 'other', label: '🐾 Other' },
];

const GENDERS: { value: PetFilters['gender']; label: string }[] = [
  { value: 'all', label: 'Any' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const AGE_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'Any age', min: 0, max: 15 },
  { label: 'Under 1', min: 0, max: 1 },
  { label: '1–3 yrs', min: 1, max: 3 },
  { label: '3–7 yrs', min: 3, max: 7 },
  { label: '7+ yrs', min: 7, max: 25 },
];

/** Bottom-sheet filter editor. Edits a local draft so Cancel truly cancels. */
export function FilterSheet({
  visible,
  filters,
  breeds,
  onApply,
  onClose,
}: FilterSheetProps) {
  const [draft, setDraft] = useState<PetFilters>(filters);

  // Re-sync the draft each time the sheet opens.
  React.useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const patch = (next: Partial<PetFilters>) => setDraft((prev) => ({ ...prev, ...next }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.heading}>Filters</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={23} color={colors.inkMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Distance</Text>
            <View style={styles.chipRow}>
              {DISTANCE_OPTIONS.map((km) => (
                <Chip
                  key={km}
                  label={`${km} km`}
                  selected={draft.maxDistanceKm === km}
                  onPress={() => patch({ maxDistanceKm: km })}
                />
              ))}
            </View>

            <Text style={styles.label}>Species</Text>
            <View style={styles.chipRow}>
              {SPECIES.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={draft.species === option.value}
                  onPress={() => patch({ species: option.value })}
                />
              ))}
            </View>

            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={draft.gender === option.value}
                  onPress={() => patch({ gender: option.value })}
                />
              ))}
            </View>

            <Text style={styles.label}>Age</Text>
            <View style={styles.chipRow}>
              {AGE_RANGES.map((range) => (
                <Chip
                  key={range.label}
                  label={range.label}
                  selected={
                    draft.minAgeYears === range.min && draft.maxAgeYears === range.max
                  }
                  onPress={() => patch({ minAgeYears: range.min, maxAgeYears: range.max })}
                />
              ))}
            </View>

            <Text style={styles.label}>Breed</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Any"
                selected={draft.breed === null}
                onPress={() => patch({ breed: null })}
              />
              {breeds.map((breed) => (
                <Chip
                  key={breed}
                  label={breed}
                  selected={draft.breed === breed}
                  onPress={() => patch({ breed })}
                />
              ))}
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchText}>
                <Text style={styles.switchLabel}>Available for breeding</Text>
                <Text style={styles.switchHint}>Only show pets open to matches</Text>
              </View>
              <Switch
                value={draft.availableForBreedingOnly}
                onValueChange={(value) => patch({ availableForBreedingOnly: value })}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label="Reset"
              variant="secondary"
              onPress={() => setDraft(DEFAULT_FILTERS)}
              style={styles.footerButton}
            />
            <Button
              label="Show results"
              onPress={() => onApply(draft)}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(26,21,35,0.45)' },
  dismissArea: { flex: 1 },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  heading: { fontSize: 20, fontWeight: '700', color: colors.ink },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  switchText: { flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  switchHint: { fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  footerButton: { flex: 1 },
});
