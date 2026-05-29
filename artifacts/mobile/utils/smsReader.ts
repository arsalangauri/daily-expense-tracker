import { Platform } from "react-native";

export interface RawSms {
  id: string;
  address: string;
  body: string;
  date: number;
}

export async function readStoredSms(_maxCount = 200): Promise<RawSms[]> {
  if (Platform.OS !== "android") return [];
  return [];
}

export function subscribeToNewSms(
  _callback: (sms: { address: string; body: string; date: number }) => void
): (() => void) | null {
  return null;
}
