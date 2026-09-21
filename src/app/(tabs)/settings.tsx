import { posthog } from "@/config/posthog";
import { useAuth } from "@clerk/expo";
import { styled } from "nativewind";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

/** Renders account settings and sign-out controls. */
function Settings() {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  /** Signs the current user out while maintaining button loading state. */
  async function handleSignOut() {
    setSignOutError("");
    setIsSigningOut(true);
    try {
      await signOut();
      posthog?.capture("user_signed_out");
    } catch {
      setSignOutError("We couldn't sign you out. Please try again.");
      return;
    } finally {
      setIsSigningOut(false);
    }

    try {
      posthog?.reset();
    } catch {
      setSignOutError("You were signed out, but analytics could not reset.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <View className="gap-6">
        <Text className="text-3xl font-sans-bold text-primary">Settings</Text>
        {signOutError ? (
          <Text className="auth-error">{signOutError}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          className="auth-secondary-button"
          disabled={isSigningOut}
          onPress={handleSignOut}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#ea7a53" />
          ) : (
            <Text className="auth-secondary-button-text">Sign out</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default Settings;
