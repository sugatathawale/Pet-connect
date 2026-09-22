import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';

const TOPICS = [
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Stay safe when meeting',
    body: 'Meet in public places, bring a friend, and never share your exact home address in chat.',
  },
  {
    icon: 'flag-outline' as const,
    title: 'Report & block',
    body: 'Open any match chat → menu → Report. You can also block an owner so they cannot message you.',
  },
  {
    icon: 'paw-outline' as const,
    title: 'Breeding & health',
    body: 'Pet Connect connects owners — it does not replace a veterinarian. Ask your vet about vaccines and breeding readiness.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'AI Assistant',
    body: 'Use the menu → AI Assistant for breed FAQs and app how-tos. Out-of-scope questions are blocked on purpose.',
  },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
    >
      <Text style={styles.lead}>
        Need help with Pet Connect? Start here — or ask the AI Assistant for breed and app FAQs.
      </Text>

      {TOPICS.map((topic) => (
        <View key={topic.title} style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name={topic.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>{topic.title}</Text>
            <Text style={styles.cardBody}>{topic.body}</Text>
          </View>
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        style={styles.mail}
        onPress={() => Linking.openURL('mailto:support@petconnect.app?subject=Pet%20Connect%20Help')}
      >
        <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
        <Text style={styles.mailText}>Email support</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  lead: {
    fontSize: 15,
    color: colors.inkMuted,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  cardBody: { fontSize: 13, color: colors.inkMuted, marginTop: 4, lineHeight: 19 },
  mail: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
  },
  mailText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
