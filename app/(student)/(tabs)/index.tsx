// Student · Home — next class, my tuitions, homework due.
import { Avatar, Button, Card, EmptyState, Header, Loading, Ring, Screen, SectionTitle, T } from "@/components/kit/core";
import { HomeworkRow } from "@/components/homework";
import { JoinTuitionSheet } from "@/components/JoinTuition";
import { FeeBadge, scheduleText } from "@/components/tuition";
import { C } from "@/constants/theme";
import { addDays, dateKey, firstName, formatDay, formatLongDay, nextClass, subjectTag } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useStudentStore } from "@/store/studentStore";
import type { Tuition } from "@/types";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

export default function StudentHome() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tuitions = useStudentStore((s) => s.tuitions);
  const homework = useStudentStore((s) => s.homework);
  const isLoading = useStudentStore((s) => s.isLoading);
  const getCurrentLogs = useStudentStore((s) => s.getCurrentLogs);
  useStudentStore((s) => s.classLogs);
  const [joining, setJoining] = useState(false);
  const now = new Date();

  const upcoming = tuitions
    .map((t) => ({ t, at: nextClass(t, now) }))
    .filter((x): x is { t: Tuition; at: Date } => !!x.at)
    .sort((a, b) => a.at.getTime() - b.at.getTime())[0];
  const when = upcoming
    ? dateKey(upcoming.at) === dateKey(now)
      ? "Today"
      : dateKey(upcoming.at) === dateKey(addDays(now, 1))
        ? "Tomorrow"
        : formatDay(upcoming.at)
    : "";

  const due = homework.filter((h) => !h.completed).sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")).slice(0, 4);

  return (
    <Screen tabBar footer={<JoinTuitionSheet open={joining} onClose={() => setJoining(false)} />}>
      <Header eyebrow={formatLongDay(now)} title={`Hi, ${firstName(user?.name) || "there"}`} right={<Avatar name={user?.name ?? "?"} onPress={() => router.push("/(student)/profile")} />} />

      {isLoading && tuitions.length === 0 ? (
        <Loading label="Loading your classes…" />
      ) : tuitions.length === 0 ? (
        <EmptyState icon="book-open" title="Join your first tuition" action={<Button title="Enter invite code" icon="log-in" size="lg" onPress={() => setJoining(true)} />}>
          Ask your teacher for the invite code on their TuitionTrack tuition page.
        </EmptyState>
      ) : (
        <>
          {upcoming ? (
            <Pressable onPress={() => router.push(`/(student)/tuition/${upcoming.t.id}`)} style={{ backgroundColor: C.ink, borderRadius: 24, padding: 20, gap: 14 }}>
              <T w="bold" size={12} color={C.primaryLine} style={{ letterSpacing: 0.8 }}>
                NEXT CLASS
              </T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" }}>
                  <T w="extrabold" size={13} color={C.white}>
                    {subjectTag(upcoming.t.subject)}
                  </T>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T w="extrabold" size={18} color={C.white}>
                    {upcoming.t.subject}
                  </T>
                  <T size={13} color={C.primaryLine}>
                    {when} · {upcoming.t.startTime} – {upcoming.t.endTime}
                  </T>
                </View>
              </View>
            </Pressable>
          ) : null}

          <SectionTitle right={<T w="bold" size={13} color={C.primary} onPress={() => setJoining(true)}>+ Join</T>}>My tuitions</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {tuitions.map((t) => {
              const taken = getCurrentLogs(t.id).length;
              return (
                <Card key={t.id} onPress={() => router.push(`/(student)/tuition/${t.id}`)} style={{ width: "47.5%", padding: 16, gap: 10 }}>
                  <Ring value={t.plannedClassesPerMonth ? taken / t.plannedClassesPerMonth : 0} size={60} stroke={7} label={`${taken}/${t.plannedClassesPerMonth}`} labelSize={13} />
                  <T w="extrabold" size={15} numberOfLines={1}>
                    {t.subject}
                  </T>
                  <T size={12} color={C.muted} numberOfLines={1}>
                    {scheduleText(t)}
                  </T>
                  <FeeBadge t={t} />
                </Card>
              );
            })}
          </View>

          <SectionTitle right={<T w="bold" size={13} color={C.primary} onPress={() => router.push("/(student)/(tabs)/homework")}>See all</T>}>Homework due</SectionTitle>
          {due.length === 0 ? (
            <Card style={{ padding: 18 }}>
              <T size={14} color={C.muted}>
                Nothing due. Nice!
              </T>
            </Card>
          ) : (
            <Card style={{ padding: 10, gap: 8 }}>
              {due.map((h) => (
                <HomeworkRow key={h.id} h={h} onPress={() => router.push({ pathname: "/(student)/homework/[id]", params: { id: h.id } })} />
              ))}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
