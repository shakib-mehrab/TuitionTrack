// Teacher · Today — today's scheduled classes with one-tap "done", month summary, needs attention.
import { Avatar, Badge, Bar, Button, Card, EmptyState, Header, IconTile, Loading, Ring, Screen, SectionTitle, T, Tile } from "@/components/kit/core";
import { useLogClass } from "@/components/LogClass";
import { C } from "@/constants/theme";
import { dateKey, firstName, formatDay, formatLongDay, formatMoney, formatTimeRange, isClassDay, monthLabel, monthName, scheduleDays, startOfDay, studentNames, subjectTag, timeToMinutes, addDays } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useTeacherStore } from "@/store/teacherStore";
import type { Tuition } from "@/types";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, View } from "react-native";

export default function TeacherToday() {
  const router = useRouter();
  const { open, quickLog } = useLogClass();
  const user = useAuthStore((s) => s.user);
  const tuitions = useTeacherStore((s) => s.tuitions);
  const classLogs = useTeacherStore((s) => s.classLogs);
  const payments = useTeacherStore((s) => s.payments);
  const isLoading = useTeacherStore((s) => s.isLoading);
  const getCurrentLogs = useTeacherStore((s) => s.getCurrentLogs);

  const today = new Date();
  const todayKey = dateKey(today);
  const active = useMemo(() => tuitions.filter((t) => t.status !== "ended"), [tuitions]);

  const stats = useMemo(() => {
    void classLogs; // recompute when logs change
    const todays = active
      .filter((t) => isClassDay(t, today))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
      .map((t) => ({ t, done: getCurrentLogs(t.id).some((l) => l.date === todayKey) }));
    const taken = active.reduce((s, t) => s + getCurrentLogs(t.id).length, 0);
    const planned = active.reduce((s, t) => s + (t.plannedClassesPerMonth || 0), 0);

    // Missed: scheduled days in the open month, before today, with no class logged.
    const missed: { t: Tuition; day: Date }[] = [];
    for (const t of active) {
      const days = scheduleDays(t);
      if (!days.length) continue;
      const logged = new Set(getCurrentLogs(t.id).map((l) => l.date));
      const start = t.cycleStartedAt ? startOfDay(new Date(t.cycleStartedAt)) : new Date(today.getFullYear(), today.getMonth(), 1);
      for (let d = start; d < startOfDay(today); d = addDays(d, 1)) {
        if (days.includes(d.getDay()) && !logged.has(dateKey(d))) missed.push({ t, day: d });
      }
    }
    missed.sort((a, b) => b.day.getTime() - a.day.getTime());

    const unpaid = payments.filter((p) => p.closedAt && p.status !== "paid" && p.amount > 0);
    return { todays, taken, planned, missed: missed.slice(0, 3), unpaid };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, classLogs, payments, todayKey]);

  const nextIdx = stats.todays.findIndex((x) => !x.done);
  const doneCount = stats.todays.filter((x) => x.done).length;
  const pct = stats.planned ? stats.taken / stats.planned : 0;

  return (
    <Screen tabBar>
      <Header
        eyebrow={formatLongDay(today)}
        title={`Hi, ${firstName(user?.name) || "there"}`}
        right={<Avatar name={user?.name ?? "?"} onPress={() => router.push("/(teacher)/profile")} />}
      />

      {isLoading && tuitions.length === 0 ? (
        <Loading label="Loading your tuitions…" />
      ) : tuitions.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Add your first tuition"
          action={<Button title="New tuition" icon="plus" size="lg" onPress={() => router.push("/(teacher)/tuition/add")} />}
        >
          Pick the class days, time and fee. Your classes for each day will show up here.
        </EmptyState>
      ) : (
        <>
          {/* Month summary */}
          <View style={{ backgroundColor: C.primary, borderRadius: 24, padding: 20, flexDirection: "row", alignItems: "center", gap: 18 }}>
            <Ring value={pct} size={84} stroke={9} track="rgba(255,255,255,0.25)" color={C.white} label={`${Math.round(pct * 100)}%`} labelSize={18} labelColor={C.white} />
            <View style={{ flex: 1, gap: 6 }}>
              <T w="semibold" size={13} color={C.primarySoft}>
                {monthName(dateKey(today).slice(0, 7))} so far
              </T>
              <T w="extrabold" size={22} color={C.white}>
                {stats.taken} of {stats.planned} classes
              </T>
              <T w="medium" size={13} color={C.primarySoft}>
                across {active.length} {active.length === 1 ? "tuition" : "tuitions"}
                {stats.unpaid.length ? ` · ${stats.unpaid.length} ${stats.unpaid.length === 1 ? "fee" : "fees"} due` : ""}
              </T>
            </View>
          </View>

          {/* Today's classes */}
          <SectionTitle
            right={
              stats.todays.length ? (
                <T w="semibold" size={13} color={C.muted}>
                  {doneCount} of {stats.todays.length} done
                </T>
              ) : null
            }
          >
            Today’s classes
          </SectionTitle>
          {stats.todays.length === 0 ? (
            <Card style={{ padding: 18, gap: 10 }}>
              <T size={14} color={C.muted}>
                No classes scheduled today.
              </T>
              <Pressable onPress={() => open()}>
                <T w="bold" size={14} color={C.primary}>
                  Log a make-up class
                </T>
              </Pressable>
            </Card>
          ) : (
            stats.todays.map(({ t, done }, i) => (
              <TodayRow
                key={t.id}
                t={t}
                taken={getCurrentLogs(t.id).length}
                done={done}
                next={i === nextIdx}
                onOpen={() => router.push(`/(teacher)/tuition/${t.id}`)}
                onDone={() => quickLog(t.id, todayKey)}
              />
            ))
          )}

          {/* Needs attention */}
          {stats.unpaid.length || stats.missed.length ? (
            <>
              <SectionTitle>Needs attention</SectionTitle>
              {stats.unpaid.slice(0, 3).map((p) => {
                const t = tuitions.find((x) => x.id === p.tuitionId);
                if (!t) return null;
                return (
                  <Card key={p.id} onPress={() => router.push("/(teacher)/(tabs)/payments")} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
                    <IconTile icon="credit-card" bg={C.coralSoft} fg={C.coralInk} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <T w="bold" size={15} numberOfLines={1}>
                        {monthName(p.month)} fee · {studentNames(t)}
                      </T>
                      <T w="semibold" size={13} color={C.coralInk}>
                        {formatMoney(p.amount)} due · {monthLabel(p.month, true)}
                      </T>
                    </View>
                  </Card>
                );
              })}
              {stats.missed.map(({ t, day }) => (
                <Card key={t.id + dateKey(day)} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
                  <IconTile icon="alert-circle" bg={C.mist} fg={C.muted} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T w="bold" size={15} numberOfLines={1}>
                      Missed · {t.subject}
                    </T>
                    <T size={13} color={C.muted}>
                      {formatDay(day)} was scheduled, not logged
                    </T>
                  </View>
                  <Button title="Log it" variant="outline" size="sm" onPress={() => open(t.id, dateKey(day))} />
                </Card>
              ))}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function TodayRow({ t, taken, done, next, onOpen, onDone }: { t: Tuition; taken: number; done: boolean; next: boolean; onOpen: () => void; onDone: () => void }) {
  const meta = `${formatTimeRange(t.startTime, t.endTime)} · ${taken} of ${t.plannedClassesPerMonth} this month`;
  const title = `${t.subject} · ${studentNames(t)}`;

  if (done) {
    return (
      <Card onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
        <IconTile icon="check" bg={C.mintSoft} fg={C.mintInk} />
        <View style={{ flex: 1, gap: 2 }}>
          <T w="bold" size={15} numberOfLines={1}>
            {title}
          </T>
          <T size={13} color={C.muted} numberOfLines={1}>
            {meta}
          </T>
        </View>
        <Badge tone="mint">Done</Badge>
      </Card>
    );
  }
  if (next) {
    return (
      <Card style={{ padding: 16, gap: 14, borderWidth: 2, borderColor: C.primaryLine }}>
        <Pressable onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Tile text={subjectTag(t.subject)} seed={t.subject} />
          <View style={{ flex: 1, gap: 2 }}>
            <T w="bold" size={15} numberOfLines={1}>
              {title}
            </T>
            <T size={13} color={C.muted} numberOfLines={1}>
              {meta}
            </T>
          </View>
          <Badge>Next</Badge>
        </Pressable>
        <Bar value={t.plannedClassesPerMonth ? taken / t.plannedClassesPerMonth : 0} />
        <Button title="Mark class done" icon="check" onPress={onDone} style={{ height: 48 }} />
      </Card>
    );
  }
  return (
    <Card onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
      <Tile text={subjectTag(t.subject)} seed={t.subject} />
      <View style={{ flex: 1, gap: 2 }}>
        <T w="bold" size={15} numberOfLines={1}>
          {title}
        </T>
        <T size={13} color={C.muted} numberOfLines={1}>
          {meta}
        </T>
      </View>
      <Button icon="check" variant="outline" accessibilityLabel={`Mark ${t.subject} class done`} onPress={onDone} />
    </Card>
  );
}
