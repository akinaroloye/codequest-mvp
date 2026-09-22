import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { ChallengeScreen } from './src/screens/ChallengeScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { useUserStore } from './src/store/useUserStore';
import { colors, font, space } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, refetchOnWindowFocus: false } },
});

function MainTabs() {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: space[1],
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: font.size.caption,
          fontWeight: font.weight.medium,
          marginBottom: space[1],
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:        ['home',    'home-outline'],
            Leaderboard: ['trophy',  'trophy-outline'],
            Profile:     ['person',  'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['grid', 'grid-outline'];
          return (
            <Ionicons
              name={(focused ? active : inactive) as any}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home"        component={HomeScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile"     component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <Stack.Navigator id="AppStack" screenOptions={{ headerShown: false, presentation: 'card' }}>
      <Stack.Screen name="Main"      component={MainTabs} />
      <Stack.Screen name="Challenge" component={ChallengeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Result"    component={ResultScreen}    options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { hydrated, hydrate, token } = useUserStore();

  useEffect(() => { hydrate(); }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar style="light" />
            {token ? <AppNavigator /> : <LoginScreen />}
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
