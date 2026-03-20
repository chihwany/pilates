import { Redirect } from "expo-router";
import { useAuthStore } from "@/lib/stores/authStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated && user) {
    if (user.role === "instructor") {
      return <Redirect href="/(instructor)" />;
    }
    return <Redirect href="/(member)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
