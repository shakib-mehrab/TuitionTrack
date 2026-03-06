import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Role = 'teacher' | 'student';

const ROLES: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'teacher', label: 'Teacher', icon: 'human-male-board', desc: 'Manage students & tuitions' },
  { value: 'student', label: 'Student', icon: 'account-school-outline', desc: 'View classes & homework' },
];

export default function GoogleRoleSelectScreen() {
  const router = useRouter();
  const { completeGoogleSignIn, logout, isLoading, pendingGoogleUser } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role>('teacher');

  const handleConfirm = async () => {
    try {
      await completeGoogleSignIn(selectedRole);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to complete sign-in.');
    }
  };

  const handleCancel = async () => {
    await logout();
    router.replace('/(auth)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="google" size={40} color={Colors.accent} />
          <Text style={styles.title}>One last step</Text>
          <Text style={styles.subtitle}>
            Welcome{pendingGoogleUser?.name ? `, ${pendingGoogleUser.name}` : ''}!{'\n'}
            How will you use TuitionTrack?
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {ROLES.map((role) => {
            const selected = selectedRole === role.value;
            return (
              <TouchableOpacity
                key={role.value}
                style={[styles.roleCard, selected && styles.roleCardSelected]}
                onPress={() => setSelectedRole(role.value)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={role.icon as any}
                  size={36}
                  color={selected ? Colors.primary : Colors.textSecondary}
                  style={styles.roleIcon}
                />
                <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
                  {role.label}
                </Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
                {selected && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={Colors.primary}
                    style={styles.checkIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, isLoading && styles.btnDisabled]}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          <Text style={styles.confirmBtnText}>
            {isLoading ? 'Setting up…' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={isLoading}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDeep },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing['3xl'],
  },
  header: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  rolesContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  roleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  roleIcon: { marginBottom: Spacing.sm },
  roleLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  roleLabelSelected: { color: Colors.primary },
  roleDesc: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  checkIcon: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  confirmBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
  },
  cancelBtn: { alignItems: 'center', padding: Spacing.sm },
  cancelBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
});
