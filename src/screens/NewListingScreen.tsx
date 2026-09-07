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
import type { ListingKind, PetGender, PetSpecies, VaccinationStatus } from '@/types';

const KINDS: { value: ListingKind; label: string }[] = [
  { value: 'adopt', label: '❤️ For adoption' },
  { value: 'sell', label: '💰 For sale' },
];

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

export default function NewListingScreen() {
  const router = useRouter();
  const { addListing, userLocation, currentOwnerId, myPets } = useApp();
  const { pickImages } = useImagePicker();

  const [kind, setKind] = useState<ListingKind>('adopt');
  const [photos, setPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<PetGender>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [vaccination, setVaccination] = useState<VaccinationStatus>('vaccinated');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!title.trim()) next.title = 'Add a short, clear title.';
    if (!breed.trim()) next.breed = 'Breed helps people find this listing.';
    if (!description.trim()) next.description = 'Describe the pet and any requirements.';

    if (!DOB_PATTERN.test(dateOfBirth)) {
      next.dateOfBirth = 'Use the format YYYY-MM-DD.';
    } else if (new Date(dateOfBirth).getTime() > Date.now()) {
      next.dateOfBirth = 'Date of birth cannot be in the future.';
    }

    // Price is required for sales only, and must be a positive number.
    if (kind === 'sell') {
      const parsed = Number(price);
      if (!price.trim() || Number.isNaN(parsed) || parsed <= 0) {
        next.price = 'Enter a valid price in rupees.';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await addListing({
        ownerId: currentOwnerId,
        kind,
        title: title.trim(),
        photos,
        species,
        breed: breed.trim(),
        gender,
        dateOfBirth,
        location: userLocation,
        price: kind === 'sell' ? Number(price) : null,
        description: description.trim(),
        vaccination,
      });
      router.back();
    } catch (error) {
      Alert.alert('Could not save', 'Something went wrong. Please try again.');
      console.warn('[new listing] save failed', error);
    } finally {
      setSaving(false);
    }
  };

  const prefillFromPet = (petId: string) => {
    const pet = myPets.find((p) => p.id === petId);
    if (!pet) return;

    setTitle(`${pet.name} · ${pet.breed}`);
    setSpecies(pet.species);
    setBreed(pet.breed);
    setGender(pet.gender);
    setDateOfBirth(pet.dateOfBirth);
    setVaccination(pet.vaccination);
    setDescription(pet.bio);
    setPhotos(pet.photos);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Listing type</Text>
        <View style={styles.chipRow}>
          {KINDS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={kind === option.value}
              onPress={() => setKind(option.value)}
            />
          ))}
        </View>

        {myPets.length > 0 && (
          <View style={styles.prefill}>
            <Text style={styles.prefillLabel}>Prefill from one of your pets</Text>
            <View style={styles.chipRow}>
              {myPets.map((pet) => (
                <Chip key={pet.id} label={pet.name} onPress={() => prefillFromPet(pet.id)} />
              ))}
            </View>
          </View>
        )}

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
              onPress={async () => {
                const picked = await pickImages(5);
                if (picked.length > 0) {
                  setPhotos((prev) => [...prev, ...picked].slice(0, 5));
                }
              }}
              style={styles.addPhoto}
            >
              <Ionicons name="camera-outline" size={23} color={colors.primary} />
              <Text style={styles.addPhotoText}>Add</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Field
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Three rescue kittens looking for homes"
            error={errors.title}
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
            placeholder="e.g. Indian Shorthair"
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
            error={errors.dateOfBirth}
            keyboardType="numbers-and-punctuation"
          />

          {kind === 'sell' && (
            <Field
              label="Price (₹)"
              value={price}
              onChangeText={setPrice}
              placeholder="25000"
              error={errors.price}
              keyboardType="number-pad"
            />
          )}

          <Field
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Temperament, health, and any adoption requirements…"
            error={errors.description}
            multiline
            numberOfLines={5}
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

          <View style={styles.locationNote}>
            <Ionicons name="location-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.locationText}>Location set to {userLocation.label}</Text>
          </View>
        </View>

        <Button
          label="Publish listing"
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
  prefill: { marginBottom: spacing.md },
  prefillLabel: {
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
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
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  locationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  locationText: { fontSize: 13, color: colors.inkMuted },
  save: { marginTop: spacing.xxl },
});
