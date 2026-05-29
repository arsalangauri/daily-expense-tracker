import { Category, Transaction, TransactionType } from "@/context/TransactionContext";

const BANK_PATTERNS: Record<string, RegExp[]> = {
  HBL: [/hbl/i, /habib bank/i],
  MCB: [/mcb/i, /muslim commercial/i],
  Meezan: [/meezan/i, /meezanbank/i],
  UBL: [/ubl/i, /united bank/i],
  "Allied Bank": [/allied bank/i, /abl/i],
  Easypaisa: [/easypaisa/i, /easy paisa/i],
  JazzCash: [/jazzcash/i, /jazz cash/i, /mobilink/i],
  SadaPay: [/sadapay/i, /sada pay/i],
  NayaPay: [/nayapay/i, /naya pay/i],
};

const AMOUNT_PATTERNS = [
  /(?:rs\.?|pkr\.?|amount[:\s]+)[\s]*([\d,]+(?:\.\d{1,2})?)/i,
  /(?:debit(?:ed)?|credit(?:ed)?|transfer(?:red)?|sent|received|paid|withdrawn|deposited)[:\s]+(?:rs\.?|pkr\.?)?[\s]*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)[\s]*(?:rs\.?|pkr\.?)/i,
  /(?:of|for)[\s]+(?:rs\.?|pkr\.?)[\s]*([\d,]+(?:\.\d{1,2})?)/i,
];

const DEBIT_KEYWORDS = [
  /\bdebit(?:ed)?\b/i,
  /\bpurchase\b/i,
  /\bwithdrawn\b/i,
  /\bwithdrawal\b/i,
  /\bpayment\b/i,
  /\bpaid\b/i,
  /\bsent\b/i,
  /\btransfer(?:red)?\s+(?:to|from\s+your)/i,
  /\bcharged\b/i,
  /\bspent\b/i,
  /\butilized\b/i,
  /\bpos\s+transaction\b/i,
];

const CREDIT_KEYWORDS = [
  /\bcredit(?:ed)?\b/i,
  /\breceived\b/i,
  /\bdeposit(?:ed)?\b/i,
  /\bincoming\b/i,
  /\bsalary\b/i,
  /\brefund\b/i,
  /\bcash\s+in\b/i,
  /\badded\b/i,
  /\btopup\b/i,
  /\btop[\s-]up\b/i,
];

const BALANCE_PATTERN =
  /(?:balance|bal\.?|avail(?:able)?)[:\s]+(?:rs\.?|pkr\.?)?[\s]*([\d,]+(?:\.\d{1,2})?)/i;

function detectPlatform(sms: string): string {
  for (const [platform, patterns] of Object.entries(BANK_PATTERNS)) {
    if (patterns.some((p) => p.test(sms))) {
      return platform;
    }
  }
  return "Unknown";
}

function detectAmount(sms: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = sms.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1].replace(/,/g, "");
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0) return amount;
    }
  }
  return null;
}

function detectType(sms: string): TransactionType {
  const debitScore = DEBIT_KEYWORDS.filter((k) => k.test(sms)).length;
  const creditScore = CREDIT_KEYWORDS.filter((k) => k.test(sms)).length;
  if (creditScore > debitScore) return "credit";
  return "debit";
}

function detectBalance(sms: string): number | undefined {
  const match = sms.match(BALANCE_PATTERN);
  if (match?.[1]) {
    const cleaned = match[1].replace(/,/g, "");
    const val = parseFloat(cleaned);
    return isNaN(val) ? undefined : val;
  }
  return undefined;
}

function guessCategory(sms: string, platform: string, type: TransactionType): Category {
  const lower = sms.toLowerCase();
  if (/salary|payroll|wage/i.test(lower)) return "salary";
  if (/transfer|sent to|received from|topup|top.up|cashback|refund/i.test(lower)) return "transfer";
  if (/electric|gas|water|utility|bill|phone|internet|wifi|ptcl|k-electric|sui/i.test(lower)) return "bills";
  if (/food|restaurant|cafe|pizza|burger|kfc|mcdonalds|eat|lunch|dinner|breakfast|biryani/i.test(lower)) return "food";
  if (/uber|careem|fuel|petrol|cng|bus|taxi|rickshaw|transport|parking/i.test(lower)) return "transport";
  if (/daraz|amazon|shopify|shop|mall|store|market|cloth|shoe|fashion/i.test(lower)) return "shopping";
  if (/hospital|doctor|clinic|pharmacy|medicine|health|medical/i.test(lower)) return "health";
  if (/cinema|movie|netflix|youtube|game|entertain|fun/i.test(lower)) return "entertainment";
  if (type === "credit") return "salary";
  return "other";
}

export function parseSmsLocally(
  sms: string,
  sender: string,
  date: Date
): Transaction | null {
  const platform = detectPlatform(sms + " " + sender);
  if (platform === "Unknown") {
    const looksFinancial =
      /(?:rs\.?|pkr\.?|debit|credit|transfer|balance|account)/i.test(sms);
    if (!looksFinancial) return null;
  }

  const amount = detectAmount(sms);
  if (!amount) return null;

  const type = detectType(sms);
  const balance = detectBalance(sms);
  const category = guessCategory(sms, platform, type);

  const shortDesc = sms.length > 80 ? sms.slice(0, 80) + "…" : sms;

  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
    amount,
    type,
    platform,
    date: date.toISOString(),
    description: shortDesc,
    category,
    rawSms: sms,
    balance,
  };
}

export function isPakistaniFinancialSms(sms: string, sender: string): boolean {
  const combined = sms + " " + sender;
  const hasPlatform = Object.values(BANK_PATTERNS)
    .flat()
    .some((p) => p.test(combined));
  const hasFinancialKeyword =
    /(?:rs\.?|pkr\.?|debit|credit|transfer|balance|account|transaction)/i.test(
      sms
    );
  return hasPlatform || hasFinancialKeyword;
}
