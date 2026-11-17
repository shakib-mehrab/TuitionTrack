// "Log a class" sheet for teachers + quick logging with an Undo toast.
import { Button, T } from "@/components/kit/core";
import { Chips, DateField, Field } from "@/components/kit/form";
import { Sheet } from "@/components/kit/sheet";
import { useToast } from "@/components/kit/toast";
import { C, R } from "@/constants/theme";
import { addDays, dateKey, isClassDay, studentNames, timeToMinutes } from "@/lib/format";
import { useTeacherStore } from "@/store/teacherStore";
import * as Haptics from "expo-haptics";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

type Ctx = {
  open: (tuitionId?: string, day?: string) => void;
  /** Logs a class immediately (no sheet) and shows Undo. */
  quickLog: (tuitionId: string, day?: string) => Promise<void>;
};

const LogClassContext = createContext<Ctx>({ open: () => {}, quickLog: async () => {} });
export const useLogClass = () => useContext(LogClassContext);

export function LogClassProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const addClassLog = useTeacherStore((s) => s.addClassLog);
  const deleteClassLog = useTeacherStore((s) => s.deleteClassLog);
  const tuitions = useTeacherStore((s) => s.tuitions);
  const [state, setState] = useState<{ open: boolean; tuitionId?: string; day?: string }>({ open: false });

  const log = useCallback(
    async (tuitionId: string, day: string) => {
      const subject = tuitions.find((t) => t.id === tuitionId)?.subject ?? "class";
      const logId = await addClassLog(tuitionId, day);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast({
        message: `Class logged · ${subject}`,
        action: {
          label: "Undo",
          onPress: () => {
            deleteClassLog(logId, tuitionId)
              .then(() => toast({ message: "Class removed" }))
              .catch(() => toast({ message: "Could not undo", tone: "error" }));
          },
        },
      });
    },
    [addClassLog, deleteClassLog, toast, tuitions]
  );

  const quickLog = useCallback(
    async (tuitionId: string, day?: string) => {
      try {
        await log(tuitionId, day ?? dateKey());
      } catch {
        toast({ message: "Could not log the class. Check your connection.", tone: "error" });
      }
    },
    [log, toast]
  );

  const value = useMemo<Ctx>(() => ({ open: (tuitionId, day) => setState({ open: true, tuitionId, day }), quickLog }), [quickLog]);

  return (
    <LogClassContext.Provider value={value}>
      {children}
      {state.open ? (
        <LogClassSheet
          initialTuition={state.tuitionId}
          initialDay={state.day}
          onClose={() => setState({ open: false })}
          onLog={async (id, day) => {
            try {
              await log(id, day);
            } catch {
              toast({ message: "Could not log the class. Check your connection.", tone: "error" });
            }
          }}
        />
      ) : null}
    </LogClassContext.Provider>
  );
}

function LogClassSheet({
  initialTuition,
  initialDay,
  onClose,
  onLog,
}: {
  initialTuition?: string;
  initialDay?: string;
  onClose: () => void;
  onLog: (tuitionId: string, day: string) => Promise<void>;
}) {
  const tuitions = useTeacherStore((s) => s.tuitions);
  const getCurrentLogs = useTeacherStore((s) => s.getCurrentLogs);
  const today = new Date();
  const todayKey = dateKey(today);
  const yesterdayKey = dateKey(addDays(today, -1));

  const sorted = useMemo(() => {
    const list = tuitions.filter((t) => t.status !== "ended");
    return list.sort((a, b) => {
      const sa = isClassDay(a, today) ? 0 : 1;
      const sb = isClassDay(b, today) ? 0 : 1;
      return sa - sb || timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tuitions]);

  const [selected, setSelected] = useState(initialTuition ?? sorted[0]?.id);
  const [showAll, setShowAll] = useState(false);
  const [when, setWhen] = useState<"today" | "yesterday" | "pick">(
    !initialDay || initialDay === todayKey ? "today" : initialDay === yesterdayKey ? "yesterday" : "pick"
  );
  const [picked, setPicked] = useState(initialDay ?? todayKey);
  const [busy, setBusy] = useState(false);

  const day = when === "today" ? todayKey : when === "yesterday" ? yesterdayKey : picked;
  const chosen = sorted.find((t) => t.id === selected);
  const firstThree = showAll || sorted.length <= 3 ? sorted : sorted.slice(0, 3);
  const visible = chosen && !firstThree.includes(chosen) ? [...firstThree, chosen] : firstThree;
  const already = chosen ? getCurrentLogs(chosen.id).some((l) => l.date === day) : false;

  return (
    <Sheet
      open
      onClose={onClose}
      title="Log a class"
      footer={
        <>
          <Button
            size="lg"
            icon="check"
            title={chosen ? `Log class · ${chosen.subject}` : "Log class"}
            loading={busy}
            disabled={!chosen}
            onPress={async () => {
              if (!chosen) return;
              setBusy(true);
              onClose();
              await onLog(chosen.id, day);
            }}
          />
          <T size={12} color={C.muted} style={{ textAlign: "center" }}>
            You can undo for 10 seconds after logging.
          </T>
        </>
      }
    >
      <Field label="Which tuition?">
        {sorted.length === 0 ? (
          <T size={14} color={C.muted}>
            You have no tuitions yet.
          </T>
        ) : null}
        <View style={{ gap: 10 }}>
          {visible.map((t) => {
            const on = t.id === selected;
            const scheduled = isClassDay(t, today);
            const taken = getCurrentLogs(t.id).length;
            return (
              <Pressable
                key={t.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setSelected(t.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: R.lg,
                  backgroundColor: on ? C.primarySoft : C.mist,
                  borderWidth: 2,
                  borderColor: on ? C.primary : "transparent",
                }}
              >
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? C.primary : C.muted, alignItems: "center", justifyContent: "center" }}>
                  {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary }} /> : null}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T w="bold" size={15} numberOfLines={1}>
                    {t.subject} · {studentNames(t)}
                  </T>
                  <T w={scheduled ? "semibold" : "regular"} size={12} color={scheduled ? C.primaryDeep : C.muted}>
                    {scheduled ? `Today · ${t.startTime}` : "Not scheduled today"}
                  </T>
                </View>
                <T w="bold" size={13} color={on ? C.primaryDeep : C.muted}>
                  {taken}/{t.plannedClassesPerMonth}
                </T>
              </Pressable>
            );
          })}
        </View>
        {!showAll && sorted.length > 3 ? (
          <Pressable onPress={() => setShowAll(true)} style={{ paddingVertical: 4 }}>
            <T w="bold" size={13} color={C.primary}>
              Show all {sorted.length} tuitions
            </T>
          </Pressable>
        ) : null}
      </Field>

      <Field label="When?">
        <Chips
          value={when}
          onChange={setWhen}
          options={[
            { value: "today", label: "Today" },
            { value: "yesterday", label: "Yesterday" },
            { value: "pick", label: "Pick a date", icon: "calendar" },
          ]}
        />
        {when === "pick" ? <DateField value={picked} onChange={setPicked} maximumDate={today} /> : null}
        {already ? (
          <View style={{ backgroundColor: C.coralMist, borderRadius: 12, padding: 10 }}>
            <T w="semibold" size={12} color={C.coralInk}>
              A class is already logged on this day. Logging again counts it twice.
            </T>
          </View>
        ) : null}
      </Field>
    </Sheet>
  );
}
