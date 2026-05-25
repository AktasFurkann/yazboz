import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { GameProvider } from './src/contexts/GameContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

const ThemedStatusBar: React.FC = () => {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <GameProvider>
          <RootNavigator />
        </GameProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
