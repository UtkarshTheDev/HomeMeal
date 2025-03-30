// Type declaration file to add missing properties to expo-auth-session
import {
  AuthSessionRedirectUriOptions,
  AuthRequestPromptOptions,
} from "expo-auth-session";

declare module "expo-auth-session" {
  interface AuthSessionRedirectUriOptions {
    useProxy?: boolean;
  }

  interface AuthRequestPromptOptions {
    useProxy?: boolean;
  }
}
