import {
  Platform,
  NativeModules,
  NativeEventEmitter,
  type EmitterSubscription,
} from "react-native";

const { SmsReceiver } = NativeModules;
const smsEmitter: NativeEventEmitter | null = SmsReceiver
  ? new NativeEventEmitter(SmsReceiver)
  : null;

export interface RawSms {
  id: string;
  address: string;
  body: string;
  date: number;
}

export async function readStoredSms(maxCount = 200): Promise<RawSms[]> {
  if (Platform.OS !== "android" || !SmsReceiver) return [];
  try {
    return await SmsReceiver.readRecentSms(maxCount);
  } catch {
    return [];
  }
}

export function subscribeToNewSms(
  callback: (sms: { address: string; body: string; date: number }) => void
): (() => void) | null {
  if (Platform.OS !== "android" || !SmsReceiver || !smsEmitter) return null;

  SmsReceiver.startListening();
  const sub: EmitterSubscription = smsEmitter.addListener(
    "SmsReceived",
    callback
  );

  return () => {
    sub.remove();
    SmsReceiver.stopListening?.();
  };
}
