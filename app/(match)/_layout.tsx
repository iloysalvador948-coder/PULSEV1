import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../utils/constants';

export default function MatchLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
        presentation: 'fullScreenModal',
      }}
    >
      <Stack.Screen name="config" />
      <Stack.Screen name="matchmaking" />
      <Stack.Screen name="battle" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}