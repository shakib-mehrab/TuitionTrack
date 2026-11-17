import { useLogClass } from "@/components/LogClass";
import { TabBar, type TabMeta } from "@/components/TabBar";
import { Tabs } from "expo-router";

const META: TabMeta = {
  index: { label: "Today", icon: "calendar" },
  tuitions: { label: "Tuitions", icon: "users" },
  homework: { label: "Homework", icon: "book-open" },
  payments: { label: "Payments", icon: "credit-card" },
};

export default function TeacherTabs() {
  const { open } = useLogClass();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} meta={META} onFab={() => open()} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tuitions" />
      <Tabs.Screen name="homework" />
      <Tabs.Screen name="payments" />
    </Tabs>
  );
}
