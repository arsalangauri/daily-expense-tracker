import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Category, Transaction } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_ICONS: Record<Category, { name: string; lib: "ion" | "mci" }> = {
  food: { name: "fast-food-outline", lib: "ion" },
  transport: { name: "car-outline", lib: "ion" },
  bills: { name: "receipt-outline", lib: "ion" },
  shopping: { name: "bag-outline", lib: "ion" },
  health: { name: "medkit-outline", lib: "ion" },
  entertainment: { name: "game-controller-outline", lib: "ion" },
  salary: { name: "briefcase-outline", lib: "ion" },
  transfer: { name: "swap-horizontal-outline", lib: "ion" },
  other: { name: "ellipsis-horizontal-circle-outline", lib: "ion" },
};

const PLATFORM_COLORS: Record<string, string> = {
  HBL: "#003087",
  MCB: "#c8102e",
  Meezan: "#006b3c",
  UBL: "#e31837",
  "Allied Bank": "#1a6b3c",
  Easypaisa: "#00a651",
  JazzCash: "#e8002d",
  SadaPay: "#7c3aed",
  NayaPay: "#2563eb",
  Unknown: "#64748b",
};

function formatPKR(amount: number): string {
  return `₨${amount.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ transaction, onPress }: Props) {
  const colors = useColors();
  const isCredit = transaction.type === "credit";
  const icon = CATEGORY_ICONS[transaction.category] || CATEGORY_ICONS.other;
  const platformColor =
    PLATFORM_COLORS[transaction.platform] || PLATFORM_COLORS.Unknown;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isCredit ? colors.incomeLight : colors.expenseLight,
          },
        ]}
      >
        <Ionicons
          name={icon.name as any}
          size={20}
          color={isCredit ? colors.income : colors.expense}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text
            style={[styles.description, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {transaction.description}
          </Text>
          <Text
            style={[
              styles.amount,
              { color: isCredit ? colors.income : colors.expense },
            ]}
          >
            {isCredit ? "+" : "-"}{formatPKR(transaction.amount)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={[styles.platformBadge, { backgroundColor: platformColor + "18" }]}>
            <Text style={[styles.platformText, { color: platformColor }]}>
              {transaction.platform}
            </Text>
          </View>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </View>

      {isCredit ? (
        <Ionicons name="arrow-down" size={14} color={colors.income} style={styles.arrow} />
      ) : (
        <Ionicons name="arrow-up" size={14} color={colors.expense} style={styles.arrow} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 5,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  description: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  amount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  platformBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  platformText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  arrow: {
    opacity: 0.5,
  },
});
