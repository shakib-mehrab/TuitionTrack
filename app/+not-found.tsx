import { Button, EmptyState } from "@/components/kit/core";
import { C } from "@/constants/theme";
import { useRouter } from "expo-router";
import { View } from "react-native";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: C.ground, justifyContent: "center", padding: 20 }}>
      <EmptyState icon="compass" title="This screen doesn’t exist" action={<Button title="Go to start" onPress={() => router.replace("/")} />}>
        The link may be old or mistyped.
      </EmptyState>
    </View>
  );
}
