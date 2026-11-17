import { TabBar, type TabMeta } from "@/components/TabBar";
import { Tabs } from "expo-router";

const META: TabMeta = {
  index: { label: "Home", icon: "home" },
  classes: { label: "Classes", icon: "calendar" },
  homework: { label: "Homework", icon: "book-open" },
  fees: { label: "Fees", icon: "credit-card" },
};

export default function StudentTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} meta={META} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="classes" />
      <Tabs.Screen name="homework" />
      <Tabs.Screen name="fees" />
    </Tabs>
  );
}
