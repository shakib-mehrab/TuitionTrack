import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type RoleOption = {
  label: string;
  value: UserRole;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  desc: string;
};

const ROLES: RoleOption[] = [
  { label: 'Teacher', value: 'teacher', icon: 'human-male-board', desc: 'Manage students & classes' },
  { label: 'Student', value: 'student', icon: 'account-school-outline', desc: 'View classes & homework' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('teacher');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    try {
      await register(name.trim(), email.trim(), password, role);
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message ?? 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
      >
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.accent} />
          <Text style={styles.backText}> Back</Text>
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <Image
            source={require('@/assets/images/TuitionTracklogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join TuitionTrack today</Text>
        </View>

        <View style={styles.card}>
          {/* Role Selector */}
          <Text style={styles.sectionLabel}>I am a...</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleCard, role === r.value && styles.roleCardActive]}
                onPress={() => setRole(r.value)}
              >
                <MaterialCommunityIcons
                  name={r.icon}
                  size={30}
                  color={role === r.value ? Colors.primaryLight : Colors.textSecondary}
                  style={styles.roleIcon}
                />
                <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>
                  {r.label}
                </Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="account-outline"
                size={18}
                color={Colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={Colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={18}
                color={Colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <MaterialCommunityIcons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[
              styles.inputRow,
              confirmPassword.length > 0 && confirmPassword !== password && styles.inputRowError,
            ]}>
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={18}
                color={
                  confirmPassword.length > 0
                    ? confirmPassword === password ? Colors.success : Colors.error
                    : Colors.textTertiary
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!showConfirmPass}
              />
              <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)} style={styles.eyeBtn}>
                <MaterialCommunityIcons
                  name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
            {confirmPassword.length > 0 && confirmPassword === password && (
              <Text style={styles.successText}>Passwords match</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, isLoading && styles.disabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <MaterialCommunityIcons name="loading" size={20} color={Colors.white} />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundDeep },
  flex: { flex: 1, backgroundColor: Colors.backgroundDeep },
  scroll: { flex: 1, backgroundColor: Colors.backgroundDeep },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.backgroundDeep,
    paddingHorizontal: Spacing.xl,
    paddingTop: 48,
    paddingBottom: Spacing['3xl'],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: FontSize.base, color: Colors.accent, fontFamily: FontFamily.medium },
  headerSection: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  logo: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: FontFamily.regular },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  roleIcon: { marginBottom: Spacing.xs },
  roleLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  roleLabelActive: { color: Colors.primaryLight },
  roleDesc: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 12,
    fontFamily: FontFamily.regular,
  },
  inputContainer: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputRowError: { borderColor: Colors.error },
  inputIcon: { marginRight: Spacing.sm },
  textInput: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    height: '100%',
  },
  eyeBtn: { padding: Spacing.xs },
  errorText: { fontSize: FontSize.xs, color: Colors.error, fontFamily: FontFamily.regular, marginTop: 4 },
  successText: { fontSize: FontSize.xs, color: Colors.success, fontFamily: FontFamily.regular, marginTop: 4 },
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  disabled: { opacity: 0.6 },
  registerBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
  },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: FontFamily.regular },
  footerLink: { fontSize: FontSize.sm, color: Colors.accent, fontFamily: FontFamily.semibold },
});
