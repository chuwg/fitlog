import { Platform } from 'react-native';

interface NativeModuleType {
  recognizeText(uri: string): Promise<string>;
}

let nativeModule: NativeModuleType | null = null;

if (Platform.OS === 'ios') {
  try {
    const ExpoModulesCore = require('expo-modules-core');
    nativeModule = ExpoModulesCore.requireNativeModule('FitlogVisionText');
  } catch {
    nativeModule = null;
  }
}

export async function recognizeText(uri: string): Promise<string> {
  if (!nativeModule) {
    throw new Error('Apple Vision text recognition is only available on iOS dev client');
  }
  return await nativeModule.recognizeText(uri);
}

export function isAvailable(): boolean {
  return nativeModule !== null;
}
