import { useUser } from "@clerk/expo";
import { router } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { posthog } from "@/config/posthog";
import { getClerkErrorMessage } from "../../lib/auth";

const SafeAreaView = styled(RNSafeAreaView);

/** Renders the onboarding completion screen for signed-in users. */
export default function Onboarding() {
  const { isLoaded, user } = useUser();
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isLoaded || !user) return null;

  const currentUser = user;

  /** Marks onboarding complete and navigates to the main tab screen. */
  async function handleContinue() {
    setError("");
    setIsSaving(true);

    try {
      await currentUser.updateMetadata({
        unsafeMetadata: { onboardingCompleted: true },
      });
      posthog?.capture("onboarding_completed");
      router.replace("/(tabs)");
    } catch (caughtError) {
      setError(
        getClerkErrorMessage(
          caughtError,
          "We couldn't finish setting up your account. Please try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <View className="auth-content justify-center">
        <View className="auth-brand-block">
          <View className="auth-logo-wrap">
            <View className="auth-logo-mark">
              <Text className="auth-logo-mark-text">R</Text>
            </View>
            <View>
              <Text className="auth-wordmark">Recurly</Text>
              <Text className="auth-wordmark-sub">Your money, in rhythm</Text>
            </View>
          </View>
          <Text className="auth-title">A clearer money rhythm</Text>
          <Text className="auth-subtitle">
            See what is renewing, what it costs, and what deserves your
            attention next.
          </Text>
        </View>

        <View className="auth-card">
          <View className="gap-4">
            <View className="rounded-2xl bg-accent/10 p-4">
              <Text className="auth-label">One calm view</Text>
              <Text className="auth-helper mt-1">
                Keep recurring spending visible without chasing dates across
                different apps.
              </Text>
            </View>
            <View className="rounded-2xl bg-subscription/30 p-4">
              <Text className="auth-label">Built for the everyday</Text>
              <Text className="auth-helper mt-1">
                Start with your subscriptions and make better decisions at a
                glance.
              </Text>
            </View>
            {error ? <Text className="auth-error">{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              className={`auth-button ${isSaving ? "auth-button-disabled" : ""}`}
              disabled={isSaving}
              onPress={handleContinue}
            >
              {isSaving ? (
                <ActivityIndicator color="#081126" />
              ) : (
                <Text className="auth-button-text">Take me in</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
