import { BorderRadius, Colors, FontFamily, FontSize, GlassDialog, GlassDialogTitle, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useTeacherStore } from '@/store/teacherStore';
import type { Tuition } from '@/types';
import { generateTuitionPDF } from '@/utils/pdf';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Dialog,
  FAB,
  Portal,
  ProgressBar,
  Snackbar,
  Surface,
  Text,
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

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    tuitions,
    addClassLog,
    deleteClassLog,
    resetClassLogs,
    deleteTuition,
    getClassCountForMonth,
    getLogsForTuition,
    getHomeworkForTuition,
  } = useTeacherStore();

  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [selectedTuition, setSelectedTuition] = useState<Tuition | null>(null);
  const [snackMsg, setSnackMsg] = useState('');

  const activeTuitions = tuitions.filter((t) => t.status === 'active');
  const uniqueStudentIds = new Set(
    tuitions.filter((t) => t.studentId).map((t) => t.studentId)
  );
  const totalSalary = activeTuitions.reduce((sum, t) => sum + (t.salary ?? 0), 0);

  const handleAddClass = (tuition: Tuition) => {
    const today = new Date().toISOString().slice(0, 10);
    addClassLog(tuition.id, today);
    setSnackMsg(`Class added for ${tuition.subject}`);
  };

  const handleDeleteLastClass = (tuition: Tuition) => {
    const logs = getLogsForTuition(tuition.id);
    if (logs.length === 0) {
      setSnackMsg('No classes to remove');
      return;
    }
    deleteClassLog(logs[0].id);
    setSnackMsg(`Last class removed for ${tuition.subject}`);
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
    const classCount = getClassCountForMonth(tuition.id, currentMonth);
    const planned = tuition.plannedClassesPerMonth || 1;
    try {
      await generateTuitionPDF(tuition, logs, homeworkList, classCount, planned);
    } catch {
      setSnackMsg('Failed to generate PDF');
    }
  };

  const confirmReset = () => {
    if (!selectedTuition) return;
    resetClassLogs(selectedTuition.id);
    setSnackMsg(`Class logs reset for ${selectedTuition.subject}`);
    closeDialog();
  };

  const confirmDelete = () => {
    if (!selectedTuition) return;
    deleteTuition(selectedTuition.id);
    setSnackMsg('Tuition deleted');
    closeDialog();
  };

  const renderTuitionCard = ({ item }: { item: Tuition }) => {
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
              <Text variant="bodySmall" style={styles.studentName}>
                {item.studentName ?? 'No student assigned'}
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

        <Card.Actions style={styles.cardActions}>
          <Button
            compact
            mode="text"
            onPress={() => router.push(`/(teacher)/tuition/${item.id}` as any)}
          >
            View
          </Button>
          <Button
            compact
            mode="text"
            textColor={Colors.success}
            onPress={() => handleAddClass(item)}
          >
            + Class
          </Button>
          <Button
            compact
            mode="text"
            textColor={Colors.warning}
            onPress={() => handleDeleteLastClass(item)}
          >
            – Class
          </Button>
          <Button
            compact
            mode="text"
            textColor={Colors.info}
            onPress={() => openDialog('reset', item)}
          >
            Reset
          </Button>
          <Button
            compact
            mode="text"
            textColor={Colors.error}
            onPress={() => openDialog('delete', item)}
          >
            Delete
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  const ListHeader = () => (
    <>
      <View style={styles.statsRow}>
        <Surface
          style={[styles.statCard, { backgroundColor: Colors.primaryMuted }]}
          elevation={0}
        >
          <Text style={styles.statValue}>{activeTuitions.length}</Text>
          <Text style={styles.statLabel}>{'Active\nTuitions'}</Text>
        </Surface>
        <Surface
          style={[styles.statCard, { backgroundColor: Colors.successLight }]}
          elevation={0}
        >
          <Text style={styles.statValue}>{uniqueStudentIds.size}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </Surface>
        <Surface
          style={[styles.statCard, { backgroundColor: Colors.warningLight }]}
          elevation={0}
        >
          <Text style={styles.statValue}>৳{totalSalary.toLocaleString()}</Text>
          <Text style={styles.statLabel}>{'Monthly\nSalary'}</Text>
        </Surface>
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
          title={`Hello, ${user?.name ?? 'Teacher'}`}
          titleStyle={styles.appbarTitle}
        />
        <Appbar.Action
          icon="logout"
          onPress={logout}
          color={Colors.textOnPrimary}
        />
      </Appbar.Header>

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
              . The tuition itself will remain intact.
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
                {selectedTuition?.studentName ?? 'unassigned student'}
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
    color: Colors.textOnPrimary,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
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
  cardActions: { paddingHorizontal: Spacing.xs, flexWrap: 'wrap' },
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
