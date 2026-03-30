import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@training-grounds/shared';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CheckInScreen } from '../screens/checkin/CheckInScreen';
import { LeaderboardScreen } from '../screens/leaderboard/LeaderboardScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { JournalScreen } from '../screens/journal/JournalScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  CheckIn: undefined;
  Leaderboard: undefined;
  Profile: undefined;
  Journal: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  CheckIn: { active: 'qr-code', inactive: 'qr-code-outline' },
  Leaderboard: { active: 'trophy', inactive: 'trophy-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
  Journal: { active: 'journal', inactive: 'journal-outline' },
};

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.warmAccent,
        tabBarInactiveTintColor: colors.steel,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Journal;
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Ranks' }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ tabBarLabel: 'Check In' }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{ tabBarLabel: 'Journal' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.charcoal,
    borderTopColor: colors.borderDark,
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabLabel: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '500' as const,
  },
});
