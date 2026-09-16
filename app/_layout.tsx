import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Pressable } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '@/context/AppContext';
import { colors } from '@/constants/theme';

/** Reusable Ionicons back button for the stack header. */
function BackButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => router.back()}
      hitSlop={10}
      style={{ marginLeft: -4 }}
    >
      <Ionicons name="chevron-back" size={26} color={colors.primary} />
    </Pressable>
  );
}

/**
 * Root layout.
 *
 * GestureHandlerRootView must wrap the whole tree for the swipe deck to receive
 * gestures, and it has to sit outside the navigator.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTitleStyle: { fontWeight: '700', color: colors.ink },
              headerTintColor: colors.primary,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.surfaceAlt },
              // Override the default native back button with an Ionicons chevron-back.
              headerLeft: () => <BackButton />,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false, headerLeft: undefined }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen
              name="pet/[id]"
              options={{ title: '', headerTransparent: true }}
            />
            <Stack.Screen name="pet/new" options={{ title: 'Add a pet' }} />
            <Stack.Screen name="pet/availability" options={{ title: 'Availability' }} />
            <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
            <Stack.Screen name="listing/[id]" options={{ title: 'Listing' }} />
            <Stack.Screen name="listing/new" options={{ title: 'Create listing' }} />
            <Stack.Screen name="owner/[id]" options={{ title: 'Owner' }} />
          </Stack>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
