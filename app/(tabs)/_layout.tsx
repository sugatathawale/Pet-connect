import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { BottomNavBar } from '@/components/ui/BottomNavBar';
import { useApp } from '@/context/AppContext';

/**
 * Tab layout.
 *
 * The default bar is replaced by `BottomNavBar`, which draws its own SVG shape
 * with a notch that follows the active tab.
 *
 * Auth gate: while the signed-in session is being read from AsyncStorage we
 * render nothing (avoids a flash of the tabs), and once hydrated we redirect
 * to /login whenever the user is signed out.
 */
export default function TabsLayout() {
  const { isSignedIn, ready } = useApp();

  if (!ready) return null;
  if (!isSignedIn) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNavBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Nearby' }} />
      <Tabs.Screen name="discover" options={{ title: 'Match' }} />
      <Tabs.Screen name="listings" options={{ title: 'Adopt' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
