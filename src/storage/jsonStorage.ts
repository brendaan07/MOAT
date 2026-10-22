// Load and save one JSON value in AsyncStorage. Both are best effort: a failed read gives the fallback, a failed write is ignored.
import AsyncStorage from '@react-native-async-storage/async-storage';

/** `decode` must read the saved value field by field so a missing or new field never throws. */
export function jsonStorage<T>(key: string, decode: (raw: unknown) => T, fallback: () => T) {
  return {
    async load(): Promise<T> {
      try {
        const json = await AsyncStorage.getItem(key);
        return json ? decode(JSON.parse(json)) : fallback();
      } catch {
        return fallback();
      }
    },
    async save(value: T) {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Saving is best effort: losing one write must never crash a lesson.
      }
    },
  };
}
