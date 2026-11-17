// PDFs in the app's visual language (same design as the web app):
// a monthly class report and a payment slip. Rendered from HTML with expo-print,
// renamed to a readable file name, then opened in the system share sheet.
import type { PaymentHistory } from "@/services/firebase/firestore.service";
import type { ClassLog, PaymentStatus, Tuition } from "@/types";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fromKey = (k: string) => {
  const [y, m, d] = k.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const monthLabel = (k: string) => `${MONTHS[(Number(k.split("-")[1]) || 1) - 1]} ${k.split("-")[0]}`;
const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
const fmtDay = (d: Date) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
const fmtClock = (d: Date) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${d.getHours() >= 12 ? "PM" : "AM"}`;
const money = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `৳${Math.round(n).toLocaleString("en-IN")}`);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E2048; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .muted { color: #4A5078; }
  .pill { display: inline-block; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 700; }
  .paid { background: #E1F5EF; color: #0E6B58; }
  .partial { background: #FFF1D6; color: #7A4A00; }
  .unpaid { background: #FFE9E5; color: #9E3020; }
  .logo { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; font-size: 17px; }
  .mark { width: 34px; height: 34px; border-radius: 10px; background: #5468F0; display: inline-flex; align-items: center; justify-content: center; }
`;
const MARK_SVG = (stroke = "#fff") =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="m9 10 2 2 4-4"/></svg>`;

function statusInfo(status: PaymentStatus | undefined, amount: number | null | undefined) {
  if (status === "paid") return { cls: "paid", label: "Paid" };
  if (status === "partial") return { cls: "partial", label: "Partly paid" };
  if (!amount) return { cls: "unpaid", label: "No fee set" };
  return { cls: "unpaid", label: "Not paid" };
}

async function shareHtml(html: string, filename: string, title: string, page?: { width: number; height: number }) {
  const { uri } = await Print.printToFileAsync({ html, base64: false, ...page });
  // expo-print names files with a random id; give it a readable name before sharing.
  const target = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.deleteAsync(target, { idempotent: true });
  await FileSystem.moveAsync({ from: uri, to: target });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device");
  await Sharing.shareAsync(target, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: title });
}

/* ------------------------------------------------------------------ */
/* Monthly class report                                                */
/* ------------------------------------------------------------------ */

export interface ReportInput {
  tuition: Tuition;
  /** "YYYY-MM" */
  month: string;
  /** That month's class logs. */
  logs: ClassLog[];
  studentName: string;
  teacherName: string;
  payment?: { status?: PaymentStatus; amount?: number | null } | null;
  closed?: boolean;
}

export async function generateTuitionPDF(input: ReportInput): Promise<void> {
  const { tuition: t, month, logs, studentName, teacherName, payment, closed } = input;
  const planned = t.plannedClassesPerMonth || 0;
  const taken = logs.length;
  const pct = planned ? Math.round((taken / planned) * 100) : 0;
  const amount = payment?.amount ?? t.salary ?? null;
  const st = statusInfo(payment?.status ?? t.paymentStatus, amount);

  const [y, m] = month.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const nDays = new Date(y, m, 0).getDate();
  const takenDays = new Set(logs.filter((l) => l.date.startsWith(month)).map((l) => Number(l.date.slice(8, 10))));
  const schedule = (t.schedule || "")
    .split(/[,\s]+/)
    .map((s) => WEEKDAYS.findIndex((w) => w.toLowerCase() === s.slice(0, 3).toLowerCase()))
    .filter((i) => i >= 0);

  let cal = "";
  for (let i = 0; i < first.getDay(); i++) cal += `<div></div>`;
  for (let d = 1; d <= nDays; d++) {
    const isTaken = takenDays.has(d);
    const scheduled = schedule.includes(new Date(y, m - 1, d).getDay());
    cal += `<div class="day ${isTaken ? "taken" : scheduled ? "sched" : ""}">${d}</div>`;
  }

  const rows = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l, i) => {
      const logged = new Date(l.createdAt);
      return `<tr${i % 2 ? ' class="alt"' : ""}><td class="muted">${i + 1}</td><td><b>${esc(fmtDay(fromKey(l.date)))} ${fromKey(l.date).getFullYear()}</b></td><td class="muted">${esc(fmtDate(logged))}, ${esc(fmtClock(logged))}</td></tr>`;
    })
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(t.subject)} report</title><style>${BASE_CSS}
    .band { background: #EEF1FB; padding: 28px 40px 22px; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .kind { font-size: 12px; font-weight: 700; color: #4A5078; }
    h1 { font-size: 26px; font-weight: 800; margin-top: 18px; letter-spacing: -0.3px; }
    .sub { font-size: 12px; margin-top: 6px; }
    .wrap { padding: 22px 40px 30px; }
    .stats { display: flex; gap: 12px; }
    .stat { flex: 1; border-radius: 14px; padding: 14px 16px; background: #F6F7FD; }
    .stat.primary { background: #5468F0; color: #fff; }
    .stat .k { font-size: 11px; font-weight: 700; color: #4A5078; }
    .stat.primary .k { color: #E3E7FD; }
    .stat .v { font-size: 22px; font-weight: 800; margin: 6px 0 6px; }
    .bar { height: 6px; border-radius: 6px; background: #E3E7FD; overflow: hidden; }
    .bar i { display: block; height: 100%; background: #5468F0; border-radius: 6px; }
    .sched-line { font-size: 12px; color: #3B4166; margin: 18px 0 10px; }
    .cal { border: 1px solid #D5DAFB; border-radius: 14px; padding: 12px 14px; display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
    .cal .h { font-size: 10px; font-weight: 700; color: #4A5078; text-align: center; }
    .day { height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #4A5078; }
    .day.taken { background: #5468F0; color: #fff; font-weight: 700; }
    .day.sched { background: #EEF1FB; color: #3A3A8F; font-weight: 600; }
    .legend { font-size: 10px; color: #4A5078; margin-top: 8px; display: flex; gap: 14px; }
    .legend span::before { content: ''; display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }
    .legend .a::before { background: #5468F0; } .legend .b::before { background: #EEF1FB; border: 1px solid #C9D0FB; }
    h2 { font-size: 15px; font-weight: 800; margin: 22px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; font-size: 11px; color: #4A5078; background: #EEF1FB; padding: 8px 10px; }
    td { padding: 8px 10px; } tr.alt td { background: #F6F7FD; }
    .empty { color: #4A5078; padding: 14px 10px; font-size: 12px; }
    .foot { margin-top: 26px; padding-top: 10px; border-top: 1px solid #D5DAFB; font-size: 10px; color: #4A5078; display: flex; justify-content: space-between; }
  </style></head><body>
    <div class="band">
      <div class="top"><span class="logo"><span class="mark">${MARK_SVG()}</span>TuitionTrack</span><span class="kind">Monthly class report</span></div>
      <h1>${esc(t.subject)} · ${esc(studentName)}</h1>
      <div class="sub muted">${esc(monthLabel(month))} &nbsp;·&nbsp; ${closed ? "Closed month" : "In progress"} &nbsp;·&nbsp; Teacher: ${esc(teacherName)}</div>
    </div>
    <div class="wrap">
      <div class="stats">
        <div class="stat primary"><div class="k">Classes taken</div><div class="v">${taken} of ${planned}</div></div>
        <div class="stat"><div class="k">Completion</div><div class="v">${pct}%</div><div class="bar"><i style="width:${Math.min(100, pct)}%"></i></div></div>
        <div class="stat"><div class="k">Monthly fee</div><div class="v">${esc(money(amount))}</div><span class="pill ${st.cls}">${st.label}</span></div>
      </div>
      <div class="sched-line">Schedule: ${esc(t.schedule || "—")} &nbsp;·&nbsp; ${esc(t.startTime)} – ${esc(t.endTime)}</div>
      <div class="cal">${WEEKDAYS.map((w) => `<div class="h">${w[0]}</div>`).join("")}${cal}</div>
      <div class="legend"><span class="a">Class taken</span>${schedule.length ? '<span class="b">Scheduled day</span>' : ""}</div>
      <h2>Class log</h2>
      <table><tr><th style="width:36px">#</th><th>Class date</th><th>Logged</th></tr>${rows || '<tr><td colspan="3" class="empty">No classes logged this month.</td></tr>'}</table>
      <div class="foot"><span>Generated ${esc(fmtDate(new Date()))} with TuitionTrack</span><span>${esc(t.subject)}</span></div>
    </div>
  </body></html>`;

  await shareHtml(html, `${slug(`${t.subject}-${studentName}-${month}`)}-report.pdf`, `${t.subject} report · ${monthLabel(month)}`);
}

/* ------------------------------------------------------------------ */
/* Payment slip                                                        */
/* ------------------------------------------------------------------ */

export interface SlipInput {
  tuition: Tuition;
  month: string;
  classCount: number;
  planned: number;
  payment: Pick<PaymentHistory, "amount" | "status" | "paidAt" | "slipNo" | "id">;
  studentName: string;
  teacherName: string;
}

export async function generatePaymentSlip(input: SlipInput): Promise<void> {
  const { tuition: t, month, classCount, planned, payment, studentName, teacherName } = input;
  const paidAt = payment.paidAt ? new Date(payment.paidAt) : null;
  const slipNo = payment.slipNo ?? `TT-${month.replace("-", "")}-${(payment.id || "").slice(0, 5).toUpperCase()}`;
  const partial = payment.status === "partial";

  const rows: [string, string][] = [
    ["Slip no.", slipNo],
    ["Received from", studentName],
    ["Received by", teacherName],
    ["Subject", t.subject],
    ["For month", monthLabel(month)],
    ["Classes taken", `${classCount} of ${planned}`],
  ];

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payment slip</title><style>${BASE_CSS}
    @page { size: A5; margin: 0; }
    html, body { background: #EEF1FB; min-height: 100%; }
    body { padding: 24px; }
    .card { background: #fff; border-radius: 22px; overflow: hidden; }
    .band { background: #5468F0; color: #fff; padding: 22px 26px 24px; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .band .mark { background: #fff; }
    .kind { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #E3E7FD; }
    .amount { font-size: 34px; font-weight: 800; margin-top: 18px; letter-spacing: -0.5px; }
    .for { font-size: 12px; color: #E3E7FD; margin-top: 4px; }
    .body { padding: 20px 26px 24px; }
    .stamp { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .stamp .pill { font-size: 13px; padding: 6px 14px; letter-spacing: 1px; }
    .row { display: flex; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid #EEF1FB; font-size: 13px; }
    .row:last-child { border-bottom: 0; }
    .row b { font-weight: 800; }
    .perf { position: relative; border-top: 2px dashed #D5DAFB; margin: 12px -26px 0; }
    .perf::before, .perf::after { content: ''; position: absolute; top: -12px; width: 22px; height: 22px; border-radius: 50%; background: #EEF1FB; }
    .perf::before { left: -11px; } .perf::after { right: -11px; }
    .note { font-size: 11px; color: #4A5078; line-height: 1.5; padding-top: 16px; }
  </style></head><body><div class="card">
    <div class="band">
      <div class="top"><span class="logo"><span class="mark">${MARK_SVG("#5468F0")}</span>TuitionTrack</span><span class="kind">PAYMENT SLIP</span></div>
      <div class="amount">${esc(money(payment.amount))}</div>
      <div class="for">${esc(t.subject)} fee for ${esc(monthLabel(month))}</div>
    </div>
    <div class="body">
      <div class="stamp"><span class="pill ${partial ? "partial" : "paid"}">${partial ? "PARTLY PAID" : "PAID"}</span><span class="muted">${paidAt ? "on " + esc(fmtDate(paidAt)) : ""}</span></div>
      ${rows.map(([k, v]) => `<div class="row"><span class="muted">${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}
      <div class="perf"></div>
      <div class="note">This slip confirms that ${esc(teacherName)} marked the ${esc(monthLabel(month))} fee for ${esc(t.subject)} as ${partial ? "partly " : ""}received. Generated ${esc(fmtDate(new Date()))}.</div>
    </div>
  </div></body></html>`;

  // A5 portrait in points.
  await shareHtml(html, `payment-slip-${slug(`${t.subject}-${studentName}-${month}`)}.pdf`, `Payment slip · ${t.subject} · ${monthLabel(month)}`, { width: 420, height: 595 });
}
