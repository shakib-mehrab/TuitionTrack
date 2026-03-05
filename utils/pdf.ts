import { Alert } from "react-native";
import type { ClassLog, Homework, Tuition } from "@/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentLabel(s: string) {
  return s === "paid" ? "Paid" : s === "partial" ? "Partial" : "Unpaid";
}

function paymentColor(s: string) {
  return s === "paid" ? "#10B981" : s === "partial" ? "#F59E0B" : "#EF4444";
}

export async function generateTuitionPDF(
  tuition: Tuition,
  classLogs: ClassLog[],
  homeworkList: Homework[],
  classCount: number,
  planned: number,
): Promise<void> {
  const progressPct = Math.round(Math.min(classCount / planned, 1) * 100);
  const remaining = Math.max(planned - classCount, 0);
  const paidColor = paymentColor(tuition.paymentStatus);
  const genDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const monthLabel = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const classRows = classLogs
    .map((log, i) => {
      const d = new Date(log.date);
      const day = DAY_NAMES[d.getDay()];
      const bg = i % 2 === 0 ? "#181830" : "#1E1E40";
      return `<tr style="background:${bg}">
      <td style="text-align:center">${classLogs.length - i}</td>
      <td>${fmtDate(log.date)}</td>
      <td style="text-align:center">${day}</td>
      <td style="text-align:center">${fmtTime(log.createdAt)}</td>
    </tr>`;
    })
    .join("");

  const hwRows = homeworkList
    .map((hw, i) => {
      const statusColor = hw.completed ? "#10B981" : "#F59E0B";
      const statusText = hw.completed ? "Done" : "Pending";
      const bg = i % 2 === 0 ? "#181830" : "#1E1E40";
      return `<tr style="background:${bg}">
      <td>${hw.chapter}</td>
      <td>${hw.task}</td>
      <td style="text-align:center">${hw.dueDate}</td>
      <td style="text-align:center;color:${statusColor};font-weight:600">${statusText}</td>
    </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tuition Report — ${tuition.subject}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:       #12122A;
      --surface:  #181830;
      --surface2: #1E1E40;
      --border:   #2E2E60;
      --primary:  #7C3AED;
      --accent:   #22D3EE;
      --text:     #F8FAFC;
      --muted:    #CBD5E1;
      --success:  #10B981;
      --warning:  #F59E0B;
      --danger:   #EF4444;
    }
    body {
      font-family: Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
      line-height: 1.6;
    }

    /* ── Header bar ── */
    .header {
      background: #0D0D1E;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--primary);
    }
    .logo { font-size: 20px; font-weight: 700; color: var(--primary); letter-spacing: 0.5px; }
    .logo span { color: var(--accent); }
    .gen-date { font-size: 11px; color: var(--muted); }

    /* ── Subject banner ── */
    .banner {
      background: linear-gradient(135deg, #1E1E40 0%, #2E2E60 100%);
      padding: 24px;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
    .banner-subject {
      font-size: 26px; font-weight: 700;
      color: var(--text); margin-bottom: 4px;
    }
    .banner-student { font-size: 14px; color: var(--muted); margin-bottom: 12px; }
    .badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      border: 1.5px solid;
    }
    .accent-line {
      position: absolute; top: 0; left: 0;
      width: 4px; height: 100%;
      background: linear-gradient(180deg, var(--primary), var(--accent));
      border-radius: 0 2px 2px 0;
    }

    /* ── Info grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      margin: 0;
    }
    .info-cell {
      background: var(--surface);
      padding: 12px 16px;
    }
    .info-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-value { font-size: 13px; font-weight: 600; color: var(--text); }

    /* ── Section ── */
    section { padding: 20px 24px; border-bottom: 1px solid var(--border); }
    .section-title {
      font-size: 14px; font-weight: 700;
      color: var(--accent);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 14px;
      display: flex; align-items: center; gap: 8px;
    }
    .section-title::after {
      content: ''; flex: 1; height: 1px;
      background: linear-gradient(90deg, var(--accent), transparent);
    }

    /* ── Progress pills ── */
    .pills { display: flex; gap: 12px; margin-bottom: 14px; }
    .pill {
      flex: 1; text-align: center;
      padding: 12px 8px;
      border-radius: 10px;
      border: 1.5px solid;
    }
    .pill-value { font-size: 22px; font-weight: 700; display: block; }
    .pill-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }

    /* ── Progress bar ── */
    .progress-track {
      background: var(--border);
      border-radius: 999px;
      height: 10px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .progress-fill {
      background: linear-gradient(90deg, var(--primary), var(--accent));
      height: 100%;
      border-radius: 999px;
    }
    .progress-note { font-size: 11px; color: var(--muted); text-align: right; }

    /* ── Tables ── */
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: var(--surface2); }
    th {
      padding: 10px 12px; text-align: left;
      font-size: 10px; font-weight: 700;
      color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border);
    }
    td { padding: 9px 12px; font-size: 12px; color: var(--text); }
    .empty-row td { text-align: center; color: var(--muted); padding: 20px; }

    /* ── Footer ── */
    .footer {
      background: #0D0D1E;
      padding: 14px 24px;
      text-align: center;
      font-size: 11px;
      color: var(--muted);
      border-top: 1px solid var(--border);
    }
    .footer strong { color: var(--primary); }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo">Tuition<span>Track</span></div>
    <div class="gen-date">Generated: ${genDate}</div>
  </div>

  <div class="banner">
    <div class="accent-line"></div>
    <div class="banner-subject">${tuition.subject}</div>
    <div class="banner-student">
      ${tuition.studentName ?? "No student assigned"}
      ${tuition.studentEmail ? ` &bull; ${tuition.studentEmail}` : ""}
    </div>
    <span class="badge" style="border-color:${paidColor};color:${paidColor}">
      ${paymentLabel(tuition.paymentStatus)}
    </span>
  </div>

  <div class="info-grid">
    <div class="info-cell">
      <div class="info-label">Schedule</div>
      <div class="info-value">${tuition.schedule}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Class Time</div>
      <div class="info-value">${tuition.startTime} – ${tuition.endTime}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Monthly Fee</div>
      <div class="info-value">${tuition.salary ? "৳" + tuition.salary.toLocaleString("en-IN") : "—"}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Days / Week</div>
      <div class="info-value">${tuition.datesPerWeek}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Status</div>
      <div class="info-value" style="text-transform:capitalize">${tuition.status}</div>
    </div>
    <div class="info-cell">
      <div class="info-label">Created On</div>
      <div class="info-value">${fmtDate(tuition.createdAt)}</div>
    </div>
  </div>

  <section>
    <div class="section-title">Monthly Progress — ${monthLabel}</div>
    <div class="pills">
      <div class="pill" style="border-color:#7C3AED">
        <span class="pill-value" style="color:#A78BFA">${planned}</span>
        <span class="pill-label">Planned</span>
      </div>
      <div class="pill" style="border-color:#10B981">
        <span class="pill-value" style="color:#34D399">${classCount}</span>
        <span class="pill-label">Done</span>
      </div>
      <div class="pill" style="border-color:#F59E0B">
        <span class="pill-value" style="color:#FBBF24">${remaining}</span>
        <span class="pill-label">Remaining</span>
      </div>
    </div>
    <div class="progress-track">
      <div class="progress-fill" style="width:${progressPct}%"></div>
    </div>
    <p class="progress-note">${progressPct}% of monthly target completed</p>
  </section>

  <section>
    <div class="section-title">Class Logs (${classLogs.length})</div>
    <table>
      <thead>
        <tr>
          <th style="text-align:center;width:40px">#</th>
          <th>Date</th>
          <th style="text-align:center;width:60px">Day</th>
          <th style="text-align:center">Logged At</th>
        </tr>
      </thead>
      <tbody>
        ${classRows || '<tr class="empty-row"><td colspan="4">No classes logged this period</td></tr>'}
      </tbody>
    </table>
  </section>

  <section>
    <div class="section-title">Homework (${homeworkList.length})</div>
    <table>
      <thead>
        <tr>
          <th style="width:28%">Chapter</th>
          <th style="width:38%">Task</th>
          <th style="text-align:center;width:18%">Due Date</th>
          <th style="text-align:center;width:16%">Status</th>
        </tr>
      </thead>
      <tbody>
        ${hwRows || '<tr class="empty-row"><td colspan="4">No homework assigned</td></tr>'}
      </tbody>
    </table>
  </section>

  <div class="footer">
    Generated by <strong>TuitionTrack</strong> &bull; ${new Date().toISOString().slice(0, 10)}
    ${tuition.salary ? ` &bull; Monthly Salary ৳${tuition.salary.toLocaleString("en-IN")}` : ""}
  </div>

</body>
</html>`;

  try {
    const Print = await import("expo-print");
    const Sharing = await import("expo-sharing");

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `${tuition.subject} — ${tuition.studentName ?? "Tuition"} Report`,
        UTI: "com.adobe.pdf",
      });
    }
  } catch {
    Alert.alert(
      "PDF Not Available",
      "PDF generation requires a development build. Run `expo run:android` or `expo run:ios` to enable this feature."
    );
  }
}
