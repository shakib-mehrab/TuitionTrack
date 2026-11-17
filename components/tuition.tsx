// Tuition widgets shared by teacher and student screens.
import { Badge, Card, Ring, T } from "@/components/kit/core";
import { C, R } from "@/constants/theme";
import { WEEKDAY_LETTER, WEEKDAY_SHORT, dateKey, formatMoney, fromKey, scheduleDays, startOfDay, studentNames } from "@/lib/format";
import type { ClassLog, PaymentStatus, Tuition } from "@/types";
import React from "react";
import { Pressable, View } from "react-native";

/* ---------- Payment status ---------- */

export function paymentTone(status: PaymentStatus | undefined): "mint" | "amber" | "coral" {
  return status === "paid" ? "mint" : status === "partial" ? "amber" : "coral";
}
export function paymentLabel(status: PaymentStatus | undefined): string {
  return status === "paid" ? "Paid" : status === "partial" ? "Partly paid" : "Not paid";
}

export function FeeBadge({ t }: { t: Tuition }) {
  if (t.paymentStatus === "paid") return <Badge tone="mint">Paid</Badge>;
  if (t.paymentStatus === "partial") return <Badge tone="amber">Partly paid</Badge>;
  if (!t.salary) return null;
  return <Badge>{formatMoney(t.salary)}</Badge>;
}

/* ---------- Schedule ---------- */

export function scheduleText(t: Tuition): string {
  const days = scheduleDays(t);
  return days.length ? days.map((d) => WEEKDAY_SHORT[d]).join(" · ") : t.schedule || `${t.datesPerWeek} days a week`;
}

export function ScheduleChips({ t }: { t: Tuition }) {
  const days = scheduleDays(t);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
      {days.map((d) => (
        <View key={d} style={{ backgroundColor: C.primarySoft, borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 6 }}>
          <T w="bold" size={12} color={C.primaryDeep}>
            {WEEKDAY_SHORT[d]}
          </T>
        </View>
      ))}
      <T w="semibold" size={13} color={C.muted} style={{ marginLeft: 4 }}>
        {t.startTime} – {t.endTime}
      </T>
    </View>
  );
}

/* ---------- List card ---------- */

export function TuitionCard({ t, taken, role, onPress }: { t: Tuition; taken: number; role: "teacher" | "student"; onPress: () => void }) {
  const planned = t.plannedClassesPerMonth || 1;
  return (
    <Card onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 16, padding: 16 }}>
      <Ring value={taken / planned} size={60} stroke={7} label={`${taken}/${t.plannedClassesPerMonth}`} labelSize={13} />
      <View style={{ flex: 1, gap: 2 }}>
        <T w="bold" size={15} numberOfLines={1}>
          {t.subject}
        </T>
        <T size={13} color={C.muted} numberOfLines={1}>
          {role === "teacher" ? studentNames(t) : "Your teacher"}
        </T>
        <T size={12} color={C.muted} numberOfLines={1}>
          {scheduleText(t)}
        </T>
      </View>
      <FeeBadge t={t} />
    </Card>
  );
}

/* ---------- Month calendar ---------- */

type Kind = "done" | "missed" | "today" | "planned" | "plain";

export function MonthCalendar({
  t,
  month,
  logs,
  canEdit,
  onDay,
}: {
  t: Tuition;
  /** "YYYY-MM" of the open month. */
  month: string;
  /** Logs of the open month. */
  logs: ClassLog[];
  canEdit: boolean;
  onDay?: (day: string, log?: ClassLog) => void;
}) {
  const today = startOfDay(new Date());
  const todayKey = dateKey(today);
  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const nDays = new Date(y, m, 0).getDate();
  const days = scheduleDays(t);
  const cycleStart = t.cycleStartedAt ? startOfDay(new Date(t.cycleStartedAt)) : first;
  const byDay = new Map<string, ClassLog>();
  for (const l of logs) if (!byDay.has(l.date)) byDay.set(l.date, l);

  const cells: ({ day: number; key: string; kind: Kind } | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= nDays; d++) {
    const date = new Date(y, m - 1, d);
    const key = dateKey(date);
    const scheduled = days.includes(date.getDay());
    let kind: Kind = "plain";
    if (byDay.has(key)) kind = "done";
    else if (key === todayKey) kind = "today";
    else if (scheduled && date < today && date >= cycleStart) kind = "missed";
    else if (scheduled && date > today) kind = "planned";
    cells.push({ day: d, key, kind });
  }
  while (cells.length % 7) cells.push(null);

  const look: Record<Kind, { bg: string; fg: string; border?: string; w: "bold" | "semibold" | "medium" | "extrabold" }> = {
    done: { bg: C.primary, fg: C.white, w: "bold" },
    missed: { bg: C.coralSoft, fg: C.coralInk, w: "bold" },
    today: { bg: "transparent", fg: C.primaryDeep, border: C.primary, w: "extrabold" },
    planned: { bg: C.ground, fg: C.primaryDeep, w: "semibold" },
    plain: { bg: "transparent", fg: C.muted, w: "medium" },
  };

  const rows: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row" }}>
        {WEEKDAY_LETTER.map((l, i) => (
          <T key={i} w="bold" size={11} color={C.muted} style={{ flex: 1, textAlign: "center" }}>
            {l}
          </T>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", gap: 4 }}>
          {row.map((c, ci) => {
            if (!c) return <View key={ci} style={{ flex: 1, height: 38 }} />;
            const s = look[c.kind];
            const future = fromKey(c.key) > today;
            const tappable = canEdit && !!onDay && !future;
            return (
              <Pressable
                key={c.key}
                disabled={!tappable}
                accessibilityRole={tappable ? "button" : undefined}
                accessibilityLabel={`${c.day}: ${c.kind === "plain" ? "no class" : c.kind}`}
                onPress={() => onDay?.(c.key, byDay.get(c.key))}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 38,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: s.bg,
                  borderWidth: s.border ? 2 : 0,
                  borderColor: s.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <T w={s.w} size={13} color={s.fg}>
                  {c.day}
                </T>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 4 }}>
        <Legend color={C.primary} label="Taken" />
        {days.length ? (
          <>
            <Legend color={C.coralSoft} border={C.coralInk} label="Missed" />
            <Legend color={C.ground} border="#9AA3D6" label="Scheduled" />
          </>
        ) : null}
      </View>
    </View>
  );
}

function Legend({ color, border, label }: { color: string; border?: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, borderWidth: border ? 1 : 0, borderColor: border }} />
      <T w="semibold" size={11} color={C.muted}>
        {label}
      </T>
    </View>
  );
}

export { studentNames };
