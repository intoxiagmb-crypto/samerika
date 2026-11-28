'use client';

import { useSyncExternalStore } from 'react';
import { isAndroidApp } from '@/lib/app-presentation.mjs';

const subscribe = () => () => {};
const getSnapshot = () => isAndroidApp(navigator.userAgent);
const getServerSnapshot = () => false;

export function useAndroidApp() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
