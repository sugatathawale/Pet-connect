import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { aiAssistantService } from '@/services/aiAssistantService';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  body: string;
  blocked?: boolean;
}

const PROMPTS: {
  label: string;
  prompt: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { label: 'Say hi', prompt: 'Hi!', icon: 'hand-left-outline' },
  { label: 'Matching', prompt: 'How does matching work?', icon: 'heart-outline' },
  { label: 'Labradors', prompt: 'Tell me about Labradors', icon: 'paw-outline' },
  { label: 'Persian cats', prompt: 'What about Persian cats?', icon: 'fish-outline' },
  { label: 'Privacy', prompt: 'Is my location private?', icon: 'shield-checkmark-outline' },
];

const WELCOME: ChatTurn = {
  id: 'welcome',
  role: 'assistant',
  body: "Hey — I'm Paw, your Pet Connect guide. Ask me about breeds, matching, listings, or privacy. I stay on-topic and block anything outside the app.",
};

/** In-app FAQ chat — immersive UI over Agno / local KB. */
export default function AIAssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentOwnerId } = useApp();
  const listRef = useRef<FlatList<ChatTurn>>(null);

  const [turns, setTurns] = useState<ChatTurn[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);

  const showHero = turns.length <= 1;

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;

    setTurns((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', body: message },
    ]);
    setDraft('');
    setBusy(true);

    const result = await aiAssistantService.ask(message, currentOwnerId);
    setTurns((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        body: result.reply,
        blocked: result.blocked,
      },
    ]);
    setBusy(false);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <View style={styles.root}>
      <AmbientBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Header
          topInset={insets.top}
          onBack={() => router.back()}
          onSupport={() => router.push('/support')}
          busy={busy}
        />

        <FlatList
          ref={listRef}
          data={turns}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: spacing.lg },
          ]}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          ListHeaderComponent={
            <View>
              {showHero && <HeroOrb />}
              <PromptRail busy={busy} onPick={send} />
            </View>
          }
          ListFooterComponent={busy ? <TypingRow /> : null}
          renderItem={({ item, index }) => (
            <MessageBubble turn={item} index={index} />
          )}
        />

        <Composer
          draft={draft}
          setDraft={setDraft}
          busy={busy}
          focused={focused}
          setFocused={setFocused}
          bottomInset={insets.bottom}
          onSend={() => send(draft)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

function AmbientBackground() {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift]);

  const blobA = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-18, 22]) },
      { translateY: interpolate(drift.value, [0, 1], [0, 28]) },
    ],
  }));

  const blobB = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [16, -20]) },
      { translateY: interpolate(drift.value, [0, 1], [10, -18]) },
    ],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#062E2E', '#0A4A48', '#E8F4F3', '#F4F8F8']}
        locations={[0, 0.22, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.blob, styles.blobTeal, blobA]} />
      <Animated.View style={[styles.blob, styles.blobAmber, blobB]} />
    </View>
  );
}

function Header({
  topInset,
  onBack,
  onSupport,
  busy,
}: {
  topInset: number;
  onBack: () => void;
  onSupport: () => void;
  busy: boolean;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const liveDot = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.85, 1.15]) }],
  }));

  return (
    <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        style={styles.headerBtn}
      >
        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
      </Pressable>

      <View style={styles.headerCenter}>
        <View style={styles.headerTitleRow}>
          <LinearGradient
            colors={['#1EC8C5', '#0E9594']}
            style={styles.miniOrb}
          >
            <Ionicons name="sparkles" size={12} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Paw</Text>
          <View style={styles.livePill}>
            <Animated.View style={[styles.liveDot, liveDot]} />
            <Text style={styles.liveText}>{busy ? 'thinking' : 'online'}</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>Pet Connect knowledge · guarded</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Support"
        onPress={onSupport}
        style={styles.headerBtn}
      >
        <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function HeroOrb() {
  const spin = useSharedValue(0);
  const breath = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.linear }),
      -1,
      false,
    );
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [spin, breath]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breath.value, [0, 1], [1, 1.06]) }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
      <View style={styles.heroOrbWrap}>
        <Animated.View style={[styles.heroRing, ringStyle]}>
          <LinearGradient
            colors={['rgba(244,162,89,0.9)', 'transparent', 'rgba(30,200,197,0.85)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View style={orbStyle}>
          <LinearGradient
            colors={['#1EC8C5', '#0E9594', '#0A5C5B']}
            style={styles.heroOrb}
          >
            <Ionicons name="paw" size={36} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </View>
      <Text style={styles.heroTitle}>Ask me anything pet</Text>
      <Text style={styles.heroBody}>
        Breeds · matching · listings · privacy — nothing else gets through.
      </Text>
    </Animated.View>
  );
}

function PromptRail({
  busy,
  onPick,
}: {
  busy: boolean;
  onPick: (prompt: string) => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(120).springify().damping(16)}>
      <Text style={styles.railLabel}>Quick sparks</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {PROMPTS.map((item, index) => (
          <Animated.View
            key={item.label}
            entering={FadeInUp.delay(80 + index * 60).springify()}
          >
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => onPick(item.prompt)}
              style={({ pressed }) => [
                styles.promptCard,
                { backgroundColor: item.soft },
                pressed && styles.promptPressed,
                busy && styles.promptDisabled,
              ]}
            >
              <View style={[styles.promptIcon, { backgroundColor: item.tint }]}>
                <Ionicons name={item.icon} size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.promptLabel}>{item.label}</Text>
              <Text style={styles.promptHint} numberOfLines={2}>
                {item.prompt}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

function MessageBubble({ turn, index }: { turn: ChatTurn; index: number }) {
  const mine = turn.role === 'user';

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 6) * 40).springify().damping(18)}
      style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}
    >
      {!mine && (
        <LinearGradient colors={['#1EC8C5', '#0E9594']} style={styles.avatar}>
          <Ionicons name="paw" size={14} color="#FFFFFF" />
        </LinearGradient>
      )}

      {mine ? (
        <LinearGradient
          colors={['#12A8A6', '#0E9594', '#0A7574']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.bubbleMine]}
        >
          <Text style={[styles.text, styles.textMine]}>{turn.body}</Text>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.bubble,
            styles.bubbleTheirs,
            turn.blocked && styles.bubbleBlocked,
          ]}
        >
          {turn.blocked && (
            <View style={styles.blockedTag}>
              <Ionicons name="shield" size={11} color={colors.warning} />
              <Text style={styles.blockedLabel}>Guardrail · out of scope</Text>
            </View>
          )}
          <Text style={styles.text}>{turn.body}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function TypingRow() {
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const c = useSharedValue(0);

  useEffect(() => {
    const bounce = (v: typeof a, delay: number) => {
      v.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
          ),
          -1,
          false,
        ),
      );
    };
    bounce(a, 0);
    bounce(b, 120);
    bounce(c, 240);
  }, [a, b, c]);

  const styleA = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(a.value, [0, 1], [0, -5]) }],
    opacity: interpolate(a.value, [0, 1], [0.4, 1]),
  }));
  const styleB = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(b.value, [0, 1], [0, -5]) }],
    opacity: interpolate(b.value, [0, 1], [0.4, 1]),
  }));
  const styleC = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(c.value, [0, 1], [0, -5]) }],
    opacity: interpolate(c.value, [0, 1], [0.4, 1]),
  }));

  return (
    <Animated.View entering={FadeIn} style={[styles.row, styles.rowTheirs]}>
      <LinearGradient colors={['#1EC8C5', '#0E9594']} style={styles.avatar}>
        <Ionicons name="paw" size={14} color="#FFFFFF" />
      </LinearGradient>
      <View style={[styles.bubble, styles.bubbleTheirs, styles.typingBubble]}>
        <Animated.View style={[styles.dot, styleA]} />
        <Animated.View style={[styles.dot, styleB]} />
        <Animated.View style={[styles.dot, styleC]} />
      </View>
    </Animated.View>
  );
}

function Composer({
  draft,
  setDraft,
  busy,
  focused,
  setFocused,
  bottomInset,
  onSend,
}: {
  draft: string;
  setDraft: (v: string) => void;
  busy: boolean;
  focused: boolean;
  setFocused: (v: boolean) => void;
  bottomInset: number;
  onSend: () => void;
}) {
  const canSend = Boolean(draft.trim()) && !busy;

  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focused, glow]);

  const shellStyle = useAnimatedStyle(() => ({
    borderColor:
      glow.value > 0.5 ? 'rgba(14,149,148,0.55)' : 'rgba(226,237,237,0.9)',
    shadowOpacity: interpolate(glow.value, [0, 1], [0.08, 0.22]),
  }));

  const placeholder = useMemo(
    () =>
      busy ? 'Paw is thinking…' : 'Ask about breeds, matching, listings…',
    [busy],
  );

  return (
    <View style={[styles.composerWrap, { paddingBottom: Math.max(bottomInset, spacing.md) }]}>
      <Animated.View style={[styles.composerShell, shellStyle]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          multiline
          maxLength={1000}
          editable={!busy}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSend}
          blurOnSubmit={false}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          onPress={onSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendHit,
            pressed && canSend && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <LinearGradient
            colors={
              canSend
                ? ['#1EC8C5', '#0E9594']
                : ['#C5D5D5', '#A8BDBD']
            }
            style={styles.send}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
      <Text style={styles.composerHint}>Scoped to Pet Connect · guardrails on</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surfaceAlt },
  flex: { flex: 1 },

  blob: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  blobTeal: {
    top: 120,
    right: -60,
    backgroundColor: 'rgba(30,200,197,0.18)',
  },
  blobAmber: {
    top: 280,
    left: -80,
    backgroundColor: 'rgba(244,162,89,0.14)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headerCenter: { flex: 1 },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniOrb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7CFFB2',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerSub: {
    marginTop: 3,
    marginLeft: 30,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },

  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  heroOrbWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 56,
    padding: 3,
    overflow: 'hidden',
  },
  heroOrb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  heroBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    textAlign: 'center',
    maxWidth: 280,
  },

  railLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  rail: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    paddingRight: spacing.lg,
  },
  promptCard: {
    width: 132,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,38,43,0.04)',
  },
  promptPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  promptDisabled: { opacity: 0.55 },
  promptIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  promptHint: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 15,
    color: colors.inkMuted,
  },

  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
    gap: 8,
  },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 20,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 4,
  },
  bubbleMine: {
    borderBottomRightRadius: 6,
    ...shadow.card,
  },
  bubbleTheirs: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(226,237,237,0.9)',
    ...shadow.card,
  },
  bubbleBlocked: {
    backgroundColor: colors.warningSoft,
    borderColor: 'rgba(200,137,11,0.25)',
  },
  blockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  blockedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.warning,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  textMine: { color: '#FFFFFF', fontWeight: '500' },

  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  composerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  composerShell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    borderWidth: 1.5,
    paddingLeft: spacing.lg,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: '#0E9594',
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
  },
  sendHit: { marginBottom: 0 },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerHint: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 10,
    fontWeight: '600',
    color: colors.inkFaint,
    letterSpacing: 0.2,
  },
});
