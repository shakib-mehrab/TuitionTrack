// Create account (teacher or student).
import { AuthLayout } from "@/components/AuthLayout";
import { Button, T } from "@/components/kit/core";
import { Field, FormError, Input } from "@/components/kit/form";
import { C, R } from "@/constants/theme";
import { CONFIG } from "@/config/firebase";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

export default function Register() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [role, setRole] = useState<UserRole>("teacher");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError("Add your name");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    try {
      await register(name.trim(), email.trim(), password, role);
      if (CONFIG.EMAIL_VERIFICATION_REQUIRED) router.replace("/(auth)/verify-email");
      else await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the account");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      back
      footer={
        <T size={14} color={C.muted}>
          Already have an account?{" "}
          <T w="bold" size={14} color={C.primary} onPress={() => router.back()}>
            Sign in
          </T>
        </T>
      }
    >
      <Field label="I am a…">
        <View style={{ flexDirection: "row", gap: 12 }}>
          <RoleCard active={role === "teacher"} onPress={() => setRole("teacher")} icon="monitor" title="Teacher" body="I give tuition" />
          <RoleCard active={role === "student"} onPress={() => setRole("student")} icon="award" title="Student" body="I take tuition" />
        </View>
      </Field>
      <Field label="Full name">
        <Input tinted value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
      </Field>
      <Field label="Email">
        <Input tinted value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      </Field>
      <Field label="Password" hint="At least 8 characters">
        <Input tinted value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      </Field>
      <FormError>{error}</FormError>
      <Button title="Create account" size="lg" loading={isLoading} onPress={submit} />
      <T size={12} color={C.muted} style={{ textAlign: "center" }}>
        We’ll email you a link to verify your address.
      </T>
    </AuthLayout>
  );
}

function RoleCard({ active, onPress, icon, title, body }: { active: boolean; onPress: () => void; icon: React.ComponentProps<typeof Feather>["name"]; title: string; body: string }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={{ flex: 1, padding: 16, gap: 8, borderRadius: R.lg, backgroundColor: active ? C.primarySoft : C.mist, borderWidth: 2, borderColor: active ? C.primary : "transparent" }}
    >
      <Feather name={icon} size={22} color={active ? C.primaryDeep : C.ink} />
      <T w="extrabold" size={15} color={active ? C.primaryDeep : C.ink}>
        {title}
      </T>
      <T size={12} color={C.muted}>
        {body}
      </T>
    </Pressable>
  );
}
