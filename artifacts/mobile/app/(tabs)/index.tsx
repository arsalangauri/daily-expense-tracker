import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BalanceCard } from "@/components/BalanceCard";
import { CategoryFilter, FilterOption } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";
import { SmsPermissionBanner } from "@/components/SmsPermissionBanner";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";
import { TransactionItem } from "@/components/TransactionItem";
import { Category, Transaction, useTransactions } from "@/context/TransactionContext";
import { useColors } from "@/hooks/useColors";
import { isPakistaniFinancialSms, parseSmsLocally } from "@/utils/smsParser";
import { parseSmWithOpenAI } from "@/utils/openaiParser";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    updateCategory,
    totalIncome,
    totalExpenses,
    netBalance,
    isLoading,
  } = useTransactions();

  const [filter, setFilter] = useState<FilterOption>("all");
  const [smsPermission, setSmsPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.category === filter);

  const requestSmsPermission = async () => {
    if (Platform.OS !== "android") {
      setSmsPermission(true);
      return;
    }
    try {
      const { PermissionsAndroid } = await import("react-native");
      const readResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: "SMS Permission",
          message:
            "Daily Expense Tracker needs to read your SMS messages to automatically detect bank transactions.",
          buttonPositive: "Allow",
          buttonNegative: "Deny",
        }
      );
      const receiveResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: "Receive SMS Permission",
          message:
            "Allow the app to detect new transaction messages in real-time.",
          buttonPositive: "Allow",
          buttonNegative: "Deny",
        }
      );
      if (readResult === PermissionsAndroid.RESULTS.GRANTED) {
        setSmsPermission(true);
        await scanExistingSms();
      }
    } catch (e) {
      console.warn("Permission error:", e);
    }
  };

  const processSms = async (
    body: string,
    address: string,
    date: Date
  ) => {
    if (!isPakistaniFinancialSms(body, address)) return;

    let tx: Transaction | null = parseSmsLocally(body, address, date);

    if (!tx && OPENAI_API_KEY) {
      tx = await parseSmWithOpenAI(body, address, date, OPENAI_API_KEY);
    }

    if (tx) {
      await addTransaction(tx);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const scanExistingSms = async () => {
    if (Platform.OS !== "android") return;
    setIsScanning(true);
    try {
      const { readStoredSms } = await import("@/utils/smsReader");
      const smsList = await readStoredSms(300);
      const processedIds = new Set(
        transactions.map((t) => t.rawSms).filter(Boolean)
      );
      for (const sms of smsList) {
        if (processedIds.has(sms.body)) continue;
        await processSms(sms.body, sms.address, new Date(sms.date));
      }
    } catch (e) {
      console.warn("SMS scan error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const setupSmsListener = async () => {
    if (Platform.OS !== "android") return;
    try {
      const { subscribeToNewSms } = await import("@/utils/smsReader");
      const unsub = subscribeToNewSms(async ({ address, body, date }) => {
        await processSms(body, address, new Date(date));
      });
      if (unsub) unsubRef.current = unsub;
    } catch {}
  };

  useEffect(() => {
    if (smsPermission) {
      setupSmsListener();
    }
    return () => {
      unsubRef.current?.();
    };
  }, [smsPermission]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (smsPermission) await scanExistingSms();
    setRefreshing(false);
  };

  const handleTxPress = (tx: Transaction) => {
    setSelectedTx(tx);
    setModalVisible(true);
  };

  const topPad =
    Platform.OS === "web" ? 67 : insets.top;

  const renderHeader = () => (
    <View style={{ paddingTop: topPad + 12 }}>
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.appTitle, { color: colors.foreground }]}>
            Daily Expense
          </Text>
          <Text style={[styles.appSubtitle, { color: colors.mutedForeground }]}>
            Tracker
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (smsPermission) scanExistingSms();
            else requestSmsPermission();
          }}
          style={[styles.scanBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="scan-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <SmsPermissionBanner
        onGrant={requestSmsPermission}
        isGranted={smsPermission}
        isScanning={isScanning}
      />

      <View style={{ marginTop: 12, marginBottom: 20 }}>
        <BalanceCard
          netBalance={netBalance}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Transactions
        </Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {filtered.length}
        </Text>
      </View>
      <CategoryFilter selected={filter} onSelect={setFilter} />
      <View style={{ height: 4 }} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={() => handleTxPress(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="card-outline"
            title="No transactions yet"
            subtitle={
              smsPermission
                ? "Pull to refresh or new SMS transactions will appear automatically"
                : "Tap the banner above to allow SMS access and auto-detect your bank transactions"
            }
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 80,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <TransactionDetailModal
        transaction={selectedTx}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedTx(null);
        }}
        onDelete={deleteTransaction}
        onUpdateCategory={updateCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 28,
    fontFamily: "Inter_400Regular",
    letterSpacing: -0.5,
    marginTop: -4,
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  count: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
