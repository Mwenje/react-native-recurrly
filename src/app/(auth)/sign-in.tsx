import { useAuth, useSignIn } from "@clerk/expo";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import {
  getClerkErrorMessage,
  validateEmail,
  validatePassword,
  type AuthFieldErrors,
} from "../../../lib/auth";

const SafeAreaView = styled(RNSafeAreaView);

function SignIn() {
  const { isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isSubmitting = fetchStatus === "fetching";

  if (isSignedIn) return null;

  async function handleSubmit() {
    const nextErrors: AuthFieldErrors = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;

    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) {
      setFormError(
        getClerkErrorMessage(
          error,
          "We couldn't sign you in. Check your details and try again.",
        ),
      );
      return;
    }

    if (signIn.status !== "complete") {
      setFormError("Additional verification is required to finish signing in.");
      return;
    }

    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) setFormError(getClerkErrorMessage(finalizeError));
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>
              <View>
                <Text className="auth-wordmark mb-2">Recurly</Text>
                <Text className="auth-wordmark-sub">Your money, in rhythm</Text>
              </View>
            </View>
            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">
              Keep every recurring payment clear and under control.
            </Text>
          </View>

          <View className="auth-card">
            <View className="auth-form">
              <View className="auth-field">
                <Text className="auth-label">Email address</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  className={`auth-input ${errors.email ? "auth-input-error" : ""}`}
                  keyboardType="email-address"
                  onChangeText={(value) => {
                    setEmail(value);
                    setErrors((current) => ({ ...current, email: "" }));
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(0, 0, 0, 0.4)"
                  value={email}
                  textAlignVertical="center"
                  style={{ includeFontPadding: false }}
                />
                {errors.email ? (
                  <Text className="auth-error">{errors.email}</Text>
                ) : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <View className="auth-input-row">
                  <TextInput
                    autoComplete="password"
                    className={`auth-input auth-input-grow ${errors.password ? "auth-input-error" : ""}`}
                    onChangeText={(value) => {
                      setPassword(value);
                      setErrors((current) => ({ ...current, password: "" }));
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    secureTextEntry={!showPassword}
                    value={password}
                  />
                  <Pressable
                    accessibilityRole="button"
                    className="auth-password-toggle"
                    onPress={() => setShowPassword((current) => !current)}
                  >
                    <Text className="auth-password-toggle-text">
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>
                {errors.password ? (
                  <Text className="auth-error">{errors.password}</Text>
                ) : null}
              </View>

              {formError ? (
                <Text className="auth-error">{formError}</Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                className={`auth-button ${isSubmitting ? "auth-button-disabled" : ""}`}
                disabled={isSubmitting}
                onPress={handleSubmit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#081126" />
                ) : (
                  <Text className="auth-button-text">Sign In</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View className="auth-link-row">
            <Text className="auth-link-copy">New to Recurly?</Text>
            <Link className="auth-link" href="/(auth)/sign-up">
              Create an account
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignIn;
