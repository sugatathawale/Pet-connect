import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ScoreRing } from '@/components/ui/ScoreRing';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import type { InterestDecision, PetWithContext } from '@/types';
import { formatAge } from '@/utils/date';
import { formatDistance } from '@/utils/geo';
import { speciesEmoji } from './PetMetaRow';
import { primaryPhoto } from '@/utils/images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;

interface SwipeDeckProps {
  items: PetWithContext[];
  onDecide: (petId: string, decision: InterestDecision) => void;
  onOpenPet: (petId: string) => void;
}

/**
 * Tinder-style deck for the matching flow.
 *
 * Only the top two cards render — the deck stays cheap no matter how many pets
 * are nearby. Gestures run on the UI thread via Reanimated so dragging never
 * stutters behind JS work.
 */
export function SwipeDeck({ items, onDecide, onOpenPet }: SwipeDeckProps) {
  const [top, next] = items;

  if (!top) return null;

  return (
    <View style={styles.deck}>
      {next && (
        <View style={[styles.cardWrap, styles.behind]} pointerEvents="none">
          <CardFace item={next} />
        </View>
      )}

      <TopCard
        key={top.pet.id}
        item={top}
        onDecide={onDecide}
        onOpenPet={onOpenPet}
      />
    </View>
  );
}

function TopCard({
  item,
  onDecide,
  onOpenPet,
}: {
  item: PetWithContext;
  onDecide: (petId: string, decision: InterestDecision) => void;
  onOpenPet: (petId: string) => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const commit = useCallback(
    (decision: InterestDecision) => {
      onDecide(item.pet.id, decision);
    },
    [item.pet.id, onDecide],
  );

  const flyOut = useCallback(
    (direction: 1 | -1) => {
      translateX.value = withTiming(direction * SCREEN_WIDTH * 1.4, { duration: 220 }, () => {
        runOnJS(commit)(direction === 1 ? 'interested' : 'skipped');
      });
    },
    [commit, translateX],
  );

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
    })
    .onEnd((event) => {
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      if (shouldSwipe) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(
          direction * SCREEN_WIDTH * 1.4,
          { duration: 220 },
          () => {
            runOnJS(commit)(direction === 1 ? 'interested' : 'skipped');
          },
        );
        return;
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const tap = Gesture.Tap().onEnd((_event, success) => {
    if (success) runOnJS(onOpenPet)(item.pet.id);
  });

  const gesture = Gesture.Exclusive(pan, tap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-10, 10])}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));

  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
  }));

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardWrap, cardStyle]}>
          <CardFace item={item} />

          <Animated.View style={[styles.stamp, styles.likeStamp, likeStyle]}>
            <Text style={styles.likeText}>INTERESTED</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.skipStamp, skipStyle]}>
            <Text style={styles.skipText}>SKIP</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <View style={styles.actions}>
        <ActionButton
          icon="close"
          tint={colors.danger}
          label="Skip"
          onPress={() => flyOut(-1)}
        />
        <ActionButton
          icon="heart"
          tint={colors.primary}
          label="Interested"
          onPress={() => flyOut(1)}
          large
        />
      </View>
    </>
  );
}

function ActionButton({
  icon,
  tint,
  label,
  onPress,
  large,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  onPress: () => void;
  large?: boolean;
}) {
  const size = large ? 68 : 58;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { width: size, height: size, borderRadius: size / 2, borderColor: tint },
        pressed && styles.actionPressed,
      ]}
    >
      <Ionicons name={icon} size={large ? 30 : 25} color={tint} />
    </Pressable>
  );
}

function CardFace({ item }: { item: PetWithContext }) {
  const { pet, distanceKm, compatibility } = item;

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: primaryPhoto(pet.photos) }}
        style={styles.photo}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.scoreFloat}>
        <ScoreRing score={compatibility.score} size="lg" />
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(26,21,35,0.35)', 'rgba(26,21,35,0.92)']}
        style={styles.scrim}
      >
        <Text style={styles.name}>
          {speciesEmoji(pet.species)} {pet.name}
        </Text>
        <Text style={styles.meta}>
          {pet.breed} · {pet.gender === 'male' ? 'Male' : 'Female'} ·{' '}
          {formatAge(pet.dateOfBirth)}
        </Text>

        <View style={styles.footerRow}>
          <Ionicons name="location" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.footerText}>{formatDistance(distanceKm)}</Text>
          {pet.vaccination === 'vaccinated' && (
            <>
              <Text style={styles.footerText}>·</Text>
              <Text style={styles.footerText}>✅ Vaccinated</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: { flex: 1 },
  cardWrap: { flex: 1 },
  behind: {
    ...StyleSheet.absoluteFill,
    transform: [{ scale: 0.95 }],
    opacity: 0.55,
  },
  card: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    ...shadow.floating,
  },
  photo: { ...StyleSheet.absoluteFill },
  scoreFloat: { position: 'absolute', top: spacing.lg, right: spacing.lg },
  scrim: {
    marginTop: 'auto',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + 20,
    paddingBottom: spacing.xl,
  },
  name: { color: '#FFFFFF', fontSize: 27, fontWeight: '800' },
  meta: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
  },
  footerText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' },
  stamp: {
    position: 'absolute',
    top: spacing.xxl + 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 3,
  },
  likeStamp: {
    left: spacing.xl,
    borderColor: colors.primary,
    transform: [{ rotate: '-14deg' }],
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  skipStamp: {
    right: spacing.xl,
    borderColor: colors.danger,
    transform: [{ rotate: '14deg' }],
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  likeText: { color: colors.primary, fontSize: 19, fontWeight: '900' },
  skipText: { color: colors.danger, fontSize: 19, fontWeight: '900' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    paddingTop: spacing.xl,
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  actionPressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
});
