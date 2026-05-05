import { Platform } from 'react-native';

interface NativeBridge {
  sendUpdate(data: Record<string, unknown>): Promise<unknown>;
  updateApplicationContext(data: Record<string, unknown>): Promise<boolean>;
  isReachable(): boolean;
  isPaired(): boolean;
  isWatchAppInstalled(): boolean;
}

let nativeModule: NativeBridge | null = null;

if (Platform.OS === 'ios') {
  try {
    const ExpoModulesCore = require('expo-modules-core');
    nativeModule = ExpoModulesCore.requireNativeModule('FitlogWatchBridge');
  } catch {
    nativeModule = null;
  }
}

export function isAvailable(): boolean {
  return nativeModule !== null;
}

export function isWatchPaired(): boolean {
  if (!nativeModule) return false;
  try {
    return nativeModule.isPaired();
  } catch {
    return false;
  }
}

export function isWatchReachable(): boolean {
  if (!nativeModule) return false;
  try {
    return nativeModule.isReachable();
  } catch {
    return false;
  }
}

export function isWatchAppInstalled(): boolean {
  if (!nativeModule) return false;
  try {
    return nativeModule.isWatchAppInstalled();
  } catch {
    return false;
  }
}

export async function sendMessage(
  data: Record<string, unknown>,
): Promise<unknown> {
  if (!nativeModule) {
    throw new Error('Watch bridge not available');
  }
  return await nativeModule.sendUpdate(data);
}

export async function updateApplicationContext(
  data: Record<string, unknown>,
): Promise<boolean> {
  if (!nativeModule) return false;
  return await nativeModule.updateApplicationContext(data);
}
