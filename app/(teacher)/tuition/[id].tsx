import { DatePickerInput } from '@/components/ui/DateTimePicker';
import { BorderRadius, Colors, FontFamily, FontSize, GlassDialog, GlassDialogPrimary, GlassDialogTitle, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useTeacherStore } from '@/store/teacherStore';
import type { Homework, PaymentStatus } from '@/types';
import { generatePaymentReceipt, generateTuitionPDF } from '@/utils/pdf';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Clipboard, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  HelperText,
  IconButton,
  List,
  Portal,
  ProgressBar,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';

type DialogMode =
  | 'addClass'
  | 'addHomework'
  | 'editHomework'
  | 'deleteHomework'
  | 'viewHomework'
  | 'payment'
  | 'inviteStudent'
  | null;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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

export default function TuitionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    getTuitionById,
    getLogsForTuition,
    getHomeworkForTuition,
    getActivityForTuition,
    getClassCountForMonth,
    getTotalClassCount,
    addClassLog,
    deleteClassLog,
    addHomework,
    updateHomework,
    deleteHomework,
    markHomeworkComplete,
    updatePaymentStatus,
    generateInviteCode,
    addComment,
    classLogs, // Subscribe to trigger re-renders when class logs change
    homework, // Subscribe to trigger re-renders when homework changes
    activityLogs, // Subscribe to trigger re-renders when activity logs change
  } = useTeacherStore();

  // Prevent ESLint warning - subscriptions are used for reactive updates
  void classLogs;
  void homework;
  void activityLogs;

  const tuition = getTuitionById(id);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const logs = tuition ? getLogsForTuition(tuition.id) : [];
  const homeworkList = tuition ? getHomeworkForTuition(tuition.id) : [];
  const activityList = tuition ? getActivityForTuition(tuition.id) : [];
  const totalClasses = tuition ? getTotalClassCount(tuition.id) : 0;
  const classCount = tuition ? getClassCountForMonth(tuition.id, currentMonth) : 0;

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [snackMsg, setSnackMsg] = useState('');

  // Add class log state
  const [classDate, setClassDate] = useState(new Date().toISOString().slice(0, 10));
  const [classDateError, setClassDateError] = useState('');

  // Homework form state
  const [hwSubject, setHwSubject] = useState('');
  const [hwChapter, setHwChapter] = useState('');
  const [hwTask, setHwTask] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');
  const [hwNotes, setHwNotes] = useState('');
  const [hwErrors, setHwErrors] = useState<Record<string, string>>({});
  const [viewingHwId, setViewingHwId] = useState<string | null>(null);
  const [editingHw, setEditingHw] = useState<Homework | null>(null);
  const [deletingHw, setDeletingHw] = useState<Homework | null>(null);

  // Invite code state
  const [inviteCode, setInviteCode] = useState<string>('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Get the current homework being viewed (reactively updates when homework changes)
  const viewingHw = useMemo(() => {
    if (!viewingHwId) return null;
    return homeworkList.find(hw => hw.id === viewingHwId) || null;
  }, [viewingHwId, homeworkList]);

  if (!tuition) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge" style={{ color: Colors.textSecondary }}>
          Tuition not found.
        </Text>
      </View>
    );
  }

  const planned = tuition.plannedClassesPerMonth || 1;
  const progress = Math.min(totalClasses / planned, 1);
  const remaining = Math.max(planned - totalClasses, 0);

  const closeDialog = () => {
    setDialogMode(null);
    setClassDate(new Date().toISOString().slice(0, 10));
    setClassDateError('');
    setHwSubject('');
    setHwChapter('');
    setHwTask('');
    setHwDueDate('');
    setHwNotes('');
    setHwErrors({});
    setEditingHw(null);
    setDeletingHw(null);
    setViewingHwId(null);
    setCommentText('');
    setIsSending(false);
  };

  const handleDownloadPDF = async () => {
    try {
      await generateTuitionPDF(tuition, logs, homeworkList, totalClasses, planned);
    } catch {
      setSnackMsg('Failed to generate PDF');
    }
  };

  const handleGenerateInviteCode = async () => {
    if (!user?.id || !tuition) return;
    setIsGeneratingCode(true);
    try {
      const code = await generateInviteCode(tuition.id, user.id);
      setInviteCode(code);
      setDialogMode('inviteStudent');
    } catch {
      setSnackMsg('Failed to generate invite code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    Clipboard.setString(inviteCode);
    setSnackMsg('Invite code copied to clipboard!');
  };

  const handleInviteStudent = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `You have been invited to join TuitionTrack!\n\nSubject: ${tuition.subject}\nSchedule: ${tuition.schedule} | ${tuition.startTime} – ${tuition.endTime}\n\nUse this invite code when joining:\n${inviteCode}`,
        title: `TuitionTrack — ${tuition.subject} Invite`,
      });
    } catch {
      setSnackMsg('Could not open share dialog');
    }
  };

  // ── Class Log handlers ──
  const handleAddClass = async () => {
    if (!classDate) {
      setClassDateError('Please select a date');
      return;
    }
    
    // Close dialog immediately for better UX
    const dateToLog = classDate;
    closeDialog();
    
    // Perform async operation in background
    try {
      await addClassLog(tuition.id, dateToLog);
      setSnackMsg('Class logged');
    } catch {
      setSnackMsg('Failed to add class');
    }
  };

  // ── Homework handlers ──
  const validateHw = () => {
    const e: Record<string, string> = {};
    if (!hwSubject.trim()) e.subject = 'Subject is required';
    if (!hwChapter.trim()) e.chapter = 'Chapter is required';
    if (!hwTask.trim()) e.task = 'Task is required';
    if (!hwDueDate.trim()) e.dueDate = 'Due date is required';
    setHwErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddHomework = async () => {
    if (!validateHw()) return;
    
    // Capture values and close dialog immediately
    const homeworkData = {
      tuitionId: tuition.id,
      teacherId: user?.id ?? '',
      subject: hwSubject.trim(),
      chapter: hwChapter.trim(),
      task: hwTask.trim(),
      dueDate: hwDueDate.trim(),
      notes: hwNotes.trim() || undefined,
    };
    closeDialog();
    
    // Perform async operation in background
    try {
      await addHomework(homeworkData);
      setSnackMsg('Homework assigned');
    } catch {
      setSnackMsg('Failed to add homework');
    }
  };

  const handleEditHomework = async () => {
    if (!editingHw || !validateHw()) return;
    
    // Capture values and close dialog immediately
    const hwId = editingHw.id;
    const updatedData = {
      subject: hwSubject.trim(),
      chapter: hwChapter.trim(),
      task: hwTask.trim(),
      dueDate: hwDueDate.trim(),
      notes: hwNotes.trim() || undefined,
    };
    closeDialog();
    
    // Perform async operation in background
    try {
      await updateHomework(hwId, updatedData);
      setSnackMsg('Homework updated');
    } catch {
      setSnackMsg('Failed to update homework');
    }
  };

  const openEditHomework = (hw: Homework) => {
    setEditingHw(hw);
    setHwSubject(hw.subject);
    setHwChapter(hw.chapter);
    setHwTask(hw.task);
    setHwDueDate(hw.dueDate);
    setHwNotes(hw.notes ?? '');
    setDialogMode('editHomework');
  };

  const openAddHomework = () => {
    setHwSubject(tuition.subject); // Pre-fill with tuition subject
    setDialogMode('addHomework');
  };

  const handleDeleteHomework = async () => {
    if (!deletingHw) return;
    
    // Capture value and close dialog immediately
    const hwId = deletingHw.id;
    closeDialog();
    
    // Perform async operation in background
    try {
      await deleteHomework(hwId);
      setSnackMsg('Homework deleted');
    } catch {
      setSnackMsg('Failed to delete homework');
    }
  };

  const handleDownloadReceipt = async () => {
    if (!tuition || !user) return;
    try {
      await generatePaymentReceipt(
        tuition,
        totalClasses,
        planned,
        user.name,
        currentMonth
      );
    } catch {
      setSnackMsg('Failed to generate receipt');
    }
  };

  const handleAddComment = async (homeworkId: string, userId: string, userName: string) => {
    if (!commentText.trim()) return;
    setIsSending(true);
    try {
      await addComment(homeworkId, {
        userId,
        userName,
        role: 'teacher',
        text: commentText.trim(),
      });
      setCommentText('');
      setSnackMsg('Comment added');
    } catch {
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
          subtitle={
            tuition.enrolledStudents && tuition.enrolledStudents.length > 0
              ? tuition.enrolledStudents.map((s) => s.name).join(', ')
              : tuition.studentName ?? 'No student'
          }
          titleStyle={styles.appbarTitle}
          subtitleStyle={styles.appbarSubtitle}
        />
        <Appbar.Action
          icon="file-pdf-box"
          color={Colors.accent}
          onPress={handleDownloadPDF}
        />
        <Appbar.Action
          icon="account-plus-outline"
          color={Colors.success}
          onPress={handleGenerateInviteCode}
          disabled={isGeneratingCode}
        />
        <Chip
          style={[styles.appbarBadge, { backgroundColor: paymentColor(tuition.paymentStatus) + '33' }]}
          textStyle={{ color: paymentColor(tuition.paymentStatus), fontSize: FontSize.xs, fontFamily: FontFamily.semibold }}
          onPress={() => setDialogMode('payment')}
        >
          {paymentLabel(tuition.paymentStatus)}
        </Chip>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Info Card ── */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardTitle}>Tuition Info</Text>
            <View style={styles.infoGrid}>
              <InfoRow label="Time" value={`${tuition.startTime} – ${tuition.endTime}`} />
              <InfoRow label="Schedule" value={tuition.schedule} />
              <InfoRow label="Days/Week" value={String(tuition.datesPerWeek)} />
              {tuition.studentEmail && <InfoRow label="Student Email" value={tuition.studentEmail} />}
              {tuition.salary && <InfoRow label="Monthly Fee" value={`৳${tuition.salary.toLocaleString()}`} />}
              <InfoRow label="Status" value={tuition.status} />
              <InfoRow label="Since" value={formatDate(tuition.createdAt)} />
            </View>
          </Card.Content>
        </Card>

        {/* ── Progress Card ── */}
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

        {/* ── Class Logs Card ── */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" style={styles.cardTitle}>Class Logs</Text>
              <Button
                compact
                mode="contained-tonal"
                onPress={() => setDialogMode('addClass')}
                icon="plus"
              >
                Add
              </Button>
            </View>

            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No classes logged yet.</Text>
            ) : (
              <>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, styles.tableHeaderText, { flex: 0.5 }]}>#</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Date</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Day</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderText]}>Logged At</Text>
                  <View style={{ width: 36 }} />
                </View>
                {logs.map((log, idx) => (
                  <View key={log.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>{logs.length - idx}</Text>
                    <Text style={styles.tableCell}>{formatDate(log.date)}</Text>
                    <Text style={styles.tableCell}>{DAY_NAMES[new Date(log.date).getDay()]}</Text>
                    <Text style={styles.tableCell}>{formatTime(log.createdAt)}</Text>
                    <IconButton
                      icon="delete-outline"
                      size={16}
                      iconColor={Colors.error}
                      onPress={async () => {
                        try {
                          await deleteClassLog(log.id, tuition.id);
                          setSnackMsg('Class log deleted');
                        } catch {
                          setSnackMsg('Failed to delete class log');
                        }
                      }}
                      style={{ margin: 0 }}
                    />
                  </View>
                ))}
              </>
            )}
          </Card.Content>
        </Card>

        {/* ── Homework Card ── */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleSmall" style={styles.cardTitle}>Homework</Text>
              <Button
                compact
                mode="contained-tonal"
                onPress={openAddHomework}
                icon="plus"
              >
                Assign
              </Button>
            </View>

            {homeworkList.length === 0 ? (
              <Text style={styles.emptyText}>No homework assigned yet.</Text>
            ) : (
              homeworkList.map((hw, idx) => (
                <View key={hw.id}>
                  {idx > 0 && <Divider style={{ marginVertical: Spacing.xs }} />}
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    onPress={() => { setViewingHwId(hw.id); setDialogMode('viewHomework'); }}
                    style={styles.hwItem}
                  >
                    <View style={styles.hwRow}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium" style={[styles.hwChapter, hw.completed && styles.strikethrough]}>
                          {hw.subject}
                        </Text>
                        <Text variant="bodySmall" style={styles.hwTask}>Chapter: {hw.chapter}</Text>
                        <Text variant="bodySmall" style={styles.hwTask}>Task: {hw.task}</Text>
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
                        <IconButton
                          icon={hw.completed ? 'check-circle' : 'check-circle-outline'}
                          size={20}
                          iconColor={hw.completed ? Colors.success : Colors.textTertiary}
                          onPress={async (e) => {
                            e.stopPropagation();
                            try {
                              await markHomeworkComplete(hw.id, !hw.completed);
                            } catch {
                              setSnackMsg('Failed to update homework status');
                            }
                          }}
                          style={{ margin: 0 }}
                        />
                        <IconButton
                          icon="pencil-outline"
                          size={18}
                          iconColor={Colors.primary}
                          onPress={(e) => {
                            e.stopPropagation();
                            openEditHomework(hw);
                          }}
                          style={{ margin: 0 }}
                        />
                        <IconButton
                          icon="delete-outline"
                          size={18}
                          iconColor={Colors.error}
                          onPress={(e) => { 
                            e.stopPropagation();
                            setDeletingHw(hw); 
                            setDialogMode('deleteHomework'); 
                          }}
                          style={{ margin: 0 }}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* ── Activity Log Card ── */}
        <Card style={[styles.card, { marginBottom: Spacing['2xl'] }]} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardTitle}>Activity Log</Text>
            {activityList.length === 0 ? (
              <Text style={styles.emptyText}>No activity yet.</Text>
            ) : (
              activityList.slice(0, 20).map((a) => (
                <List.Item
                  key={a.id}
                  title={a.description}
                  description={formatTime(a.timestamp)}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={activityIcon(a.type)}
                      color={activityColor(a.type)}
                    />
                  )}
                  titleStyle={styles.activityTitle}
                  descriptionStyle={styles.activityTime}
                  style={styles.activityItem}
                />
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* ── Dialogs ── */}
      <Portal>
        {/* Add Class Log Dialog */}
        <Dialog visible={dialogMode === 'addClass'} onDismiss={closeDialog} style={GlassDialog}>
          <Dialog.Title style={GlassDialogTitle}>Add Class Log</Dialog.Title>
          <Dialog.Content>
            <DatePickerInput
              label="Date"
              value={classDate}
              onChangeDate={(date) => { setClassDate(date); setClassDateError(''); }}
              outlineColor={Colors.border}
              activeOutlineColor={GlassDialogPrimary}
            />
            {classDateError ? <HelperText type="error">{classDateError}</HelperText> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleAddClass} textColor={GlassDialogPrimary}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Add/Edit Homework Dialog */}
        <Dialog
          visible={dialogMode === 'addHomework' || dialogMode === 'editHomework'}
          onDismiss={closeDialog}
          style={GlassDialog}
        >
          <Dialog.Title style={GlassDialogTitle}>
            {dialogMode === 'editHomework' ? 'Edit Homework' : 'Assign Homework'}
          </Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400 }}>
            <ScrollView>
              <TextInput
                mode="outlined"
                label="Subject *"
                value={hwSubject}
                onChangeText={setHwSubject}
                outlineColor={Colors.border}
                activeOutlineColor={GlassDialogPrimary}
                style={styles.dialogInput}
              />
              {hwErrors.subject && <HelperText type="error">{hwErrors.subject}</HelperText>}
              <TextInput
                mode="outlined"
                label="Chapter *"
                value={hwChapter}
                onChangeText={setHwChapter}
                outlineColor={Colors.border}
                activeOutlineColor={GlassDialogPrimary}
                style={styles.dialogInput}
              />
              {hwErrors.chapter && <HelperText type="error">{hwErrors.chapter}</HelperText>}
              <TextInput
                mode="outlined"
                label="Task *"
                value={hwTask}
                onChangeText={setHwTask}
                multiline
                numberOfLines={3}
                outlineColor={Colors.border}
                activeOutlineColor={GlassDialogPrimary}
                style={styles.dialogInput}
              />
              {hwErrors.task && <HelperText type="error">{hwErrors.task}</HelperText>}
              <DatePickerInput
                label="Due Date *"
                value={hwDueDate}
                onChangeDate={setHwDueDate}
                outlineColor={Colors.border}
                activeOutlineColor={GlassDialogPrimary}
                style={styles.dialogInput}
              />
              {hwErrors.dueDate && <HelperText type="error">{hwErrors.dueDate}</HelperText>}
              <TextInput
                mode="outlined"
                label="Notes (optional)"
                value={hwNotes}
                onChangeText={setHwNotes}
                multiline
                outlineColor={Colors.border}
                activeOutlineColor={GlassDialogPrimary}
                style={styles.dialogInput}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button
              onPress={dialogMode === 'editHomework' ? handleEditHomework : handleAddHomework}
              textColor={GlassDialogPrimary}
            >
              {dialogMode === 'editHomework' ? 'Update' : 'Assign'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Homework Confirm */}
        <Dialog visible={dialogMode === 'deleteHomework'} onDismiss={closeDialog} style={GlassDialog}>
          <Dialog.Title style={GlassDialogTitle}>Delete Homework?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Delete &quot;{deletingHw?.chapter}&quot;? This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleDeleteHomework} textColor={Colors.error}>Delete</Button>
          </Dialog.Actions>
        </Dialog>

        {/* View Homework Details */}
        <Dialog 
          visible={dialogMode === 'viewHomework'} 
          onDismiss={closeDialog}
          style={GlassDialog}
        >
          <Dialog.Title style={GlassDialogTitle}>
            {viewingHw?.subject} • {viewingHw?.chapter}
          </Dialog.Title>
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
                        <Text style={styles.hwDetailLabel}>Notes</Text>
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
                                {comment.userName} {comment.role === 'teacher' ? '(Teacher)' : '(Student)'}
                              </Text>
                              <Text style={styles.commentTime}>{formatTime(comment.timestamp)}</Text>
                            </View>
                            <Text style={styles.commentText}>{comment.text}</Text>
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
                        outlineColor={Colors.border}
                        activeOutlineColor={GlassDialogPrimary}
                      />
                      <Button
                        mode="contained"
                        onPress={() => handleAddComment(viewingHw.id, user?.id ?? '', user?.name ?? 'Teacher')}
                        disabled={!commentText.trim() || isSending}
                        loading={isSending}
                        compact
                        buttonColor={GlassDialogPrimary}
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
            <Button onPress={closeDialog}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog visible={dialogMode === 'payment'} onDismiss={closeDialog} style={GlassDialog}>
          <Dialog.Title style={GlassDialogTitle}>Update Payment</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: Spacing.md }}>
              Current: <Text style={{ fontFamily: FontFamily.semibold }}>
                {paymentLabel(tuition.paymentStatus)}
              </Text>
            </Text>
            {(['paid', 'partial', 'not_paid'] as PaymentStatus[]).map((s) => (
              <Button
                key={s}
                mode={tuition.paymentStatus === s ? 'contained' : 'outlined'}
                onPress={async () => {
                  try {
                    if (!tuition.salary) {
                      setSnackMsg('Please set monthly fee in tuition details');
                      return;
                    }
                    await updatePaymentStatus(
                      tuition.id,
                      user?.id ?? '',
                      tuition.studentId || '', // Allow empty studentId
                      currentMonth,
                      s,
                      tuition.salary
                    );
                    setSnackMsg(`Payment updated to ${paymentLabel(s)}`);
                    closeDialog();
                  } catch (error) {
                    console.error('Payment update error:', error);
                    const errorMsg = error instanceof Error ? error.message : 'Failed to update payment status';
                    setSnackMsg(errorMsg);
                  }
                }}
                style={{ marginBottom: Spacing.sm }}
                buttonColor={tuition.paymentStatus === s ? GlassDialogPrimary : undefined}
                textColor={tuition.paymentStatus === s ? Colors.backgroundDeep : GlassDialogPrimary}
              >
                {paymentLabel(s)}
              </Button>
            ))}
            
            <Divider style={{ marginVertical: Spacing.md }} />
            
            <Button
              mode="contained-tonal"
              icon="file-download"
              onPress={handleDownloadReceipt}
              style={{ marginTop: Spacing.sm }}
              buttonColor={Colors.accent + '22'}
              textColor={Colors.accent}
            >
              Download Payment Receipt
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Invite Student Dialog */}
        <Dialog visible={dialogMode === 'inviteStudent'} onDismiss={closeDialog} style={GlassDialog}>
          <Dialog.Title style={GlassDialogTitle}>Invite Student</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: Colors.textSecondary, marginBottom: Spacing.md }}>
              Share the details below with your student so they can join this tuition on TuitionTrack.
            </Text>
            <View style={styles.inviteBox}>
              <Text style={styles.inviteLabel}>Tuition</Text>
              <Text style={styles.inviteValue}>{tuition.subject}</Text>
            </View>
            <View style={styles.inviteBox}>
              <Text style={styles.inviteLabel}>Schedule</Text>
              <Text style={styles.inviteValue}>{tuition.schedule} · {tuition.startTime} – {tuition.endTime}</Text>
            </View>
            <View style={[styles.inviteBox, styles.inviteCodeBox]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviteLabel}>Invite Code</Text>
                  <Text style={styles.inviteCode}>{inviteCode}</Text>
                </View>
                <IconButton
                  icon="content-copy"
                  iconColor={Colors.accent}
                  size={20}
                  onPress={handleCopyCode}
                />
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button
              mode="contained"
              icon="share-variant"
              buttonColor={GlassDialogPrimary}
              textColor={Colors.backgroundDeep}
              onPress={() => { handleInviteStudent(); closeDialog(); }}
            >
              Share
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackMsg}
        onDismiss={() => setSnackMsg('')}
        duration={2000}
        style={styles.snackbar}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

// Helper sub-components
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

function activityIcon(type: string) {
  switch (type) {
    case 'class_added': return 'calendar-plus';
    case 'class_deleted': return 'calendar-minus';
    case 'reset': return 'refresh';
    case 'homework_added': return 'book-plus';
    case 'payment_updated': return 'cash-check';
    default: return 'information';
  }
}

function activityColor(type: string) {
  switch (type) {
    case 'class_added': return Colors.success;
    case 'class_deleted': return Colors.warning;
    case 'reset': return Colors.info;
    case 'homework_added': return Colors.primary;
    case 'payment_updated': return Colors.statusPaid;
    default: return Colors.textSecondary;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appbar: { backgroundColor: Colors.backgroundDeep },
  appbarTitle: { color: Colors.textOnPrimary, fontSize: FontSize.md, fontFamily: FontFamily.semibold },
  appbarSubtitle: { color: Colors.textOnPrimary + 'CC', fontSize: FontSize.xs, fontFamily: FontFamily.regular },
  appbarBadge: { marginRight: Spacing.sm, height: 28 },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  card: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontFamily: FontFamily.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  infoGrid: { gap: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1, fontFamily: FontFamily.regular },
  infoValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontFamily: FontFamily.medium, flex: 1.5, textAlign: 'right' },
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
  progressBar: { height: 8, borderRadius: 4, backgroundColor: Colors.border, marginTop: Spacing.xs },
  progressText: { color: Colors.textSecondary, textAlign: 'right', marginTop: 4, fontFamily: FontFamily.regular },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  tableRowAlt: { backgroundColor: Colors.surfaceVariant },
  tableHeader: { borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 2 },
  tableHeaderText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontFamily: FontFamily.semibold },
  tableCell: { flex: 1, fontSize: FontSize.xs, color: Colors.textPrimary, fontFamily: FontFamily.regular },
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
  hwNotes: { color: Colors.textSecondary, marginTop: 2, fontSize: FontSize.xs, fontFamily: FontFamily.regular, fontStyle: 'italic' },
  hwComments: { color: Colors.info, fontSize: FontSize.xs, fontFamily: FontFamily.regular },
  hwActions: { flexDirection: 'row', alignItems: 'center' },
  hwDetailRow: { marginBottom: Spacing.md },
  hwDetailLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontFamily: FontFamily.semibold, textTransform: 'uppercase', marginBottom: 4 },
  hwDetailValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontFamily: FontFamily.regular },
  commentBox: { 
    backgroundColor: Colors.surfaceVariant, 
    padding: Spacing.sm, 
    borderRadius: BorderRadius.md, 
    marginBottom: Spacing.xs 
  },
  teacherComment: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  studentComment: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentAuthor: { fontSize: FontSize.xs, fontFamily: FontFamily.semibold, color: Colors.primary },
  commentTime: { fontSize: FontSize.xs, fontFamily: FontFamily.regular, color: Colors.textTertiary },
  commentText: { fontSize: FontSize.sm, fontFamily: FontFamily.regular, color: Colors.textPrimary },
  addCommentRow: { 
    flexDirection: 'row', 
    gap: Spacing.sm, 
    alignItems: 'flex-end',
    marginTop: Spacing.sm,
  },
  commentInput: { 
    flex: 1,
    backgroundColor: Colors.surface,
  },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textTertiary },
  activityItem: { paddingVertical: 0 },
  activityTitle: { fontSize: FontSize.sm, color: Colors.textPrimary, fontFamily: FontFamily.regular },
  activityTime: { fontSize: FontSize.xs, color: Colors.textTertiary, fontFamily: FontFamily.regular },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing.md, fontFamily: FontFamily.regular },
  dialogInput: { marginBottom: Spacing.xs, backgroundColor: Colors.surface },
  snackbar: { bottom: Spacing.xl },
  inviteBox: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  inviteCodeBox: {
    borderBottomWidth: 0,
    backgroundColor: Colors.backgroundDeep,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  inviteLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  inviteValue: { fontSize: FontSize.sm, fontFamily: FontFamily.medium, color: Colors.textPrimary },
  inviteCode: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.accent,
    letterSpacing: 1.5,
    paddingVertical: Spacing.xs,
  },
});
