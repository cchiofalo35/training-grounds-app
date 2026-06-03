import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '@training-grounds/shared';
import type { RootState } from '../../redux/store';
import type { AppStackParamList } from '../../navigation/AppStack';

type NavProp = NativeStackNavigationProp<AppStackParamList>;

interface ProfileAvatarProps {
  size?: number;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ size = 40 }) => {
  const navigation = useNavigation<NavProp>();
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user) return null;

  const initial = user.name?.charAt(0).toUpperCase() ?? '?';
  const hasPhoto = !!user.avatarUrl;
  const borderW = 1.5;
  const innerSize = size - borderW * 2;

  return (
    <Pressable
      onPress={() => navigation.navigate('Profile')}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: borderW,
          borderColor: 'rgba(255,255,255,0.2)',
          overflow: 'hidden',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {hasPhoto ? (
        <Image
          source={{ uri: user.avatarUrl! }}
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: 'rgba(201, 168, 124, 0.15)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: size * 0.4,
              fontWeight: '600',
              color: colors.warmAccent,
            }}
          >
            {initial}
          </Text>
        </View>
      )}
    </Pressable>
  );
};
