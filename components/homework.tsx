// Homework list row + the teacher's assign/edit sheet.
import { Badge, Button, T } from "@/components/kit/core";
import { DateField, Field, FormError, Input } from "@/components/kit/form";
import { Sheet } from "@/components/kit/sheet";
import { useToast } from "@/components/kit/toast";
import { C, R } from "@/constants/theme";
import { addDays, dateKey, dueLabel } from "@/lib/format";
import { useTeacherStore } from "@/store/teacherStore";
import type { Homework, Tuition } from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

export function HomeworkRow({ h, onPress, showSubject = true }: { h: Homework; onPress: () => void; showSubject?: boolean }) {
  const dl = dueLabel(h.dueDate?.slice(0, 10));
  const urgent = !h.completed && (dl.overdue || dl.soon);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: R.lg,
        backgroundColor: urgent ? C.coralMist : C.mist,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <T w="bold" size={14} numberOfLines={1} style={h.completed ? { textDecorationLine: "line-through", color: C.muted } : undefined}>
          {h.chapter} · {h.task}
        </T>
        <T w={urgent || h.completed ? "semibold" : "regular"} size={12} color={h.completed ? C.mintInk : urgent ? C.coralInk : C.muted} numberOfLines={1}>
          {showSubject ? `${h.subject} · ` : ""}
          {h.completed ? "Completed" : dl.text}
          {h.comments?.length ? ` · ${h.comments.length} ${h.comments.length === 1 ? "reply" : "replies"}` : ""}
        </T>
      </View>
      <Feather name="chevron-right" size={18} color={C.muted} />
    </Pressable>
  );
}

export function HomeworkStatus({ h }: { h: Homework }) {
  if (h.completed) return <Badge tone="mint">Completed</Badge>;
  const dl = dueLabel(h.dueDate?.slice(0, 10));
  return <Badge tone={dl.overdue || dl.soon ? "coral" : "primary"}>{dl.text}</Badge>;
}

/** Assign (pass `tuitions` or `tuition`) or edit (pass `editing`) homework. */
export function HomeworkSheet({
  open,
  onClose,
  tuitions,
  tuition,
  editing,
  teacherId,
}: {
  open: boolean;
  onClose: () => void;
  tuitions?: Tuition[];
  tuition?: Tuition;
  editing?: Homework;
  teacherId: string;
}) {
  const toast = useToast();
  const addHomework = useTeacherStore((s) => s.addHomework);
  const updateHomework = useTeacherStore((s) => s.updateHomework);
  const choices = tuitions ?? [];
  const [tuitionId, setTuitionId] = useState(editing?.tuitionId ?? tuition?.id ?? choices[0]?.id ?? "");
  const chosen = tuition ?? choices.find((t) => t.id === tuitionId);
  const [subject, setSubject] = useState(editing?.subject ?? chosen?.subject ?? "");
  const [chapter, setChapter] = useState(editing?.chapter ?? "");
  const [task, setTask] = useState(editing?.task ?? "");
  const [due, setDue] = useState(editing?.dueDate?.slice(0, 10) ?? dateKey(addDays(new Date(), 2)));
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!editing && !chosen) return setError("Pick a tuition");
    if (!chapter.trim() || !task.trim()) return setError("Add a chapter and the task");
    setBusy(true);
    try {
      const data = { subject: subject.trim() || chosen?.subject || "", chapter: chapter.trim(), task: task.trim(), dueDate: due, notes: notes.trim() || undefined };
      if (editing) await updateHomework(editing.id, data);
      else await addHomework({ ...data, tuitionId: chosen!.id, teacherId });
      toast({ message: editing ? "Homework updated" : "Homework assigned" });
      onClose();
    } catch {
      setError("Could not save the homework. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Edit homework" : "Assign homework"}
      description={chosen ? chosen.subject : undefined}
      footer={<Button size="lg" title={editing ? "Save changes" : "Assign homework"} loading={busy} onPress={submit} />}
    >
      {!tuition && !editing && choices.length > 1 ? (
        <Field label="Tuition">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {choices.map((t) => {
              const on = t.id === tuitionId;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    setTuitionId(t.id);
                    setSubject(t.subject);
                  }}
                  style={{ paddingHorizontal: 14, height: 38, borderRadius: R.full, justifyContent: "center", backgroundColor: on ? C.ink : C.mist }}
                >
                  <T w={on ? "bold" : "semibold"} size={13} color={on ? C.white : C.ink}>
                    {t.subject}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </Field>
      ) : null}
      <Field label="Chapter">
        <Input value={chapter} onChangeText={setChapter} placeholder="e.g. Chapter 4" />
      </Field>
      <Field label="Task">
        <Input value={task} onChangeText={setTask} placeholder="e.g. Motion numericals 1–12" />
      </Field>
      <Field label="Due date">
        <DateField value={due} onChange={setDue} />
      </Field>
      <Field label="Notes (optional)">
        <Input value={notes} onChangeText={setNotes} placeholder="Instructions for the student" multiline />
      </Field>
      <FormError>{error}</FormError>
    </Sheet>
  );
}
