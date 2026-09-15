import { Tabs } from 'expo-router';
import React from 'react';

import { BottomNavBar } from '@/components/ui/BottomNavBar';

/**
 * Tab layout.
 *
 * The default bar is replaced by `BottomNavBar`, which draws its own SVG shape
 * with a notch that follows the active tab.
 */
export default function TabsLayout() {
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
