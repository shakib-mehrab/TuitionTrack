// Teacher · Payments — what's due, what's collected, month by month.
import { Header, Screen } from "@/components/kit/core";
import { PaymentsList } from "@/components/payments";
import { useAuthStore } from "@/store/authStore";
import { useTeacherStore } from "@/store/teacherStore";
import React from "react";

export default function TeacherPayments() {
  const user = useAuthStore((s) => s.user);
  const tuitions = useTeacherStore((s) => s.tuitions);
  const payments = useTeacherStore((s) => s.payments);
  const classLogs = useTeacherStore((s) => s.classLogs);
  const getCurrentLogs = useTeacherStore((s) => s.getCurrentLogs);
  const getOpenMonth = useTeacherStore((s) => s.getOpenMonth);
  const updatePaymentStatus = useTeacherStore((s) => s.updatePaymentStatus);

  return (
    <Screen tabBar>
      <Header title="Payments" />
      <PaymentsList
        role="teacher"
        tuitions={tuitions}
        payments={payments}
        currentCount={(id) => getCurrentLogs(id).length}
        openMonth={getOpenMonth}
        logsFor={(id) => classLogs.filter((l) => l.tuitionId === id)}
        teacherName={() => user?.name ?? "Teacher"}
        onMarkPaid={(t, month, amount) =>
          updatePaymentStatus(t.id, user?.id ?? "", t.studentId || t.studentIds?.[0] || "", month, "paid", amount)
        }
      />
    </Screen>
  );
}
