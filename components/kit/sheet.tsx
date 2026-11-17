// Bottom sheet (phone-style modal) and a yes/no confirmation built on it.
import { C, R } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, T } from "./core";

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.scrim }} />
        <View style={{ backgroundColor: C.surface, borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet, maxHeight: "92%", paddingBottom: Math.max(insets.bottom, 16) }}>
          <View style={{ alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: C.line, marginTop: 12 }} />
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20, paddingTop: 16 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <T w="extrabold" size={22} style={{ letterSpacing: -0.3 }}>
                {title}
              </T>
              {description ? (
                <T size={14} color={C.muted} style={{ lineHeight: 20 }}>
                  {description}
                </T>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.ground, alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="x" size={18} color={C.ink} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, gap: 16 }}>
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 10, gap: 8 }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  danger,
  loading,
  extra,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  /** Optional extra action shown above the two buttons (e.g. "Download report"). */
  extra?: React.ReactNode;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          {extra}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button title="Cancel" variant="outline" size="lg" onPress={onClose} style={{ flex: 1 }} />
            <Button
              title={confirmLabel}
              size="lg"
              onPress={onConfirm}
              loading={loading}
              style={[{ flex: 1 }, danger && { backgroundColor: C.coralInk, shadowOpacity: 0 }]}
            />
          </View>
        </>
      }
    >
      {typeof children === "string" ? (
        <T size={15} color={C.body} style={{ lineHeight: 22 }}>
          {children}
        </T>
      ) : (
        children
      )}
    </Sheet>
  );
}
