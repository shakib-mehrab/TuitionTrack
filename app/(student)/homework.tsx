import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useStudentStore } from '@/store/studentStore';
import type { Homework } from '@/types';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
    Appbar,
    Button,
    Card,
    Chip,
    Divider,
    IconButton,
    Menu,
    Text,
    TextInput,
} from 'react-native-paper';

type Filter = 'all' | 'pending' | 'done';

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

function HomeworkCard({
  hw,
  userId,
  userName,
  onAddComment,
}: {
  hw: Homework;
  userId: string;
  userName: string;
  onAddComment: (hwId: string, text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isOverdue = !hw.completed && new Date(hw.dueDate) < new Date();
  const daysLeft = Math.ceil((new Date(hw.dueDate).getTime() - Date.now()) / 86400000);

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    onAddComment(hw.id, commentText.trim());
    setCommentText('');
  };

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        {/* Header row */}
        <View style={styles.hwHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.subjectTag}>
              <Text style={styles.subjectTagText}>{hw.subject}</Text>
            </View>
            <Text variant="titleSmall" style={[styles.chapter, hw.completed && styles.strikethrough]}>
              {hw.chapter}
            </Text>
            <Text variant="bodySmall" style={styles.task}>
              {hw.task}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {hw.completed ? (
              <Chip
                icon="check-circle"
                style={styles.doneChip}
                textStyle={{ color: Colors.success, fontSize: FontSize.xs, fontFamily: FontFamily.semibold }}
              >
                Done
              </Chip>
            ) : (
              <Chip
                style={[styles.dueChip, isOverdue && styles.overdueChip]}
                textStyle={{
                  color: isOverdue ? Colors.error : Colors.warning,
                  fontSize: FontSize.xs,
                  fontFamily: FontFamily.medium,
                }}
              >
                {isOverdue ? 'Overdue' : daysLeft >= 0 ? `${daysLeft}d left` : ''}
              </Chip>
            )}
          </View>
        </View>

        <Text variant="bodySmall" style={styles.dueDate}>
          Due: {formatDate(hw.dueDate)}
        </Text>

        {/* Toggle expand */}
        <Button
          compact
          mode="text"
          onPress={() => setExpanded(!expanded)}
          icon={expanded ? 'chevron-up' : 'chevron-down'}
          style={styles.expandBtn}
        >
          {expanded ? 'Hide' : `Comments (${hw.comments.length})`}
        </Button>

        {expanded && (
          <>
            <Divider style={{ marginVertical: Spacing.sm }} />

            {hw.notes && (
              <View style={styles.notesBox}>
                <Text variant="bodySmall" style={styles.notesLabel}>Teacher Note:</Text>
                <Text variant="bodySmall" style={styles.notesText}>{hw.notes}</Text>
              </View>
            )}

            {/* Comments thread */}
            {hw.comments.length > 0 ? (
              <View style={styles.commentsBlock}>
                {hw.comments.map((c) => (
                  <View
                    key={c.id}
                    style={[
                      styles.comment,
                      c.role === 'teacher' ? styles.teacherComment : styles.studentComment,
                    ]}
                  >
                    <Text style={styles.commentName}>
                      {c.userName} {c.role === 'teacher' ? '(Teacher)' : ''}
                    </Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                    <Text style={styles.commentTime}>{formatTime(c.timestamp)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noComments}>No comments yet. Add one below.</Text>
            )}

            {/* Add comment */}
            <View style={styles.commentInputRow}>
              <TextInput
                mode="outlined"
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.primary}
                style={styles.commentInput}
                multiline
                dense
              />
              <Button
                mode="contained"
                onPress={handleSendComment}
                disabled={!commentText.trim()}
                style={styles.sendBtn}
                buttonColor={Colors.primary}
                compact
              >
                Send
              </Button>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

export default function StudentHomeworkScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tuitions, getHomeworkForTuition, addComment, markHomeworkComplete } = useStudentStore();

  const [filter, setFilter] = useState<Filter>('all');

  const myTuitions = tuitions;
  const allHomework: Homework[] = myTuitions.flatMap((t) => getHomeworkForTuition(t.id));

  const filtered =
    filter === 'all'
      ? allHomework
      : filter === 'done'
      ? allHomework.filter((h) => h.completed)
      : allHomework.filter((h) => !h.completed);

  const pendingCount = allHomework.filter((h) => !h.completed).length;

  const handleAddComment = (hwId: string, text: string) => {
    addComment(hwId, {
      userId: user?.id ?? '',
      userName: user?.name ?? 'Student',
      role: 'student',
      text,
    });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} color={Colors.textOnPrimary} />
        <Appbar.Content
          title="Homework"
          subtitle={`${pendingCount} pending`}
          titleStyle={styles.appbarTitle}
          subtitleStyle={styles.appbarSubtitle}
        />
      </Appbar.Header>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'done'] as Filter[]).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipSelected]}
            textStyle={filter === f ? styles.filterChipTextSelected : styles.filterChipText}
          >
            {f === 'all' ? 'All' : f === 'done' ? 'Completed' : 'Pending'}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {filter === 'done'
              ? 'No completed homework yet.'
              : filter === 'pending'
              ? 'No pending homework. All done!'
              : 'No homework assigned yet.'}
          </Text>
        }
        renderItem={({ item }) => (
          <HomeworkCard
            hw={item}
            userId={user?.id ?? ''}
            userName={user?.name ?? 'Student'}
            onAddComment={handleAddComment}
          />
        )}
      />
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
  appbarSubtitle: { color: Colors.textOnPrimary + 'CC', fontSize: FontSize.xs, fontFamily: FontFamily.regular },
  filterRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: { backgroundColor: Colors.surfaceVariant },
  filterChipSelected: { backgroundColor: Colors.primary },
  filterChipText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontFamily: FontFamily.regular },
  filterChipTextSelected: { color: Colors.white, fontSize: FontSize.xs, fontFamily: FontFamily.medium },
  listContent: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  card: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hwHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.xs },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  subjectTag: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  subjectTagText: { fontSize: FontSize.xs, color: Colors.primaryLight, fontFamily: FontFamily.semibold },
  chapter: { fontFamily: FontFamily.semibold, color: Colors.textPrimary },
  task: { color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamily.regular },
  strikethrough: { textDecorationLine: 'line-through', color: Colors.textTertiary },
  doneChip: { backgroundColor: Colors.successLight, height: 28, alignSelf: 'flex-start', marginLeft: Spacing.xs },
  dueChip: { backgroundColor: Colors.warningLight, height: 28, alignSelf: 'flex-start', marginLeft: Spacing.xs },
  overdueChip: { backgroundColor: Colors.errorLight },
  dueDate: { color: Colors.textSecondary, marginTop: 2, fontSize: FontSize.xs, fontFamily: FontFamily.regular },
  expandBtn: { alignSelf: 'flex-start', marginTop: Spacing.xs },
  notesBox: {
    backgroundColor: Colors.primaryMuted,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  notesLabel: { fontFamily: FontFamily.semibold, color: Colors.primaryLight, marginBottom: 2 },
  notesText: { color: Colors.textPrimary, fontFamily: FontFamily.regular },
  commentsBlock: { gap: Spacing.xs, marginBottom: Spacing.sm },
  comment: { padding: Spacing.sm, borderRadius: BorderRadius.md },
  teacherComment: {
    backgroundColor: Colors.primaryMuted,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  studentComment: {
    backgroundColor: Colors.surfaceVariant,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  commentName: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  commentText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontFamily: FontFamily.regular },
  commentTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2, textAlign: 'right', fontFamily: FontFamily.regular },
  noComments: { color: Colors.textTertiary, fontSize: FontSize.sm, marginBottom: Spacing.sm, fontFamily: FontFamily.regular },
  commentInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginTop: Spacing.xs },
  commentInput: { flex: 1, backgroundColor: Colors.surface, fontSize: FontSize.sm },
  sendBtn: { borderRadius: BorderRadius.md, alignSelf: 'flex-end' },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: Spacing['3xl'], fontFamily: FontFamily.regular },
});
