import type { ClassLog, Homework, Tuition } from "@/types";
import { Alert } from "react-native";

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

  // Generate filename: StudentName_TuitionRecord_MonthYear.pdf
  const studentName = (tuition.studentName || "Student").replace(/\s+/g, "_");
  const monthName = new Date().toLocaleString("default", { month: "long" });
  const year = new Date().getFullYear();
  const filename = `${studentName}_TuitionRecord_${monthName}${year}.pdf`;

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
        dialogTitle: filename,
        UTI: "com.adobe.pdf",
      });
    }
  } catch {
    Alert.alert(
      "PDF Not Available",
      "PDF generation requires a development build. Run `expo run:android` or `expo run:ios` to enable this feature.",
    );
  }
}

export async function generatePaymentReceipt(
  tuition: Tuition,
  classCount: number,
  planned: number,
  teacherName: string,
  month: string,
): Promise<void> {
  const remaining = Math.max(planned - classCount, 0);
  const paymentStatusLabel = paymentLabel(tuition.paymentStatus);
  const paymentStatusColor = paymentColor(tuition.paymentStatus);
  const receiptDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const monthLabel = new Date(month + "-01").toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Generate filename: StudentName_Payment_MonthYear.pdf
  const studentName = (tuition.studentName || "Student").replace(/\s+/g, "_");
  const monthName = new Date(month + "-01").toLocaleString("default", {
    month: "long",
  });
  const year = new Date(month + "-01").getFullYear();
  const filename = `${studentName}_Payment_${monthName}${year}.pdf`;

  const amountPaid =
    tuition.paymentStatus === "paid"
      ? tuition.salary || 0
      : tuition.paymentStatus === "partial"
        ? Math.floor((tuition.salary || 0) / 2)
        : 0;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Payment Receipt — ${tuition.subject}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg:       #FFFFFF;
      --surface:  #F8FAFC;
      --border:   #E2E8F0;
      --primary:  #7C3AED;
      --accent:   #22D3EE;
      --text:     #1E293B;
      --muted:    #64748B;
      --success:  #10B981;
      --warning:  #F59E0B;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
      line-height: 1.5;
      padding: 15px 10px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: white;
      border: 2px solid var(--border);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%);
      padding: 18px 24px;
      text-align: center;
      border-bottom: 3px solid var(--primary);
    }
    .header-title {
      font-size: 26px;
      font-weight: 700;
      color: white;
      letter-spacing: 1px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 400;
      font-style: italic;
    }
    .memo-header {
      background: var(--surface);
      padding: 12px 24px;
      border-bottom: 1px dashed var(--border);
    }
    .memo-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 12px;
    }
    .memo-label {
      color: var(--muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 11px;
    }
    .memo-value {
      color: var(--text);
      font-weight: 500;
    }
    .content {
      padding: 18px 24px;
    }
    .receipt-title {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
    }
    .info-table {
      width: 100%;
      margin-bottom: 16px;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
    }
    .info-row:last-child {
      border-bottom: 2px solid var(--primary);
    }
    .info-label {
      flex: 0 0 40%;
      font-weight: 600;
      color: var(--muted);
      font-size: 13px;
      letter-spacing: 0.3px;
    }
    .info-value {
      flex: 1;
      font-weight: 500;
      color: var(--text);
      text-align: right;
    }
    .amount-box {
      background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
      border: 2px solid var(--success);
      border-radius: 8px;
      padding: 14px;
      text-align: center;
      margin: 16px 0;
    }
    .amount-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .amount-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--success);
      letter-spacing: 1px;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .signature-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px dashed var(--border);
    }
    .signature-box {
      text-align: right;
    }
    .signature-line {
      border-top: 2px solid var(--text);
      width: 180px;
      margin: 30px 0 6px auto;
    }
    .signature-label {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .signature-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-top: 3px;
    }
    .footer {
      background: var(--surface);
      padding: 12px 24px;
      text-align: center;
      border-top: 1px solid var(--border);
    }
    .footer-note {
      font-size: 10px;
      color: var(--muted);
      font-style: italic;
      line-height: 1.5;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      color: rgba(124, 58, 237, 0.02);
      font-weight: 900;
      pointer-events: none;
      z-index: 0;
    }
  </style>
</head>
<body>
  <div class="watermark">TuitionTrack</div>
  
  <div class="container">
    <div class="header">
      <div class="header-title">Payment Receipt</div>
      <div class="header-subtitle">TuitionTrack Professional Services</div>
    </div>

    <div class="memo-header">
      <div class="memo-row">
        <span class="memo-label">Receipt No:</span>
        <span class="memo-value">RCP-${Date.now().toString().slice(-8)}</span>
      </div>
      <div class="memo-row">
        <span class="memo-label">Date:</span>
        <span class="memo-value">${receiptDate}</span>
      </div>
      <div class="memo-row">
        <span class="memo-label">Period:</span>
        <span class="memo-value">${monthLabel}</span>
      </div>
    </div>

    <div class="content">
      <div class="receipt-title">Payment Details</div>

      <div class="info-table">
        <div class="info-row">
          <div class="info-label">Student Name</div>
          <div class="info-value">${tuition.studentName || "N/A"}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Subject</div>
          <div class="info-value">${tuition.subject}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Class Schedule</div>
          <div class="info-value">${tuition.schedule} • ${tuition.startTime} – ${tuition.endTime}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Planned Classes</div>
          <div class="info-value">${planned} classes</div>
        </div>
        <div class="info-row">
          <div class="info-label">Classes Taken</div>
          <div class="info-value">${classCount} classes</div>
        </div>
        <div class="info-row">
          <div class="info-label">Classes Remaining</div>
          <div class="info-value">${remaining} classes</div>
        </div>
        <div class="info-row">
          <div class="info-label">Payment Status</div>
          <div class="info-value">
            <span class="status-badge" style="background:${paymentStatusColor}22;color:${paymentStatusColor};border:1.5px solid ${paymentStatusColor}">
              ${paymentStatusLabel}
            </span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-label">Monthly Fee</div>
          <div class="info-value">৳${(tuition.salary || 0).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div class="amount-box">
        <div class="amount-label">Amount Paid</div>
        <div class="amount-value">৳${amountPaid.toLocaleString("en-IN")}</div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Authorized Signature</div>
          <div class="signature-name">${teacherName}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-note">
        This is a computer-generated receipt and does not require a physical signature.<br/>
        For any queries, please contact your tutor directly.<br/>
        Generated by <strong>TuitionTrack</strong> on ${receiptDate}
      </div>
    </div>
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
        dialogTitle: filename,
        UTI: "com.adobe.pdf",
      });
    }
  } catch {
    Alert.alert(
      "PDF Not Available",
      "PDF generation requires a development build. Run `expo run:android` or `expo run:ios` to enable this feature.",
    );
  }
}
