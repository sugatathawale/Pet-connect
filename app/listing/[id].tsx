import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPrice } from '@/components/listing/ListingCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { notificationService } from '@/services/notificationService';
import { formatAge, formatRelativeTime } from '@/utils/date';
import { distanceBetween, formatDistance } from '@/utils/geo';
import { primaryPhoto } from '@/utils/images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listings, ownerById, userLocation, currentOwnerId, removeListing } = useApp();

  const listing = listings.find((l) => l.id === id);
  const owner = listing ? ownerById(listing.ownerId) : undefined;

  if (!listing || !owner) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>This listing is no longer available.</Text>
      </View>
    );
  }

  const distanceKm = distanceBetween(userLocation, listing.location);
  const isMine = listing.ownerId === currentOwnerId;
  const gallery = listing.photos.length > 0 ? listing.photos : [primaryPhoto([])];

  const handleRespond = async () => {
    await notificationService.push(
      'listing_response',
      'Response sent',
      `${owner.name} has been notified about "${listing.title}".`,
      `/listing/${listing.id}`,
    );
    Alert.alert(
      'Enquiry sent',
      `${owner.name} will get in touch about ${listing.kind === 'adopt' ? 'the adoption' : 'the sale'}.`,
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete listing', 'Remove this listing permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeListing(listing.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {gallery.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.photo} contentFit="cover" />
          ))}
        </ScrollView>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Badge
              label={listing.kind === 'adopt' ? 'Adopt' : 'For sale'}
              tone={listing.kind === 'adopt' ? 'success' : 'brand'}
            />
            <Text style={styles.posted}>{formatRelativeTime(listing.createdAt)} ago</Text>
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatPrice(listing)}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location" size={14} color={colors.primary} />
            <Text style={styles.metaText}>
              {formatDistance(distanceKm)} · {listing.location.label}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Stat label="Breed" value={listing.breed} />
            <Stat label="Age" value={formatAge(listing.dateOfBirth)} />
            <Stat label="Gender" value={listing.gender === 'male' ? 'Male' : 'Female'} />
          </View>

          <View style={styles.badgeRow}>
            {listing.vaccination === 'vaccinated' && (
              <Badge label="✅ Vaccinated" tone="success" />
            )}
            {listing.vaccination === 'partial' && (
              <Badge label="Partly vaccinated" tone="warning" />
            )}
            {listing.vaccination === 'not_vaccinated' && (
              <Badge label="Not vaccinated" tone="danger" />
            )}
          </View>

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>

          <Text style={styles.sectionLabel}>Posted by</Text>
          <View style={styles.ownerCard}>
            <Avatar uri={owner.avatar} name={owner.name} size={46} />
            <View style={styles.ownerText}>
              <View style={styles.ownerNameRow}>
                <Text style={styles.ownerName}>{owner.name}</Text>
                {owner.isVerified && <Badge label="⭐ Verified" tone="brand" />}
              </View>
              <Text style={styles.ownerCity}>{owner.city}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {isMine ? (
          <Button
            label="Delete listing"
            variant="danger"
            onPress={handleDelete}
            style={styles.action}
          />
        ) : (
          <Button
            label={listing.kind === 'adopt' ? 'Enquire about adoption' : 'Contact seller'}
            onPress={handleRespond}
            style={styles.action}
          />
        )}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  missing: { fontSize: 14, color: colors.inkMuted, textAlign: 'center' },
  scroll: { paddingBottom: spacing.xxl },
  photo: { width: SCREEN_WIDTH, height: 300, backgroundColor: colors.surfaceAlt },
  body: { padding: spacing.lg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  posted: { fontSize: 12, color: colors.inkFaint },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, lineHeight: 28 },
  price: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
  },
  metaText: { fontSize: 13, color: colors.inkMuted },
  statRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: { fontSize: 14, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 11, color: colors.inkFaint, marginTop: 2 },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMuted,
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
  },
  description: { fontSize: 15, color: colors.ink, lineHeight: 23 },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  ownerText: { flex: 1, gap: 2 },
  ownerNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ownerName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  ownerCity: { fontSize: 12, color: colors.inkMuted },
  actionBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  action: { width: '100%' },
});
