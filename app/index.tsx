import { Redirect } from 'expo-router';

// This is the app's entry route.
// The _layout.tsx auth guard will redirect to /(auth) or /(teacher) / /(student)
// based on the user's authentication state. We just need to hand off to (auth)
// so the guard has a starting point.
export default function Index() {
  return <Redirect href="/(auth)" />;
}

