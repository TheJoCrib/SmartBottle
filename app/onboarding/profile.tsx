import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { colors, spacing, typography } from "../../constants/theme";

const GENDERS = [
  { value: "male", label: "Man", icon: "user" as const },
  { value: "female", label: "Kvinna", icon: "users" as const },
  { value: "other", label: "Annat", icon: "user" as const },
];

export default function ProfileStep() {
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const updateProfile = useMutation(api.auth.updateProfile);
  const user = useQuery(api.auth.validateSession, token ? { token } : "skip");

  const isEditing = !!(user?.height && user?.weight);

  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.gender) setGender(user.gender);
      if (user.age) setAge(String(user.age));
      if (user.height) setHeight(String(user.height));
      if (user.weight) setWeight(String(user.weight));
    }
  }, [user]);

  const handleNext = async () => {
    if (!gender || !age || !height || !weight) {
      Alert.alert("Fel", "Fyll i alla fält");
      return;
    }
    if (!token) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      await updateProfile({
        token,
        height: parseFloat(height),
        weight: parseFloat(weight),
        age: parseInt(age),
        gender: gender as any,
      });
      if (isEditing) {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)");
      } else {
        router.push("/onboarding/activity" as any);
      }
    } catch (e: any) {
      Alert.alert("Fel", e.message || "Kunde inte spara");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {isEditing && (
        <View style={styles.editHeader}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
            hitSlop={12}
          >
            <Feather name="x" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>{isEditing ? "Redigera profil" : "Om dig"}</Text>
          <Text style={styles.subtitle}>Steg 1 av 4</Text>
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={styles.label}>KÖN</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => {
              const sel = gender === g.value;
              return (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.genderCard, sel && styles.genderCardSel]}
                  onPress={() => { setGender(g.value); Haptics.selectionAsync(); }}
                  activeOpacity={0.7}
                >
                  <Feather name={g.icon} size={24} color={sel ? colors.accent : colors.textMuted} />
                  <Text style={[styles.genderText, sel && { color: colors.accent }]}>{g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <View style={styles.metricsRow}>
            <View style={styles.metricField}>
              <Text style={styles.label}>ÅLDER</Text>
              <TextInput style={styles.metricInput} value={age} onChangeText={setAge}
                keyboardType="number-pad" returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()}
                placeholder="25" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.metricField}>
              <Text style={styles.label}>LÄNGD (CM)</Text>
              <TextInput style={styles.metricInput} value={height} onChangeText={setHeight}
                keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()}
                placeholder="175" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={styles.metricField}>
              <Text style={styles.label}>VIKT (KG)</Text>
              <TextInput style={styles.metricInput} value={weight} onChangeText={setWeight}
                keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()}
                placeholder="70" placeholderTextColor={colors.textMuted} />
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 24 }} />

        
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <TouchableOpacity
            style={[styles.nextBtn, (!gender || !age || !height || !weight || isLoading) && { opacity: 0.4 }]}
            onPress={handleNext}
            disabled={!gender || !age || !height || !weight || isLoading}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>{isLoading ? "Sparar..." : "Nästa"}</Text>
            <Feather name="arrow-right" size={20} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  editHeader: { paddingHorizontal: spacing.page, paddingTop: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: spacing.page, paddingTop: 24, paddingBottom: 40 },
  title: { ...typography.header, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 28 },
  label: { fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  genderRow: { flexDirection: "row", gap: 10 },
  genderCard: { flex: 1, paddingVertical: 18, borderRadius: 14, alignItems: "center", backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  genderCardSel: { borderColor: colors.accent, backgroundColor: colors.primaryMuted },
  genderText: { marginTop: 6, fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  metricsRow: { flexDirection: "row", gap: 10 },
  metricField: { flex: 1 },
  metricInput: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, height: 52, paddingHorizontal: 12, fontSize: 20, fontWeight: "700", color: colors.textPrimary, textAlign: "center" },
  nextBtn: { flexDirection: "row", backgroundColor: colors.primary, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { fontSize: 17, fontWeight: "700", color: "#FFF" },
});
