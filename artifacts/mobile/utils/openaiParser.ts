import { Category, Transaction, TransactionType } from "@/context/TransactionContext";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface ParsedResult {
  amount: number;
  type: TransactionType;
  platform: string;
  date: string;
  description: string;
  category: Category;
  balance?: number;
}

export async function parseSmWithOpenAI(
  sms: string,
  sender: string,
  date: Date,
  apiKey: string
): Promise<Transaction | null> {
  const prompt = `You are a Pakistani bank SMS parser. Parse this SMS and extract transaction details.

SMS: "${sms}"
Sender: "${sender}"
Date: "${date.toISOString()}"

Return ONLY a JSON object with these fields (no explanation, no markdown):
{
  "amount": number (PKR amount, required),
  "type": "debit" or "credit",
  "platform": "HBL" | "MCB" | "Meezan" | "UBL" | "Allied Bank" | "Easypaisa" | "JazzCash" | "SadaPay" | "NayaPay" | "Unknown",
  "description": "short description max 80 chars",
  "category": "food" | "transport" | "bills" | "shopping" | "health" | "entertainment" | "salary" | "transfer" | "other",
  "balance": number or null (available balance after transaction if mentioned)
}

If this is not a financial transaction SMS, return {"error": "not_financial"}.`;

  try {
    const apiKey_ = apiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey_}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed: ParsedResult & { error?: string } = JSON.parse(content);
    if (parsed.error) return null;

    return {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      amount: parsed.amount,
      type: parsed.type,
      platform: parsed.platform,
      date: date.toISOString(),
      description: parsed.description,
      category: parsed.category,
      rawSms: sms,
      balance: parsed.balance ?? undefined,
    };
  } catch {
    return null;
  }
}
