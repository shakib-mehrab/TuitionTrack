// Student · Classes — every tuition the student has joined.
import { Button, EmptyState, Header, Loading, Screen } from "@/components/kit/core";
import { JoinTuitionSheet } from "@/components/JoinTuition";
import { TuitionCard } from "@/components/tuition";
import { useStudentStore } from "@/store/studentStore";
import { useRouter } from "expo-router";
import React, { useState } from "react";

export default function StudentClasses() {
  const router = useRouter();
  const tuitions = useStudentStore((s) => s.tuitions);
  const isLoading = useStudentStore((s) => s.isLoading);
  const getCurrentLogs = useStudentStore((s) => s.getCurrentLogs);
  useStudentStore((s) => s.classLogs);
  const [joining, setJoining] = useState(false);

  return (
    <Screen tabBar footer={<JoinTuitionSheet open={joining} onClose={() => setJoining(false)} />}>
      <Header title="My classes" eyebrow={`${tuitions.length} ${tuitions.length === 1 ? "tuition" : "tuitions"}`} right={<Button title="Join" icon="plus" size="sm" onPress={() => setJoining(true)} />} />
      {isLoading && tuitions.length === 0 ? (
        <Loading />
      ) : tuitions.length === 0 ? (
        <EmptyState icon="calendar" title="No classes yet" action={<Button title="Enter invite code" icon="log-in" size="lg" onPress={() => setJoining(true)} />}>
          Join with the invite code your teacher shares.
        </EmptyState>
      ) : (
        tuitions.map((t) => <TuitionCard key={t.id} t={t} role="student" taken={getCurrentLogs(t.id).length} onPress={() => router.push(`/(student)/tuition/${t.id}`)} />)
      )}
    </Screen>
  );
}
