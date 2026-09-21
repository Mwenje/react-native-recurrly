import Constants from "expo-constants";
import PostHog from "posthog-react-native";

type PostHogConfig = {
  posthogProjectToken?: string;
  posthogHost?: string;
};

const config = Constants.expoConfig?.extra as PostHogConfig | undefined;
const projectToken = config?.posthogProjectToken;
const host = config?.posthogHost;

export const posthog =
  projectToken && host
    ? new PostHog(projectToken, {
        host,
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
            console: [],
          },
        },
      })
    : null;
