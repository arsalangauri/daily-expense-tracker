import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTransactions(JSON.parse(stored));
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

  const addTransaction = useCallback(async (tx: Transaction) => {
    setTransactions((prev) => {
      const exists = prev.find((t) => t.id === tx.id);
      if (exists) return prev;
      const updated = [tx, ...prev];
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const updateCategory = useCallback(async (id: string, category: Category) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, category } : t));
      saveTransactions(updated);
      return updated;
    });
  }, []);

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
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used inside TransactionProvider");
  return ctx;
}
