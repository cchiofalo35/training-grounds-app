import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { MainTabs } from './MainTabs';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { JournalScreen } from '../screens/journal/JournalScreen';
import { RewardsScreen } from '../screens/rewards/RewardsScreen';
import { GymSelectorScreen } from '../screens/gym/GymSelectorScreen';
import { GymBrandingScreen } from '../screens/admin/GymBrandingScreen';
import { WeightliftingScreen } from '../screens/weightlifting/WeightliftingScreen';
import { LiftDetailScreen } from '../screens/weightlifting/LiftDetailScreen';
import { LogPrScreen } from '../screens/weightlifting/LogPrScreen';

export type AppStackParamList = {
  HomeTabs: undefined;
  Profile: undefined;
  Journal: undefined;
  Rewards: undefined;
  GymSelector: undefined;
  GymBranding: undefined;
  Weightlifting: undefined;
  LiftDetail: { movementName: string };
  LogPr: { movementName?: string };
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStack: React.FC = () => {
  const theme = useTheme();

  const headerOptions = {
    headerStyle: { backgroundColor: theme.secondaryColor },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: {
      fontFamily: 'BebasNeue',
      fontSize: 20,
    },
    headerShadowVisible: false,
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.secondaryColor },
      }}
    >
      <Stack.Screen name="HomeTabs" component={MainTabs} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Profile',
          ...headerOptions,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          headerShown: true,
          headerTitle: 'Training Journal',
          ...headerOptions,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Rewards & Badges',
          ...headerOptions,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="GymSelector"
        component={GymSelectorScreen}
        options={{
          headerShown: true,
          headerTitle: 'Switch Gym',
          ...headerOptions,
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Weightlifting"
        component={WeightliftingScreen}
        options={{
          headerShown: true,
          headerTitle: 'Lift Tracker',
          ...headerOptions,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="LiftDetail"
        component={LiftDetailScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          ...headerOptions,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="LogPr"
        component={LogPrScreen}
        options={{
          headerShown: true,
          headerTitle: 'Log Lift',
          ...headerOptions,
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};
