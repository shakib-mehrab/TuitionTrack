// Formatting + schedule helpers shared by every screen (mirrors the web app's helpers).
import type { Tuition } from "@/types";

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Local calendar day key, "2026-11-17". Class logs store dates in this form. */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parses "2026-11-17" as a local date (new Date("2026-11-17") would be UTC). */
export function fromKey(key: string): Date {
  const [y, m, d] = key.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "Tuesday, 17 November" */
export function formatLongDay(d: Date): string {
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Tue, 17 Nov" */
export function formatDay(d: Date | null | undefined): string {
  if (!d) return "";
  return `${WEEKDAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "17 Nov 2026" */
export function formatDate(d: Date | null | undefined): string {
  if (!d) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

export function formatClock(d: Date): string {
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** "2026-11" → "November 2026" (or "Nov 2026"). */
export function monthLabel(key: string | undefined, short = false): string {
  if (!key) return "";
  const [y, m] = key.split("-").map(Number);
  const name = MONTHS[(m || 1) - 1];
  return `${short ? name.slice(0, 3) : name} ${y}`;
}

export function monthName(key: string | undefined): string {
  if (!key) return "";
  return MONTHS[(Number(key.split("-")[1]) || 1) - 1];
}

/** "৳4,000" */
export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `৳${Math.round(n).toLocaleString("en-IN")}`;
}

/** Times are stored as "5:00 PM"; returns minutes after midnight for sorting. */
export function timeToMinutes(t: string | undefined): number {
  if (!t) return 0;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3]?.toUpperCase() === "PM") h += 12;
  if (!m[3] && Number(m[1]) === 12) h = 12;
  return h * 60 + Number(m[2]);
}

export function formatTimeRange(start?: string, end?: string): string {
  if (!start) return "";
  return end ? `${start} – ${end}` : start;
}

/** Tuition.schedule is "Mon, Wed, Fri" → [1, 3, 5]. */
export function scheduleDays(t: Pick<Tuition, "schedule">): number[] {
  if (!t.schedule) return [];
  return t.schedule
    .split(/[,\s]+/)
    .map((s) => WEEKDAY_SHORT.findIndex((w) => w.toLowerCase() === s.trim().slice(0, 3).toLowerCase()))
    .filter((i) => i >= 0);
}

export function isClassDay(t: Pick<Tuition, "schedule">, d: Date): boolean {
  return scheduleDays(t).includes(d.getDay());
}

/** Number of class days a weekday set gives in a month (suggests "classes per month"). */
export function classDaysInMonth(days: number[], year: number, month: number): number {
  let n = 0;
  const total = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= total; i++) if (days.includes(new Date(year, month, i).getDay())) n++;
  return n;
}

/** Next scheduled class start (today counts if not started yet). */
export function nextClass(t: Pick<Tuition, "schedule" | "startTime">, now = new Date()): Date | null {
  const days = scheduleDays(t);
  if (!days.length) return null;
  const mins = timeToMinutes(t.startTime);
  for (let i = 0; i < 8; i++) {
    const d = addDays(startOfDay(now), i);
    if (!days.includes(d.getDay())) continue;
    const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(mins / 60), mins % 60);
    if (at > now) return at;
  }
  return null;
}

export function dueLabel(dueKey: string | undefined, today = new Date()): { text: string; overdue: boolean; soon: boolean } {
  if (!dueKey) return { text: "", overdue: false, soon: false };
  const n = Math.round((fromKey(dueKey).getTime() - startOfDay(today).getTime()) / 86_400_000);
  if (n < 0) return { text: n === -1 ? "Overdue by 1 day" : `Overdue by ${-n} days`, overdue: true, soon: false };
  if (n === 0) return { text: "Due today", overdue: false, soon: true };
  if (n === 1) return { text: "Due tomorrow", overdue: false, soon: true };
  return { text: `Due ${formatDay(fromKey(dueKey))}`, overdue: false, soon: n <= 3 };
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

export function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}

export function subjectTag(subject: string): string {
  return subject.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || subject.slice(0, 3);
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** Display name(s) of a tuition's students. */
export function studentNames(t: Pick<Tuition, "enrolledStudents" | "studentName">): string {
  if (t.enrolledStudents?.length) return t.enrolledStudents.map((s) => s.name).join(", ");
  return t.studentName || "No student yet";
}

export function hasStudent(t: Pick<Tuition, "studentId" | "studentIds" | "enrolledStudents">): boolean {
  return !!(t.studentId || t.studentIds?.length || t.enrolledStudents?.length);
}
