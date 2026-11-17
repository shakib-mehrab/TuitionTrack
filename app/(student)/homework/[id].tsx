import { HomeworkDetail } from "@/components/HomeworkDetail";
import { useLocalSearchParams } from "expo-router";

export default function StudentHomeworkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HomeworkDetail id={id} role="student" />;
}
