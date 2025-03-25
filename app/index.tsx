import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ROUTES } from "@/src/utils/routes";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to the auth intro screen
    router.replace(ROUTES.AUTH_INTRO);
  }, [router]);

  // Return null during the redirect
  return null;
}
