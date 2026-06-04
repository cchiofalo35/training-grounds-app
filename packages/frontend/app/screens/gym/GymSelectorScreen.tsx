import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import type { Gym } from '@training-grounds/shared';
import type { RootState, AppDispatch } from '../../redux/store';
import { switchGym } from '../../redux/slices/gymSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, borderRadius } from '@training-grounds/shared';

/** Static taglines per gym slug — extend as gyms onboard */
const GYM_TAGLINES: Record<string, string> = {
  'training-grounds': 'Multi-Discipline MMA',
  'crossfit-karuna': 'Fitter. Stronger. Happier.',
  'iron-lion-mma': 'Forged in Iron',
};

interface GymSelectorScreenProps {
  /** Called after a gym is selected (e.g. navigate away) */
  onGymSelected?: () => void;
}

export const GymSelectorScreen: React.FC<GymSelectorScreenProps> = ({
  onGymSelected,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const gyms = useSelector((state: RootState) => state.gym.gyms);
  const activeGymId = useSelector((state: RootState) => state.gym.activeGymId);
  const isLoading = useSelector((state: RootState) => state.gym.isLoading);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#0D0D0D',
        },
        header: {
          paddingTop: 80,
          paddingHorizontal: 24,
          paddingBottom: 32,
          alignItems: 'center',
        },
        title: {
          fontFamily: 'BebasNeue',
          fontSize: 32,
          color: '#FAFAF8',
          letterSpacing: 2,
          marginBottom: 8,
        },
        subtitle: {
          fontFamily: 'Inter',
          fontSize: 14,
          color: '#8B949E',
          lineHeight: 20,
          textAlign: 'center',
        },
        listContent: {
          paddingHorizontal: 20,
          paddingBottom: 40,
        },
        // Individual gym card
        gymCard: {
          borderRadius: 16,
          marginBottom: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        gymCardActive: {
          borderWidth: 2,
        },
        // Colored accent bar at top of card
        accentBar: {
          height: 4,
        },
        cardBody: {
          padding: 18,
          flexDirection: 'row',
          alignItems: 'center',
        },
        logoContainer: {
          width: 52,
          height: 52,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
          overflow: 'hidden',
        },
        logo: {
          width: 52,
          height: 52,
          borderRadius: 14,
        },
        logoFallback: {
          fontFamily: 'BebasNeue',
          fontSize: 22,
        },
        gymInfo: {
          flex: 1,
        },
        gymName: {
          fontFamily: 'Inter',
          fontSize: 17,
          fontWeight: '700',
          color: '#FAFAF8',
          marginBottom: 3,
        },
        tagline: {
          fontFamily: 'Inter',
          fontSize: 12,
          color: '#8B949E',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        checkIcon: {
          marginLeft: 12,
        },
        loadingContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0D0D0D',
        },
        emptyContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          backgroundColor: '#0D0D0D',
        },
        emptyText: {
          fontFamily: 'Inter',
          fontSize: 14,
          color: '#8B949E',
          textAlign: 'center',
          lineHeight: 20,
          marginTop: 12,
        },
      }),
    [],
  );

  const handleSelectGym = useCallback(
    (gymId: string) => {
      dispatch(switchGym(gymId)).then(() => {
        onGymSelected?.();
      });
    },
    [dispatch, onGymSelected],
  );

  const renderGymItem = useCallback(
    ({ item }: { item: Gym }) => {
      const isActive = item.id === activeGymId;
      const accentColor = item.primaryColor ?? theme.primaryColor;
      const surfaceBg = item.surfaceColor ?? '#1A1A1A';
      const tagline = GYM_TAGLINES[item.slug] ?? item.slug;

      return (
        <TouchableOpacity
          style={[
            styles.gymCard,
            { backgroundColor: surfaceBg },
            isActive && [styles.gymCardActive, { borderColor: accentColor }],
          ]}
          onPress={() => handleSelectGym(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          <View style={styles.cardBody}>
            <View style={[styles.logoContainer, { backgroundColor: item.secondaryColor ?? '#111' }]}>
              {item.logoUrl ? (
                <Image source={{ uri: item.logoUrl }} style={styles.logo} />
              ) : (
                <Text style={[styles.logoFallback, { color: accentColor }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.gymInfo}>
              <Text style={styles.gymName}>{item.name}</Text>
              <Text style={[styles.tagline, { color: accentColor }]}>{tagline}</Text>
            </View>
            {isActive && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={accentColor}
                style={styles.checkIcon}
              />
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [activeGymId, handleSelectGym, styles, theme.primaryColor],
  );

  const keyExtractor = useCallback((item: Gym) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  if (gyms.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="fitness-outline" size={48} color="#8B949E" />
        <Text style={styles.emptyText}>
          You don't belong to any gyms yet. Ask your gym owner for an invite.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Gym</Text>
        <Text style={styles.subtitle}>
          Choose which gym you'd like to train at
        </Text>
      </View>
      <FlatList
        data={gyms}
        keyExtractor={keyExtractor}
        renderItem={renderGymItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};
