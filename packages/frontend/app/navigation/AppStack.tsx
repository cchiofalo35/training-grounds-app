import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '@training-grounds/shared';
import { MainTabs } from './MainTabs';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { JournalScreen } from '../screens/journal/JournalScreen';
import { RewardsScreen } from '../screens/rewards/RewardsScreen';

export type AppStackParamList = {
  HomeTabs: undefined;
  Profile: undefined;
  Journal: undefined;
  Rewards: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.charcoal },
      }}
    >
      <Stack.Screen name="HomeTabs" component={MainTabs} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Profile',
          headerStyle: { backgroundColor: colors.charcoal },
          headerTintColor: colors.offWhite,
          headerTitleStyle: {
            fontFamily: 'BebasNeue',
            fontSize: 20,
          },
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          headerShown: true,
          headerTitle: 'Training Journal',
          headerStyle: { backgroundColor: colors.charcoal },
          headerTintColor: colors.offWhite,
          headerTitleStyle: {
            fontFamily: 'BebasNeue',
            fontSize: 20,
          },
          headerShadowVisible: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Rewards & Badges',
          headerStyle: { backgroundColor: colors.charcoal },
          headerTintColor: colors.offWhite,
          headerTitleStyle: {
            fontFamily: 'BebasNeue',
            fontSize: 20,
          },
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};
