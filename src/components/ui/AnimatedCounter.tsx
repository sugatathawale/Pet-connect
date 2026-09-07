import React, { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useAnimatedReaction, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
  suffix?: string;
}

/**
 * Counts up to `value` on mount and whenever it changes.
 *
 * The tween runs on the UI thread and only the rounded integer crosses back to
 * JS, so a row of these stays cheap.
 */
export function AnimatedCounter({
  value,
  style,
  duration = 900,
  suffix = '',
}: AnimatedCounterProps) {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(value, { duration });
  }, [value, duration, progress]);

  useAnimatedReaction(
    () => Math.round(progress.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setDisplay)(current);
    },
    [],
  );

  return (
    <Text style={style}>
      {display}
      {suffix}
    </Text>
  );
}
