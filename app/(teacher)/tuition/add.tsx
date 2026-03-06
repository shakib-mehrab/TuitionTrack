import { TimePickerInput } from '@/components/ui/DateTimePicker';
import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useTeacherStore } from '@/store/teacherStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
    Appbar,
    Button,
    Chip,
    Divider,
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
    } catch (error) {
      setErrors({ submit: 'Failed to create tuition. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} color={Colors.textOnPrimary} />
        <Appbar.Content title="Add Tuition" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Subject */}
        <Text variant="labelLarge" style={styles.sectionLabel}>Subject *</Text>
        <TextInput
          mode="outlined"
          label="e.g. Mathematics, Physics, Hindi…"
          value={subject}
          onChangeText={(v) => { setSubject(v); setErrors((e) => ({ ...e, subject: '' })); }}
          outlineColor={Colors.border}
          activeOutlineColor={Colors.primary}
          style={styles.input}
        />
        {errors.subject && <HelperText type="error">{errors.subject}</HelperText>}

        <Divider style={styles.divider} />

        {/* Days */}
        <Text variant="labelLarge" style={styles.sectionLabel}>Schedule *</Text>
        <View style={styles.chipRow}>
          {DAYS.map((day) => (
            <Chip
              key={day}
              selected={selectedDays.includes(day)}
              onPress={() => toggleDay(day)}
              style={[styles.chip, selectedDays.includes(day) && styles.chipSelected]}
              textStyle={selectedDays.includes(day) ? styles.chipTextSelected : styles.chipText}
            >
              {day}
            </Chip>
          ))}
        </View>
        {errors.days && <HelperText type="error">{errors.days}</HelperText>}

        <Divider style={styles.divider} />

        {/* Times */}
        <Text variant="labelLarge" style={styles.sectionLabel}>Class Times *</Text>
        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <TimePickerInput
              label="Start Time"
              value={startTime}
              onChangeTime={setStartTime}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              style={styles.input}
            />
            {errors.startTime && <HelperText type="error">{errors.startTime}</HelperText>}
          </View>
          <View style={{ width: Spacing.md }} />
          <View style={{ flex: 1 }}>
            <TimePickerInput
              label="End Time"
              value={endTime}
              onChangeTime={setEndTime}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              style={styles.input}
            />
            {errors.endTime && <HelperText type="error">{errors.endTime}</HelperText>}
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Planned classes */}
        <Text variant="labelLarge" style={styles.sectionLabel}>Planned Classes / Month *</Text>
        <TextInput
          mode="outlined"
          label="e.g. 12"
          value={plannedClasses}
          onChangeText={setPlannedClasses}
          keyboardType="numeric"
          outlineColor={Colors.border}
          activeOutlineColor={Colors.primary}
          style={styles.input}
        />
        {errors.plannedClasses && <HelperText type="error">{errors.plannedClasses}</HelperText>}

        <Divider style={styles.divider} />

        {/* Student info (optional) */}
        <Text variant="labelLarge" style={styles.sectionLabel}>Student Info (optional)</Text>
        <TextInput
          mode="outlined"
          label="Student Name"
          value={studentName}
          onChangeText={setStudentName}
          outlineColor={Colors.border}
          activeOutlineColor={Colors.primary}
          style={styles.input}
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
        />
        <TextInput
          mode="outlined"
          label="Monthly Salary (৳)"
          value={salary}
          onChangeText={setSalary}
          keyboardType="numeric"
          outlineColor={Colors.border}
          activeOutlineColor={Colors.primary}
          style={styles.input}
        />

        {errors.submit && <HelperText type="error">{errors.submit}</HelperText>}

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitBtn}
          contentStyle={{ paddingVertical: Spacing.xs }}
          buttonColor={Colors.primary}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Tuition...' : 'Create Tuition'}
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  appbar: { backgroundColor: Colors.backgroundDeep },
  appbarTitle: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
  },
  content: { padding: Spacing.lg, paddingBottom: Spacing['4xl'] },
  sectionLabel: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.semibold,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.full,
  },
  chipSelected: { backgroundColor: Colors.primary },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: FontFamily.regular },
  chipTextSelected: { fontSize: FontSize.xs, color: Colors.white, fontFamily: FontFamily.medium },
  input: { backgroundColor: Colors.surface, marginBottom: Spacing.xs },
  timeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  divider: { marginVertical: Spacing.lg, backgroundColor: Colors.border },
  submitBtn: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
});
