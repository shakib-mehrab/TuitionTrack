// Student · Fees — month-by-month fee status with shareable payment slips.
import { Header, Screen } from "@/components/kit/core";
import { PaymentsList } from "@/components/payments";
import { useStudentStore } from "@/store/studentStore";
import type { Tuition } from "@/types";
import { COLLECTIONS } from "@/config/firebase";
import firestore from "@react-native-firebase/firestore";
import React, { useEffect, useState } from "react";

export default function StudentFees() {
  const tuitions = useStudentStore((s) => s.tuitions);
  const payments = useStudentStore((s) => s.payments);
  const classLogs = useStudentStore((s) => s.classLogs);
  const getCurrentLogs = useStudentStore((s) => s.getCurrentLogs);
  const getOpenMonth = useStudentStore((s) => s.getOpenMonth);
  const teacherNames = useTeacherNames(tuitions);

  return (
    <Screen tabBar>
      <Header title="Fees" />
      <PaymentsList
        role="student"
        tuitions={tuitions}
        payments={payments}
        currentCount={(id) => getCurrentLogs(id).length}
        openMonth={getOpenMonth}
        logsFor={(id) => classLogs.filter((l) => l.tuitionId === id)}
        teacherName={(t) => teacherNames[t.teacherId] ?? "Teacher"}
      />
    </Screen>
  );
}

/** Teacher display names for the student's tuitions. */
function useTeacherNames(tuitions: Tuition[]): Record<string, string> {
  const [names, setNames] = useState<Record<string, string>>({});
  const ids = Array.from(new Set(tuitions.map((t) => t.teacherId))).sort().join(",");
  useEffect(() => {
    if (!ids) return;
    Promise.all(
      ids.split(",").map((id) =>
        firestore()
          .collection(COLLECTIONS.USERS)
          .doc(id)
          .get()
          .then((d) => [id, (d.data()?.name as string) ?? "Teacher"] as const)
          .catch(() => [id, "Teacher"] as const)
      )
    ).then((pairs) => setNames(Object.fromEntries(pairs)));
  }, [ids]);
  return names;
}
