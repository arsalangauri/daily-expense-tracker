import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface BalanceCardProps {
  netBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

function formatPKR(amount: number): string {
  if (amount >= 1_000_000) return `₨${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₨${(amount / 1_000).toFixed(1)}K`;
  return `₨${amount.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

export function BalanceCard({
  netBalance,
  totalIncome,
  totalExpenses,
}: BalanceCardProps) {
  const colors = useColors();

  return (
    <LinearGradient
      colors={["#15803d", "#16a34a", "#22c55e"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.header}>
        <Text style={styles.label}>Net Balance</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PKR</Text>
        </View>
      </View>

      <Text style={styles.balance}>
        {netBalance >= 0 ? "" : "-"}
        {formatPKR(Math.abs(netBalance))}
      </Text>

      <View style={styles.row}>
        <View style={styles.stat}>
          <View style={[styles.statIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="arrow-down-circle" size={16} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statValue}>{formatPKR(totalIncome)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.stat}>
          <View style={[styles.statIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="arrow-up-circle" size={16} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statValue}>{formatPKR(totalExpenses)}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  balance: {
    color: "#ffffff",
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    marginBottom: 24,
    letterSpacing: -1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  statValue: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 16,
  },
});
