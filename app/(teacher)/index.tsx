import { BorderRadius, Colors, FontFamily, FontSize, GlassDialog, GlassDialogTitle, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useTeacherStore } from '@/store/teacherStore';
import type { Tuition } from '@/types';
import { generateTuitionPDF } from '@/utils/pdf';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  Divider,
  FAB,
  Portal,
  ProgressBar,
  Snackbar,
  Text
} from 'react-native-paper';

type DialogType = 'reset' | 'delete' | null;

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

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    tuitions,
    classLogs, // Subscribe to trigger re-renders when class logs change
    isLoading,
    initialize,
    cleanup,
    addClassLog,
    deleteClassLog,
    resetClassLogs,
    deleteTuition,
    getClassCountForMonth,
    getTotalClassCount,
    getLogsForTuition,
    getHomeworkForTuition,
  } = useTeacherStore();

  // Prevent ESLint warning - classLogs is used for subscription
  void classLogs;

  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedTuition, setSelectedTuition] = useState<Tuition | null>(null);
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

  const activeTuitions = tuitions.filter((t) => t.status === 'active');
  const uniqueStudentIds = new Set(
    tuitions.flatMap((t) => {
      const ids = t.studentIds || [];
      if (t.studentId && !ids.includes(t.studentId)) ids.push(t.studentId);
      return ids;
    })
  );
  const totalSalary = activeTuitions.reduce((sum, t) => sum + (t.salary ?? 0), 0);

  const handleAddClass = async (tuition: Tuition) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await addClassLog(tuition.id, today);
      setSnackMsg(`Class added for ${tuition.subject}`);
    } catch {
      setSnackMsg('Failed to add class');
    }
  };

  const handleDeleteLastClass = async (tuition: Tuition) => {
    const logs = getLogsForTuition(tuition.id);
    if (logs.length === 0) {
      setSnackMsg('No classes to remove');
      return;
    }
    try {
      await deleteClassLog(logs[0].id, tuition.id);
      setSnackMsg(`Last class removed for ${tuition.subject}`);
    } catch {
      setSnackMsg('Failed to delete class');
    }
  };

  const openDialog = (type: DialogType, tuition: Tuition) => {
    setSelectedTuition(tuition);
    setDialogType(type);
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedTuition(null);
  };

  const handleDownloadReport = async (tuition: Tuition) => {
    const logs = getLogsForTuition(tuition.id);
    const homeworkList = getHomeworkForTuition(tuition.id);
    const totalClasses = getTotalClassCount(tuition.id);
    const classCount = getClassCountForMonth(tuition.id, currentMonth);
    const planned = tuition.plannedClassesPerMonth || 1;
    try {
      await generateTuitionPDF(tuition, logs, homeworkList, totalClasses, planned);
    } catch {
      setSnackMsg('Failed to generate PDF');
    }
  };

  const confirmReset = async () => {
    if (!selectedTuition) return;
    try {
      await resetClassLogs(selectedTuition.id);
      setSnackMsg(`Class logs reset for ${selectedTuition.subject}`);
      closeDialog();
    } catch {
      setSnackMsg('Failed to reset class logs');
    }
  };

  const confirmDelete = async () => {
    if (!selectedTuition) return;
    try {
      await deleteTuition(selectedTuition.id);
      setSnackMsg('Tuition deleted');
      closeDialog();
    } catch {
      setSnackMsg('Failed to delete tuition');
    }
  };

  const renderTuitionCard = ({ item }: { item: Tuition }) => {
    const totalClasses = getTotalClassCount(item.id);
    const classCount = getClassCountForMonth(item.id, currentMonth);
    const planned = item.plannedClassesPerMonth || 1;
    const progress = Math.min(totalClasses / planned, 1);

    return (
      <Card style={styles.card} mode="elevated" onPress={() => router.push(`/(teacher)/tuition/${item.id}` as any)}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={styles.subject}>
                {item.enrolledStudents && item.enrolledStudents.length > 0
                  ? item.enrolledStudents.map(s => s.name).join(', ')
                  : item.studentName ?? 'No students assigned'}
              </Text>
              <Text variant="bodySmall" style={styles.timeText}>
                {item.subject} · {item.startTime} – {item.endTime}
              </Text>
            </View>
            <View
              style={[
                styles.paymentBadge,
                { backgroundColor: paymentColor(item.paymentStatus) + '22' },
              ]}
            >
              <Text
                style={[
                  styles.paymentText,
                  { color: paymentColor(item.paymentStatus) },
                ]}
              >
                {paymentLabel(item.paymentStatus)}
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <Text variant="bodySmall" style={styles.progressLabel}>
              {totalClasses} / {planned} classes (Last: {getLogsForTuition(item.id)[0] ? new Date(getLogsForTuition(item.id)[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'None'})
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

          <Divider style={{ marginTop: Spacing.md, marginBottom: Spacing.sm, marginHorizontal: -Spacing.md }} />
          <View style={styles.cardActionsRow}>
            <Button
              compact
              mode="text"
              textColor={Colors.primary}
              style={{ paddingHorizontal: 0, minWidth: 0, alignSelf: 'center' }}
              onPress={() => router.push(`/(teacher)/tuition/${item.id}` as any)}
            >
              View
            </Button>
            <View style={styles.iconActionGroup}>
              <View style={styles.actionBtnWrapper}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => handleAddClass(item)}>
                  <MaterialCommunityIcons name="plus" size={18} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.actionBtnCaption}>Add</Text>
              </View>
              <View style={styles.actionBtnWrapper}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.warning }]} onPress={() => handleDeleteLastClass(item)}>
                  <MaterialCommunityIcons name="minus" size={18} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.actionBtnCaption}>Remove</Text>
              </View>
              <View style={styles.actionBtnWrapper}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.info }]} onPress={() => openDialog('reset', item)}>
                  <MaterialCommunityIcons name="refresh" size={16} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.actionBtnCaption}>Reset</Text>
              </View>
              <View style={styles.actionBtnWrapper}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.error }]} onPress={() => openDialog('delete', item)}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.actionBtnCaption}>Delete</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const ListHeader = () => (
    <>
      {/* ── Stat Tiles ── */}
      <View style={styles.statsRow}>
        <StatTile
          icon="book-education-outline"
          iconBg={Colors.primary + '18'}
          iconColor={Colors.primary}
          value={String(activeTuitions.length)}
          label="Active Tuitions"
          borderColor={Colors.primary + '40'}
        />
        <StatTile
          icon="account-group-outline"
          iconBg={Colors.success + '18'}
          iconColor={Colors.success}
          value={String(uniqueStudentIds.size)}
          label="Students"
          borderColor={Colors.success + '40'}
        />
        <StatTile
          icon="cash-multiple"
          iconBg={Colors.warning + '18'}
          iconColor={Colors.warning}
          value={`৳${totalSalary >= 1000 ? (totalSalary / 1000).toFixed(1) + 'k' : totalSalary}`}
          label="Monthly"
          borderColor={Colors.warning + '40'}
        />
      </View>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        My Tuitions
      </Text>
    </>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content
          title={user?.name ? user.name.trim().split(' ').slice(-1)[0] : 'Teacher'}
          titleStyle={styles.appbarTitle}
        />
        <Appbar.Action
          icon="logout"
          onPress={logout}
          color={Colors.textPrimary}
        />
      </Appbar.Header>

      {isLoading && tuitions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading tuitions...</Text>
        </View>
      ) : (
        <FlatList
          data={tuitions}
          keyExtractor={(item) => item.id}
          renderItem={renderTuitionCard}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No tuitions yet. Tap + to add one.
            </Text>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color={Colors.white}
        onPress={() => router.push('/(teacher)/tuition/add')}
      />

      <Portal>
        <Dialog visible={dialogType === 'reset'} onDismiss={closeDialog} style={GlassDialog}>
          <Dialog.Title style={GlassDialogTitle}>Reset Class Logs?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This will clear all class logs for{' '}
              <Text style={styles.boldText}>
                {selectedTuition?.subject}
              </Text>
              {' '}and reset the payment status to Unpaid. The tuition itself will remain intact.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button
              icon="download"
              textColor={Colors.accent}
              onPress={() => selectedTuition && handleDownloadReport(selectedTuition)}
            >
              Download
            </Button>
            <Button onPress={confirmReset} textColor={Colors.error}>
              Reset
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={dialogType === 'delete'} onDismiss={closeDialog} style={GlassDialog}>
          <Dialog.Title style={GlassDialogTitle}>Delete Tuition?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Delete{' '}
              <Text style={styles.boldText}>
                {selectedTuition?.subject}
              </Text>{' '}
              for{' '}
              <Text style={styles.boldText}>
                {selectedTuition?.enrolledStudents && selectedTuition.enrolledStudents.length > 0
                  ? selectedTuition.enrolledStudents.map(s => s.name).join(', ')
                  : selectedTuition?.studentName ?? 'unassigned class'}
              </Text>
              ? All class logs and homework will be permanently removed.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button
              icon="download"
              textColor={Colors.accent}
              onPress={() => selectedTuition && handleDownloadReport(selectedTuition)}
            >
              Download
            </Button>
            <Button onPress={confirmDelete} textColor={Colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={2500}
        style={styles.snackbar}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
  },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  subject: { fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  studentName: { color: Colors.primaryLight, marginTop: 2, fontFamily: FontFamily.medium },
  timeText: { color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamily.regular },
  paymentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginLeft: Spacing.sm,
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
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  iconActionGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtnWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  actionBtnCaption: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    backgroundColor: Colors.primary,
  },
  snackbar: { bottom: 80 },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontFamily: FontFamily.regular,
    marginTop: Spacing['3xl'],
  },
  boldText: { fontFamily: FontFamily.semibold },
});
