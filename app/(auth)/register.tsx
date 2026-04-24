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
    TouchableOpacity,
    View,
} from 'react-native';

import AppButton from '@/components/ui/AppButton';
import AppInput from '@/components/ui/AppInput';

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
      router.push('/(auth)/verify-email');
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
                    color={role === r.value ? Colors.primary : Colors.textSecondary}
                    style={styles.roleIcon}
                  />
                  <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>
                    {r.label}
                  </Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formGroup}>
              <AppInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                icon="account-outline"
                autoCapitalize="words"
              />

              <AppInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                icon="email-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <AppInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                icon="lock-outline"
                secureTextEntry
              />

              <AppInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                icon="lock-outline"
                secureTextEntry
                error={confirmPassword.length > 0 && confirmPassword !== password ? 'Passwords do not match' : undefined}
              />

              <AppButton
                label="Create Account"
                onPress={handleRegister}
                loading={isLoading}
                fullWidth
                style={styles.registerBtn}
              />
            </View>
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
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.surface,
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
  roleLabelActive: { color: Colors.primary },
  roleDesc: {
    fontSize: 9,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 12,
    fontFamily: FontFamily.regular,
  },
  formGroup: {
    gap: Spacing.xs,
  },
  registerBtn: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing['2xl'],
  },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: FontFamily.regular },
  footerLink: { fontSize: FontSize.sm, color: Colors.accent, fontFamily: FontFamily.semibold },
});
