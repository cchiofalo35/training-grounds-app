import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { fonts, buttonStyles } from '@training-grounds/shared';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const themeStyle = isPrimary ? buttonStyles.primary : buttonStyles.outline;

  const styles = useMemo(() => StyleSheet.create({
    base: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    text: {
      fontFamily: 'Inter',
      textTransform: 'uppercase',
    },
  }), [theme]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: themeStyle.backgroundColor,
          paddingVertical: themeStyle.paddingVertical,
          paddingHorizontal: themeStyle.paddingHorizontal,
          borderRadius: themeStyle.borderRadius,
          borderWidth: isPrimary ? 0 : ('borderWidth' in themeStyle ? themeStyle.borderWidth : 0),
          borderColor: isPrimary ? undefined : ('borderColor' in themeStyle ? themeStyle.borderColor : undefined),
          opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? theme.secondaryColor : theme.textPrimary}
        />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: themeStyle.color,
              fontWeight: themeStyle.fontWeight,
              fontSize: themeStyle.fontSize,
              letterSpacing: themeStyle.letterSpacing,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};
