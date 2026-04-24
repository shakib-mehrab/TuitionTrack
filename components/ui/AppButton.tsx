import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/Colors';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: Colors.primary },
    text: { color: Colors.white },
  },
  secondary: {
    container: { backgroundColor: Colors.surfaceVariant, borderWidth: 1, borderColor: Colors.border },
    text: { color: Colors.textPrimary },
  },
  outline: {
    container: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.borderDark,
    },
    text: { color: Colors.textPrimary },
  },
  ghost: {
    container: { backgroundColor: Colors.primaryMuted },
    text: { color: Colors.primaryDark },
  },
  danger: {
    container: { backgroundColor: Colors.error },
    text: { color: Colors.white },
  },
};

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { height: 40, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md },
    text: { fontSize: FontSize.sm },
  },
  md: {
    container: { height: 50, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.md },
    text: { fontSize: FontSize.base },
  },
  lg: {
    container: { height: 56, paddingHorizontal: Spacing['2xl'], borderRadius: BorderRadius.md },
    text: { fontSize: FontSize.md },
  },
};

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: AppButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        v.container,
        s.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color as string} size="small" />
      ) : (
        <>
          {icon && <Text style={[styles.icon, v.text]}>{icon}</Text>}
          <Text style={[styles.text, v.text, s.text, textStyle]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: { fontWeight: FontWeight.semibold },
  icon: { fontSize: 18 },
});
