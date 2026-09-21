import { posthog } from "@/config/posthog";
import "@/global.css";
import { ClerkProvider, useAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Redirect, SplashScreen, Stack, useSegments } from "expo-router";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Add your Clerk publishable key to the .env file");
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "sans-regular": require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold": require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium": require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("@/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("@/assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  useEffect(
    function () {
      if (fontsLoaded) {
        SplashScreen.hideAsync();
      }
    },
    [fontsLoaded],
  );

  if (!fontsLoaded) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {posthog ? (
        <PostHogProvider client={posthog}>
          <PostHogIdentity />
          <AuthGate />
        </PostHogProvider>
      ) : (
        <AuthGate />
      )}
    </ClerkProvider>
  );
}

function PostHogIdentity() {
  const posthog = usePostHog();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const identifiedUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isSignedIn) {
      identifiedUserId.current = undefined;
      posthog.reset();
      return;
    }

    if (!user?.id || identifiedUserId.current === user.id) {
      return;
    }

    posthog.identify(user.id, {
      $set: {
        ...(user.primaryEmailAddress?.emailAddress
          ? { email: user.primaryEmailAddress.emailAddress }
          : {}),
        ...(user.firstName ? { first_name: user.firstName } : {}),
        ...(user.lastName ? { last_name: user.lastName } : {}),
      },
    });
    identifiedUserId.current = user.id;
  }, [isSignedIn, posthog, user]);

  return null;
}

function AuthGate() {
  const segments = useSegments();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const isOnboardingComplete =
    user?.unsafeMetadata?.onboardingCompleted === true;
  const currentGroup = segments[0];

  if (!authLoaded || !userLoaded) {
    return <LoadingScreen />;
  }

  if (!isSignedIn && currentGroup !== "(auth)") {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isSignedIn && !isOnboardingComplete && currentGroup !== "onboarding") {
    return <Redirect href="/onboarding" />;
  }

  if (isSignedIn && isOnboardingComplete && currentGroup !== "(tabs)") {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#ea7a53" size="small" />
    </View>
  );
}
