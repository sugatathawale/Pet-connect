import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, overlay, radius, shadow, spacing } from '@/constants/theme';
import type { PetWithContext } from '@/types';
import { formatAge } from '@/utils/date';
import { formatDistance } from '@/utils/geo';
import { PLACEHOLDER_PHOTO, primaryPhoto } from '@/utils/images';

/**
 * Spotlight card for the highest-scoring pet nearby.
 * Full-bleed photo, soft sheen, glass badge — no emoji clutter.
 */
export function TopMatchCard({
  item,
  onPress,
}: {
  item: PetWithContext;
  onPress: () => void;
}) {
  const { pet, distanceKm, compatibility } = item;

  const sheen = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    sheen.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 2800 }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [sheen, pulse]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sheen.value, [0, 1], [-280, 340]) }],
    opacity: interpolate(sheen.value, [0, 0.2, 0.8, 1], [0, 0.45, 0.45, 0]),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.05]) }],
  }));

  return (
    <Animated.View entering={FadeInDown.springify().damping(16)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Top match: ${pet.name}, ${compatibility.score}% compatible`}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        <Image
          source={{ uri: primaryPhoto(pet.photos) }}
          placeholder={{ uri: PLACEHOLDER_PHOTO }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          recyclingKey={pet.id}
        />

        <Animated.View style={[styles.sheen, sheenStyle]} pointerEvents="none">
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.32)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.topRow}>
          <View style={styles.ribbon}>
            <Ionicons name="sparkles" size={11} color="#FFFFFF" />
            <Text style={styles.ribbonText}>Top match</Text>
          </View>

          <Animated.View style={pulseStyle}>
            <LinearGradient
              colors={['#1EC8C5', '#0E9594']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreBadge}
            >
              <Text style={styles.scoreValue}>{compatibility.score}</Text>
              <Text style={styles.scoreUnit}>%</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(10,40,40,0.55)', overlay.scrimStrong]}
          locations={[0, 0.45, 1]}
          style={styles.scrim}
        >
          <Text style={styles.name} numberOfLines={1}>
            {pet.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {pet.breed} · {formatAge(pet.dateOfBirth)}
          </Text>

          <View style={styles.footer}>
            <View style={styles.metaPill}>
              <Ionicons name="location" size={12} color="#FFFFFF" />
              <Text style={styles.metaPillText}>{formatDistance(distanceKm)}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons
                name={pet.gender === 'male' ? 'male' : 'female'}
                size={12}
                color="#FFFFFF"
              />
              <Text style={styles.metaPillText}>
                {pet.gender === 'male' ? 'Male' : 'Female'}
              </Text>
            </View>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>Open</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.primaryDark} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 248,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    marginBottom: spacing.lg,
    ...shadow.floating,
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.985 }] },
  sheen: { position: 'absolute', top: 0, bottom: 0, width: 110 },
  topRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  ribbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(14,149,148,0.92)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  scoreBadge: {
    minWidth: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 6,
  },
  scoreValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  scoreUnit: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 3,
  },
  scrim: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.lg,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  meta: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  metaPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cta: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
});
