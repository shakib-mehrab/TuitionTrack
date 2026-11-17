// Sign in.
import { AuthLayout } from "@/components/AuthLayout";
import { Button, T } from "@/components/kit/core";
import { Field, FormError, Input } from "@/components/kit/form";
import { C } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable } from "react-native";

export default function SignIn() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  const submit = async () => {
    setError(null);
    setUnverified(false);
    if (!email.trim() || !password) return setError("Enter your email and password");
    try {
      await login(email.trim(), password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not sign in";
      setUnverified(/verify your email/i.test(msg));
      setError(msg);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      footer={
        <T size={14} color={C.muted}>
          New to TuitionTrack?{" "}
          <T w="bold" size={14} color={C.primary} onPress={() => router.push("/(auth)/register")}>
            Create an account
          </T>
        </T>
      }
    >
      <Field label="Email">
        <Input tinted value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      </Field>
      <Field label="Password">
        <Input
          tinted
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          autoComplete="password"
          onSubmitEditing={submit}
          right={
            <Pressable accessibilityLabel={show ? "Hide password" : "Show password"} onPress={() => setShow((s) => !s)} hitSlop={10}>
              <Feather name={show ? "eye-off" : "eye"} size={20} color={C.muted} />
            </Pressable>
          }
        />
      </Field>
      <Pressable onPress={() => router.push({ pathname: "/(auth)/forgot-password", params: { email } })} style={{ alignSelf: "flex-end", marginTop: -8 }}>
        <T w="semibold" size={13} color={C.primary}>
          Forgot password?
        </T>
      </Pressable>
      <FormError>{error}</FormError>
      {unverified ? <Button title="Open verification help" variant="soft" onPress={() => router.push("/(auth)/verify-email")} /> : null}
      <Button title="Sign in" size="lg" loading={isLoading} onPress={submit} />
    </AuthLayout>
  );
}
