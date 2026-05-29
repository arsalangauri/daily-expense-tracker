import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORIES } from "@/components/CategoryFilter";
import { Category, useTransactions } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");

function formatPKR(amount: number): string {
  if (amount >= 1_000_000) return `₨${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₨${(amount / 1_000).toFixed(1)}K`;
  return `₨${amount.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

type Period = "week" | "month" | "all";

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions } = useTransactions();
  const [period, setPeriod] = useState<Period>("month");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      if (period === "all") return true;
      const d = new Date(t.date);
      const diff = (now.getTime() - d.getTime()) / 86400000;
      return period === "week" ? diff <= 7 : diff <= 30;
    });
  }, [transactions, period]);

  const income = filtered
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = filtered
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + t.amount, 0);
  const savings = income - expenses;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered
      .filter((t) => t.type === "debit")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [filtered]);

  const byPlatform = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    filtered.forEach((t) => {
      if (!map[t.platform]) map[t.platform] = { income: 0, expense: 0 };
      if (t.type === "credit") map[t.platform].income += t.amount;
      else map[t.platform].expense += t.amount;
    });
    return Object.entries(map).sort(
      ([, a], [, b]) => b.income + b.expense - (a.income + a.expense)
    );
  }, [filtered]);

  const maxCategory = byCategory[0]?.[1] ?? 1;

  const PERIODS: { key: Period; label: string }[] = [
    { key: "week", label: "7 Days" },
    { key: "month", label: "30 Days" },
    { key: "all", label: "All Time" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 12,
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, { color: colors.foreground }]}>Analytics</Text>

      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[
              styles.periodChip,
              {
                backgroundColor:
                  period === p.key ? colors.primary : colors.card,
                borderColor:
                  period === p.key ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.periodLabel,
                {
                  color:
                    period === p.key
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsRow}>
        {[
          { label: "Income", value: income, color: colors.income },
          { label: "Expenses", value: expenses, color: colors.expense },
          { label: "Savings", value: savings, color: colors.primary },
        ].map((s) => (
          <View
            key={s.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              {s.label}
            </Text>
            <Text style={[styles.statValue, { color: s.color }]}>
              {formatPKR(Math.abs(s.value))}
            </Text>
          </View>
        ))}
      </View>

      {income > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Savings Rate
          </Text>
          <View style={styles.savingsRow}>
            <Text
              style={[
                styles.savingsRate,
                { color: savingsRate >= 0 ? colors.income : colors.expense },
              ]}
            >
              {savingsRate}%
            </Text>
            <Text style={[styles.savingsHint, { color: colors.mutedForeground }]}>
              {savingsRate >= 20
                ? "Excellent saving!"
                : savingsRate >= 10
                ? "Good progress"
                : savingsRate >= 0
                ? "Try to save more"
                : "Spending more than income"}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.max(0, savingsRate))}%`,
                  backgroundColor:
                    savingsRate >= 20 ? colors.income : savingsRate >= 0 ? colors.primary : colors.expense,
                },
              ]}
            />
          </View>
        </View>
      )}

      {byCategory.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Spending by Category
          </Text>
          {byCategory.map(([cat, amount]) => {
            const catDef = CATEGORIES.find((c) => c.key === cat);
            const pct = (amount / maxCategory) * 100;
            return (
              <View key={cat} style={styles.catRow}>
                <View style={styles.catLeft}>
                  <Ionicons
                    name={(catDef?.icon ?? "ellipsis-horizontal-circle-outline") as any}
                    size={14}
                    color={colors.mutedForeground}
                  />
                  <Text style={[styles.catName, { color: colors.foreground }]}>
                    {catDef?.label ?? cat}
                  </Text>
                </View>
                <View style={styles.catRight}>
                  <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${pct}%`, backgroundColor: colors.expense },
                      ]}
                    />
                  </View>
                  <Text style={[styles.catAmount, { color: colors.foreground }]}>
                    {formatPKR(amount)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {byPlatform.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            By Platform
          </Text>
          {byPlatform.map(([platform, data]) => (
            <View
              key={platform}
              style={[styles.platformRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.platformName, { color: colors.foreground }]}>
                {platform}
              </Text>
              <View style={styles.platformStats}>
                <Text style={[styles.platformIncome, { color: colors.income }]}>
                  +{formatPKR(data.income)}
                </Text>
                <Text style={[styles.platformExpense, { color: colors.expense }]}>
                  -{formatPKR(data.expense)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {filtered.length === 0 && (
        <View style={styles.emptyCenter}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No data for this period
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  savingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  savingsRate: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  savingsHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  catLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 90,
  },
  catName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  catRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  catAmount: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    minWidth: 68,
    textAlign: "right",
  },
  platformRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  platformName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  platformStats: {
    flexDirection: "row",
    gap: 12,
  },
  platformIncome: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  platformExpense: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  emptyCenter: {
    alignItems: "center",
    padding: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
