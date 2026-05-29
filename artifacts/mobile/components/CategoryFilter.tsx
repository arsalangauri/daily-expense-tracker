import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Category } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";

export type FilterOption = Category | "all";

interface CategoryDef {
  key: FilterOption;
  label: string;
  icon: string;
}

export const CATEGORIES: CategoryDef[] = [
  { key: "all", label: "All", icon: "apps-outline" },
  { key: "food", label: "Food", icon: "fast-food-outline" },
  { key: "transport", label: "Transport", icon: "car-outline" },
  { key: "bills", label: "Bills", icon: "receipt-outline" },
  { key: "shopping", label: "Shopping", icon: "bag-outline" },
  { key: "health", label: "Health", icon: "medkit-outline" },
  { key: "entertainment", label: "Fun", icon: "game-controller-outline" },
  { key: "salary", label: "Salary", icon: "briefcase-outline" },
  { key: "transfer", label: "Transfer", icon: "swap-horizontal-outline" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal-circle-outline" },
];

interface Props {
  selected: FilterOption;
  onSelect: (cat: FilterOption) => void;
}

export function CategoryFilter({ selected, onSelect }: Props) {
  const colors = useColors();

  const handleSelect = (key: FilterOption) => {
    Haptics.selectionAsync();
    onSelect(key);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {CATEGORIES.map((cat) => {
        const active = selected === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            onPress={() => handleSelect(cat.key)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={active ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[
                styles.label,
                {
                  color: active
                    ? colors.primaryForeground
                    : colors.mutedForeground,
                },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
