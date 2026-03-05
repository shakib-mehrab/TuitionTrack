import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/Colors';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>This screen doesn't exist.</Text>
        <Link href="/(auth)" style={styles.link}>
          <Text style={styles.linkText}>Go to Login</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  icon: { fontSize: 64, marginBottom: Spacing.xl },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing['2xl'] },
  link: { backgroundColor: Colors.primary, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  linkText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
});
