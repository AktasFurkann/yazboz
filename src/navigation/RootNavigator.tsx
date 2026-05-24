import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MenuScreen } from '../screens/MenuScreen';
import { GameScreen } from '../screens/GameScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

export const RootNavigator: React.FC = () => (
  <NavigationContainer theme={navTheme}>
    <Stack.Navigator
      initialRouteName="Menu"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen name="Game" component={GameScreen} />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
