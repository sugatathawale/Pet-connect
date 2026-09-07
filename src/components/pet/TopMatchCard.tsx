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
import { primaryPhoto } from '@/utils/images';
import { speciesEmoji } from './PetMetaRow';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Spotlight card for the highest-scoring pet nearby.
 *
 * The sheen sweep and score pulse are decorative but deliberately slow and
 * non-looping-on-content, so the card feels alive without pulling attention off
 * the feed below it.
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
    // A slow sweep across the photo, with a long pause between passes.
    sheen.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 2600 }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [sheen, pulse]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sheen.value, [0, 1], [-260, 320]) }],
    opacity: interpolate(sheen.value, [0, 0.25, 0.75, 1], [0, 0.5, 0.5, 0]),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.07]) }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Top match: ${pet.name}, ${compatibility.score}% compatible`}
      onPress={onPress}
      entering={FadeInDown.springify().damping(16)}
      style={({ pressed }: { pressed: boolean }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: primaryPhoto(pet.photos) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={220}
      />

      {/* Moving highlight — purely decorative. */}
      <Animated.View style={[styles.sheen, sheenStyle]} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.28)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.ribbon}>
        <Ionicons name="sparkles" size={11} color="#FFFFFF" />
        <Text style={styles.ribbonText}>TOP MATCH TODAY</Text>
      </View>

      <Animated.View style={[styles.scorePill, pulseStyle]}>
        <Text style={styles.scoreValue}>{compatibility.score}%</Text>
      </Animated.View>

      <LinearGradient
        colors={['transparent', overlay.scrimSoft, overlay.scrimStrong]}
        style={styles.scrim}
      >
        <Text style={styles.name}>
          {speciesEmoji(pet.species)} {pet.name}
        </Text>
        <Text style={styles.meta}>
          {pet.breed} · {formatAge(pet.dateOfBirth)}
        </Text>

        <View style={styles.footer}>
          <Ionicons name="location" size={12} color="rgba(255,255,255,0.9)" />
          <Text style={styles.footerText}>{formatDistance(distanceKm)}</Text>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>View</Text>
            <Ionicons name="arrow-forward" size={11} color={colors.primaryDark} />
          </View>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 190,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.lg,
    ...shadow.floating,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  sheen: { position: 'absolute', top: 0, bottom: 0, width: 130 },
  ribbon: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  ribbonText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  scorePill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  scoreValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  scrim: {
    marginTop: 'auto',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md + 2,
  },
  name: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  meta: { color: 'rgba(255,255,255,0.92)', fontSize: 12.5, fontWeight: '500', marginTop: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  footerText: { color: 'rgba(255,255,255,0.9)', fontSize: 11.5, fontWeight: '600' },
  cta: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  ctaText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
});
