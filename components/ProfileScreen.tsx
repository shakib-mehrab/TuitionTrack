import { Avatar, Badge, Button, Card, Header, Screen, T } from "@/components/kit/core";
import { ConfirmSheet } from "@/components/kit/sheet";
import { C, R } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";
import Constants from "expo-constants";
import React, { useState } from "react";
import { View } from "react-native";

export function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [confirm, setConfirm] = useState(false);

  return (
    <Screen>
      <Header title="Profile" back />
      <Card style={{ padding: 20, flexDirection: "row", alignItems: "center", gap: 16, borderRadius: R.panel }}>
        <Avatar name={user?.name ?? "?"} size={64} dark />
        <View style={{ flex: 1, gap: 4 }}>
          <T w="extrabold" size={18} numberOfLines={1}>
            {user?.name}
          </T>
          <T size={14} color={C.muted} numberOfLines={1}>
            {user?.email}
          </T>
          <Badge>{user?.role === "teacher" ? "Teacher account" : "Student account"}</Badge>
        </View>
      </Card>
      <Button title="Sign out" icon="log-out" variant="outline" size="lg" onPress={() => setConfirm(true)} />
      <T size={12} color={C.muted} style={{ textAlign: "center" }}>
        TuitionTrack {Constants.expoConfig?.version ?? ""}
      </T>
      <ConfirmSheet open={confirm} onClose={() => setConfirm(false)} title="Sign out?" confirmLabel="Sign out" onConfirm={() => logout().catch(() => {})}>
        You can sign back in any time with your email and password.
      </ConfirmSheet>
    </Screen>
  );
}
