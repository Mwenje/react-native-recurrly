import { useAuth, useSignUp } from "@clerk/expo";
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
  validateCode,
  validateConfirmation,
  validateEmail,
  validatePassword,
  type AuthFieldErrors,
} from "../../../lib/auth";

const SafeAreaView = styled(RNSafeAreaView);

function SignUp() {
  const { isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");
  const isSubmitting = fetchStatus === "fetching";

  if (isSignedIn) return null;

  async function handleSignUp() {
    const nextErrors: AuthFieldErrors = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmationError = validateConfirmation(password, confirmation);

    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;
    if (confirmationError) nextErrors.confirmPassword = confirmationError;

    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) {
      setFormError(
        getClerkErrorMessage(
          error,
          "We couldn't create your account. Please try again.",
        ),
      );
      return;
    }

    const { error: codeError } = await signUp.verifications.sendEmailCode();
    if (codeError) {
      setFormError(
        getClerkErrorMessage(
          codeError,
          "We couldn't send your verification code.",
        ),
      );
      return;
    }

    setIsVerifying(true);
  }

  async function handleVerify() {
    const codeError = validateCode(code);
    setErrors(codeError ? { code: codeError } : {});
    setFormError("");
    if (codeError) return;

    const { error } = await signUp.verifications.verifyEmailCode({
      code: code.trim(),
    });

    if (error) {
      setFormError(
        getClerkErrorMessage(
          error,
          "That code is not valid. Check it and try again.",
        ),
      );
      return;
    }

    if (signUp.status !== "complete") {
      setFormError(
        "Your email still needs to be verified before we can finish setting up your account.",
      );
      return;
    }

    const { error: finalizeError } = await signUp.finalize();
    if (finalizeError) setFormError(getClerkErrorMessage(finalizeError));
  }

  async function handleResend() {
    setFormError("");
    const { error } = await signUp.verifications.sendEmailCode();
    if (error)
      setFormError(getClerkErrorMessage(error, "We couldn't send a new code."));
  }

  async function handleStartOver() {
    await signUp.reset();
    setCode("");
    setIsVerifying(false);
    setFormError("");
    setErrors({});
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
                <Text className="auth-wordmark">Recurly</Text>
                <Text className="auth-wordmark-sub">Your money, in rhythm</Text>
              </View>
            </View>
            <Text className="auth-title">
              {isVerifying ? "Check your inbox" : "Start with clarity"}
            </Text>
            <Text className="auth-subtitle">
              {isVerifying
                ? `Enter the 6-digit code we sent to ${email.trim()}.`
                : "Build a calmer view of every recurring payment."}
            </Text>
          </View>

          <View className="auth-card">
            {isVerifying ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    autoFocus
                    autoCapitalize="none"
                    className={`auth-input auth-code-input ${errors.code ? "auth-input-error" : ""}`}
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={(value) => {
                      setCode(value.replace(/\D/g, ""));
                      setErrors((current) => ({ ...current, code: "" }));
                    }}
                    placeholder="000000"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    value={code}
                  />
                  {errors.code ? (
                    <Text className="auth-error">{errors.code}</Text>
                  ) : null}
                </View>
                <Text className="auth-helper">
                  The code expires soon. Check your spam folder if it does not
                  arrive.
                </Text>
                {formError ? (
                  <Text className="auth-error">{formError}</Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  className={`auth-button ${isSubmitting ? "auth-button-disabled" : ""}`}
                  disabled={isSubmitting}
                  onPress={handleVerify}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Verify email</Text>
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="auth-secondary-button"
                  disabled={isSubmitting}
                  onPress={handleResend}
                >
                  <Text className="auth-secondary-button-text">
                    Send a new code
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="items-center py-1"
                  disabled={isSubmitting}
                  onPress={handleStartOver}
                >
                  <Text className="auth-helper">Use a different email</Text>
                </Pressable>
              </View>
            ) : (
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
                  />
                  {errors.email ? (
                    <Text className="auth-error">{errors.email}</Text>
                  ) : null}
                </View>
                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <View className="auth-input-row">
                    <TextInput
                      autoComplete="new-password"
                      className={`auth-input auth-input-grow ${errors.password ? "auth-input-error" : ""}`}
                      onChangeText={(value) => {
                        setPassword(value);
                        setErrors((current) => ({ ...current, password: "" }));
                      }}
                      placeholder="At least 8 characters"
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
                <View className="auth-field">
                  <Text className="auth-label">Confirm password</Text>
                  <TextInput
                    autoComplete="new-password"
                    className={`auth-input ${errors.confirmPassword ? "auth-input-error" : ""}`}
                    onChangeText={(value) => {
                      setConfirmation(value);
                      setErrors((current) => ({
                        ...current,
                        confirmPassword: "",
                      }));
                    }}
                    placeholder="Repeat your password"
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    secureTextEntry={!showPassword}
                    value={confirmation}
                  />
                  {errors.confirmPassword ? (
                    <Text className="auth-error">{errors.confirmPassword}</Text>
                  ) : null}
                </View>
                <Text className="auth-helper">
                  Your account is protected with secure email verification.
                </Text>
                {formError ? (
                  <Text className="auth-error">{formError}</Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  className={`auth-button ${isSubmitting ? "auth-button-disabled" : ""}`}
                  disabled={isSubmitting}
                  onPress={handleSignUp}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Create account</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>

          <View className="auth-link-row">
            <Text className="auth-link-copy">Already have an account?</Text>
            <Link className="auth-link" href="/(auth)/sign-in">
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default SignUp;
