import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CATEGORIES } from "@/components/CategoryFilter";
import { Category, Transaction, TransactionType, useTransactions } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";

const PLATFORMS = [
  "HBL", "MCB", "Meezan", "UBL", "Allied Bank",
  "Easypaisa", "JazzCash", "SadaPay", "NayaPay", "Other",
];

export default function AddTransactionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction } = useTransactions();

  const [type, setType] = useState<TransactionType>("debit");
  const [amount, setAmount] = useState("");
  const [platform, setPlatform] = useState("HBL");
  const [category, setCategory] = useState<Category>("other");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSave = async () => {
    const amt = parseFloat(amount.replace(/,/g, ""));
    if (!amt || isNaN(amt)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const tx: Transaction = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      amount: amt,
      type,
      platform,
      date: new Date().toISOString(),
      description: description || `${type === "credit" ? "Credit" : "Debit"} via ${platform}`,
      category,
    };

    await addTransaction(tx);
    setAmount("");
    setDescription("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: topPad + 12,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: colors.foreground }]}>
          Add Transaction
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Type</Text>
          <View style={styles.typeRow}>
            {(["debit", "credit"] as TransactionType[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  Haptics.selectionAsync();
                  setType(t);
                }}
                style={[
                  styles.typeBtn,
                  {
                    backgroundColor:
                      type === t
                        ? t === "credit"
                          ? colors.income
                          : colors.expense
                        : colors.secondary,
                    borderColor:
                      type === t
                        ? t === "credit"
                          ? colors.income
                          : colors.expense
                        : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={t === "credit" ? "arrow-down" : "arrow-up"}
                  size={16}
                  color={type === t ? "#fff" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.typeBtnText,
                    { color: type === t ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {t === "credit" ? "Credit / Income" : "Debit / Expense"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Amount (PKR)
          </Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Text style={[styles.currency, { color: colors.mutedForeground }]}>₨</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.amountInput, { color: colors.foreground }]}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Platform</Text>
          <View style={styles.chipGrid}>
            {PLATFORMS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => {
                  Haptics.selectionAsync();
                  setPlatform(p);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      platform === p ? colors.primary : colors.secondary,
                    borderColor:
                      platform === p ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        platform === p
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.chipGrid}>
            {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCategory(c.key as Category);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      category === c.key ? colors.accent : colors.secondary,
                    borderColor:
                      category === c.key ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={c.icon as any}
                  size={13}
                  color={
                    category === c.key
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        category === c.key
                          ? colors.primary
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Description (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Grocery shopping"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.descInput,
              {
                color: colors.foreground,
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
            multiline
          />
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!amount}
          style={[
            styles.saveBtn,
            {
              backgroundColor: success
                ? colors.income
                : !amount
                ? colors.muted
                : colors.primary,
            },
          ]}
        >
          <Ionicons
            name={success ? "checkmark-circle" : "add-circle-outline"}
            size={20}
            color={success || !!amount ? "#fff" : colors.mutedForeground}
          />
          <Text
            style={[
              styles.saveBtnText,
              { color: !amount && !success ? colors.mutedForeground : "#fff" },
            ]}
          >
            {success ? "Saved!" : "Save Transaction"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.6,
  },
  typeRow: {
    gap: 8,
  },
  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 4,
  },
  currency: {
    fontSize: 22,
    fontFamily: "Inter_400Regular",
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    paddingVertical: 12,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  descInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 72,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
