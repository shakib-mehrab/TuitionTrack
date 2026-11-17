// Payments / Fees list shared by teacher (can mark paid) and student (read-only + slips).
import { Badge, Button, Card, EmptyState, T } from "@/components/kit/core";
import { Chips } from "@/components/kit/form";
import { useToast } from "@/components/kit/toast";
import { paymentLabel, paymentTone } from "@/components/tuition";
import { C } from "@/constants/theme";
import { formatMoney, monthLabel, studentNames } from "@/lib/format";
import type { PaymentHistory } from "@/services/firebase/firestore.service";
import type { ClassLog, PaymentStatus, Tuition } from "@/types";
import { generatePaymentSlip, generateTuitionPDF } from "@/utils/pdf";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

type Row = {
  key: string;
  t: Tuition;
  month: string;
  open: boolean;
  classCount: number;
  planned: number;
  status: PaymentStatus;
  amount: number | null;
  record?: PaymentHistory;
};

type Filter = "all" | "due" | "paid";

export function PaymentsList({
  role,
  tuitions,
  payments,
  currentCount,
  openMonth,
  logsFor,
  teacherName,
  onMarkPaid,
}: {
  role: "teacher" | "student";
  tuitions: Tuition[];
  payments: PaymentHistory[];
  currentCount: (tuitionId: string) => number;
  openMonth: (tuitionId: string) => string;
  /** All class logs of a tuition (used for closed-month reports). */
  logsFor: (tuitionId: string) => ClassLog[];
  teacherName: (t: Tuition) => string;
  onMarkPaid?: (t: Tuition, month: string, amount: number) => Promise<void>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const rows: Row[] = [];
  for (const t of tuitions) {
    const month = openMonth(t.id);
    const openRecord = payments.find((p) => p.tuitionId === t.id && p.month === month && !p.closedAt);
    rows.push({
      key: `${t.id}-open`,
      t,
      month,
      open: true,
      classCount: currentCount(t.id),
      planned: t.plannedClassesPerMonth,
      status: t.paymentStatus,
      amount: openRecord?.amount ?? t.salary ?? null,
      record: openRecord,
    });
    for (const p of payments.filter((x) => x.tuitionId === t.id && x.closedAt)) {
      rows.push({
        key: p.id,
        t,
        month: p.month,
        open: false,
        classCount: p.classCount ?? 0,
        planned: p.plannedClasses ?? t.plannedClassesPerMonth,
        status: p.status,
        amount: p.amount ?? null,
        record: p,
      });
    }
  }

  const due = rows.filter((r) => !r.open && r.status !== "paid" && (r.amount ?? 0) > 0);
  const dueTotal = due.reduce((s, r) => s + (r.amount ?? 0), 0);
  const year = String(new Date().getFullYear());
  const collected = rows.filter((r) => r.status === "paid" && r.record?.paidAt?.startsWith(year)).reduce((s, r) => s + (r.amount ?? 0), 0);

  const shown = rows.filter((r) => (filter === "all" ? true : filter === "paid" ? r.status === "paid" : due.includes(r)));
  const groups = new Map<string, Row[]>();
  for (const r of shown.sort((a, b) => Number(b.open) - Number(a.open) || b.month.localeCompare(a.month))) {
    const key = r.open ? "open" : r.month;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  const slip = async (r: Row) => {
    if (!r.record) return;
    try {
      await generatePaymentSlip({
        tuition: r.t,
        month: r.month,
        classCount: r.classCount,
        planned: r.planned,
        payment: r.record,
        studentName: studentNames(r.t),
        teacherName: teacherName(r.t),
      });
    } catch {
      toast({ message: "Could not create the slip", tone: "error" });
    }
  };

  const report = async (r: Row) => {
    try {
      const logs = r.record?.classDates
        ? r.record.classDates.map((d, i) => ({ id: String(i), tuitionId: r.t.id, date: d, createdAt: `${d}T12:00:00` }))
        : logsFor(r.t.id).filter((l) => l.date.startsWith(r.month));
      await generateTuitionPDF({
        tuition: r.t,
        month: r.month,
        logs,
        studentName: studentNames(r.t),
        teacherName: teacherName(r.t),
        payment: { status: r.status, amount: r.amount },
        closed: !r.open,
      });
    } catch {
      toast({ message: "Could not create the report", tone: "error" });
    }
  };

  if (!tuitions.length) {
    return <EmptyState icon="credit-card" title="No tuitions yet">Fees show up here once a tuition has a monthly fee.</EmptyState>;
  }

  return (
    <>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, backgroundColor: C.coralSoft, borderRadius: 20, padding: 16, gap: 6 }}>
          <T w="bold" size={12} color={C.coralInk}>
            Due
          </T>
          <T w="extrabold" size={22}>
            {formatMoney(dueTotal)}
          </T>
          <T w="semibold" size={12} color={C.coralInk}>
            {due.length ? `${due.length} closed ${due.length === 1 ? "month" : "months"} unpaid` : "All settled"}
          </T>
        </View>
        <Card style={{ flex: 1, padding: 16, gap: 6 }}>
          <T w="bold" size={12} color={C.muted}>
            {role === "teacher" ? "Collected" : "Paid"} in {year}
          </T>
          <T w="extrabold" size={22}>
            {formatMoney(collected)}
          </T>
          <T w="semibold" size={12} color={C.mintInk}>
            {rows.filter((r) => r.status === "paid").length} paid months
          </T>
        </Card>
      </View>

      <Chips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All" },
          { value: "due", label: due.length ? `Due · ${due.length}` : "Due" },
          { value: "paid", label: "Paid" },
        ]}
      />

      {groups.size === 0 ? (
        <Card style={{ padding: 18 }}>
          <T size={14} color={C.muted}>
            Nothing here.
          </T>
        </Card>
      ) : null}

      {Array.from(groups.entries()).map(([key, items]) => (
        <View key={key} style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T w="extrabold" size={15}>
              {key === "open" ? "This month" : monthLabel(key)}
            </T>
            {key === "open" ? <Badge>Open months</Badge> : null}
          </View>
          <Card>
            {items.map((r, i) => (
              <View key={r.key} style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: C.ground }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T w="bold" size={14} numberOfLines={1} onPress={() => router.push(`/(${role})/tuition/${r.t.id}` as never)}>
                      {r.t.subject} · {role === "teacher" ? studentNames(r.t) : teacherName(r.t)}
                    </T>
                    <T size={12} color={C.muted}>
                      {r.open ? `${monthLabel(r.month, true)} · ${r.classCount} of ${r.planned} so far` : `${r.classCount} of ${r.planned} classes`}
                    </T>
                  </View>
                  <T w="bold" size={14}>
                    {formatMoney(r.amount)}
                  </T>
                  {r.status === "paid" ? (
                    <Badge tone="mint">Paid</Badge>
                  ) : r.open ? (
                    <Badge>Running</Badge>
                  ) : (r.amount ?? 0) > 0 ? (
                    <Badge tone={paymentTone(r.status)}>{r.status === "partial" ? paymentLabel(r.status) : "Due"}</Badge>
                  ) : (
                    <Badge tone="neutral">No fee</Badge>
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {(r.status === "paid" || r.status === "partial") && r.record ? (
                    <Button title="Share slip" icon="share-2" variant="soft" size="sm" onPress={() => slip(r)} />
                  ) : null}
                  {role === "teacher" && onMarkPaid && r.status !== "paid" && (r.amount ?? 0) > 0 ? (
                    <Button
                      title="Mark paid"
                      icon="check"
                      variant="dark"
                      size="sm"
                      loading={busy === r.key}
                      onPress={async () => {
                        setBusy(r.key);
                        try {
                          await onMarkPaid(r.t, r.month, r.amount ?? 0);
                          toast({ message: `${monthLabel(r.month)} fee marked as paid` });
                        } catch {
                          toast({ message: "Could not update the payment", tone: "error" });
                        } finally {
                          setBusy(null);
                        }
                      }}
                    />
                  ) : null}
                  {!r.open ? <Button title="Report" icon="file-text" variant="outline" size="sm" onPress={() => report(r)} /> : null}
                </View>
              </View>
            ))}
          </Card>
        </View>
      ))}
    </>
  );
}
