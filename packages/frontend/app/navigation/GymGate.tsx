import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { useTheme } from '../contexts/ThemeContext';
import { GymSelectorScreen } from '../screens/gym/GymSelectorScreen';
import { AppStack } from './AppStack';

export const GymGate: React.FC = () => {
  const theme = useTheme();
  const { activeGymId, gyms, isLoading } = useSelector((state: RootState) => state.gym);

  const styles = useMemo(() => StyleSheet.create({
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.secondaryColor,
    },
  }), [theme]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  // User has multiple gyms but none selected yet
  if (gyms.length > 1 && !activeGymId) {
    return <GymSelectorScreen />;
  }

  return <AppStack />;
};
