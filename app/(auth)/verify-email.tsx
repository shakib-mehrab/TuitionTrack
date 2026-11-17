// Verify email — Firebase sends a link; once tapped, "I've verified" signs the user in.
import { Button, IconTile, T } from "@/components/kit/core";
import { FormError } from "@/components/kit/form";
import { useToast } from "@/components/kit/toast";
import { C } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COOLDOWN = 60;

export default function VerifyEmail() {
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const refreshVerification = useAuthStore((s) => s.refreshVerification);
  const resendVerificationEmail = useAuthStore((s) => s.resendVerificationEmail);
  const logout = useAuthStore((s) => s.logout);
  const email = auth().currentUser?.email ?? "";
  const [wait, setWait] = useState(COOLDOWN);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const check = async () => {
    setError(null);
    setChecking(true);
    try {
      const ok = await refreshVerification();
      if (!ok) setError("Not verified yet. Tap the link in the email, then try again.");
    } catch {
      setError("Could not check right now. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await resendVerificationEmail();
      toast({ message: "Verification email sent" });
      setWait(COOLDOWN);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the email");
    }
  };

  const masked = email ? `${email.slice(0, 2)}•••@${email.split("@")[1] ?? ""}` : "your email";

  return (
    <View style={{ flex: 1, backgroundColor: C.ground, paddingTop: insets.top + 40, paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 22 }}>
      <View style={{ alignItems: "center", gap: 14, paddingTop: 24 }}>
        <View style={{ shadowColor: C.primary, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 6, borderRadius: 32 }}>
          <IconTile icon="mail" bg={C.surface} fg={C.primary} size={96} />
        </View>
        <T w="extrabold" size={24} style={{ letterSpacing: -0.3 }}>
          Check your email
        </T>
        <T size={14} color={C.muted} style={{ textAlign: "center", lineHeight: 21, maxWidth: 300 }}>
          We sent a verification link to <T w="bold" size={14}>{masked}</T>. Tap it, then come back here.
        </T>
      </View>
      <FormError>{error}</FormError>
      <View style={{ flex: 1 }} />
      <Button title="I’ve verified my email" size="lg" loading={checking} onPress={check} disabled={!email} />
      <T size={14} color={C.muted} style={{ textAlign: "center" }}>
        Didn’t get it?{" "}
        {wait > 0 ? (
          <T w="bold" size={14} color={C.primaryDeep}>
            Resend in 0:{String(wait).padStart(2, "0")}
          </T>
        ) : (
          <T w="bold" size={14} color={C.primary} onPress={resend}>
            Resend email
          </T>
        )}
      </T>
      <Button
        title="Use a different account"
        variant="ghost"
        onPress={async () => {
          await logout().catch(() => {});
          router.replace("/(auth)");
        }}
      />
    </View>
  );
}
