import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
}

/** Circular avatar that degrades to an initial when no image exists. */
export function Avatar({ uri, name, size = 44 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (!uri) {
    return (
      <View style={[styles.fallback, dimension]}>
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, dimension]}
      contentFit="cover"
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceAlt },
  fallback: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: colors.primaryDark, fontWeight: '700' },
});
