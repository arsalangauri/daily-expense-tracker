import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { parseSmsLocally, isPakistaniFinancialSms } from "@/utils/smsParser";
import { readStoredSms, subscribeToNewSms } from "@/utils/smsReader";

export type TransactionType = "credit" | "debit";

export type Category =
  | "food"
  | "transport"
  | "bills"
  | "shopping"
  | "health"
  | "entertainment"
  | "salary"
  | "transfer"
  | "other";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  platform: string;
  date: string;
  description: string;
  category: Category;
  rawSms?: string;
  balance?: number;
}

interface TransactionContextValue {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateCategory: (id: string, category: Category) => Promise<void>;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  isLoading: boolean;
  lastSmsAt: number | null;
}

const STORAGE_KEY = "@daily_expense_transactions";

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSmsAt, setLastSmsAt] = useState<number | null>(null);
  const seenSmsKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    scanInboxOnStart();
    const unsubscribe = subscribeToNewSms((sms) => {
      handleIncomingSms(sms.address, sms.body, sms.date, "live");
    });
    return () => {
      unsubscribe?.();
    };
  }, [isLoading]);

  const makeSmsKey = (address: string, body: string) =>
    `${address}:${body.slice(0, 60)}`;

  const handleIncomingSms = useCallback(
    (address: string, body: string, date: number, source: "scan" | "live") => {
      const key = makeSmsKey(address, body);
      if (seenSmsKeys.current.has(key)) return;
      if (!isPakistaniFinancialSms(body, address)) return;

      const parsed = parseSmsLocally(body, address, new Date(date));
      if (!parsed) return;

      if (source === "scan") {
        parsed.id = `sms_${address}_${date}`;
      }

      seenSmsKeys.current.add(key);
      setLastSmsAt(Date.now());
      addTransactionInternal(parsed);
    },
    []
  );

  const scanInboxOnStart = async () => {
    const smsList = await readStoredSms(300);
    for (const sms of smsList) {
      handleIncomingSms(sms.address, sms.body, sms.date, "scan");
    }
  };

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Transaction[] = JSON.parse(stored);
        setTransactions(parsed);
        for (const tx of parsed) {
          if (tx.rawSms) {
            const key = makeSmsKey("", tx.rawSms.slice(0, 60));
            seenSmsKeys.current.add(key);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTransactions = async (txs: Transaction[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
  };

  const addTransactionInternal = (tx: Transaction) => {
    setTransactions((prev) => {
      const exists = prev.find(
        (t) => t.id === tx.id || (tx.rawSms && t.rawSms === tx.rawSms)
      );
      if (exists) return prev;
      const updated = [tx, ...prev];
      saveTransactions(updated);
      return updated;
    });
  };

  const addTransaction = useCallback(async (tx: Transaction) => {
    addTransactionInternal(tx);
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const updateCategory = useCallback(
    async (id: string, category: Category) => {
      setTransactions((prev) => {
        const updated = prev.map((t) => (t.id === id ? { ...t, category } : t));
        saveTransactions(updated);
        return updated;
      });
    },
    []
  );

  const totalIncome = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateCategory,
        totalIncome,
        totalExpenses,
        netBalance,
        isLoading,
        lastSmsAt,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx)
    throw new Error("useTransactions must be used inside TransactionProvider");
  return ctx;
}
