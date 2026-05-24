import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { GameProvider } from './src/contexts/GameContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <GameProvider>
        <RootNavigator />
      </GameProvider>
    </SafeAreaProvider>
  );
}
