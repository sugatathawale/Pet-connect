import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/listing/ListingCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import type { ListingKind } from '@/types';

type Tab = 'all' | ListingKind;

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'adopt', label: 'Adopt' },
  { value: 'sell', label: 'For sale' },
];

/** Adopt / sell marketplace. Adoption is first-class from day one. */
export default function ListingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { listings } = useApp();
  const [tab, setTab] = useState<Tab>('all');

  const visible = useMemo(
    () => (tab === 'all' ? listings : listings.filter((l) => l.kind === tab)),
    [listings, tab],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Adopt & sell</Text>
          <Text style={styles.subtitle}>Find a pet a home, or a home a pet</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create listing"
          onPress={() => router.push('/listing/new')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={23} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={tab === option.value}
            onPress={() => setTab(option.value)}
          />
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="home-outline"
            title="No listings yet"
            message="Be the first to post a pet for adoption or sale in your area."
            actionLabel="Create a listing"
            onAction={() => router.push('/listing/new')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  title: { fontSize: 25, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
});
