import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Storage } from 'expo-sqlite/kv-store';

const SettingsContext = createContext(null);
const STORAGE_KEY = 'app-settings';

const DEFAULT_SETTINGS = {
  showRewardProgress: true,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const hasHydrated = useRef(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await Storage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        if (isMounted && parsed) {
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (error) {
        console.warn('Failed to load settings, using defaults.', error);
      } finally {
        if (isMounted) {
          hasHydrated.current = true;
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    Storage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch((error) =>
      console.warn('Failed to save settings.', error)
    );
  }, [settings]);

  const setShowRewardProgress = (value) =>
    setSettings((prev) => ({ ...prev, showRewardProgress: value }));

  return (
    <SettingsContext.Provider
      value={{
        showRewardProgress: settings.showRewardProgress,
        setShowRewardProgress,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
