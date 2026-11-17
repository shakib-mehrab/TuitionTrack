// Month cycles: each tuition has an open month (tuition.cycleId); every class log is
// stamped with the cycle it was logged in. Closing a month starts a new cycle and keeps
// the old logs. Tuitions/logs from before this existed share the implicit "legacy" cycle.
import type { ClassLog, Tuition } from "@/types";

export const LEGACY_CYCLE = "legacy";

export const cycleOf = (x: { cycleId?: string }) => x.cycleId ?? LEGACY_CYCLE;

/** Class logs of the tuition's open month, newest first. */
export function currentLogs(t: Pick<Tuition, "id" | "cycleId">, logs: ClassLog[]): ClassLog[] {
  const cycle = cycleOf(t);
  return logs
    .filter((l) => l.tuitionId === t.id && cycleOf(l) === cycle)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "YYYY-MM" label of the open month: when it started, else its first class, else now. */
export function openMonthKey(t: Pick<Tuition, "id" | "cycleId" | "cycleStartedAt">, logs: ClassLog[]): string {
  if (t.cycleStartedAt) return monthKey(new Date(t.cycleStartedAt));
  const cur = currentLogs(t, logs);
  const first = cur[cur.length - 1];
  return first ? first.date.slice(0, 7) : monthKey();
}
