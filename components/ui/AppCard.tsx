import { BorderRadius, Colors, Shadow, Spacing } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
}

export default function AppCard({
  children,
  style,
  padding = 'md',
  shadow = 'sm',
}: AppCardProps) {
  const paddingMap = {
    none: 0,
    sm: Spacing.md,
    md: Spacing.lg,
    lg: Spacing['2xl'],
  };

  return (
    <View
      style={[
        styles.card,
        { padding: paddingMap[padding] },
        shadow !== 'none' ? Shadow[shadow] : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
  },
});
