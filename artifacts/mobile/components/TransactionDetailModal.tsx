import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Category, Transaction } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";
import { CATEGORIES } from "./CategoryFilter";

interface Props {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateCategory: (id: string, cat: Category) => void;
}

function formatPKR(amount: number): string {
  return `₨${amount.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

export function TransactionDetailModal({
  transaction,
  visible,
  onClose,
  onDelete,
  onUpdateCategory,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (!transaction) return null;

  const isCredit = transaction.type === "credit";

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(transaction.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Transaction Details
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <View style={styles.amountSection}>
            <View
              style={[
                styles.typeChip,
                {
                  backgroundColor: isCredit
                    ? colors.incomeLight
                    : colors.expenseLight,
                },
              ]}
            >
              <Ionicons
                name={isCredit ? "arrow-down" : "arrow-up"}
                size={14}
                color={isCredit ? colors.income : colors.expense}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: isCredit ? colors.income : colors.expense },
                ]}
              >
                {isCredit ? "Credit" : "Debit"}
              </Text>
            </View>
            <Text
              style={[
                styles.amount,
                { color: isCredit ? colors.income : colors.expense },
              ]}
            >
              {isCredit ? "+" : "-"}{formatPKR(transaction.amount)}
            </Text>
            <Text style={[styles.platform, { color: colors.mutedForeground }]}>
              {transaction.platform} •{" "}
              {new Date(transaction.date).toLocaleString("en-PK", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              DESCRIPTION
            </Text>
            <Text style={[styles.sectionValue, { color: colors.foreground }]}>
              {transaction.description}
            </Text>
          </View>

          {transaction.balance !== undefined && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                BALANCE AFTER
              </Text>
              <Text style={[styles.sectionValue, { color: colors.foreground }]}>
                {formatPKR(transaction.balance)}
              </Text>
            </View>
          )}

          {transaction.rawSms && (
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                RAW SMS
              </Text>
              <Text style={[styles.rawSms, { color: colors.mutedForeground }]}>
                {transaction.rawSms}
              </Text>
            </View>
          )}

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              CATEGORY
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.filter((c) => c.key !== "all").map((cat) => {
                const active = transaction.category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onUpdateCategory(transaction.id, cat.key as Category);
                    }}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.secondary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={13}
                      color={active ? colors.primaryForeground : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.catLabel,
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
            </View>
          </View>

          <TouchableOpacity
            onPress={handleDelete}
            style={[
              styles.deleteBtn,
              { backgroundColor: colors.expenseLight, borderColor: colors.expense },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.expense} />
            <Text style={[styles.deleteText, { color: colors.expense }]}>
              Delete Transaction
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  amountSection: {
    alignItems: "center",
    padding: 28,
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  amount: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  platform: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  sectionValue: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  rawSms: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  catLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
