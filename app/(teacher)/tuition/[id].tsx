// Teacher · Tuition detail — calendar, fee, close month, invite, homework, past months, activity.
import { Badge, Button, Card, EmptyState, Header, HeaderIconButton, Ring, Screen, T } from "@/components/kit/core";
import { Segmented } from "@/components/kit/form";
import { ConfirmSheet, Sheet } from "@/components/kit/sheet";
import { useToast } from "@/components/kit/toast";
import { HomeworkRow, HomeworkSheet } from "@/components/homework";
import { useLogClass } from "@/components/LogClass";
import { MonthCalendar, ScheduleChips, paymentLabel, paymentTone } from "@/components/tuition";
import { C, R } from "@/constants/theme";
import { formatClock, formatDate, formatDay, formatMoney, fromKey, hasStudent, monthLabel, monthName, studentNames } from "@/lib/format";
import type { PaymentHistory } from "@/services/firebase/firestore.service";
import { useAuthStore } from "@/store/authStore";
import { useTeacherStore } from "@/store/teacherStore";
import type { ClassLog, PaymentStatus, Tuition } from "@/types";
import { generatePaymentSlip, generateTuitionPDF } from "@/utils/pdf";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Clipboard, Pressable, Share, View } from "react-native";

type Tab = "classes" | "homework" | "months";
type SheetName = null | "more" | "payment" | "invite" | "close" | "delete" | "homework";

export default function TeacherTuitionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { open: openLog } = useLogClass();
  const user = useAuthStore((s) => s.user);
  const tuition = useTeacherStore((s) => s.tuitions.find((t) => t.id === id));
  const classLogs = useTeacherStore((s) => s.classLogs);
  const homework = useTeacherStore((s) => s.homework);
  const payments = useTeacherStore((s) => s.payments);
  const activityLogs = useTeacherStore((s) => s.activityLogs);
  const store = useTeacherStore();

  const [tab, setTab] = useState<Tab>("classes");
  const [sheet, setSheet] = useState<SheetName>(null);
  const [removing, setRemoving] = useState<ClassLog | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [showAllActivity, setShowAllActivity] = useState(false);

  const current = useMemo(() => (tuition ? store.getCurrentLogs(tuition.id) : []), [tuition, classLogs]); // eslint-disable-line react-hooks/exhaustive-deps
  const month = tuition ? store.getOpenMonth(tuition.id) : "";
  const hw = useMemo(() => homework.filter((h) => h.tuitionId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [homework, id]);
  const closed = useMemo(() => payments.filter((p) => p.tuitionId === id && p.closedAt).sort((a, b) => b.month.localeCompare(a.month)), [payments, id]);
  const openRecord = payments.find((p) => p.tuitionId === id && p.month === month && !p.closedAt);
  const activity = useMemo(() => activityLogs.filter((a) => a.tuitionId === id).sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [activityLogs, id]);

  if (!tuition) {
    return (
      <Screen>
        <Header title="Tuition" back />
        <EmptyState icon="alert-circle" title="Tuition not found">
          It may have been deleted.
        </EmptyState>
      </Screen>
    );
  }

  const t: Tuition = tuition;
  const planned = t.plannedClassesPerMonth || 1;
  const left = Math.max(0, planned - current.length);
  const openHw = hw.filter((h) => !h.completed).length;
  const names = studentNames(t);

  const report = async (logs: ClassLog[], m: string, payment?: { status?: PaymentStatus; amount?: number | null }, isClosed?: boolean) => {
    try {
      await generateTuitionPDF({ tuition: t, month: m, logs, studentName: names, teacherName: user?.name ?? "Teacher", payment, closed: isClosed });
    } catch {
      toast({ message: "Could not create the report", tone: "error" });
    }
  };

  const slip = async (p: PaymentHistory, classCount: number, plannedCount: number) => {
    try {
      await generatePaymentSlip({ tuition: t, month: p.month, classCount, planned: plannedCount, payment: p, studentName: names, teacherName: user?.name ?? "Teacher" });
    } catch {
      toast({ message: "Could not create the slip", tone: "error" });
    }
  };

  const setPayment = async (status: PaymentStatus, m = month) => {
    if (!t.salary) {
      toast({ message: "Set a monthly fee first (Edit tuition)", tone: "error" });
      return;
    }
    setBusy(true);
    try {
      await store.updatePaymentStatus(t.id, user?.id ?? "", t.studentId || t.studentIds?.[0] || "", m, status, t.salary);
      toast({ message: `Marked ${paymentLabel(status).toLowerCase()}` });
      setSheet(null);
    } catch {
      toast({ message: "Could not update the payment", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const invite = async () => {
    setBusy(true);
    try {
      const code = await store.generateInviteCode(t.id, user?.id ?? "");
      setInviteCode(code);
      setSheet("invite");
    } catch {
      toast({ message: "Could not create an invite code", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          {/* More options */}
          <Sheet open={sheet === "more"} onClose={() => setSheet(null)} title={`${t.subject} · ${names}`}>
            <MenuItem icon="edit-2" label="Edit tuition" onPress={() => { setSheet(null); router.push({ pathname: "/(teacher)/tuition/add", params: { id: t.id } }); }} />
            <MenuItem icon="user-plus" label={hasStudent(t) ? "Invite another student" : "Invite student"} onPress={invite} />
            <MenuItem icon="trash-2" label="Delete tuition" danger onPress={() => setSheet("delete")} />
          </Sheet>

          {/* Payment status for the open month */}
          <Sheet open={sheet === "payment"} onClose={() => setSheet(null)} title={`${monthName(month)} fee`} description={t.salary ? `${formatMoney(t.salary)} per month` : "No monthly fee set yet"}>
            {(["paid", "partial", "not_paid"] as PaymentStatus[]).map((s) => {
              const on = t.paymentStatus === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setPayment(s)}
                  disabled={busy}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: R.lg, backgroundColor: on ? C.primarySoft : C.mist, borderWidth: 2, borderColor: on ? C.primary : "transparent" }}
                >
                  <Badge tone={paymentTone(s)}>{paymentLabel(s)}</Badge>
                  <T size={14} color={C.muted} style={{ flex: 1 }}>
                    {s === "paid" ? "Full fee received" : s === "partial" ? "Some of the fee received" : "Nothing received yet"}
                  </T>
                  {on ? <Feather name="check" size={20} color={C.primary} /> : null}
                </Pressable>
              );
            })}
          </Sheet>

          {/* Invite code */}
          <Sheet open={sheet === "invite"} onClose={() => setSheet(null)} title="Invite a student" description="The student signs up in TuitionTrack as a student, then joins with this code.">
            <View style={{ backgroundColor: C.primarySoft, borderRadius: R.card, padding: 20, alignItems: "center", gap: 6 }}>
              <T w="bold" size={12} color={C.primaryDeep}>
                INVITE CODE
              </T>
              <T w="extrabold" size={34} color={C.ink} style={{ letterSpacing: 6 }} selectable>
                {inviteCode}
              </T>
              <T size={13} color={C.muted}>
                {t.subject} · {t.schedule} · {t.startTime}
              </T>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                title="Copy"
                icon="copy"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => {
                  Clipboard.setString(inviteCode);
                  toast({ message: "Code copied" });
                }}
              />
              <Button
                title="Share"
                icon="share-2"
                style={{ flex: 1 }}
                onPress={() =>
                  Share.share({
                    message: `Join my ${t.subject} tuition on TuitionTrack.\n${t.schedule} · ${t.startTime} – ${t.endTime}\n\nInvite code: ${inviteCode}`,
                  }).catch(() => {})
                }
              />
            </View>
          </Sheet>

          <ConfirmSheet
            open={sheet === "close"}
            onClose={() => setSheet(null)}
            title={`Close ${monthName(month)}?`}
            confirmLabel="Close month"
            loading={busy}
            extra={<Button title="Download report first" icon="file-text" variant="outline" onPress={() => report(current, month, { status: t.paymentStatus, amount: t.salary })} />}
            onConfirm={async () => {
              setBusy(true);
              try {
                await store.closeMonth(t.id);
                toast({ message: `${monthName(month)} closed. A new month has started.` });
                setSheet(null);
              } catch {
                toast({ message: "Could not close the month", tone: "error" });
              } finally {
                setBusy(false);
              }
            }}
          >
            {`${monthLabel(month)} will be saved with ${current.length} of ${planned} classes and its fee status (${paymentLabel(t.paymentStatus).toLowerCase()}). You'll find it under Months. The new month starts at 0.`}
          </ConfirmSheet>

          <ConfirmSheet
            open={sheet === "delete"}
            onClose={() => setSheet(null)}
            title="Delete this tuition?"
            confirmLabel="Delete forever"
            danger
            loading={busy}
            onConfirm={async () => {
              setBusy(true);
              try {
                await store.deleteTuition(t.id);
                toast({ message: "Tuition deleted" });
                router.back();
              } catch {
                toast({ message: "Could not delete the tuition", tone: "error" });
                setBusy(false);
              }
            }}
          >
            {`${t.subject} with ${names} will be deleted with all its classes, months, payments and homework. This can't be undone.`}
          </ConfirmSheet>

          <ConfirmSheet
            open={!!removing}
            onClose={() => setRemoving(null)}
            title="Remove this class?"
            confirmLabel="Remove class"
            danger
            onConfirm={async () => {
              if (!removing) return;
              const log = removing;
              setRemoving(null);
              try {
                await store.deleteClassLog(log.id, t.id);
                toast({ message: "Class removed" });
              } catch {
                toast({ message: "Could not remove the class", tone: "error" });
              }
            }}
          >
            {removing ? `The class on ${formatDay(fromKey(removing.date))} will be removed and this month's count goes down by one.` : ""}
          </ConfirmSheet>

          {sheet === "homework" ? <HomeworkSheet open tuition={t} teacherId={user?.id ?? ""} onClose={() => setSheet(null)} /> : null}
        </>
      }
    >
      <Header title={t.subject} back right={<HeaderIconButton icon="more-horizontal" label="More options" onPress={() => setSheet("more")} />} />

      {/* Hero */}
      <Card style={{ padding: 18, gap: 16, borderRadius: R.panel }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Ring value={current.length / planned} size={72} label={`${current.length}/${t.plannedClassesPerMonth}`} labelSize={15} />
          <View style={{ flex: 1, gap: 4 }}>
            <T w="extrabold" size={18} numberOfLines={2}>
              {names}
            </T>
            <T size={13} color={C.muted}>
              {monthName(month)} · {left ? `${left} ${left === 1 ? "class" : "classes"} left` : "all planned classes done"}
            </T>
            {hasStudent(t) ? <Badge tone="mint">Student app linked</Badge> : <Badge tone="neutral">No student account</Badge>}
          </View>
        </View>
        <ScheduleChips t={t} />
      </Card>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "classes", label: "Classes" },
          { value: "homework", label: openHw ? `Homework · ${openHw}` : "Homework" },
          { value: "months", label: "Months" },
        ]}
      />

      {tab === "classes" ? (
        <>
          <Card style={{ padding: 16, gap: 12, borderRadius: R.panel }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <T w="extrabold" size={15}>
                {monthLabel(month)}
              </T>
              <T w="semibold" size={12} color={C.muted}>
                Tap a day to log or remove
              </T>
            </View>
            <MonthCalendar t={t} month={month} logs={current} canEdit onDay={(day, log) => (log ? setRemoving(log) : openLog(t.id, day))} />
          </Card>

          {/* Fee */}
          <Card style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T w="bold" size={14}>
                  {monthName(month)} fee · {formatMoney(t.salary ?? null)}
                </T>
                <T w="semibold" size={12} color={t.paymentStatus === "paid" ? C.mintInk : C.muted}>
                  {!t.salary ? "No fee set for this tuition" : t.paymentStatus === "paid" && openRecord?.paidAt ? `Paid ${formatDate(new Date(openRecord.paidAt))}` : paymentLabel(t.paymentStatus)}
                </T>
              </View>
              {t.paymentStatus !== "paid" && t.salary ? <Button title="Mark paid" icon="check" variant="dark" size="sm" loading={busy} onPress={() => setPayment("paid")} /> : null}
            </View>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {(t.paymentStatus === "paid" || t.paymentStatus === "partial") && openRecord ? (
                <Button title="Share slip" icon="share-2" variant="soft" size="sm" onPress={() => slip(openRecord, current.length, planned)} />
              ) : null}
              <Button title="Change status" variant="ghost" size="sm" onPress={() => setSheet("payment")} />
            </View>
          </Card>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button title="Report PDF" icon="file-text" variant="outline" style={{ flex: 1 }} onPress={() => report(current, month, { status: t.paymentStatus, amount: t.salary })} />
            <Button title="Close month" style={{ flex: 1 }} onPress={() => setSheet("close")} />
          </View>

          {/* Activity */}
          <Card style={{ padding: 16, borderRadius: R.panel }}>
            <T w="extrabold" size={15} style={{ marginBottom: 6 }}>
              This month’s classes
            </T>
            {current.length === 0 ? (
              <T size={14} color={C.muted} style={{ paddingVertical: 6 }}>
                No classes logged this month yet.
              </T>
            ) : (
              current.slice(0, showAllActivity ? undefined : 8).map((l, i) => (
                <View key={l.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: i < current.length - 1 ? 1 : 0, borderBottomColor: C.ground }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" }}>
                    <Feather name="check" size={16} color={C.primaryDeep} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T w="semibold" size={14}>
                      Class on {formatDay(fromKey(l.date))}
                    </T>
                    <T size={12} color={C.muted}>
                      Logged {formatDate(new Date(l.createdAt))}, {formatClock(new Date(l.createdAt))}
                    </T>
                  </View>
                  <Pressable accessibilityLabel={`Remove class on ${formatDay(fromKey(l.date))}`} hitSlop={8} onPress={() => setRemoving(l)}>
                    <Feather name="trash-2" size={17} color={C.muted} />
                  </Pressable>
                </View>
              ))
            )}
            {current.length > 8 ? (
              <Pressable onPress={() => setShowAllActivity((v) => !v)} style={{ paddingTop: 8 }}>
                <T w="bold" size={13} color={C.primary}>
                  {showAllActivity ? "Show less" : `Show all ${current.length}`}
                </T>
              </Pressable>
            ) : null}
          </Card>

          {activity.length ? (
            <Card style={{ padding: 16, gap: 4, borderRadius: R.panel }}>
              <T w="extrabold" size={15} style={{ marginBottom: 6 }}>
                Activity
              </T>
              {activity.slice(0, 6).map((a) => (
                <View key={a.id} style={{ flexDirection: "row", gap: 10, paddingVertical: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.primaryLine, marginTop: 7 }} />
                  <View style={{ flex: 1 }}>
                    <T size={13}>{a.description}</T>
                    <T size={11} color={C.muted}>
                      {formatDate(new Date(a.timestamp))}, {formatClock(new Date(a.timestamp))}
                    </T>
                  </View>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}

      {tab === "homework" ? (
        <Card style={{ padding: 16, gap: 10, borderRadius: R.panel }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T w="extrabold" size={15}>
              Homework
            </T>
            <Button title="Assign" icon="plus" variant="soft" size="sm" onPress={() => setSheet("homework")} />
          </View>
          {hw.length === 0 ? (
            <T size={14} color={C.muted}>
              No homework yet.
            </T>
          ) : (
            hw.map((h) => <HomeworkRow key={h.id} h={h} showSubject={false} onPress={() => router.push({ pathname: "/(teacher)/homework/[id]", params: { id: h.id } })} />)
          )}
        </Card>
      ) : null}

      {tab === "months" ? (
        <Card style={{ padding: 16, gap: 4, borderRadius: R.panel }}>
          <T w="extrabold" size={15} style={{ marginBottom: 6 }}>
            Past months
          </T>
          {closed.length === 0 ? (
            <T size={14} color={C.muted} style={{ lineHeight: 21 }}>
              No closed months yet. When a month ends, use “Close month” to keep its record and fee status here.
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
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {p.status === "paid" || p.status === "partial" ? (
                    <Button title="Share slip" icon="share-2" variant="soft" size="sm" onPress={() => slip(p, p.classCount ?? 0, p.plannedClasses ?? planned)} />
                  ) : null}
                  {p.status !== "paid" && p.amount > 0 ? <Button title="Mark paid" icon="check" variant="dark" size="sm" onPress={() => setPayment("paid", p.month)} /> : null}
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

function MenuItem({ icon, label, onPress, danger }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: R.lg,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: danger ? C.coralMist : C.mist,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Feather name={icon} size={20} color={danger ? C.coralInk : C.ink} />
      <T w="bold" size={15} color={danger ? C.coralInk : C.ink}>
        {label}
      </T>
    </Pressable>
  );
}
