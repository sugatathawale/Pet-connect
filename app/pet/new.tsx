import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Field } from '@/components/ui/Field';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import type { PetGender, PetSpecies, VaccinationStatus } from '@/types';

const SPECIES: { value: PetSpecies; label: string }[] = [
  { value: 'dog', label: '🐕 Dog' },
  { value: 'cat', label: '🐈 Cat' },
  { value: 'other', label: '🐾 Other' },
];

const GENDERS: { value: PetGender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const VACCINATION: { value: VaccinationStatus; label: string }[] = [
  { value: 'vaccinated', label: 'Vaccinated' },
  { value: 'partial', label: 'Partial' },
  { value: 'not_vaccinated', label: 'Not yet' },
];

const DOB_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Create-pet form. */
export default function NewPetScreen() {
  const router = useRouter();
  const { addPet, userLocation, currentOwnerId } = useApp();
  const { pickImages } = useImagePicker();

  const [photos, setPhotos] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<PetGender>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bio, setBio] = useState('');
  const [vaccination, setVaccination] = useState<VaccinationStatus>('vaccinated');
  const [isNeutered, setIsNeutered] = useState(false);
  const [availableForBreeding, setAvailableForBreeding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!name.trim()) next.name = 'Give your pet a name.';
    if (!breed.trim()) next.breed = 'Breed helps owners find a good match.';

    if (!DOB_PATTERN.test(dateOfBirth)) {
      next.dateOfBirth = 'Use the format YYYY-MM-DD.';
    } else {
      const parsed = new Date(dateOfBirth);
      if (Number.isNaN(parsed.getTime())) {
        next.dateOfBirth = 'That date is not valid.';
      } else if (parsed.getTime() > Date.now()) {
        next.dateOfBirth = 'Date of birth cannot be in the future.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await addPet({
        ownerId: currentOwnerId,
        name: name.trim(),
        // A profile without a photo still works; the UI falls back gracefully.
        photos: photos.length > 0 ? photos : [],
        species,
        breed: breed.trim(),
        gender,
        dateOfBirth,
        location: userLocation,
        bio: bio.trim(),
        vaccination,
        isSpayedOrNeutered: isNeutered,
        availableForBreeding,
        availability: {
          enabled: availableForBreeding,
          startDate: null,
          endDate: null,
          // Private by default — the owner opts in to sharing later.
          visibility: 'private',
        },
      });
      router.back();
    } catch (error) {
      Alert.alert('Could not save', 'Something went wrong. Please try again.');
      console.warn('[new pet] save failed', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhotos = async () => {
    const picked = await pickImages(5);
    if (picked.length > 0) setPhotos((prev) => [...prev, ...picked].slice(0, 5));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Photos" subtitle="Add up to 5 photos" />
        <View style={styles.photoRow}>
          {photos.map((uri, index) => (
            <View key={uri} style={styles.photoWrap}>
              <Image source={{ uri }} style={styles.photo} contentFit="cover" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${index + 1}`}
                onPress={() => setPhotos((prev) => prev.filter((p) => p !== uri))}
                style={styles.removePhoto}
              >
                <Ionicons name="close" size={13} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}

          {photos.length < 5 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add photos"
              onPress={handleAddPhotos}
              style={styles.addPhoto}
            >
              <Ionicons name="camera-outline" size={23} color={colors.primary} />
              <Text style={styles.addPhotoText}>Add</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Field
            label="Pet name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Bruno"
            error={errors.name}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Species</Text>
          <View style={styles.chipRow}>
            {SPECIES.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={species === option.value}
                onPress={() => setSpecies(option.value)}
              />
            ))}
          </View>

          <Field
            label="Breed"
            value={breed}
            onChangeText={setBreed}
            placeholder="e.g. Golden Retriever"
            error={errors.breed}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={gender === option.value}
                onPress={() => setGender(option.value)}
              />
            ))}
          </View>

          <Field
            label="Date of birth"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            hint="Age is calculated from this automatically."
            error={errors.dateOfBirth}
            keyboardType="numbers-and-punctuation"
          />

          <Field
            label="Bio / personality"
            value={bio}
            onChangeText={setBio}
            placeholder="Playful, loves long walks, great with kids…"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Text style={styles.label}>Vaccination status</Text>
          <View style={styles.chipRow}>
            {VACCINATION.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={vaccination === option.value}
                onPress={() => setVaccination(option.value)}
              />
            ))}
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Spayed / neutered</Text>
            </View>
            <Switch
              value={isNeutered}
              onValueChange={setIsNeutered}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>Available for breeding</Text>
              <Text style={styles.switchHint}>
                You can set dates and choose who sees them afterwards.
              </Text>
            </View>
            <Switch
              value={availableForBreeding}
              onValueChange={setAvailableForBreeding}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.locationNote}>
            <Ionicons name="location-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.locationText}>
              Location set to {userLocation.label}
            </Text>
          </View>
        </View>

        <Button
          label="Save pet"
          onPress={handleSave}
          loading={saving}
          style={styles.save}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + 20 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  photoWrap: { position: 'relative' },
  photo: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  removePhoto: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhoto: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addPhotoText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  section: { marginTop: spacing.xxl },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  switchText: { flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  switchHint: {
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 2,
    lineHeight: 17,
  },
  locationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  locationText: { fontSize: 13, color: colors.inkMuted },
  save: { marginTop: spacing.xxl },
});
