import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { Message } from '@/types';
import { formatClockTime } from '@/utils/date';

export function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
        {message.kind === 'text' && (
          <Text style={[styles.text, isMine && styles.textMine]}>{message.body}</Text>
        )}

        {message.kind === 'image' && (
          <Image source={{ uri: message.body }} style={styles.image} contentFit="cover" />
        )}

        {message.kind === 'location' && (
          <View style={styles.locationRow}>
            <Ionicons
              name="location"
              size={16}
              color={isMine ? '#FFFFFF' : colors.primary}
            />
            <Text style={[styles.text, isMine && styles.textMine]}>
              Approximate location shared
            </Text>
          </View>
        )}

        <Text style={[styles.time, isMine && styles.timeMine]}>
          {formatClockTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.sm + 2 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
  },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  theirs: { backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: radius.sm },
  text: { fontSize: 15, color: colors.ink, lineHeight: 20 },
  textMine: { color: '#FFFFFF' },
  image: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
    marginBottom: 4,
    backgroundColor: colors.border,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: {
    fontSize: 10,
    color: colors.inkFaint,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  timeMine: { color: 'rgba(255,255,255,0.8)' },
});
