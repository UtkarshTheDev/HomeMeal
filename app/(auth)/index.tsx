import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { ROUTES } from "@/src/utils/routes";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to the auth intro screen
    router.replace(ROUTES.AUTH_INTRO);
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
}