import { Image } from 'expo-image';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors, radius, spacing } from '@/constants/theme';
import type { Pet } from '@/types';
import { primaryPhoto } from '@/utils/images';

interface MatchCelebrationProps {
  visible: boolean;
  myPet: Pet | null;
  theirPet: Pet | null;
  onChat: () => void;
  onKeepBrowsing: () => void;
}

/** "🎉 Pet Connect!" overlay shown the moment interest becomes mutual. */
export function MatchCelebration({
  visible,
  myPet,
  theirPet,
  onChat,
  onKeepBrowsing,
}: MatchCelebrationProps) {
  if (!myPet || !theirPet) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeepBrowsing}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Pet Connect!</Text>
          <Text style={styles.subtitle}>
            {theirPet.name} & {myPet.name} matched.
          </Text>

          <View style={styles.photos}>
            <Image source={{ uri: primaryPhoto(myPet.photos) }} style={styles.photo} contentFit="cover" />
            <View style={styles.heartBubble}>
              <Text style={styles.heart}>❤️</Text>
            </View>
            <Image
              source={{ uri: primaryPhoto(theirPet.photos) }}
              style={styles.photo}
              contentFit="cover"
            />
          </View>

          <Text style={styles.hint}>
            You can now chat with {theirPet.name}'s owner.
          </Text>

          <Button label="Say hello" onPress={onChat} style={styles.primaryAction} />
          <Button label="Keep browsing" variant="ghost" onPress={onKeepBrowsing} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,21,35,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emoji: { fontSize: 40 },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.ink,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.inkMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  photos: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.surfaceAlt,
  },
  heartBubble: {
    marginHorizontal: -14,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: { fontSize: 19 },
  hint: {
    fontSize: 13,
    color: colors.inkFaint,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  primaryAction: { alignSelf: 'stretch', marginBottom: spacing.sm },
});
