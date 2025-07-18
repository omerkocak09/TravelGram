import 'react-native-gesture-handler';
import React from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import { Stack } from 'expo-router';

export default function App() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
