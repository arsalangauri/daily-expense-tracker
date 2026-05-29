---
name: Expo SMS native packages
description: react-native-get-sms-android breaks Metro in Expo Go with ENOENT on a _tmp directory; background SMS needs a custom dev build (EAS/APK), not Expo Go.
---

## Rule
Do NOT install `react-native-get-sms-android` or `react-native-sms-retriever` in an Expo Go project. They create a temp directory at install time that Metro then tries to watch — if it disappears, Metro crashes with `ENOENT: no such file or directory, watch ...react-native-get-sms-android_tmp_XXXX`.

**Why:** These packages have a postinstall script that creates a temp dir for native module detection. Metro's FallbackWatcher picks it up, then fails when it's gone.

**How to apply:** For SMS reading on Android, provide a stub implementation that compiles but does nothing in Expo Go. Real background SMS reading requires a custom dev build (exported APK with the native modules linked). Stub out `readStoredSms()` and `subscribeToNewSms()` to return empty/null. Document this for the user — they need to build the APK via EAS to get the real SMS feature.
