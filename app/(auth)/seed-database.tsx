import { Colors, Spacing } from '@/constants/Colors';
import { clearSeedData, seedFirebase } from '@/scripts/seedFirebase';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

/**
 * Seed Database Screen
 * 
 * This is a temporary utility screen to seed the Firebase database with demo data.
 * 
 * USAGE:
 * 1. Navigate to this screen once after Firebase is configured
 * 2. Tap "Seed Database" button
 * 3. Wait for completion
 * 4. Remove this screen from the app
 * 
 * To access: Add this route temporarily to your navigation
 */
export default function SeedDatabaseScreen() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState('');

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult('');
    try {
      await seedFirebase();
      setResult('✅ Database seeded successfully!\n\nDemo accounts:\nTeacher: teacher@demo.com / password123\nStudent: student@demo.com / password123');
      Alert.alert(
        'Success',
        'Database seeded! You can now login with demo accounts.\n\nRemember to disable email verification in config/firebase.ts'
      );
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    Alert.alert(
      'Clear Data',
      'This will delete all seeded data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            setResult('');
            try {
              await clearSeedData();
              setResult('✅ Seed data cleared');
              Alert.alert('Success', 'Seed data cleared. Delete user accounts manually in Firebase Console.');
            } catch (error: any) {
              setResult(`❌ Error: ${error.message}`);
              Alert.alert('Error', error.message);
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Seeding Tool</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          This tool will create demo accounts and sample data in Firebase.
        </Text>
        <Text style={styles.warningText}>
          ⚠️  Run this only once after Firebase setup!
        </Text>
      </View>

      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      ) : null}

      <Button
        mode="contained"
        onPress={handleSeed}
        disabled={isSeeding || isClearing}
        style={styles.button}
        loading={isSeeding}
      >
        {isSeeding ? 'Seeding Database...' : 'Seed Database'}
      </Button>

      <Button
        mode="outlined"
        onPress={handleClear}
        disabled={isSeeding || isClearing}
        style={styles.button}
        loading={isClearing}
      >
        {isClearing ? 'Clearing...' : 'Clear Seed Data'}
      </Button>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>After Seeding:</Text>
        <Text style={styles.instructionText}>
          1. Disable email verification in config/firebase.ts{'\n'}
          2. Delete this screen from the app{'\n'}
          3. Login with demo accounts
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    backgroundColor: Colors.background,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  infoText: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  warningText: {
    color: Colors.error,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.lg,
    borderRadius: 8,
    marginBottom: Spacing.lg,
  },
  resultText: {
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  button: {
    marginBottom: Spacing.md,
  },
  instructions: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.infoLight,
    borderRadius: 8,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  instructionText: {
    color: Colors.textSecondary,
    lineHeight: 24,
  },
});
