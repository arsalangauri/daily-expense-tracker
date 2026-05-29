import { NativeModulesProxy, EventEmitter, Subscription } from "expo-modules-core";

const NativeSmsReceiver = NativeModulesProxy.SmsReceiver;

const emitter = new EventEmitter(NativeSmsReceiver ?? NativeModulesProxy);

export interface SmsEvent {
  address: string;
  body: string;
  date: number;
}

export interface RawSmsRecord {
  id: string;
  address: string;
  body: string;
  date: number;
}

export function startListening(): void {
  NativeSmsReceiver?.startListening?.();
}

export function stopListening(): void {
  NativeSmsReceiver?.stopListening?.();
}

export async function readRecentSms(maxCount = 200): Promise<RawSmsRecord[]> {
  if (!NativeSmsReceiver?.readRecentSms) return [];
  try {
    return await NativeSmsReceiver.readRecentSms(maxCount);
  } catch {
    return [];
  }
}

export function addSmsListener(
  listener: (event: SmsEvent) => void
): Subscription {
  return emitter.addListener<SmsEvent>("onSmsReceived", listener);
}
