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

  // Generate filename: Monthly Report-Student Name.pdf
  const studentName = tuition.studentName || "Student";
  const filename = `Monthly Report-${studentName}.pdf`;

  const classRows = classLogs
    .map((log, i) => {
      const d = new Date(log.date);
      const day = DAY_NAMES[d.getDay()];
      return `<tr>
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
      return `<tr>
      <td>${hw.subject}</td>
      <td>${hw.chapter}</td>
      <td>${hw.task}</td>
      <td style="text-align:center">${hw.dueDate}</td>
      <td style="text-align:center;color:${statusColor};font-weight:700">${statusText}</td>
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
      --bg:       #F8FAFC;
      --surface:  #FFFFFF;
      --surface2: #F1F5F9;
      --border:   #E2E8F0;
      --primary:  #6366F1;
      --accent:   #818CF8;
      --text:     #1E293B;
      --muted:    #64748B;
      --success:  #10B981;
      --warning:  #F59E0B;
      --danger:   #EF4444;
    }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      font-size: 12px;
      line-height: 1.5;
    }

    /* ── Header bar ── */
    .header {
      background: var(--surface);
      padding: 20px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
    }
    .logo { font-size: 22px; font-weight: 800; color: var(--primary); letter-spacing: -0.5px; }
    .logo span { color: var(--text); opacity: 0.8; }
    .gen-date { font-size: 11px; color: var(--muted); font-weight: 500; }

    /* ── Subject banner ── */
    .banner {
      background: var(--surface);
      padding: 32px 32px 48px 32px;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
    .banner-subject {
      font-size: 28px; font-weight: 800;
      color: var(--primary); margin-bottom: 6px;
      letter-spacing: -0.5px;
    }
    .banner-student { font-size: 14px; color: var(--muted); margin-bottom: 16px; font-weight: 500; }
    .badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .accent-line {
      position: absolute; top: 0; left: 0;
      width: 6px; height: 100%;
      background: var(--primary);
    }

    /* ── Info grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding: 0 32px;
      margin-top: -24px;
      position: relative;
      z-index: 10;
    }
    .info-cell {
      background: var(--surface2);
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    .info-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 700; }
    .info-value { font-size: 14px; font-weight: 700; color: var(--text); }

    /* ── Section ── */
    section { padding: 24px 32px; }
    .section-title {
      font-size: 13px; font-weight: 800;
      color: var(--text);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 18px;
      display: flex; align-items: center; gap: 10px;
    }
    .section-title::after {
      content: ''; flex: 1; height: 2px;
      background: var(--border);
      border-radius: 2px;
    }

    /* ── Progress pills ── */
    .pills { display: flex; gap: 16px; margin-bottom: 20px; }
    .pill {
      flex: 1; text-align: left;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface);
    }
    .pill-value { font-size: 24px; font-weight: 800; display: block; margin-bottom: 2px; }
    .pill-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }

    /* ── Progress bar ── */
    .progress-track {
      background: var(--border);
      border-radius: 6px;
      height: 8px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-fill {
      background: var(--primary);
      height: 100%;
      border-radius: 6px;
    }
    .progress-note { font-size: 11px; color: var(--muted); text-align: right; font-weight: 600; }

    /* ── Tables ── */
    table { width: 100%; border-collapse: separate; border-spacing: 0; }
    th {
      padding: 12px 16px; text-align: left;
      font-size: 10px; font-weight: 800;
      color: var(--muted); text-transform: uppercase; letter-spacing: 1px;
      background: var(--surface2);
      border-bottom: 2px solid var(--border);
    }
    th:first-child { border-top-left-radius: 8px; }
    th:last-child { border-top-right-radius: 8px; }
    
    td { padding: 12px 16px; font-size: 13px; color: var(--text); border-bottom: 1px solid var(--border); background: var(--surface); }
    tr:last-child td:first-child { border-bottom-left-radius: 8px; }
    tr:last-child td:last-child { border-bottom-right-radius: 8px; }

    .empty-row td { text-align: center; color: var(--muted); padding: 32px; font-style: italic; }

    /* ── Footer ── */
    .footer {
      padding: 32px;
      text-align: center;
      font-size: 11px;
      color: var(--muted);
      border-top: 1px solid var(--border);
      background: var(--surface);
    }
    .footer strong { color: var(--primary); font-weight: 800; }
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
    <span class="badge" style="background:${paidColor}15;color:${paidColor};border:1px solid ${paidColor}40">
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
      <div class="pill">
        <span class="pill-value" style="color:var(--text)">${planned}</span>
        <span class="pill-label">Planned</span>
      </div>
      <div class="pill">
        <span class="pill-value" style="color:var(--success)">${classCount}</span>
        <span class="pill-label">Done</span>
      </div>
      <div class="pill">
        <span class="pill-value" style="color:var(--warning)">${remaining}</span>
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
          <th style="width:18%">Subject</th>
          <th style="width:20%">Chapter</th>
          <th style="width:30%">Task</th>
          <th style="text-align:center;width:17%">Due Date</th>
          <th style="text-align:center;width:15%">Status</th>
        </tr>
      </thead>
      <tbody>
        ${hwRows || '<tr class="empty-row"><td colspan="5">No homework assigned</td></tr>'}
      </tbody>
    </table>
  </section>

  <div class="footer">
    Generated by <strong>TuitionTrack</strong> &bull; ${new Date().toISOString().slice(0, 10)}
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

  // Generate filename: Payment Receipt-Student Name.pdf
  const studentName = tuition.studentName || "Student";
  const filename = `Payment Receipt-${studentName}.pdf`;

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
      --primary:  #6366F1;
      --accent:   #818CF8;
      --text:     #1E293B;
      --muted:    #64748B;
      --success:  #10B981;
      --warning:  #F59E0B;
    }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      font-size: 13px;
      line-height: 1.5;
      padding: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    .header {
      background: var(--primary);
      padding: 32px;
      text-align: left;
      border-bottom: none;
    }
    .header-title {
      font-size: 32px;
      font-weight: 800;
      color: white;
      letter-spacing: -1px;
      margin-bottom: 4px;
    }
    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
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
      font-weight: 500;
      line-height: 1.6;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      color: rgba(99, 102, 241, 0.03);
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
