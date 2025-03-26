import { Redirect } from "expo-router";
import { ROUTES } from "@/src/utils/routes";

export default function Index() {
  return <Redirect href={ROUTES.AUTH_INTRO} />;
}
