import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors } from '@training-grounds/shared';
import type { RootState } from '../redux/store';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { CheckInScreen } from '../screens/checkin/CheckInScreen';
import { LeaderboardScreen } from '../screens/leaderboard/LeaderboardScreen';
import { CoachCheckinScreen } from '../screens/coach/CoachCheckinScreen';
import { CommunityScreen } from '../screens/community/CommunityScreen';
import { ProfileAvatar } from '../components/common/ProfileAvatar';

export type MainTabParamList = {
  Dashboard: undefined;
  CheckIn: undefined;
  Community: undefined;
  Leaderboard: undefined;
  CoachCheckin: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  CheckIn: { active: 'qr-code', inactive: 'qr-code-outline' },
  Leaderboard: { active: 'trophy', inactive: 'trophy-outline' },
  CoachCheckin: { active: 'people', inactive: 'people-outline' },
  Community: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
};

const HeaderRight = () => (
  <View style={styles.headerRight}>
    <ProfileAvatar size={34} />
  </View>
);

export const MainTabs: React.FC = () => {
  const userRole = useSelector((state: RootState) => state.auth.user?.role);
  const isCoachOrAdmin = userRole === 'coach' || userRole === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: colors.offWhite,
        headerRight: () => <HeaderRight />,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.warmAccent,
        tabBarInactiveTintColor: colors.steel,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Dashboard;
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Ranks', headerTitle: 'Leaderboard' }}
      />
      <Tab.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ tabBarLabel: 'Check In', headerTitle: 'Check In' }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarLabel: 'Community', headerTitle: 'Community' }}
      />
      {isCoachOrAdmin && (
        <Tab.Screen
          name="CoachCheckin"
          component={CoachCheckinScreen}
          options={{ tabBarLabel: 'Coach', headerTitle: 'Coach' }}
        />
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.charcoal,
    shadowColor: 'transparent',
    elevation: 0,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 20,
    color: colors.offWhite,
    letterSpacing: 1.5,
  },
  headerRight: {
    marginRight: 16,
  },
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
