import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing } from '@/constants/theme';

/** Dashboard shortcut that opens the Paw AI assistant. */
export function AssistantPromo() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open AI Assistant"
      onPress={() => router.push('/assistant')}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={['#0E9594', '#0A5C5B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.orb}>
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Ask Paw</Text>
          <Text style={styles.body} numberOfLines={1}>
            Breeds, matching & app help
          </Text>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaText}>Chat</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.primaryDark} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  orb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
    fontWeight: '500',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  ctaText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
});
