import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Heart, Home, MessageCircle, PawPrint, User } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BAR_HEIGHT = 62;
const CORNER_RADIUS = 4;

/**
 * Notch geometry.
 *
 * The cradle must fit inside one tab: with 5 tabs on a ~390px screen a tab is
 * ~78px, so a 58px half-width (116px total) would overflow into its neighbours
 * and force the edge tabs to clamp inward. 38 keeps it contained.
 */
const NOTCH_HALF_WIDTH = 38;
const NOTCH_DEPTH = 30;

const CIRCLE_INNER = 54;
const RING = 4;
const CIRCLE_TOTAL = CIRCLE_INNER + RING * 2;
/** How far the circle pokes above the bar's top edge. */
const CIRCLE_LIFT = 30;

const GLOW_RADIUS = 62;

const ICONS = {
  index: PawPrint,
  discover: Heart,
  listings: Home,
  chats: MessageCircle,
  profile: User,
} as const;

const LABELS: Record<string, string> = {
  index: 'Nearby',
  discover: 'Match',
  listings: 'Adopt',
  chats: 'Chats',
  profile: 'Profile',
};

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

/**
 * Builds the bar outline with a notch cradling the active tab.
 *
 * A worklet so the path can be rebuilt on the UI thread as `centerX` springs
 * between tabs — the notch slides rather than jumping.
 */
function buildNavPath(centerX: number): string {
  'worklet';
  const w = SCREEN_WIDTH;
  const h = BAR_HEIGHT;
  const r = CORNER_RADIUS;
  const half = NOTCH_HALF_WIDTH;
  const depth = NOTCH_DEPTH;

  // Keep the whole cradle on-screen. The circle is wider than the notch, so
  // clamp against it — otherwise the raised button hangs off the edge.
  const edge = r + half;
  const min = edge;
  const max = w - edge;
  const cx = centerX < min ? min : centerX > max ? max : centerX;

  const x1 = cx - half;
  const x2 = cx + half;

  return [
    `M ${r} 0`,
    `L ${x1} 0`,
    // Ease down into the cradle.
    `C ${cx - half * 0.5} 0, ${cx - half * 0.62} ${depth * 0.38}, ${cx - half * 0.34} ${depth * 0.38}`,
    // Around the circle.
    `C ${cx - half * 0.2} ${depth * 0.92}, ${cx - half * 0.08} ${depth}, ${cx} ${depth}`,
    `C ${cx + half * 0.08} ${depth}, ${cx + half * 0.2} ${depth * 0.92}, ${cx + half * 0.34} ${depth * 0.38}`,
    // Ease back up to the top edge.
    `C ${cx + half * 0.62} ${depth * 0.38}, ${cx + half * 0.5} 0, ${x2} 0`,
    `L ${w - r} 0`,
    `Q ${w} 0 ${w} ${r}`,
    `L ${w} ${h}`,
    `L 0 ${h}`,
    `L 0 ${r}`,
    `Q 0 0 ${r} 0`,
    'Z',
  ].join(' ');
}

/** Quick pulse on the tab being deselected. */
function BounceableTab({
  routeKey,
  bouncing,
  children,
}: {
  routeKey: string;
  bouncing: SharedValue<string | null>;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  useAnimatedReaction(
    () => bouncing.value,
    (current) => {
      if (current === routeKey) {
        scale.value = withSequence(
          withTiming(0.82, { duration: 110 }),
          withSpring(1, { damping: 6, stiffness: 260, mass: 0.5 }),
        );
        bouncing.value = null;
      }
    },
  );

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

/**
 * Floating tab bar with a notch that follows the active tab.
 *
 * The notch path, glow halo, and raised circle all read from one shared
 * `centerX`, so they stay locked together while it springs.
 */
export function BottomNavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const tabWidth = SCREEN_WIDTH / state.routes.length;
  const centerFor = (index: number) => tabWidth * index + tabWidth / 2;
  const target = centerFor(state.index);

  const centerX = useSharedValue(target);
  const bouncing = useSharedValue<string | null>(null);
  const previousKey = useRef(state.routes[state.index]?.key);

  useEffect(() => {
    centerX.value = withSpring(target, { damping: 18, stiffness: 180, mass: 0.7 });

    const currentKey = state.routes[state.index]?.key;
    if (previousKey.current && previousKey.current !== currentKey) {
      bouncing.value = previousKey.current;
    }
    previousKey.current = currentKey;
  }, [target, state.index, state.routes, centerX, bouncing]);

  const pathProps = useAnimatedProps(() => ({ d: buildNavPath(centerX.value) }));
  const glowProps = useAnimatedProps(() => ({ cx: centerX.value }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: centerX.value - CIRCLE_TOTAL / 2 }],
  }));

  const bottomInset = Math.max(insets.bottom, 8);
  const ActiveIcon = ICONS[state.routes[state.index]?.name as keyof typeof ICONS] ?? PawPrint;

  return (
    <View
      style={[styles.wrapper, { height: BAR_HEIGHT + bottomInset + CIRCLE_LIFT }]}
      pointerEvents="box-none"
    >
      {/* Fills the safe area below the bar so no gap shows on gesture devices. */}
      <View style={[styles.safeFill, { height: bottomInset }]} pointerEvents="none" />

      <View
        style={[styles.svgLayer, { bottom: bottomInset - 1, height: BAR_HEIGHT + GLOW_RADIUS }]}
        pointerEvents="none"
      >
        <Svg width={SCREEN_WIDTH} height={BAR_HEIGHT + GLOW_RADIUS}>
          <Defs>
            <RadialGradient id="navGlow" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="0.26" />
              <Stop offset="0.5" stopColor={colors.primary} stopOpacity="0.09" />
              <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          <AnimatedSvgCircle
            animatedProps={glowProps}
            cy={GLOW_RADIUS}
            r={GLOW_RADIUS}
            fill="url(#navGlow)"
          />

          <AnimatedPath
            animatedProps={pathProps}
            transform={`translate(0, ${GLOW_RADIUS})`}
            fill={colors.surface}
          />
        </Svg>
      </View>

      {/* Raised button for the active tab. */}
      <Animated.View
        style={[styles.circle, { bottom: bottomInset + BAR_HEIGHT - CIRCLE_LIFT }, circleStyle]}
        pointerEvents="none"
      >
        <View style={styles.circleInner}>
          <ActiveIcon size={24} color="#FFFFFF" strokeWidth={2.2} />
        </View>
      </Animated.View>

      <View style={[styles.row, { bottom: bottomInset, height: BAR_HEIGHT }]}>
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const Icon = ICONS[route.name as keyof typeof ICONS];
          if (!Icon) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActive && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={LABELS[route.name] ?? route.name}
              onPress={onPress}
              style={styles.tab}
            >
              <BounceableTab routeKey={route.key} bouncing={bouncing}>
                <View style={styles.tabInner}>
                  {/* The active tab's icon lives in the floating circle instead. */}
                  {isActive ? (
                    // The icon moves into the floating circle; keep its space so
                    // every label sits on the same baseline.
                    <View style={styles.iconSpacer} />
                  ) : (
                    <Icon size={21} color={colors.inkFaint} strokeWidth={1.9} />
                  )}
                  <Text
                    style={[styles.label, isActive && styles.labelActive]}
                    numberOfLines={1}
                  >
                    {LABELS[route.name] ?? route.name}
                  </Text>
                </View>
              </BounceableTab>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
  },
  svgLayer: { position: 'absolute', left: 0, right: 0 },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  tabInner: { alignItems: 'center', justifyContent: 'center', gap: 3, height: BAR_HEIGHT },
  iconSpacer: { width: 21, height: 21 },
  label: { fontSize: 10.5, fontWeight: '600', color: colors.inkFaint },
  labelActive: { color: colors.primary, fontWeight: '800' },
  circle: {
    position: 'absolute',
    left: 0,
    width: CIRCLE_TOTAL,
    height: CIRCLE_TOTAL,
    borderRadius: CIRCLE_TOTAL / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  circleInner: {
    width: CIRCLE_INNER,
    height: CIRCLE_INNER,
    borderRadius: CIRCLE_INNER / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
