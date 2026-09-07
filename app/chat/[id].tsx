import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBubble } from '@/components/chat/MessageBubble';
import { colors, radius, spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { chatService } from '@/services/chatService';
import { notificationService } from '@/services/notificationService';
import type { Message } from '@/types';
import { approximateLocation } from '@/utils/geo';

/** One-to-one chat, unlocked by a mutual match. */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Message>>(null);

  const {
    matches,
    myPets,
    petById,
    ownerById,
    currentOwnerId,
    userLocation,
    blockOwner,
    refresh,
  } = useApp();
  const { pickImages } = useImagePicker();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  const match = useMemo(() => matches.find((m) => m.id === id), [matches, id]);

  const theirPet = useMemo(() => {
    if (!match) return undefined;
    const myPetIds = new Set(myPets.map((p) => p.id));
    const theirId = match.petIds.find((petId) => !myPetIds.has(petId));
    return theirId ? petById(theirId) : undefined;
  }, [match, myPets, petById]);

  const theirOwner = theirPet ? ownerById(theirPet.ownerId) : undefined;

  const loadMessages = useCallback(async () => {
    if (!id) return;
    setMessages(await chatService.listMessages(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleReport = useCallback(() => {
    if (!theirOwner) return;

    Alert.alert(
      `Report ${theirOwner.name}?`,
      'Our team will review this conversation. You can also block this owner so they can no longer reach you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report only',
          onPress: () =>
            Alert.alert('Report sent', 'Thanks — our team will take a look.'),
        },
        {
          text: 'Report & block',
          style: 'destructive',
          onPress: async () => {
            await blockOwner(theirOwner.id);
            await refresh();
            router.back();
          },
        },
      ],
    );
  }, [theirOwner, blockOwner, refresh, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: theirPet ? `${theirPet.name}'s owner` : 'Chat',
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Report or block"
          onPress={handleReport}
          hitSlop={8}
        >
          <Ionicons name="ellipsis-horizontal" size={21} color={colors.ink} />
        </Pressable>
      ),
    });
  }, [navigation, theirPet, handleReport]);

  const send = async (kind: Message['kind'], body: string) => {
    if (!id) return;

    await chatService.sendMessage(id, currentOwnerId, kind, body);
    setDraft('');
    await loadMessages();
    await refresh();

    // Nudge the other owner. A real backend would push to their device instead.
    if (theirPet) {
      await notificationService.push(
        'message',
        `New message about ${theirPet.name}`,
        kind === 'text' ? body : 'Sent an attachment',
        `/chat/${id}`,
      );
    }
  };

  const handleSendText = () => {
    const text = draft.trim();
    if (!text) return;
    send('text', text);
  };

  const handleSendPhoto = async () => {
    const [uri] = await pickImages(1);
    if (uri) send('image', uri);
  };

  const handleShareLocation = () => {
    // Deliberately blurred: owners share a neighbourhood, never an address.
    const approx = approximateLocation(userLocation, 1);

    Alert.alert(
      'Share approximate location?',
      'Your location will be blurred to about a 1 km radius so your exact address stays private.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => send('location', `${approx.latitude},${approx.longitude}`),
        },
      ],
    );
  };

  if (!match || !theirPet || !theirOwner) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>This conversation is no longer available.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 92 : 0}
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMine={item.senderId === currentOwnerId} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            <View style={styles.intro}>
              <Text style={styles.introTitle}>
                🎉 You matched with {theirPet.name}
              </Text>
              <Text style={styles.introBody}>
                Say hello to {theirOwner.name}. Keep personal details private until
                you're comfortable.
              </Text>
            </View>
          }
        />
      )}

      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send a photo"
          onPress={handleSendPhoto}
          style={styles.composerButton}
        >
          <Ionicons name="image-outline" size={22} color={colors.inkMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share approximate location"
          onPress={handleShareLocation}
          style={styles.composerButton}
        >
          <Ionicons name="location-outline" size={22} color={colors.inkMuted} />
        </Pressable>

        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Message…"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          multiline
          onSubmitEditing={handleSendText}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          onPress={handleSendText}
          disabled={!draft.trim()}
          style={[styles.sendButton, !draft.trim() && styles.sendDisabled]}
        >
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  missing: { fontSize: 14, color: colors.inkMuted, textAlign: 'center' },
  list: { padding: spacing.lg, paddingBottom: spacing.md },
  intro: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  introTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  introBody: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
    lineHeight: 19,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  composerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 40,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    fontSize: 15,
    color: colors.ink,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});
