import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardTypeOptions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface AppInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  editable?: boolean;
  style?: ViewStyle;
}

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  error,
  editable = true,
  style,
}: AppInputProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          !editable && styles.inputDisabled,
          multiline && { height: 'auto', minHeight: Math.max(50, numberOfLines * 24 + 20) },
        ]}
      >
        {icon && (
          <MaterialCommunityIcons 
            name={icon as any} 
            size={20} 
            color={focused ? Colors.primary : Colors.textTertiary} 
            style={styles.icon} 
          />
        )}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={secureTextEntry && !showSecret}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          textAlignVertical={multiline ? 'top' : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowSecret(!showSecret)} style={styles.eyeBtn}>
            <MaterialCommunityIcons 
              name={showSecret ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color={Colors.textTertiary} 
              style={styles.eyeIcon} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputFocused: { 
    borderColor: Colors.primary, 
    borderWidth: 1.5,
  },
  inputError: { 
    borderColor: Colors.error, 
    borderWidth: 1.5, 
    backgroundColor: Colors.errorLight 
  },
  inputDisabled: { opacity: 0.6, backgroundColor: Colors.surfaceVariant },
  icon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    height: '100%',
  },
  multilineInput: { textAlignVertical: 'top', paddingTop: Spacing.md, paddingBottom: Spacing.md },
  eyeBtn: { padding: Spacing.xs },
  eyeIcon: {},
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginTop: 4, fontWeight: FontWeight.medium },
});
