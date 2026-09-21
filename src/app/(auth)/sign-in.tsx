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
import { posthog } from "@/config/posthog";
import {
  getClerkErrorMessage,
  validateCode,
  validateEmail,
  validatePassword,
  type AuthFieldErrors,
} from "../../../lib/auth";

const SafeAreaView = styled(RNSafeAreaView);

/** Renders the password-based sign-in flow. */
function SignIn() {
  const { isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStrategy, setVerificationStrategy] = useState<
    "email_code" | "phone_code" | "totp" | "backup_code" | null
  >(null);
  const isSubmitting = fetchStatus === "fetching";

  if (isSignedIn) return null;

  async function prepareVerification(
    status: typeof signIn.status,
  ): Promise<boolean> {
    const factors = signIn.supportedSecondFactors;
    const preferredStrategies =
      status === "needs_client_trust"
        ? ["email_code", "phone_code"]
        : ["phone_code", "email_code", "totp", "backup_code"];
    const strategy = preferredStrategies.find((value) =>
      factors.some((factor) => factor.strategy === value),
    ) as "email_code" | "phone_code" | "totp" | "backup_code" | undefined;

    if (!strategy) {
      setFormError(
        "This account needs a verification method this app does not support yet.",
      );
      return false;
    }

    setVerificationStrategy(strategy);

    if (strategy === "email_code") {
      const { error } = await signIn.mfa.sendEmailCode();
      if (error) {
        setFormError(
          getClerkErrorMessage(
            error,
            "We couldn't send your verification code.",
          ),
        );
        return false;
      }
    }

    if (strategy === "phone_code") {
      const { error } = await signIn.mfa.sendPhoneCode();
      if (error) {
        setFormError(
          getClerkErrorMessage(
            error,
            "We couldn't send your verification code.",
          ),
        );
        return false;
      }
    }

    return true;
  }

  /** Validates and submits the current credentials to Clerk. */
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

    if (
      signIn.status === "needs_second_factor" ||
      signIn.status === "needs_client_trust"
    ) {
      await prepareVerification(signIn.status);
      return;
    }

    if (signIn.status !== "complete") {
      setFormError(
        "We couldn't complete sign-in with the available verification methods.",
      );
      return;
    }

    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) {
      setFormError(getClerkErrorMessage(finalizeError));
      return;
    }

    posthog?.capture("user_signed_in");
  }

  async function handleVerification() {
    const codeError = validateCode(verificationCode);
    setFormError(codeError);
    if (codeError || !verificationStrategy) return;

    let error = null;
    if (verificationStrategy === "email_code") {
      ({ error } = await signIn.mfa.verifyEmailCode({
        code: verificationCode,
      }));
    } else if (verificationStrategy === "phone_code") {
      ({ error } = await signIn.mfa.verifyPhoneCode({
        code: verificationCode,
      }));
    } else if (verificationStrategy === "totp") {
      ({ error } = await signIn.mfa.verifyTOTP({ code: verificationCode }));
    } else {
      ({ error } = await signIn.mfa.verifyBackupCode({
        code: verificationCode,
      }));
    }

    if (error) {
      setFormError(
        getClerkErrorMessage(
          error,
          "That code is not valid. Check it and try again.",
        ),
      );
      return;
    }

    if (signIn.status !== "complete") {
      setFormError("Verification is still required to finish signing in.");
      return;
    }

    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) {
      setFormError(getClerkErrorMessage(finalizeError));
      return;
    }

    posthog?.capture("user_signed_in");
  }

  async function handleResendCode() {
    setFormError("");
    const result =
      verificationStrategy === "email_code"
        ? await signIn.mfa.sendEmailCode()
        : verificationStrategy === "phone_code"
          ? await signIn.mfa.sendPhoneCode()
          : { error: null };

    if (result.error) {
      setFormError(
        getClerkErrorMessage(result.error, "We couldn't send a new code."),
      );
    }
  }

  async function handleStartOver() {
    await signIn.reset();
    setVerificationCode("");
    setVerificationStrategy(null);
    setFormError("");
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
            {verificationStrategy ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">
                    {verificationStrategy === "totp"
                      ? "Authenticator code"
                      : verificationStrategy === "backup_code"
                        ? "Backup code"
                        : "Verification code"}
                  </Text>
                  <TextInput
                    autoFocus
                    autoCapitalize="none"
                    className="auth-input auth-code-input"
                    keyboardType="number-pad"
                    maxLength={verificationStrategy === "backup_code" ? 20 : 6}
                    onChangeText={(value) => {
                      setVerificationCode(
                        verificationStrategy === "backup_code"
                          ? value
                          : value.replace(/\D/g, ""),
                      );
                      setFormError("");
                    }}
                    placeholder={
                      verificationStrategy === "backup_code"
                        ? "Enter your backup code"
                        : "000000"
                    }
                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                    value={verificationCode}
                  />
                </View>
                <Text className="auth-helper">
                  {verificationStrategy === "email_code"
                    ? "We sent a code to your email address."
                    : verificationStrategy === "phone_code"
                      ? "We sent a code to your phone."
                      : "Use the code from your authenticator app or recovery codes."}
                </Text>
                {formError ? (
                  <Text className="auth-error">{formError}</Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  className={`auth-button ${isSubmitting ? "auth-button-disabled" : ""}`}
                  disabled={isSubmitting}
                  onPress={handleVerification}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">
                      Verify and continue
                    </Text>
                  )}
                </Pressable>
                {(verificationStrategy === "email_code" ||
                  verificationStrategy === "phone_code") && (
                  <Pressable
                    accessibilityRole="button"
                    className="auth-secondary-button"
                    disabled={isSubmitting}
                    onPress={handleResendCode}
                  >
                    <Text className="auth-secondary-button-text">
                      Send a new code
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  className="items-center py-1"
                  disabled={isSubmitting}
                  onPress={handleStartOver}
                >
                  <Text className="auth-helper">Start over</Text>
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
            )}
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
