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
      <View style={styles.statsRow}>
        <Surface style={[styles.statCard, { backgroundColor: Colors.primaryMuted }]} elevation={0}>
          <Text style={styles.statValue}>{myTuitions.length}</Text>
          <Text style={styles.statLabel}>Tuitions</Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: Colors.successLight }]} elevation={0}>
          <Text style={styles.statValue}>{uniqueTeachers.size}</Text>
          <Text style={styles.statLabel}>Teachers</Text>
        </Surface>
        <Surface style={[styles.statCard, { backgroundColor: Colors.warningLight }]} elevation={0}>
          <Text style={styles.statValue}>{pendingHomework}</Text>
          <Text style={styles.statLabel}>{'Pending\nHomework'}</Text>
        </Surface>
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
          title={`Hello, ${user?.name ?? 'Student'}`}
          titleStyle={styles.appbarTitle}
        />
        <Appbar.Action icon="logout" onPress={logout} color={Colors.textOnPrimary} />
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
                  <View style={styles.subjectAvatar}>
                    <Text style={styles.subjectAvatarText}>
                      {item.subject.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
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
          <Dialog.Title style={GlassDialogTitle}>Join Tuition</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: Colors.textSecondary, marginBottom: Spacing.md }}>
              Enter the invite code provided by your teacher
            </Text>
            <TextInput
              label="Invite Code"
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text.toUpperCase());
                setCodeError('');
              }}
              mode="outlined"
              autoCapitalize="characters"
              maxLength={6}
              error={!!codeError}
              disabled={isJoining}
            />
            {codeError ? <HelperText type="error" visible>{codeError}</HelperText> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowJoinDialog(false)} disabled={isJoining}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleJoinTuition} loading={isJoining} disabled={isJoining}>
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
    color: Colors.textOnPrimary,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
  },
  listContent: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
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
  hwButton: { marginBottom: Spacing.xl, borderRadius: BorderRadius.lg },
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
  subjectAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '55',
  },
  subjectAvatarText: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.primaryLight,
  },
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
