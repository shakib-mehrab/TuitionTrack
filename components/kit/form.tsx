// Form controls: labelled inputs, date/time pickers, weekday picker, chips, segmented tabs.
import { C, F, R } from "@/constants/theme";
import { WEEKDAY_LETTER, WEEKDAY_SHORT, dateKey, formatDay, fromKey } from "@/lib/format";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import React, { forwardRef, useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { T, type IconName } from "./core";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <T w="bold" size={13} color={C.muted}>
      {children}
    </T>
  );
}

export function Field({ label, hint, error, children, style }: { label?: string; hint?: string; error?: string | null; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 8 }, style]}>
      {label ? <Label>{label}</Label> : null}
      {children}
      {error ? (
        <T w="semibold" size={12} color={C.coralInk}>
          {error}
        </T>
      ) : hint ? (
        <T size={12} color={C.muted}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

type InputProps = TextInputProps & { icon?: IconName; right?: React.ReactNode; invalid?: boolean; tinted?: boolean };

export const Input = forwardRef<TextInput, InputProps>(function Input({ icon, right, invalid, tinted, style, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        s.inputWrap,
        tinted && { backgroundColor: C.mist },
        focused && { borderColor: C.primary },
        invalid && { borderColor: C.coralStrong },
        rest.multiline && { height: undefined, minHeight: 96, alignItems: "flex-start", paddingVertical: 10 },
      ]}
    >
      {icon ? <Feather name={icon} size={18} color={C.muted} /> : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#8A90B4"
        style={[s.input, rest.multiline && { textAlignVertical: "top" }, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {right}
    </View>
  );
});

export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <View style={{ backgroundColor: C.coralSoft, borderRadius: R.lg, paddingHorizontal: 14, paddingVertical: 12 }}>
      <T w="semibold" size={13} color={C.coralInk}>
        {children}
      </T>
    </View>
  );
}

/** Tappable field that opens the native date picker. Value is "YYYY-MM-DD". */
export function DateField({ value, onChange, placeholder = "Pick a date", maximumDate, minimumDate }: { value: string; onChange: (v: string) => void; placeholder?: string; maximumDate?: Date; minimumDate?: Date }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={s.inputWrap}>
        <Feather name="calendar" size={18} color={C.muted} />
        <T size={15} color={value ? C.ink : "#8A90B4"} style={{ flex: 1 }}>
          {value ? formatDay(fromKey(value)) + ` ${fromKey(value).getFullYear()}` : placeholder}
        </T>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value ? fromKey(value) : new Date()}
          mode="date"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(e, d) => {
            setOpen(Platform.OS === "ios");
            if (e.type === "set" && d) onChange(dateKey(d));
          }}
        />
      ) : null}
    </>
  );
}

function to12h(d: Date): string {
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function from12h(v: string): Date {
  const d = new Date();
  const m = v.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m) {
    let h = Number(m[1]) % 12;
    if (m[3].toUpperCase() === "PM") h += 12;
    d.setHours(h, Number(m[2]), 0, 0);
  }
  return d;
}

/** Tappable field that opens the native time picker. Value is "5:00 PM". */
export function TimeField({ value, onChange, placeholder = "Time" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={s.inputWrap}>
        <Feather name="clock" size={18} color={C.muted} />
        <T size={15} color={value ? C.ink : "#8A90B4"} style={{ flex: 1 }}>
          {value || placeholder}
        </T>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value ? from12h(value) : from12h("5:00 PM")}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(e, d) => {
            setOpen(Platform.OS === "ios");
            if (e.type === "set" && d) onChange(to12h(d));
          }}
        />
      ) : null}
    </>
  );
}

/** Seven toggles, Sunday first. Values are weekday numbers 0–6. */
export function WeekdayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {WEEKDAY_LETTER.map((letter, d) => {
        const on = value.includes(d);
        return (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={WEEKDAY_SHORT[d]}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(on ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b))}
            style={{ flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: on ? C.primary : C.ground }}
          >
            <T w={on ? "bold" : "semibold"} size={13} color={on ? C.white : C.muted}>
              {letter}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pill chips, single select. */
export function Chips<V extends string>({ value, onChange, options }: { value: V; onChange: (v: V) => void; options: { value: V; label: string; icon?: IconName }[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={{ height: 38, paddingHorizontal: 16, borderRadius: R.full, backgroundColor: on ? C.ink : C.surface, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            {o.icon ? <Feather name={o.icon} size={15} color={on ? C.white : C.ink} /> : null}
            <T w={on ? "bold" : "semibold"} size={13} color={on ? C.white : C.ink}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Segmented control / tabs. */
export function Segmented<V extends string>({ value, onChange, options }: { value: V; onChange: (v: V) => void; options: { value: V; label: string }[] }) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: "#DFE4F8", borderRadius: R.md, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[{ flex: 1, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" }, on && s.segOn]}
          >
            <T w={on ? "bold" : "semibold"} size={13} color={on ? C.ink : C.muted} numberOfLines={1}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  inputWrap: {
    height: 50,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.surface,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, fontFamily: F.regular, fontSize: 15, color: C.ink, paddingVertical: 0 },
  segOn: { backgroundColor: C.surface, shadowColor: "#30388C", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
});
