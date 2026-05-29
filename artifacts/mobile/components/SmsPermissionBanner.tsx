import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  onGrant: () => void;
  isGranted: boolean;
  isScanning: boolean;
}

export function SmsPermissionBanner({ onGrant, isGranted, isScanning }: Props) {
  const colors = useColors();

  if (isGranted) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.incomeLight, borderColor: colors.income },
        ]}
      >
        <Ionicons name="checkmark-circle" size={18} color={colors.income} />
        <Text style={[styles.text, { color: colors.income }]}>
          {isScanning ? "Scanning SMS messages…" : "SMS auto-read active"}
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onGrant}
      activeOpacity={0.8}
      style={[
        styles.container,
        styles.button,
        { backgroundColor: colors.primary },
      ]}
    >
      <Ionicons name="mail-unread-outline" size={18} color="#fff" />
      <Text style={[styles.text, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
        Allow SMS Access to Auto-Read Transactions
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  button: {
    borderWidth: 0,
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
