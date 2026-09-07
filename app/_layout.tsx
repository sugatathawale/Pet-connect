import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from '@/context/AppContext';
import { colors } from '@/constants/theme';

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
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
            <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
          </Stack>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
