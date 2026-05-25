import React from 'react';
import { Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { GameProvider } from './src/contexts/GameContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Cap system font scaling so the layout doesn't break for users with
// extra-large accessibility font sizes. App stays at its designed size.
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.maxFontSizeMultiplier = 1;
(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.maxFontSizeMultiplier = 1;

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
