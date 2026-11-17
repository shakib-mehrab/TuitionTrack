// Teacher · Homework — every homework across tuitions, filterable, with "Assign".
import { Button, Card, EmptyState, Header, Screen, SectionTitle } from "@/components/kit/core";
import { Chips } from "@/components/kit/form";
import { HomeworkRow, HomeworkSheet } from "@/components/homework";
import { studentNames } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useTeacherStore } from "@/store/teacherStore";
import { useRouter } from "expo-router";
import React, { useState } from "react";

type Filter = "open" | "done" | "all";

export default function TeacherHomework() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const tuitions = useTeacherStore((s) => s.tuitions);
  const homework = useTeacherStore((s) => s.homework);
  const [filter, setFilter] = useState<Filter>("open");
  const [assigning, setAssigning] = useState(false);

  const open = homework.filter((h) => !h.completed).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  const done = homework.filter((h) => h.completed);
  const shown = filter === "open" ? open : filter === "done" ? done : homework;

  // Group by tuition.
  const groups = tuitions
    .map((t) => ({ t, items: shown.filter((h) => h.tuitionId === t.id) }))
    .filter((g) => g.items.length);

  return (
    <Screen tabBar>
      <Header
        title="Homework"
        eyebrow={`${open.length} open · ${done.length} completed`}
        right={tuitions.length ? <Button title="Assign" icon="plus" size="sm" onPress={() => setAssigning(true)} /> : undefined}
      />
      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "open", label: open.length ? `Open · ${open.length}` : "Open" },
          { value: "done", label: "Completed" },
          { value: "all", label: "All" },
        ]}
      />
      {groups.length === 0 ? (
        <EmptyState icon="book-open" title={filter === "open" ? "Nothing open" : "No homework here"}>
          Assign homework from here or from a tuition page.
        </EmptyState>
      ) : (
        groups.map(({ t, items }) => (
          <React.Fragment key={t.id}>
            <SectionTitle>{`${t.subject} · ${studentNames(t)}`}</SectionTitle>
            <Card style={{ padding: 10, gap: 8 }}>
              {items.map((h) => (
                <HomeworkRow key={h.id} h={h} showSubject={false} onPress={() => router.push({ pathname: "/(teacher)/homework/[id]", params: { id: h.id } })} />
              ))}
            </Card>
          </React.Fragment>
        ))
      )}
      {assigning ? <HomeworkSheet open tuitions={tuitions} teacherId={userId} onClose={() => setAssigning(false)} /> : null}
    </Screen>
  );
}
