import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import type { Listing } from '@/types';
import { formatAge } from '@/utils/date';
import { primaryPhoto } from '@/utils/images';

export function formatPrice(listing: Listing): string {
  if (listing.kind === 'adopt' || listing.price === null) return 'Free to adopt';
  return `₹${listing.price.toLocaleString('en-IN')}`;
}

export function ListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={listing.title}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: primaryPhoto(listing.photos) }}
        style={styles.photo}
        contentFit="cover"
        transition={180}
      />

      <View style={styles.body}>
        <Badge
          label={listing.kind === 'adopt' ? 'Adopt' : 'For sale'}
          tone={listing.kind === 'adopt' ? 'success' : 'brand'}
        />

        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <Text style={styles.meta} numberOfLines={1}>
          {listing.breed} · {formatAge(listing.dateOfBirth)}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(listing)}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.inkFaint} />
            <Text style={styles.location} numberOfLines={1}>
              {listing.location.label}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.card,
  },
  pressed: { opacity: 0.92 },
  photo: { width: '100%', height: 170, backgroundColor: colors.surfaceAlt },
  body: { padding: spacing.lg, gap: 6 },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink, lineHeight: 21 },
  meta: { fontSize: 13, color: colors.inkMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  price: { fontSize: 15, fontWeight: '800', color: colors.primary },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
  },
  location: { fontSize: 12, color: colors.inkFaint, flexShrink: 1 },
});
