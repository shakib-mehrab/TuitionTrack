import { TimePickerInput } from '@/components/ui/DateTimePicker';
import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useTeacherStore } from '@/store/teacherStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    Appbar,
    Button,
    HelperText,
    Text,
    TextInput,
} from 'react-native-paper';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AddTuitionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addTuition } = useTeacherStore();

  const [subject, setSubject] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [plannedClasses, setPlannedClasses] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!subject.trim()) e.subject = 'Subject is required';
    if (selectedDays.length === 0) e.days = 'Select at least one day';
    if (!startTime.trim()) e.startTime = 'Start time is required';
    if (!endTime.trim()) e.endTime = 'End time is required';
    if (!plannedClasses.trim() || isNaN(Number(plannedClasses)) || Number(plannedClasses) < 1)
      e.plannedClasses = 'Enter a valid number (min 1)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const schedule = selectedDays.join(', ');
      await addTuition({
        teacherId: user?.id ?? '',
        subject: subject.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        schedule,
        datesPerWeek: selectedDays.length,
        plannedClassesPerMonth: parseInt(plannedClasses, 10),
        studentName: studentName.trim() || undefined,
        studentEmail: studentEmail.trim() || undefined,
        salary: salary.trim() ? parseFloat(salary) : undefined,
        status: 'active',
        paymentStatus: 'not_paid',
      });
      router.back();
    } catch {
      setErrors({ submit: 'Failed to create tuition. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} color={Colors.textPrimary} />
        <Appbar.Content title="New Tuition" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Subject ── */}
          <FormSection icon="book-education-outline" title="Subject" required>
            <TextInput
              mode="outlined"
              placeholder="e.g. Mathematics, Physics…"
              value={subject}
              onChangeText={(v) => { setSubject(v); setErrors((e) => ({ ...e, subject: '' })); }}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {errors.subject && <HelperText type="error">{errors.subject}</HelperText>}
          </FormSection>

          {/* ── Schedule ── */}
          <FormSection icon="calendar-week" title="Class Days" required error={errors.days}>
            <View style={styles.daysRow}>
              {DAYS.map((day) => {
                const selected = selectedDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => { toggleDay(day); setErrors((e) => ({ ...e, days: '' })); }}
                    style={[styles.dayChip, selected && styles.dayChipSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.days && <HelperText type="error">{errors.days}</HelperText>}
          </FormSection>

          {/* ── Times ── */}
          <FormSection icon="clock-outline" title="Class Times" required>
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TimePickerInput
                  label=""
                  value={startTime}
                  onChangeTime={setStartTime}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.primary}
                  style={styles.input}
                />
                {errors.startTime && <HelperText type="error">{errors.startTime}</HelperText>}
              </View>
              <View style={styles.timeSep}>
                <Text style={styles.timeSepText}>–</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TimePickerInput
                  label=""
                  value={endTime}
                  onChangeTime={setEndTime}
                  outlineColor={Colors.border}
                  activeOutlineColor={Colors.primary}
                  style={styles.input}
                />
                {errors.endTime && <HelperText type="error">{errors.endTime}</HelperText>}
              </View>
            </View>
          </FormSection>

          {/* ── Planned Classes ── */}
          <FormSection icon="chart-bar" title="Planned Classes / Month" required>
            <TextInput
              mode="outlined"
              placeholder="e.g. 12"
              value={plannedClasses}
              onChangeText={setPlannedClasses}
              keyboardType="numeric"
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            {errors.plannedClasses && <HelperText type="error">{errors.plannedClasses}</HelperText>}
          </FormSection>

          {/* ── Student Info ── */}
          <FormSection icon="account-outline" title="Student Info" subtitle="Optional — can also invite later">
            <TextInput
              mode="outlined"
              label="Student Name"
              value={studentName}
              onChangeText={setStudentName}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            <TextInput
              mode="outlined"
              label="Student Email"
              value={studentEmail}
              onChangeText={setStudentEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
            <TextInput
              mode="outlined"
              label="Monthly Fee (৳)"
              value={salary}
              onChangeText={setSalary}
              keyboardType="numeric"
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />
          </FormSection>

          {errors.submit && <HelperText type="error" style={{ textAlign: 'center' }}>{errors.submit}</HelperText>}

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitBtn}
            contentStyle={styles.submitBtnContent}
            labelStyle={styles.submitBtnLabel}
            buttonColor={Colors.primary}
            loading={isSubmitting}
            disabled={isSubmitting}
            icon="check"
          >
            {isSubmitting ? 'Creating…' : 'Create Tuition'}
          </Button>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FormSection({
  icon, title, subtitle, required, error, children
}: {
  icon: string; title: string; subtitle?: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.wrapper}>
      <View style={sectionStyles.header}>
        <View style={sectionStyles.iconBox}>
          <MaterialCommunityIcons name={icon as any} size={18} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sectionStyles.title}>
            {title}{required && <Text style={sectionStyles.required}> *</Text>}
          </Text>
          {subtitle && <Text style={sectionStyles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  required: { color: Colors.error },
  subtitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  body: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDeep },
  appbar: { backgroundColor: Colors.backgroundDeep },
  appbarTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
  },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  input: { backgroundColor: Colors.surface, marginBottom: Spacing.xs },
  inputOutline: { borderRadius: BorderRadius.md },
  inputLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayChipText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.textSecondary,
  },
  dayChipTextSelected: {
    color: Colors.white,
  },
  timeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  timeSep: { paddingTop: 18, paddingHorizontal: 4 },
  timeSepText: { fontSize: FontSize.lg, color: Colors.textTertiary, fontFamily: FontFamily.regular },
  submitBtn: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  submitBtnContent: { paddingVertical: Spacing.sm },
  submitBtnLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    letterSpacing: 0.5,
  },
});
