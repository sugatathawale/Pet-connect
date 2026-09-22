import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [nearbyAlerts, setNearbyAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
    >
      <Text style={styles.section}>Notifications</Text>

      <View style={styles.group}>
        <Row
          icon="heart-outline"
          label="Match alerts"
          value={matchAlerts}
          onChange={setMatchAlerts}
        />
        <Row
          icon="location-outline"
          label="Nearby availability"
          value={nearbyAlerts}
          onChange={setNearbyAlerts}
        />
        <Row
          icon="chatbubble-outline"
          label="Message alerts"
          value={messageAlerts}
          onChange={setMessageAlerts}
          last
        />
      </View>

      <Text style={styles.section}>Assistant</Text>
      <View style={styles.note}>
        <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
        <Text style={styles.noteText}>
          The AI Assistant answers Pet Connect and breed questions only. Guardrails block
          off-topic or misleading requests.
        </Text>
      </View>

      <Text style={styles.section}>About</Text>
      <Pressable style={styles.aboutRow}>
        <Text style={styles.aboutLabel}>Version</Text>
        <Text style={styles.aboutValue}>1.0.0</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  value,
  onChange,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.inkFaint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  note: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  noteText: { flex: 1, fontSize: 13, color: colors.inkMuted, lineHeight: 19 },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  aboutLabel: { fontSize: 15, fontWeight: '600', color: colors.ink },
  aboutValue: { fontSize: 15, color: colors.inkMuted },
});
