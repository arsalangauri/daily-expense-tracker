import { Platform } from "react-native";
import {
  startListening,
  stopListening,
  readRecentSms,
  addSmsListener,
  type SmsEvent,
  type RawSmsRecord,
} from "sms-receiver";

export interface RawSms {
  id: string;
  address: string;
  body: string;
  date: number;
}

export async function readStoredSms(maxCount = 200): Promise<RawSms[]> {
  if (Platform.OS !== "android") return [];
  return readRecentSms(maxCount);
}

export function subscribeToNewSms(
  callback: (sms: { address: string; body: string; date: number }) => void
): (() => void) | null {
  if (Platform.OS !== "android") return null;
  startListening();
  const sub = addSmsListener((event: SmsEvent) => {
    callback({ address: event.address, body: event.body, date: event.date });
  });
  return () => {
    sub.remove();
    stopListening();
  };
}

export { type RawSmsRecord };
