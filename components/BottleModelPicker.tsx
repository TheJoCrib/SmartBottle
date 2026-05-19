import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BOTTLE_MODELS, BottleModel } from "../constants/bottleModels";
import { colors, spacing } from "../constants/theme";

interface BottleModelPickerProps {
  selectedModelId: string;
  onSelect: (model: BottleModel) => void;
}

export function BottleModelPicker({ selectedModelId, onSelect }: BottleModelPickerProps) {
  const handleSelect = (model: BottleModel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(model);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Välj flasktyp</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {BOTTLE_MODELS.map((model) => {
          const isSelected = model.id === selectedModelId;
          const IconComponent =
            model.iconLibrary === "MaterialCommunityIcons"
              ? MaterialCommunityIcons
              : Ionicons;

          return (
            <TouchableOpacity
              key={model.id}
              style={[styles.modelCard, isSelected && styles.modelCardSelected]}
              onPress={() => handleSelect(model)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                ]}
              >
                <IconComponent
                  name={model.iconName as any}
                  size={28}
                  color={isSelected ? "#FFFFFF" : colors.textMuted}
                />
              </View>
              <Text
                style={[styles.modelName, isSelected && styles.modelNameSelected]}
                numberOfLines={1}
              >
                {model.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 10,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  modelCard: {
    alignItems: "center",
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: spacing.cardRadius,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "transparent",
  },
  modelCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  iconContainerSelected: {
    backgroundColor: colors.primary,
  },
  modelName: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  modelNameSelected: {
    color: colors.primary,
  },
});
