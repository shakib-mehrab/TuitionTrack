// Forgot password — sends Firebase's password reset email (previously this screen only pretended to).
import { AuthLayout } from "@/components/AuthLayout";
import { Button, T } from "@/components/kit/core";
import { Field, FormError, Input } from "@/components/kit/form";
import { C } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

export default function ForgotPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const [email, setEmail] = useState(params.email ?? "");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address");
    setBusy(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e) {
      // Don't reveal whether an account exists.
      const msg = e instanceof Error ? e.message : "";
      if (/no user|not found/i.test(msg)) setSent(true);
      else setError(msg || "Could not send the email. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title={sent ? "Check your inbox" : "Reset your password"} subtitle={sent ? undefined : "We’ll email you a link to choose a new password."} back>
      {sent ? (
        <View style={{ gap: 18 }}>
          <View style={{ backgroundColor: C.mintSoft, borderRadius: 16, padding: 16 }}>
            <T w="semibold" size={14} color={C.mintInk} style={{ lineHeight: 21 }}>
              If an account exists for {email.trim()}, a reset link is on its way. Follow it, then sign in with your new password.
            </T>
          </View>
          <Button title="Back to sign in" size="lg" onPress={() => router.back()} />
        </View>
      ) : (
        <>
          <Field label="Email">
            <Input tinted value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          </Field>
          <FormError>{error}</FormError>
          <Button title="Send reset link" size="lg" loading={busy} onPress={submit} />
        </>
      )}
    </AuthLayout>
  );
}
