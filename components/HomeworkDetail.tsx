// Homework detail + discussion thread, shared by teacher and student routes.
import { Badge, Button, Card, EmptyState, Header, T } from "@/components/kit/core";
import { ConfirmSheet } from "@/components/kit/sheet";
import { useToast } from "@/components/kit/toast";
import { HomeworkSheet, HomeworkStatus } from "@/components/homework";
import { C, F, R } from "@/constants/theme";
import { formatClock, formatDate, formatDay, fromKey } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useStudentStore } from "@/store/studentStore";
import { useTeacherStore } from "@/store/teacherStore";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function HomeworkDetail({ id, role }: { id: string; role: "teacher" | "student" }) {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const teacher = useTeacherStore();
  const student = useStudentStore();
  const store = role === "teacher" ? teacher : student;
  const h = store.homework.find((x) => x.id === id);
  const t = store.tuitions.find((x) => x.id === h?.tuitionId);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!h) {
    return (
      <View style={{ flex: 1, backgroundColor: C.ground, paddingTop: insets.top + 16, paddingHorizontal: 20, gap: 18 }}>
        <Header title="Homework" back />
        <EmptyState icon="book-open" title="Homework not found">
          It may have been deleted.
        </EmptyState>
      </View>
    );
  }

  const toggleComplete = async () => {
    try {
      await store.markHomeworkComplete(h.id, !h.completed);
      toast({ message: h.completed ? "Marked as not done" : "Marked complete" });
    } catch {
      toast({ message: "Could not update the homework", tone: "error" });
    }
  };

  const send = async () => {
    const text = message.trim();
    if (!text || !user) return;
    setSending(true);
    setMessage("");
    try {
      await store.addComment(h.id, { userId: user.id, userName: user.name, role, text });
    } catch {
      setMessage(text);
      toast({ message: "Could not send the message", tone: "error" });
    } finally {
      setSending(false);
    }
  };

  const comments = [...(h.comments ?? [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: C.ground }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, gap: 18 }}>
        <Header title="Homework" back />
        <Card style={{ padding: 18, gap: 12, borderRadius: R.panel }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Badge>{h.subject}</Badge>
            <HomeworkStatus h={h} />
            {!h.completed && h.dueDate ? <Badge tone="neutral">Due {formatDay(fromKey(h.dueDate))}</Badge> : null}
          </View>
          <T w="extrabold" size={20} style={{ letterSpacing: -0.2 }}>
            {h.chapter} · {h.task}
          </T>
          {h.notes ? (
            <T size={14} color={C.body} style={{ lineHeight: 21 }}>
              {h.notes}
            </T>
          ) : null}
          <T size={12} color={C.muted}>
            {t ? `${t.subject} · ` : ""}assigned {formatDate(new Date(h.createdAt))}
          </T>
          <View style={{ flexDirection: "row", gap: 10, paddingTop: 2 }}>
            <Button
              title={h.completed ? "Mark not done" : "Mark complete"}
              icon={h.completed ? "rotate-ccw" : "check"}
              variant={h.completed ? "outline" : "primary"}
              style={{ flex: 1 }}
              onPress={toggleComplete}
            />
            {role === "teacher" ? (
              <>
                <Button icon="edit-2" variant="outline" accessibilityLabel="Edit homework" onPress={() => setEditing(true)} />
                <Button icon="trash-2" variant="outline" accessibilityLabel="Delete homework" onPress={() => setDeleting(true)} />
              </>
            ) : null}
          </View>
        </Card>

        <T w="extrabold" size={15}>
          Discussion
        </T>
        {comments.length === 0 ? (
          <T size={14} color={C.muted}>
            No messages yet. Ask a question or leave a note.
          </T>
        ) : (
          comments.map((c) => {
            const mine = c.userId === user?.id;
            const at = new Date(c.timestamp);
            return (
              <View key={c.id} style={{ maxWidth: "80%", alignSelf: mine ? "flex-end" : "flex-start", alignItems: mine ? "flex-end" : "flex-start", gap: 4 }}>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    backgroundColor: mine ? C.primary : C.surface,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    borderBottomLeftRadius: mine ? 18 : 6,
                    borderBottomRightRadius: mine ? 6 : 18,
                  }}
                >
                  <T size={14} color={mine ? C.white : C.ink} style={{ lineHeight: 20 }}>
                    {c.text}
                  </T>
                </View>
                <T size={11} color={C.muted}>
                  {mine ? "You" : c.userName} · {formatDay(at)}, {formatClock(at)}
                </T>
              </View>
            );
          })
        )}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: C.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 14),
          shadowColor: "#30388C",
          shadowOpacity: 0.08,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -8 },
          elevation: 16,
        }}
      >
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Write a message…"
          placeholderTextColor="#8A90B4"
          maxLength={1000}
          multiline
          style={{ flex: 1, minHeight: 48, maxHeight: 120, borderRadius: R.md, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.mist, paddingHorizontal: 14, paddingVertical: 12, fontFamily: F.regular, fontSize: 14, color: C.ink }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          onPress={send}
          disabled={!message.trim() || sending}
          style={{ width: 48, height: 48, borderRadius: R.md, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", opacity: !message.trim() ? 0.5 : 1 }}
        >
          <Feather name="send" size={20} color={C.white} />
        </Pressable>
      </View>

      {editing && role === "teacher" ? <HomeworkSheet open editing={h} teacherId={user?.id ?? ""} onClose={() => setEditing(false)} /> : null}
      <ConfirmSheet
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete this homework?"
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          setDeleting(false);
          try {
            await teacher.deleteHomework(h.id);
            toast({ message: "Homework deleted" });
            router.back();
          } catch {
            toast({ message: "Could not delete the homework", tone: "error" });
          }
        }}
      >
        The homework and its discussion will be removed for you and the student.
      </ConfirmSheet>
    </KeyboardAvoidingView>
  );
}
