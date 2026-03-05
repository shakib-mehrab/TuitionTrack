import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/Colors';
import { useTeacherStore } from '@/store/teacherStore';
import { generateTuitionPDF } from '@/utils/pdf';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Appbar,
    Card,
    Chip,
    Divider,
    ProgressBar,
    Snackbar,
    Text,
} from 'react-native-paper';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const currentMonth = new Date().toISOString().slice(0, 7);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

export default function StudentTuitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    getTuitionById,
    getLogsForTuition,
    getHomeworkForTuition,
    getClassCountForMonth,
  } = useTeacherStore();

  const [snackMsg, setSnackMsg] = useState('');

  const tuition = getTuitionById(id);

  if (!tuition) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors.textSecondary }}>Tuition not found.</Text>
      </View>
    );
  }

  const logs = getLogsForTuition(tuition.id);
  const homeworkList = getHomeworkForTuition(tuition.id);
  const classCount = getClassCountForMonth(tuition.id, currentMonth);
  const planned = tuition.plannedClassesPerMonth || 1;
  const progress = Math.min(classCount / planned, 1);
  const remaining = Math.max(planned - classCount, 0);

  const handleDownloadPDF = async () => {
    try {
      await generateTuitionPDF(tuition, logs, homeworkList, classCount, planned);
    } catch {
      setSnackMsg('Failed to generate PDF');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} color={Colors.textOnPrimary} />
        <Appbar.Content
          title={tuition.subject}
          titleStyle={styles.appbarTitle}
        />
        <Appbar.Action
          icon="file-pdf-box"
          color={Colors.accent}
          onPress={handleDownloadPDF}
        />
        <Chip
          style={[
            styles.appbarBadge,
            { backgroundColor: paymentColor(tuition.paymentStatus) + '33' },
          ]}
          textStyle={{ color: paymentColor(tuition.paymentStatus), fontSize: FontSize.xs, fontFamily: FontFamily.semibold }}
        >
          {paymentLabel(tuition.paymentStatus)}
        </Chip>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Info Card */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardTitle}>Class Info</Text>
            <InfoRow label="Time" value={`${tuition.startTime} – ${tuition.endTime}`} />
            <InfoRow label="Schedule" value={tuition.schedule} />
            <InfoRow label="Days/Week" value={String(tuition.datesPerWeek)} />
            {tuition.salary && (
              <InfoRow label="Monthly Fee" value={`৳${tuition.salary.toLocaleString()}`} />
            )}
            <InfoRow label="Since" value={formatDate(tuition.createdAt)} />
          </Card.Content>
        </Card>

        {/* Progress Card */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardTitle}>
              Progress — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <View style={styles.statsRow}>
              <StatPill label="Planned" value={planned} color={Colors.primary} />
              <StatPill label="Done" value={classCount} color={Colors.success} />
              <StatPill label="Remaining" value={remaining} color={Colors.warning} />
            </View>
            <ProgressBar
              progress={progress}
              color={Colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressText}>
              {Math.round(progress * 100)}% of monthly target
            </Text>
          </Card.Content>
        </Card>

        {/* Class Logs (read-only) */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardTitle}>
              Class Logs ({logs.length})
            </Text>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No classes logged yet.</Text>
            ) : (
              <>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 0.5 }]}>#</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Date</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Day</Text>
                </View>
                {logs.map((log, idx) => (
                  <View
                    key={log.id}
                    style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
                  >
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{logs.length - idx}</Text>
                    <Text style={styles.tableCell}>{formatDate(log.date)}</Text>
                    <Text style={styles.tableCell}>{DAY_NAMES[new Date(log.date).getDay()]}</Text>
                  </View>
                ))}
              </>
            )}
          </Card.Content>
        </Card>

        {/* Homework (read-only) */}
        <Card style={[styles.card, { marginBottom: Spacing['2xl'] }]} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardTitle}>
              Homework ({homeworkList.length})
            </Text>
            {homeworkList.length === 0 ? (
              <Text style={styles.emptyText}>No homework assigned yet.</Text>
            ) : (
              homeworkList.map((hw, idx) => (
                <View key={hw.id}>
                  {idx > 0 && <Divider style={{ marginVertical: Spacing.sm }} />}
                  <View style={styles.hwRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.hwChapter,
                          hw.completed && styles.strikethrough,
                        ]}
                      >
                        {hw.chapter}
                      </Text>
                      <Text variant="bodySmall" style={styles.hwTask}>
                        {hw.task}
                      </Text>
                      <Text variant="bodySmall" style={styles.hwDue}>
                        Due: {formatDate(hw.dueDate)}
                      </Text>
                      {hw.notes && (
                        <Text variant="bodySmall" style={styles.hwNotes}>
                          Note: {hw.notes}
                        </Text>
                      )}
                    </View>
                    {hw.completed && (
                      <Chip
                        style={styles.doneChip}
                        textStyle={{ color: Colors.success, fontSize: FontSize.xs, fontFamily: FontFamily.semibold }}
                        icon="check-circle"
                      >
                        Done
                      </Chip>
                    )}
                  </View>

                  {/* Comments (read-only) */}
                  {hw.comments.length > 0 && (
                    <View style={styles.commentsBlock}>
                      {hw.comments.map((c) => (
                        <View
                          key={c.id}
                          style={[
                            styles.comment,
                            c.role === 'teacher'
                              ? styles.teacherComment
                              : styles.studentComment,
                          ]}
                        >
                          <Text style={styles.commentName}>{c.userName}</Text>
                          <Text style={styles.commentText}>{c.text}</Text>
                          <Text style={styles.commentTime}>{formatTime(c.timestamp)}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={2500}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statPill, { borderColor: color + '55', backgroundColor: color + '11' }]}>
      <Text style={[styles.statPillValue, { color }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appbar: { backgroundColor: Colors.backgroundDeep },
  appbarTitle: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },
  appbarBadge: { marginRight: Spacing.sm, height: 28 },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  card: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, fontFamily: FontFamily.regular },
  infoValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontFamily: FontFamily.medium,
    flex: 1.5,
    textAlign: 'right',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statPillValue: { fontSize: FontSize.lg, fontFamily: FontFamily.bold },
  statPillLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamily.regular },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: Colors.border },
  progressText: { color: Colors.textSecondary, textAlign: 'right', marginTop: 4, fontFamily: FontFamily.regular },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  tableRowAlt: { backgroundColor: Colors.surfaceVariant },
  tableHeader: { borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 2 },
  tableHeaderText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
  },
  tableCell: { flex: 1, fontSize: FontSize.xs, color: Colors.textPrimary, fontFamily: FontFamily.regular },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.regular,
  },
  hwRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.xs },
  hwChapter: { fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  hwTask: { color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamily.regular },
  hwDue: { color: Colors.warning, marginTop: 2, fontSize: FontSize.xs, fontFamily: FontFamily.regular },
  hwNotes: { color: Colors.info, marginTop: 2, fontSize: FontSize.xs, fontFamily: FontFamily.regular },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textTertiary },
  doneChip: { backgroundColor: Colors.successLight, height: 28, alignSelf: 'flex-start' },
  commentsBlock: { marginTop: Spacing.sm, gap: Spacing.xs },
  comment: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  teacherComment: { backgroundColor: Colors.primaryMuted, alignSelf: 'flex-start', maxWidth: '85%' },
  studentComment: { backgroundColor: Colors.surfaceVariant, alignSelf: 'flex-end', maxWidth: '85%' },
  commentName: { fontSize: FontSize.xs, fontFamily: FontFamily.semibold, color: Colors.textSecondary, marginBottom: 2 },
  commentText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontFamily: FontFamily.regular },
  commentTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2, textAlign: 'right', fontFamily: FontFamily.regular },
});
