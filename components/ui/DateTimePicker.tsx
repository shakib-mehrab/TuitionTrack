import { Colors } from '@/constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { TextInput } from 'react-native-paper';

interface DatePickerProps {
  label: string;
  value: string; // ISO date string YYYY-MM-DD
  onChangeDate: (date: string) => void;
  error?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  style?: any;
}

export function DatePickerInput({
  label,
  value,
  onChangeDate,
  error,
  outlineColor = Colors.border,
  activeOutlineColor = Colors.primary,
  style,
}: DatePickerProps) {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(value ? new Date(value) : new Date());

  const onChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      setDate(selectedDate);
      const isoDate = selectedDate.toISOString().split('T')[0];
      onChangeDate(isoDate);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <Pressable onPress={() => setShow(true)}>
        <TextInput
          mode="outlined"
          label={label}
          value={formatDisplayDate(value)}
          editable={false}
          right={<TextInput.Icon icon="calendar" />}
          outlineColor={outlineColor}
          activeOutlineColor={activeOutlineColor}
          style={style}
          error={!!error}
          pointerEvents="none"
        />
      </Pressable>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
        />
      )}
    </>
  );
}

interface TimePickerProps {
  label: string;
  value: string; // Time string like "5:00 PM"
  onChangeTime: (time: string) => void;
  error?: string;
  outlineColor?: string;
  activeOutlineColor?: string;
  style?: any;
}

export function TimePickerInput({
  label,
  value,
  onChangeTime,
  error,
  outlineColor = Colors.border,
  activeOutlineColor = Colors.primary,
  style,
}: TimePickerProps) {
  const [show, setShow] = useState(false);
  const [time, setTime] = useState(() => {
    if (!value) return new Date();
    // Parse time string like "5:00 PM" to Date
    const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      const date = new Date();
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const meridiem = match[3].toUpperCase();
      
      if (meridiem === 'PM' && hours !== 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    return new Date();
  });

  const onChange = (event: any, selectedTime?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
      // Format to "5:00 PM" style
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const meridiem = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
      onChangeTime(formattedTime);
    }
  };

  return (
    <>
      <Pressable onPress={() => setShow(true)}>
        <TextInput
          mode="outlined"
          label={label}
          value={value}
          editable={false}
          right={<TextInput.Icon icon="clock-outline" />}
          outlineColor={outlineColor}
          activeOutlineColor={activeOutlineColor}
          style={style}
          error={!!error}
          pointerEvents="none"
        />
      </Pressable>
      {show && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
        />
      )}
    </>
  );
}

