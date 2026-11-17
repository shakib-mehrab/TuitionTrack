// Student · Tuition detail — read-only calendar, fee status + slip, homework, past months.
import { Badge, Button, Card, EmptyState, Header, Ring, Screen, T } from "@/components/kit/core";
import { Segmented } from "@/components/kit/form";
import { useToast } from "@/components/kit/toast";
import { HomeworkRow } from "@/components/homework";
import { MonthCalendar, ScheduleChips, paymentLabel, paymentTone } from "@/components/tuition";
import { C, R } from "@/constants/theme";
import { formatDate, formatMoney, monthLabel, monthName, studentNames } from "@/lib/format";
import { useUserName } from "@/lib/useUserName";
import type { PaymentHistory } from "@/services/firebase/firestore.service";
import { useStudentStore } from "@/store/studentStore";
import type { ClassLog, PaymentStatus } from "@/types";
import { generatePaymentSlip, generateTuitionPDF } from "@/utils/pdf";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { View } from "react-native";

type Tab = "classes" | "homework" | "months";

export default function StudentTuitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const tuition = useStudentStore((s) => s.tuitions.find((t) => t.id === id));
  const classLogs = useStudentStore((s) => s.classLogs);
  const homework = useStudentStore((s) => s.homework);
  const payments = useStudentStore((s) => s.payments);
  const getCurrentLogs = useStudentStore((s) => s.getCurrentLogs);
  const getOpenMonth = useStudentStore((s) => s.getOpenMonth);
  const teacherName = useUserName(tuition?.teacherId);
  const [tab, setTab] = useState<Tab>("classes");

  const current = useMemo(() => (tuition ? getCurrentLogs(tuition.id) : []), [tuition, classLogs]); // eslint-disable-line react-hooks/exhaustive-deps
  const hw = useMemo(() => homework.filter((h) => h.tuitionId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [homework, id]);
  const closed = useMemo(() => payments.filter((p) => p.tuitionId === id && p.closedAt).sort((a, b) => b.month.localeCompare(a.month)), [payments, id]);

  if (!tuition) {
    return (
      <Screen>
        <Header title="Tuition" back />
        <EmptyState icon="alert-circle" title="Tuition not found">
          You may no longer be part of this tuition.
        </EmptyState>
      </Screen>
    );
  }

  const t = tuition;
  const month = getOpenMonth(t.id);
  const planned = t.plannedClassesPerMonth || 1;
  const left = Math.max(0, planned - current.length);
  const openRecord = payments.find((p) => p.tuitionId === id && p.month === month && !p.closedAt);
  const names = studentNames(t);

  const report = async (logs: ClassLog[], m: string, payment: { status?: PaymentStatus; amount?: number | null }, isClosed?: boolean) => {
    try {
      await generateTuitionPDF({ tuition: t, month: m, logs, studentName: names, teacherName, payment, closed: isClosed });
    } catch {
      toast({ message: "Could not create the report", tone: "error" });
    }
  };
  const slip = async (p: PaymentHistory, classCount: number, plannedCount: number) => {
    try {
      await generatePaymentSlip({ tuition: t, month: p.month, classCount, planned: plannedCount, payment: p, studentName: names, teacherName });
    } catch {
      toast({ message: "Could not create the slip", tone: "error" });
    }
  };

  return (
    <Screen>
      <Header title={t.subject} back />
      <Card style={{ padding: 18, gap: 16, borderRadius: R.panel }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Ring value={current.length / planned} size={72} label={`${current.length}/${t.plannedClassesPerMonth}`} labelSize={15} />
          <View style={{ flex: 1, gap: 4 }}>
            <T w="extrabold" size={18}>
              with {teacherName}
            </T>
            <T size={13} color={C.muted}>
              {monthName(month)} · {left ? `${left} ${left === 1 ? "class" : "classes"} left` : "all planned classes done"}
            </T>
          </View>
        </View>
        <ScheduleChips t={t} />
      </Card>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "classes", label: "Classes" },
          { value: "homework", label: hw.filter((h) => !h.completed).length ? `Homework · ${hw.filter((h) => !h.completed).length}` : "Homework" },
          { value: "months", label: "Months" },
        ]}
      />

      {tab === "classes" ? (
        <>
          <Card style={{ padding: 16, gap: 12, borderRadius: R.panel }}>
            <T w="extrabold" size={15}>
              {monthLabel(month)}
            </T>
            <MonthCalendar t={t} month={month} logs={current} canEdit={false} />
          </Card>
          <Card style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T w="bold" size={14}>
                  {monthName(month)} fee · {formatMoney(t.salary ?? null)}
                </T>
                <T w="semibold" size={12} color={t.paymentStatus === "paid" ? C.mintInk : C.muted}>
                  {t.paymentStatus === "paid" && openRecord?.paidAt ? `Paid ${formatDate(new Date(openRecord.paidAt))}` : paymentLabel(t.paymentStatus)}
                </T>
              </View>
              <Badge tone={paymentTone(t.paymentStatus)}>{paymentLabel(t.paymentStatus)}</Badge>
            </View>
            {(t.paymentStatus === "paid" || t.paymentStatus === "partial") && openRecord ? (
              <Button title="Share payment slip" icon="share-2" variant="soft" size="sm" style={{ alignSelf: "flex-start" }} onPress={() => slip(openRecord, current.length, planned)} />
            ) : null}
          </Card>
          <Button title="Report PDF" icon="file-text" variant="outline" onPress={() => report(current, month, { status: t.paymentStatus, amount: t.salary })} />
        </>
      ) : null}

      {tab === "homework" ? (
        <Card style={{ padding: 16, gap: 10, borderRadius: R.panel }}>
          <T w="extrabold" size={15}>
            Homework
          </T>
          {hw.length === 0 ? (
            <T size={14} color={C.muted}>
              No homework yet.
            </T>
          ) : (
            hw.map((h) => <HomeworkRow key={h.id} h={h} showSubject={false} onPress={() => router.push({ pathname: "/(student)/homework/[id]", params: { id: h.id } })} />)
          )}
        </Card>
      ) : null}

      {tab === "months" ? (
        <Card style={{ padding: 16, gap: 4, borderRadius: R.panel }}>
          <T w="extrabold" size={15} style={{ marginBottom: 6 }}>
            Past months
          </T>
          {closed.length === 0 ? (
            <T size={14} color={C.muted}>
              No closed months yet.
            </T>
          ) : (
            closed.map((p, i) => (
              <View key={p.id} style={{ paddingVertical: 12, gap: 10, borderBottomWidth: i < closed.length - 1 ? 1 : 0, borderBottomColor: C.ground }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T w="bold" size={14}>
                      {monthLabel(p.month)}
                    </T>
                    <T size={12} color={C.muted}>
                      {p.classCount ?? 0} of {p.plannedClasses ?? planned} classes · {formatMoney(p.amount)}
                    </T>
                  </View>
                  <Badge tone={p.status === "paid" ? "mint" : paymentTone(p.status)}>{p.status === "paid" ? "Paid" : p.status === "partial" ? "Partly paid" : "Due"}</Badge>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {p.status === "paid" || p.status === "partial" ? <Button title="Share slip" icon="share-2" variant="soft" size="sm" onPress={() => slip(p, p.classCount ?? 0, p.plannedClasses ?? planned)} /> : null}
                  <Button
                    title="Report"
                    icon="file-text"
                    variant="outline"
                    size="sm"
                    onPress={() =>
                      report(
                        (p.classDates ?? []).map((d, k) => ({ id: String(k), tuitionId: t.id, date: d, createdAt: `${d}T12:00:00` })),
                        p.month,
                        { status: p.status, amount: p.amount },
                        true
                      )
                    }
                  />
                </View>
              </View>
            ))
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
