// Student · Homework — everything assigned, filterable.
import { Card, EmptyState, Header, Screen, SectionTitle } from "@/components/kit/core";
import { Chips } from "@/components/kit/form";
import { HomeworkRow } from "@/components/homework";
import { useStudentStore } from "@/store/studentStore";
import { useRouter } from "expo-router";
import React, { useState } from "react";

type Filter = "open" | "done" | "all";

export default function StudentHomework() {
  const router = useRouter();
  const tuitions = useStudentStore((s) => s.tuitions);
  const homework = useStudentStore((s) => s.homework);
  const [filter, setFilter] = useState<Filter>("open");

  const open = homework.filter((h) => !h.completed).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  const done = homework.filter((h) => h.completed);
  const shown = filter === "open" ? open : filter === "done" ? done : homework;
  const groups = tuitions.map((t) => ({ t, items: shown.filter((h) => h.tuitionId === t.id) })).filter((g) => g.items.length);

  return (
    <Screen tabBar>
      <Header title="Homework" eyebrow={`${open.length} open · ${done.length} completed`} />
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
          When your teacher assigns homework, it shows up here.
        </EmptyState>
      ) : (
        groups.map(({ t, items }) => (
          <React.Fragment key={t.id}>
            <SectionTitle>{t.subject}</SectionTitle>
            <Card style={{ padding: 10, gap: 8 }}>
              {items.map((h) => (
                <HomeworkRow key={h.id} h={h} showSubject={false} onPress={() => router.push({ pathname: "/(student)/homework/[id]", params: { id: h.id } })} />
              ))}
            </Card>
          </React.Fragment>
        ))
      )}
    </Screen>
  );
}
