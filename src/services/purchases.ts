// RevenueCat wrapper: configure, read the premium entitlement, fetch the offering, purchase and restore. Never throws.
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

/**
 * RevenueCat entitlements and keys.
 * In Expo Go the SDK runs in its Preview API Mode: every call works but purchases are mocked.
 * Real purchases need a development build (expo-dev-client).
 */
export const RevenueCatKeys = {
  testStoreAPIKey: 'test_ejGOWLHFWvvIVLsrjgdwGFFNcHp',
  appleAPIKey: 'appl_YOUR_APPLE_KEY_HERE',
  useTestStore: true,
  premiumEntitlement: 'premium',
  get active() {
    return this.useTestStore ? this.testStoreAPIKey : this.appleAPIKey;
  },
};

let configured = false;

/** Runs a RevenueCat call and gives `fallback` if it throws (no network, user cancelled, Expo Go limits). Logs in development only. */
async function safely<T>(what: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (__DEV__) console.warn(`RevenueCat: ${what}`, e);
    return fallback;
  }
}

/** Safe to call anywhere: failures give null or false, never throw. */
export const PurchasesService = {
  configure() {
    if (configured) return;
    try {
      Purchases.configure({ apiKey: RevenueCatKeys.active });
      configured = true;
    } catch (e) {
      if (__DEV__) console.warn('RevenueCat: configure failed', e);
    }
  },
  isPremium(info: CustomerInfo | null | undefined): boolean {
    return info?.entitlements.active[RevenueCatKeys.premiumEntitlement] !== undefined;
  },
  customerInfo: (): Promise<CustomerInfo | null> => safely("couldn't fetch customerInfo", () => Purchases.getCustomerInfo(), null),
  currentOffering: (): Promise<PurchasesOffering | null> =>
    safely("couldn't fetch offerings", async () => (await Purchases.getOfferings()).current ?? null, null),
  purchase: (pkg: PurchasesPackage): Promise<CustomerInfo | null> =>
    safely('purchase failed', async () => (await Purchases.purchasePackage(pkg)).customerInfo, null),
  restore: (): Promise<CustomerInfo | null> => safely('restore failed', () => Purchases.restorePurchases(), null),
  onUpdate(listener: (info: CustomerInfo) => void): () => void {
    try {
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => Purchases.removeCustomerInfoUpdateListener(listener);
    } catch {
      return () => {};
    }
  },
};
