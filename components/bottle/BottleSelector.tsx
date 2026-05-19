import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing } from "../../constants/theme";
import { getBottleModel } from "../../constants/bottleModels";

interface Bottle {
  _id: string;
  name: string;
  icon?: string;
  color?: string;
  capacityMl?: number;
  modelId?: string;
}

interface BottleSelectorProps {
  bottles: Bottle[];
  activeBottleId: string | null;
  onSelect: (bottle: Bottle) => void;
  onAdd: () => void;
}

export function BottleSelector({
  bottles,
  activeBottleId,
  onSelect,
  onAdd,
}: BottleSelectorProps) {
  if (bottles.length <= 1) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {bottles.map((bottle) => {
          const isActive = bottle._id === activeBottleId;
          const model = getBottleModel(bottle.modelId || "water-bottle");
          const IconComp =
            model.iconLibrary === "MaterialCommunityIcons"
              ? MaterialCommunityIcons
              : Ionicons;

          return (
            <TouchableOpacity
              key={bottle._id}
              style={[styles.card, isActive && styles.cardActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(bottle);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: (bottle.color || colors.primary) + "20" },
                  isActive && styles.iconCircleActive,
                ]}
              >
                <IconComp
                  name={model.iconName as any}
                  size={20}
                  color={isActive ? "#FFFFFF" : bottle.color || colors.primary}
                />
              </View>
              <Text
                style={[styles.name, isActive && styles.nameActive]}
                numberOfLines={1}
              >
                {bottle.name}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.addCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAdd();
          }}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.page,
    marginBottom: 8,
  },
  scrollContent: {
    gap: 10,
    paddingRight: spacing.page,
  },
  card: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    minWidth: 72,
  },
  cardActive: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconCircleActive: {
    backgroundColor: colors.primary,
  },
  name: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  nameActive: {
    color: colors.textPrimary,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  addCard: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
});
