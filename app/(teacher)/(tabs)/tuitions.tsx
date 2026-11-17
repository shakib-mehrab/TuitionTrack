// Teacher · Tuitions — every tuition with this month's progress.
import { Button, EmptyState, Header, Loading, Screen } from "@/components/kit/core";
import { Input } from "@/components/kit/form";
import { TuitionCard } from "@/components/tuition";
import { studentNames } from "@/lib/format";
import { useTeacherStore } from "@/store/teacherStore";
import { useRouter } from "expo-router";
import React, { useState } from "react";

export default function TeacherTuitions() {
  const router = useRouter();
  const tuitions = useTeacherStore((s) => s.tuitions);
  const isLoading = useTeacherStore((s) => s.isLoading);
  const getCurrentLogs = useTeacherStore((s) => s.getCurrentLogs);
  useTeacherStore((s) => s.classLogs); // re-render on new logs
  const [q, setQ] = useState("");

  const list = tuitions.filter((t) => {
    const s = q.trim().toLowerCase();
    return !s || t.subject.toLowerCase().includes(s) || studentNames(t).toLowerCase().includes(s);
  });

  return (
    <Screen tabBar>
      <Header
        title="Tuitions"
        eyebrow={`${tuitions.length} ${tuitions.length === 1 ? "tuition" : "tuitions"}`}
        right={<Button title="New" icon="plus" size="sm" onPress={() => router.push("/(teacher)/tuition/add")} />}
      />
      {tuitions.length > 4 ? <Input icon="search" placeholder="Search subject or student" value={q} onChangeText={setQ} /> : null}

      {isLoading && tuitions.length === 0 ? (
        <Loading />
      ) : list.length === 0 ? (
        <EmptyState
          icon="users"
          title={q ? "No matches" : "No tuitions yet"}
          action={!q ? <Button title="New tuition" icon="plus" size="lg" onPress={() => router.push("/(teacher)/tuition/add")} /> : undefined}
        >
          {q ? "Try a different name or subject." : "Add a tuition to start counting classes."}
        </EmptyState>
      ) : (
        list.map((t) => (
          <TuitionCard key={t.id} t={t} role="teacher" taken={getCurrentLogs(t.id).length} onPress={() => router.push(`/(teacher)/tuition/${t.id}`)} />
        ))
      )}
    </Screen>
  );
}
