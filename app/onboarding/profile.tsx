import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { Ionicons } from "@expo/vector-icons";

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", description: "Little to no exercise" },
  { value: "light", label: "Light", description: "Exercise 1-3 days/week" },
  { value: "moderate", label: "Moderate", description: "Exercise 3-5 days/week" },
  { value: "active", label: "Active", description: "Exercise 6-7 days/week" },
  { value: "very_active", label: "Very Active", description: "Hard exercise daily" },
];

const GENDERS = [
  { value: "male", label: "Male", icon: "male" },
  { value: "female", label: "Female", icon: "female" },
  { value: "other", label: "Other", icon: "person" },
];

const MEDICAL_CONDITIONS = [
  { value: "kidney_issues", label: "Kidney Issues", icon: "🫘", description: "May require reduced fluid intake" },
  { value: "heart_condition", label: "Heart Condition", icon: "❤️", description: "May need to monitor fluid levels" },
  { value: "pregnancy", label: "Pregnancy", icon: "🤰", description: "Increased hydration recommended" },
  { value: "diabetes", label: "Diabetes", icon: "💉", description: "Consistent hydration is important" },
  { value: "high_blood_pressure", label: "High Blood Pressure", icon: "🩺", description: "Moderate fluid intake" },
  { value: "uti_prone", label: "UTI Prone", icon: "💧", description: "Increased water intake helps" },
  { value: "kidney_stones", label: "Kidney Stones", icon: "🪨", description: "Higher water intake recommended" },
  { value: "other", label: "Other", icon: "📋", description: "Custom health consideration" },
];

export default function ProfileOnboarding() {
  const { token } = useAuthStore();
  const updateProfile = useMutation(api.auth.updateProfile);

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string>("");
  const [activityLevel, setActivityLevel] = useState<string>("");
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState(false);
  const [manualGoal, setManualGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const recommendedIntake = useQuery(
    api.auth.getRecommendedIntake,
    weight && activityLevel
      ? { weight: parseFloat(weight), activityLevel }
      : "skip"
  );

  const toggleCondition = (condition: string) => {
    setMedicalConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const handleContinue = async () => {
    if (!height || !weight || !age || !gender || !activityLevel) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!token) return;

    setIsLoading(true);
    try {
      const profileData: any = {
        token,
        height: parseFloat(height),
        weight: parseFloat(weight),
        age: parseInt(age),
        gender: gender as "male" | "female" | "other",
        activityLevel: activityLevel as any,
        medicalConditions,
        customGoal,
      };

      if (customGoal && manualGoal) {
        profileData.dailyGoalMl = parseInt(manualGoal);
      }

      await updateProfile(profileData);
      router.push("/onboarding/first-bottle");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        <View className="pt-8 pb-6">
          <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Let's personalize{"\n"}your experience
          </Text>
          <Text className="text-text-light-secondary dark:text-text-dark-secondary mt-2">
            We'll calculate your recommended daily water intake
          </Text>
        </View>

        
        <View className="mb-6">
          <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
            Gender
          </Text>
          <View className="flex-row space-x-3">
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.value}
                className={`flex-1 py-4 rounded-xl items-center border-2 ${
                  gender === g.value
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                    : "border-gray-200 dark:border-gray-700"
                }`}
                onPress={() => setGender(g.value)}
              >
                <Ionicons
                  name={g.icon as any}
                  size={24}
                  color={gender === g.value ? "#0EA5E9" : "#94A3B8"}
                />
                <Text
                  className={`mt-1 font-medium ${
                    gender === g.value
                      ? "text-primary-500"
                      : "text-text-light-secondary dark:text-text-dark-secondary"
                  }`}
                >
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        
        <View className="flex-row space-x-4 mb-6">
          <View className="flex-1">
            <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Age
            </Text>
            <TextInput
              className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary text-center"
              placeholder="25"
              placeholderTextColor="#94A3B8"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Height (cm)
            </Text>
            <TextInput
              className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary text-center"
              placeholder="175"
              placeholderTextColor="#94A3B8"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Weight (kg)
            </Text>
            <TextInput
              className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary text-center"
              placeholder="70"
              placeholderTextColor="#94A3B8"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        
        <View className="mb-6">
          <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
            Activity Level
          </Text>
          {ACTIVITY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              className={`py-4 px-4 rounded-xl mb-2 border-2 ${
                activityLevel === level.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              onPress={() => setActivityLevel(level.value)}
            >
              <Text
                className={`font-medium ${
                  activityLevel === level.value
                    ? "text-primary-500"
                    : "text-text-light-primary dark:text-text-dark-primary"
                }`}
              >
                {level.label}
              </Text>
              <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mt-0.5">
                {level.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        
        <View className="mb-6">
          <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-1">
            Medical Conditions
          </Text>
          <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mb-3">
            Optional - helps us adjust your recommended intake
          </Text>
          <View className="flex-row flex-wrap -m-1">
            {MEDICAL_CONDITIONS.map((condition) => {
              const isSelected = medicalConditions.includes(condition.value);
              return (
                <TouchableOpacity
                  key={condition.value}
                  className={`m-1 px-3 py-2.5 rounded-xl flex-row items-center border-2 ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  onPress={() => toggleCondition(condition.value)}
                >
                  <Text className="text-base mr-1.5">{condition.icon}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-primary-500"
                        : "text-text-light-primary dark:text-text-dark-primary"
                    }`}
                  >
                    {condition.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {medicalConditions.length > 0 && (
            <View className="mt-2 bg-warning-50 dark:bg-warning-900/20 rounded-xl p-3">
              <Text className="text-xs text-warning-700 dark:text-warning-300">
                Your daily intake recommendation will be adjusted based on your conditions.
                Always consult your doctor for personalized hydration advice.
              </Text>
            </View>
          )}
        </View>

        
        {recommendedIntake && (
          <View className="bg-primary-50 dark:bg-primary-900/30 rounded-2xl p-4 mb-4">
            <Text className="text-sm text-primary-700 dark:text-primary-300 font-medium">
              Recommended Daily Intake
            </Text>
            <Text className="text-3xl font-bold text-primary-500 mt-1">
              {(recommendedIntake / 1000).toFixed(1)}L
            </Text>
            <Text className="text-xs text-primary-600 dark:text-primary-400 mt-1">
              Based on your profile
            </Text>
          </View>
        )}

        
        <View className="mb-4">
          <TouchableOpacity
            className={`flex-row items-center justify-between py-4 px-4 rounded-xl border-2 ${
              customGoal
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                : "border-gray-200 dark:border-gray-700"
            }`}
            onPress={() => setCustomGoal(!customGoal)}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={customGoal ? "checkbox" : "square-outline"}
                size={24}
                color={customGoal ? "#0EA5E9" : "#94A3B8"}
              />
              <Text className="ml-3 font-medium text-text-light-primary dark:text-text-dark-primary">
                Set custom daily goal
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        
        {customGoal && (
          <View className="mb-6">
            <Text className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Your Daily Goal (ml)
            </Text>
            <TextInput
              className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-text-light-primary dark:text-text-dark-primary text-center text-2xl font-bold"
              placeholder={recommendedIntake ? String(recommendedIntake) : "2000"}
              placeholderTextColor="#94A3B8"
              value={manualGoal}
              onChangeText={setManualGoal}
              keyboardType="number-pad"
            />
          </View>
        )}

        
        <TouchableOpacity
          className={`bg-primary-500 rounded-xl py-4 items-center mb-8 ${
            isLoading ? "opacity-50" : ""
          }`}
          onPress={handleContinue}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-lg">
            {isLoading ? "Saving..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
