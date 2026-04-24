import { BorderRadius, Colors, FontFamily, FontSize, GlassDialog, GlassDialogTitle, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  FAB,
  HelperText,
  Portal,
  ProgressBar,
  Snackbar,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';

const currentMonth = new Date().toISOString().slice(0, 7);

function paymentColor(status: string) {
  if (status === 'paid') return Colors.statusPaid;
  if (status === 'partial') return Colors.statusPending;
  return Colors.statusUnpaid;
}

function paymentLabel(status: string) {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial';
  return 'Unpaid';
}

function StatTile({
  icon, iconBg, iconColor, value, label, borderColor,
}: {
  icon: string; iconBg: string; iconColor: string; value: string; label: string; borderColor: string;
}) {
  return (
    <View style={[tileStyles.tile, { borderColor }]}>
      <View style={[tileStyles.iconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={[tileStyles.value, { color: iconColor }]}>{value}</Text>
      <Text style={tileStyles.label}>{label}</Text>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    lineHeight: 22,
  },
  label: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: Colors.textTertiary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { 
    tuitions,
    initialize,
    cleanup,
    joinTuition,
    getClassCountForMonth, 
    getHomeworkForTuition 
  } = useStudentStore();

  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  // Initialize Firebase listeners
  useEffect(() => {
    if (user?.id) {
      initialize(user.id);
    }
    
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const myTuitions = tuitions;
  const uniqueTeachers = new Set(myTuitions.map((t) => t.teacherId));
  const pendingHomework = myTuitions.reduce((sum, t) => {
    return sum + getHomeworkForTuition(t.id).filter((h) => !h.completed).length;
  }, 0);

  const handleJoinTuition = async () => {
    if (!inviteCode.trim()) {
      setCodeError('Please enter an invite code');
      return;
    }

    if (!user?.id || !user?.name || !user?.email) {
      setCodeError('User information not available');
      return;
    }

    setCodeError('');
    setIsJoining(true);

    try {
      await joinTuition(inviteCode.trim(), user.id, user.name, user.email);
      setShowJoinDialog(false);
      setInviteCode('');
      setSnackMsg('Successfully joined tuition!');
    } catch (error: any) {
      setCodeError(error.message || 'Failed to join tuition');
    } finally {
      setIsJoining(false);
    }
  };

  const ListHeader = () => (
    <>
      {/* ── Stat Tiles ── */}
      <View style={styles.statsRow}>
        <StatTile
          icon="book-education-outline"
          iconBg={Colors.primary + '18'}
          iconColor={Colors.primary}
          value={String(myTuitions.length)}
          label="Tuitions"
          borderColor={Colors.primary + '40'}
        />
        <StatTile
          icon="account-tie-outline"
          iconBg={Colors.success + '18'}
          iconColor={Colors.success}
          value={String(uniqueTeachers.size)}
          label="Teachers"
          borderColor={Colors.success + '40'}
        />
        <StatTile
          icon="notebook-edit-outline"
          iconBg={Colors.warning + '18'}
          iconColor={Colors.warning}
          value={String(pendingHomework)}
          label="Homework"
          borderColor={Colors.warning + '40'}
        />
      </View>

      <Button
        mode="contained-tonal"
        onPress={() => router.push('/(student)/homework')}
        style={styles.hwButton}
        icon="notebook-outline"
      >
        View All Homework
      </Button>

      <Text variant="titleMedium" style={styles.sectionTitle}>My Tuitions</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content
          title={user?.name ? user.name.trim().split(' ').slice(-1)[0] : 'Student'}
          titleStyle={styles.appbarTitle}
        />
        <Appbar.Action icon="logout" onPress={logout} color={Colors.textPrimary} />
      </Appbar.Header>

      <FlatList
        data={myTuitions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No tuitions assigned yet. Ask your teacher to add you.
          </Text>
        }
        renderItem={({ item }) => {
          const classCount = getClassCountForMonth(item.id, currentMonth);
          const planned = item.plannedClassesPerMonth || 1;
          const progress = Math.min(classCount / planned, 1);

          return (
            <Card style={styles.card} mode="elevated">
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium" style={styles.subject}>
                      {item.subject}
                    </Text>
                    <Text variant="bodySmall" style={styles.timeText}>
                      {item.startTime} – {item.endTime} · {item.schedule}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.paymentBadge,
                      { backgroundColor: paymentColor(item.paymentStatus) + '22' },
                    ]}
                  >
                    <Text style={[styles.paymentText, { color: paymentColor(item.paymentStatus) }]}>
                      {paymentLabel(item.paymentStatus)}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <Text variant="bodySmall" style={styles.progressLabel}>
                    {classCount} / {planned} classes this month
                  </Text>
                  <Text variant="bodySmall" style={styles.progressPct}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
                <ProgressBar
                  progress={progress}
                  color={Colors.primary}
                  style={styles.progressBar}
                />
              </Card.Content>

              <Card.Actions>
                <Button
                  mode="text"
                  onPress={() => router.push(`/(student)/tuition/${item.id}` as any)}
                >
                  View Details
                </Button>
              </Card.Actions>
            </Card>
          );
        }}
      />

      <FAB
        icon="plus"
        label="Join Tuition"
        onPress={() => setShowJoinDialog(true)}
        style={styles.fab}
        color={Colors.textOnPrimary}
      />

      <Portal>
        <Dialog visible={showJoinDialog} onDismiss={() => setShowJoinDialog(false)} style={GlassDialog}>
          <View style={styles.dialogHeader}>
            <View style={styles.dialogIconBadge}>
              <MaterialCommunityIcons name="account-plus-outline" size={22} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dialogTitle}>Join Tuition</Text>
              <Text style={styles.dialogSubtitle}>Enter the code from your teacher</Text>
            </View>
          </View>
          <Dialog.Content style={styles.dialogContent}>
            <Text style={styles.fieldLabel}>Invite Code</Text>
            <TextInput
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text.toUpperCase());
                setCodeError('');
              }}
              mode="outlined"
              placeholder="e.g. AB12XY"
              autoCapitalize="characters"
              maxLength={6}
              error={!!codeError}
              disabled={isJoining}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              outlineStyle={{ borderRadius: BorderRadius.md }}
              style={{ backgroundColor: Colors.surface }}
            />
            {codeError ? <HelperText type="error" visible>{codeError}</HelperText> : null}
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button mode="text" textColor={Colors.textSecondary} onPress={() => setShowJoinDialog(false)} disabled={isJoining}>
              Cancel
            </Button>
            <Button mode="contained" buttonColor={Colors.primary} onPress={handleJoinTuition} loading={isJoining} disabled={isJoining} style={{ borderRadius: BorderRadius.md }}>
              Join
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={3000}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  appbar: { backgroundColor: Colors.backgroundDeep },
  appbarTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
  },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  hwButton: { marginBottom: Spacing.xl, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary + '10' },
  sectionTitle: {
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  subject: { fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  timeText: { color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamily.regular },
  paymentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginLeft: Spacing.xs,
  },
  paymentText: { fontSize: FontSize.xs, fontFamily: FontFamily.semibold },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: { color: Colors.textSecondary, fontFamily: FontFamily.regular },
  progressPct: { color: Colors.textSecondary, fontFamily: FontFamily.medium },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dialogIconBadge: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  dialogSubtitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  dialogContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dialogActions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: Spacing['3xl'],
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: Colors.primary,
  },
});
