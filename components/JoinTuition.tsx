// Student: join a tuition with the teacher's invite code.
import { Button } from "@/components/kit/core";
import { Field, FormError, Input } from "@/components/kit/form";
import { Sheet } from "@/components/kit/sheet";
import { useToast } from "@/components/kit/toast";
import { useAuthStore } from "@/store/authStore";
import { useStudentStore } from "@/store/studentStore";
import React, { useState } from "react";

export function JoinTuitionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const joinTuition = useStudentStore((s) => s.joinTuition);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const join = async () => {
    setError(null);
    if (code.trim().length < 4) return setError("Enter the code your teacher shared");
    if (!user) return;
    setBusy(true);
    try {
      await joinTuition(code.trim().toUpperCase(), user.id, user.name, user.email);
      toast({ message: "You joined the tuition" });
      setCode("");
      onClose();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Could not join. Check the code and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Join a tuition"
      description="Ask your teacher for the 6-character invite code from their tuition page."
      footer={<Button size="lg" title="Join tuition" loading={busy} onPress={join} />}
    >
      <Field label="Invite code">
        <Input value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="e.g. 7K3QFA" autoCapitalize="characters" autoCorrect={false} maxLength={12} style={{ letterSpacing: 3, fontSize: 18 }} />
      </Field>
      <FormError>{error}</FormError>
    </Sheet>
  );
}
