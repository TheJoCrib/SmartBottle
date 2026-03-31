import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

interface CalibrationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (fullWeight: number, emptyWeight: number) => void;
  initialFullWeight?: number;
  initialEmptyWeight?: number;
}

export function CalibrationModal({
  visible,
  onClose,
  onSave,
  initialFullWeight,
  initialEmptyWeight,
}: CalibrationModalProps) {
  const [fullWeight, setFullWeight] = useState(
    initialFullWeight?.toString() ?? ""
  );
  const [emptyWeight, setEmptyWeight] = useState(
    initialEmptyWeight?.toString() ?? "0"
  );

  useEffect(() => {
    if (visible) {
      setFullWeight(initialFullWeight?.toString() ?? "");
      setEmptyWeight(initialEmptyWeight?.toString() ?? "0");
    }
  }, [visible, initialFullWeight, initialEmptyWeight]);

  const handleSave = () => {
    const full = parseInt(fullWeight, 10);
    const empty = parseInt(emptyWeight, 10);

    if (isNaN(full) || full <= 0) return;
    if (isNaN(empty) || empty < 0) return;
    if (full <= empty) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(full, empty);
  };

  const handleClear = (setter: (val: string) => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter("");
  };

  const isValid = (() => {
    const full = parseInt(fullWeight, 10);
    const empty = parseInt(emptyWeight, 10);
    return !isNaN(full) && full > 0 && !isNaN(empty) && empty >= 0 && full > empty;
  })();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            
            <View style={styles.handleBar} />

            
            <Text style={styles.title}>Kalibrera flaska</Text>
            <Text style={styles.description}>
              L\u00e5t modulen v\u00e4ga din flaska n\u00e4r den \u00e4r helt full respektive helt tom f\u00f6r att automatiskt r\u00e4kna ut volymen. (1g = 1ml)
            </Text>

            
            <View style={styles.fieldGroup}>
              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <Text style={styles.fieldLabel}>
                  Vikt med full flaska (g)
                </Text>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={fullWeight}
                    onChangeText={setFullWeight}
                    keyboardType="number-pad"
                    placeholder="1000"
                    placeholderTextColor="#94A3B8"
                    selectTextOnFocus
                  />
                  {fullWeight.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => handleClear(setFullWeight)}
                      hitSlop={8}
                    >
                      <Feather name="x-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            
            <View style={styles.fieldGroup}>
              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <Text style={styles.fieldLabel}>
                  Vikt med tom flaska (g)
                </Text>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={emptyWeight}
                    onChangeText={setEmptyWeight}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    selectTextOnFocus
                  />
                  {emptyWeight.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => handleClear(setEmptyWeight)}
                      hitSlop={8}
                    >
                      <Feather name="x-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Avbryt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !isValid && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!isValid}
              >
                <Feather
                  name="check"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.saveText}>Spara</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingBottom: 40,
    paddingTop: 14,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#3B82F6",
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B82F6",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  saveButton: {
    flex: 1.3,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#3B82F6",
  },
  saveButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
