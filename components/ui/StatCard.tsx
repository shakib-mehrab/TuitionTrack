import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  trend?: string;
}

export default function StatCard({ icon, label, value, color, bgColor, trend }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend && <Text style={styles.trend}>{trend}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    minWidth: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  icon: { fontSize: 20 },
  value: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  trend: { fontSize: FontSize.xs, color: Colors.success, marginTop: 4 },
});
