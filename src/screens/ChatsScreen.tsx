import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { formatRelativeTime } from '@/utils/date';
import { primaryPhoto } from '@/utils/images';

/** Conversation list — one row per match. */
export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matches, myPets, petById, ownerById } = useApp();

  const rows = useMemo(() => {
    const myPetIds = new Set(myPets.map((p) => p.id));

    return matches
      .map((match) => {
        const theirPetId = match.petIds.find((id) => !myPetIds.has(id));
        const theirPet = theirPetId ? petById(theirPetId) : undefined;
        const owner = theirPet ? ownerById(theirPet.ownerId) : undefined;
        return { match, theirPet, owner };
      })
      .filter((row) => row.theirPet && row.owner)
      .sort((a, b) =>
        (b.match.lastMessageAt ?? b.match.createdAt).localeCompare(
          a.match.lastMessageAt ?? a.match.createdAt,
        ),
      );
  }, [matches, myPets, petById, ownerById]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>
          {rows.length} {rows.length === 1 ? 'connection' : 'connections'}
        </Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => row.match.id}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/chat/${item.match.id}`)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Image
              source={{ uri: primaryPhoto(item.theirPet!.photos) }}
              style={styles.photo}
              contentFit="cover"
            />

            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.theirPet!.name}
                </Text>
                <Text style={styles.time}>
                  {formatRelativeTime(item.match.lastMessageAt ?? item.match.createdAt)}
                </Text>
              </View>

              <Text style={styles.owner} numberOfLines={1}>
                {item.owner!.name} · {item.theirPet!.breed}
              </Text>

              <Text style={styles.preview} numberOfLines={1}>
                {item.match.lastMessagePreview ?? 'You matched! Say hello 👋'}
              </Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No connections yet"
            message="When you and another owner are both interested, a chat opens up here."
            actionLabel="Start matching"
            onAction={() => router.push('/discover')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  title: { fontSize: 25, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  pressed: { opacity: 0.9 },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
  },
  rowBody: { flex: 1, justifyContent: 'center' },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },
  time: { fontSize: 11, color: colors.inkFaint },
  owner: { fontSize: 12, color: colors.inkMuted, marginTop: 1 },
  preview: { fontSize: 13, color: colors.inkFaint, marginTop: 3 },
});
