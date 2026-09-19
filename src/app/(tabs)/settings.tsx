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

  /** Signs the current user out while maintaining button loading state. */
  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <View className="gap-6">
        <Text className="text-3xl font-sans-bold text-primary">Settings</Text>
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
