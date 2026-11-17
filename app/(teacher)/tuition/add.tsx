// Teacher · New tuition (or edit, when opened with ?id=).
import { Button, Card, Header, Screen, T } from "@/components/kit/core";
import { Field, FormError, Input, TimeField, WeekdayPicker } from "@/components/kit/form";
import { useToast } from "@/components/kit/toast";
import { C, R } from "@/constants/theme";
import { WEEKDAY_SHORT, classDaysInMonth, monthName, dateKey, scheduleDays, timeToMinutes } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useTeacherStore } from "@/store/teacherStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

export default function AddTuitionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const addTuition = useTeacherStore((s) => s.addTuition);
  const updateTuition = useTeacherStore((s) => s.updateTuition);
  const editing = useTeacherStore((s) => (id ? s.tuitions.find((t) => t.id === id) : undefined));
  const now = new Date();

  const [subject, setSubject] = useState(editing?.subject ?? "");
  const [studentName, setStudentName] = useState(editing?.studentName ?? "");
  const [days, setDays] = useState<number[]>(editing ? scheduleDays(editing) : []);
  const [startTime, setStartTime] = useState(editing?.startTime ?? "5:00 PM");
  const [endTime, setEndTime] = useState(editing?.endTime ?? "6:30 PM");
  const [planned, setPlanned] = useState(editing ? String(editing.plannedClassesPerMonth) : "");
  const [plannedTouched, setPlannedTouched] = useState(!!editing);
  const [fee, setFee] = useState(editing?.salary ? String(editing.salary) : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const suggestion = days.length ? classDaysInMonth(days, now.getFullYear(), now.getMonth()) : null;

  const onDays = (next: number[]) => {
    setDays(next);
    if (!plannedTouched && next.length) setPlanned(String(classDaysInMonth(next, now.getFullYear(), now.getMonth())));
  };

  const submit = async () => {
    setError(null);
    if (!subject.trim()) return setError("Add a subject");
    if (!days.length) return setError("Pick at least one class day");
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) return setError("End time must be after start time");
    const plannedNum = parseInt(planned, 10);
    if (!plannedNum || plannedNum < 1 || plannedNum > 62) return setError("Classes per month must be between 1 and 62");
    const feeNum = fee.trim() ? Number(fee) : undefined;
    if (fee.trim() && (!Number.isFinite(feeNum) || (feeNum ?? 0) < 0)) return setError("Enter the fee as a number");

    const data = {
      subject: subject.trim(),
      schedule: days.map((d) => WEEKDAY_SHORT[d]).join(", "),
      datesPerWeek: days.length,
      startTime,
      endTime,
      plannedClassesPerMonth: plannedNum,
      studentName: studentName.trim() || undefined,
      salary: feeNum,
    };

    setBusy(true);
    try {
      if (editing) {
        await updateTuition(editing.id, data);
        toast({ message: "Tuition updated" });
      } else {
        await addTuition({ ...data, teacherId: user?.id ?? "", status: "active", paymentStatus: "not_paid" });
        toast({ message: "Tuition created" });
      }
      router.back();
    } catch {
      setError("Could not save the tuition. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={editing ? "Edit tuition" : "New tuition"} back />
      <Card style={{ padding: 18, gap: 16, borderRadius: R.panel }}>
        <Field label="Subject">
          <Input value={subject} onChangeText={setSubject} placeholder="e.g. Physics" autoCapitalize="words" />
        </Field>
        <Field label="Student name" hint={editing ? undefined : "Optional. Students join with an invite code from the tuition page."}>
          <Input value={studentName} onChangeText={setStudentName} placeholder="Student’s name" autoCapitalize="words" />
        </Field>
        <Field label="Class days">
          <WeekdayPicker value={days} onChange={onDays} />
        </Field>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Field label="Starts" style={{ flex: 1 }}>
            <TimeField value={startTime} onChange={setStartTime} />
          </Field>
          <Field label="Ends" style={{ flex: 1 }}>
            <TimeField value={endTime} onChange={setEndTime} />
          </Field>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Field label="Classes / month" style={{ flex: 1 }}>
            <Input
              value={planned}
              onChangeText={(v) => {
                setPlannedTouched(true);
                setPlanned(v.replace(/[^0-9]/g, ""));
              }}
              keyboardType="number-pad"
              placeholder="12"
            />
          </Field>
          <Field label="Monthly fee (৳)" style={{ flex: 1 }}>
            <Input value={fee} onChangeText={(v) => setFee(v.replace(/[^0-9.]/g, ""))} keyboardType="number-pad" placeholder="Optional" />
          </Field>
        </View>
        {suggestion ? (
          <T size={12} color={C.muted} style={{ marginTop: -6 }}>
            {days.length} {days.length === 1 ? "day" : "days"} a week gives {suggestion} classes in {monthName(dateKey(now).slice(0, 7))}.
          </T>
        ) : null}
        <FormError>{error}</FormError>
      </Card>
      <Button size="lg" title={editing ? "Save changes" : "Create tuition"} loading={busy} onPress={submit} />
    </Screen>
  );
}
