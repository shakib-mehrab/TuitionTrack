import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import { generateTuitionPDF } from '@/utils/pdf';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    Appbar,
    Button,
    Card,
    Chip,
    Dialog,
    Divider,
    IconButton,
    Portal,
    ProgressBar,
    Snackbar,
    Text,
    TextInput,
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
  const { user } = useAuthStore();
  const {
    getTuitionById,
    getLogsForTuition,
    getHomeworkForTuition,
    getClassCountForMonth,
    getTotalClassCount,
    markHomeworkComplete,
    addComment,
    classLogs, // Subscribe to trigger re-renders when class logs change
    homework, // Subscribe to trigger re-renders when homework changes
  } = useStudentStore();

  // Prevent ESLint warning - subscriptions are used for reactive updates
  void classLogs;
  void homework;

  const [snackMsg, setSnackMsg] = useState('');
  const [viewingHwId, setViewingHwId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);

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
  const totalClasses = getTotalClassCount(tuition.id);
  const classCount = getClassCountForMonth(tuition.id, currentMonth);
  const planned = tuition.plannedClassesPerMonth || 1;
  const progress = Math.min(totalClasses / planned, 1);
  const remaining = Math.max(planned - totalClasses, 0);

  // Get the current homework being viewed (reactively updates when homework changes)
  const viewingHw = useMemo(() => {
    if (!viewingHwId) return null;
    return homeworkList.find(hw => hw.id === viewingHwId) || null;
  }, [viewingHwId, homeworkList]);

  const handleDownloadPDF = async () => {
    try {
      await generateTuitionPDF(tuition, logs, homeworkList, classCount, planned);
    } catch {
      setSnackMsg('Failed to generate PDF');
    }
  };

  const handleToggleComplete = async (hwId: string, currentStatus: boolean) => {
    try {
      await markHomeworkComplete(hwId, !currentStatus);
      setSnackMsg(currentStatus ? 'Homework marked as pending' : 'Homework marked as complete');
    } catch (error) {
      setSnackMsg('Failed to update homework status');
    }
  };

  const handleAddComment = async (hwId: string, userId: string, userName: string) => {
    if (!commentText.trim()) return;
    
    setIsSending(true);
    try {
      await addComment(hwId, {
        userId,
        userName,
        role: 'student',
        text: commentText.trim(),
      });
      setCommentText('');
      setSnackMsg('Comment added');
    } catch (error) {
      setSnackMsg('Failed to add comment');
    } finally {
      setIsSending(false);
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
              <StatPill label="Done" value={totalClasses} color={Colors.success} />
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

        {/* Homework (Interactive) */}
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
                  <TouchableOpacity onPress={() => setViewingHwId(hw.id)} activeOpacity={0.7} style={styles.hwItem}>
                    <View style={styles.hwRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          variant="bodyMedium"
                          style={[
                            styles.hwChapter,
                            hw.completed && styles.strikethrough,
                          ]}
                        >
                          {hw.subject}
                        </Text>
                        <Text variant="bodySmall" style={styles.hwTask}>
                          Chapter: {hw.chapter}
                        </Text>
                        <Text variant="bodySmall" style={styles.hwTask}>
                          Task: {hw.task}
                        </Text>
                        <View style={styles.hwMetaRow}>
                          <View style={styles.hwMetaItem}>
                            <MaterialCommunityIcons name="calendar-clock" size={14} color={Colors.warning} />
                            <Text variant="bodySmall" style={styles.hwDue}>
                              {formatDate(hw.dueDate)}
                            </Text>
                          </View>
                          {hw.comments.length > 0 && (
                            <View style={styles.hwMetaItem}>
                              <MaterialCommunityIcons name="comment-multiple" size={14} color={Colors.info} />
                              <Text variant="bodySmall" style={styles.hwComments}>
                                {hw.comments.length}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.hwActions}>
                        {hw.completed ? (
                          <Chip
                            style={styles.doneChip}
                            textStyle={{ color: Colors.success, fontSize: FontSize.xs, fontFamily: FontFamily.semibold }}
                            icon="check-circle"
                          >
                            Done
                          </Chip>
                        ) : null}
                        <IconButton
                          icon={hw.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                          iconColor={hw.completed ? Colors.success : Colors.textSecondary}
                          size={20}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(hw.id, hw.completed);
                          }}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        {/* Homework Details Dialog */}
        <Dialog 
          visible={!!viewingHw} 
          onDismiss={() => {
            setViewingHwId(null);
            setCommentText('');
          }} 
          style={styles.dialog}
        >
          <Dialog.Title>{viewingHw?.subject} • {viewingHw?.chapter}</Dialog.Title>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
            <Dialog.ScrollArea>
              <ScrollView 
                contentContainerStyle={{ padding: Spacing.md }} 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
                alwaysBounceVertical={false}
              >
              {viewingHw && (
                <>
                  <View style={styles.hwDetailRow}>
                    <Text style={styles.hwDetailLabel}>Task</Text>
                    <Text style={styles.hwDetailValue}>{viewingHw.task}</Text>
                  </View>
                  <View style={styles.hwDetailRow}>
                    <Text style={styles.hwDetailLabel}>Due Date</Text>
                    <Text style={styles.hwDetailValue}>{formatDate(viewingHw.dueDate)}</Text>
                  </View>
                  {viewingHw.notes && (
                    <View style={styles.hwDetailRow}>
                      <Text style={styles.hwDetailLabel}>Teacher Notes</Text>
                      <Text style={styles.hwDetailValue}>{viewingHw.notes}</Text>
                    </View>
                  )}
                  <View style={styles.hwDetailRow}>
                    <Text style={styles.hwDetailLabel}>Status</Text>
                    <Chip
                      icon={viewingHw.completed ? 'check-circle' : 'clock-outline'}
                      style={{ 
                        backgroundColor: viewingHw.completed ? Colors.success + '22' : Colors.warning + '22', 
                        alignSelf: 'flex-start' 
                      }}
                      textStyle={{ color: viewingHw.completed ? Colors.success : Colors.warning }}
                    >
                      {viewingHw.completed ? 'Completed' : 'Pending'}
                    </Chip>
                  </View>
                  
                  <Divider style={{ marginVertical: Spacing.md }} />
                  
                  <Text variant="titleSmall" style={{ fontFamily: FontFamily.semibold, marginBottom: Spacing.sm }}>
                    Comments ({viewingHw.comments.length})
                  </Text>
                  
                  {viewingHw.comments.length === 0 ? (
                    <Text style={{ color: Colors.textSecondary, fontStyle: 'italic', marginBottom: Spacing.sm }}>
                      No comments yet. Add one below!
                    </Text>
                  ) : (
                    <View style={{ marginBottom: Spacing.sm }}>
                      {viewingHw.comments.map((comment: any) => (
                        <View 
                          key={comment.id} 
                          style={[
                            styles.commentBox,
                            comment.role === 'teacher' ? styles.teacherComment : styles.studentComment
                          ]}
                        >
                          <View style={styles.commentHeader}>
                            <Text style={styles.commentAuthor}>
                              {comment.userName} {comment.role === 'teacher' ? '(Teacher)' : ''}
                            </Text>
                            <Text style={styles.commentTime2}>{formatTime(comment.timestamp)}</Text>
                          </View>
                          <Text style={styles.commentText2}>{comment.text}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Add Comment */}
                  <View style={styles.addCommentRow}>
                    <TextInput
                      mode="outlined"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      dense
                      style={styles.commentInput}
                      disabled={isSending}
                    />
                    <Button
                      mode="contained"
                      onPress={() => handleAddComment(viewingHw.id, user?.id ?? '', user?.name ?? 'Student')}
                      disabled={!commentText.trim() || isSending}
                      loading={isSending}
                      compact
                    >
                      Send
                    </Button>
                  </View>
                </>
              )}
              </ScrollView>
            </Dialog.ScrollArea>
          </KeyboardAvoidingView>
          <Dialog.Actions>
            <Button onPress={() => {
              setViewingHwId(null);
              setCommentText('');
            }}>
              Close
            </Button>
            <Button 
              mode="contained" 
              icon={viewingHw?.completed ? 'checkbox-blank-circle-outline' : 'check-circle'}
              onPress={() => {
                if (viewingHw) {
                  handleToggleComplete(viewingHw.id, viewingHw.completed);
                }
              }}
            >
              Mark as {viewingHw?.completed ? 'Pending' : 'Done'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  hwItem: {
    backgroundColor: Colors.surfaceVariant + '40',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border + '60',
  },
  hwRow: { flexDirection: 'row', alignItems: 'flex-start' },
  hwChapter: { fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  hwTask: { color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamily.regular },
  hwMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: 4 },
  hwMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hwDue: { color: Colors.warning, fontSize: FontSize.xs, fontFamily: FontFamily.regular },
  hwNotes: { color: Colors.info, marginTop: 2, fontSize: FontSize.xs, fontFamily: FontFamily.regular, fontStyle: 'italic' },
  hwComments: { color: Colors.primary, fontSize: FontSize.xs, fontFamily: FontFamily.regular },
  hwActions: { flexDirection: 'row', alignItems: 'center' },
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
  dialog: { maxHeight: '80%' },
  hwDetailRow: { marginBottom: Spacing.md },
  hwDetailLabel: { 
    fontSize: FontSize.xs, 
    color: Colors.textTertiary, 
    fontFamily: FontFamily.semibold, 
    textTransform: 'uppercase', 
    marginBottom: 4 
  },
  hwDetailValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontFamily: FontFamily.regular },
  commentBox: { 
    backgroundColor: Colors.surfaceVariant, 
    padding: Spacing.sm, 
    borderRadius: BorderRadius.md, 
    marginBottom: Spacing.xs 
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { fontSize: FontSize.xs, fontFamily: FontFamily.semibold, color: Colors.primary },
  commentTime2: { fontSize: FontSize.xs, fontFamily: FontFamily.regular, color: Colors.textTertiary },
  commentText2: { fontSize: FontSize.sm, fontFamily: FontFamily.regular, color: Colors.textPrimary },
  addCommentRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  commentInput: { flex: 1, backgroundColor: Colors.surface, fontSize: FontSize.sm },
});
