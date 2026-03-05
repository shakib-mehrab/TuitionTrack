import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'primary' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.successLight, text: Colors.success },
  error: { bg: Colors.errorLight, text: Colors.error },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  info: { bg: Colors.infoLight, text: Colors.info },
  primary: { bg: Colors.primaryLight, text: Colors.primary },
  neutral: { bg: Colors.surfaceVariant, text: Colors.textSecondary },
};

export default function Badge({ label, variant = 'neutral', size = 'md' }: BadgeProps) {
  const colors = variantMap[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: colors.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  textSm: { fontSize: 10 },
});
