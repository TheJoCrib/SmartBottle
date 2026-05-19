import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated as RNAnimated,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing } from "../../constants/theme";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const passwordRef = useRef<TextInput>(null);
  const emailShake = useRef(new RNAnimated.Value(0)).current;
  const passwordShake = useRef(new RNAnimated.Value(0)).current;

  const login = useMutation(api.auth.login);
  const seedBeverages = useMutation(api.beverages.seedDefaults);
  const { setToken } = useAuthStore();

  const triggerShake = useCallback((anim: RNAnimated.Value) => {
    RNAnimated.sequence([
      RNAnimated.timing(anim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      RNAnimated.timing(anim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      RNAnimated.timing(anim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      RNAnimated.timing(anim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      RNAnimated.timing(anim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
  };

  const handleLogin = async () => {
    clearErrors();
    let hasError = false;

    if (!email.trim()) {
      setEmailError("Ange din e-postadress.");
      triggerShake(emailShake);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      hasError = true;
    }

    if (!password) {
      setPasswordError("Ange ditt losenord.");
      triggerShake(passwordShake);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      hasError = true;
    }

    if (hasError) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      const result = await login({ email: email.trim(), password });
      await setToken(result.token);

      try {
        await seedBeverages({});
      } catch {
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes("Invalid email or password")) {
        setGeneralError(
          "E-postadressen eller losenordet ar felaktigt. Forsok igen.",
        );
      } else if (msg.includes("network") || msg.includes("fetch")) {
        setGeneralError(
          "Kunde inte na servern. Kontrollera din internetanslutning.",
        );
      } else {
        setGeneralError(msg || "Nagot gick fel. Forsok igen.");
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              style={styles.header}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="water" size={48} color={colors.accent} />
              </View>
              <Text style={styles.title}>Smart Bottle</Text>
              <Text style={styles.subtitle}>Din smarta vattenflaska</Text>
            </Animated.View>

            
            <Animated.View entering={FadeInDown.delay(250).duration(500)}>
              
              {generalError ? (
                <Text style={styles.generalError}>{generalError}</Text>
              ) : null}

              
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-post</Text>
                <RNAnimated.View
                  style={{ transform: [{ translateX: emailShake }] }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      emailFocused && styles.inputFocused,
                      emailError ? styles.inputError : null,
                    ]}
                    placeholder="din@epost.se"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (emailError) setEmailError("");
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </RNAnimated.View>
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              
              <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                <Text style={styles.label}>Lösenord</Text>
                <RNAnimated.View
                  style={{ transform: [{ translateX: passwordShake }] }}
                >
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      ref={passwordRef}
                      style={[
                        styles.input,
                        { paddingRight: 48 },
                        passwordFocused && styles.inputFocused,
                        passwordError ? styles.inputError : null,
                      ]}
                      placeholder="Ditt lösenord"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        if (passwordError) setPasswordError("");
                      }}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry={!showPassword}
                      autoComplete="off"
                      textContentType="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => {
                        setShowPassword(!showPassword);
                      }}
                      hitSlop={12}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color={colors.inputPlaceholder}
                      />
                    </Pressable>
                  </View>
                </RNAnimated.View>
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </View>

              
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? "Loggar in..." : "Logga in"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            
            <Animated.View
              entering={FadeInDown.delay(400).duration(500)}
              style={styles.linkRow}
            >
              <Text style={styles.linkText}>Har du inget konto? </Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/register")}
              >
                <Text style={styles.linkAccent}>Registrera</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.page,
    paddingTop: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.textSecondary,
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.inputFocusBorder,
  },
  inputError: {
    borderColor: colors.error,
  },
  passwordWrapper: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    height: 52,
    justifyContent: "center",
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 6,
  },
  generalError: {
    fontSize: 13,
    color: colors.error,
    textAlign: "center",
    marginBottom: 16,
    backgroundColor: colors.errorMuted,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    overflow: "hidden",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  linkAccent: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
});
