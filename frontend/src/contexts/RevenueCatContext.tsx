import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Purchases, type CustomerInfo, type Offerings } from "@revenuecat/purchases-js";
import { useAuth } from "@/contexts/AuthContext";

const RC_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY as string;

export const ENTITLEMENT_MERGE = "Polarity Pro";
export const ENTITLEMENT_MEETING = "Polarity Pro";

interface RevenueCatContextValue {
  customerInfo: CustomerInfo | null;
  offerings: Offerings | null;
  isSubscribed: boolean;
  hasMeetingToken: boolean;
  isReady: boolean;
  refreshCustomerInfo: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextValue>({
  customerInfo: null,
  offerings: null,
  isSubscribed: false,
  hasMeetingToken: false,
  isReady: false,
  refreshCustomerInfo: async () => {},
});

export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!RC_API_KEY || !user) return;

    let cancelled = false;

    const init = async () => {
      try {
        const purchases = Purchases.isConfigured()
          ? await Purchases.getSharedInstance().changeUser(user.id).then(() => Purchases.getSharedInstance())
          : Purchases.configure({ apiKey: RC_API_KEY, appUserId: user.id });

        const [info, offs] = await Promise.all([
          purchases.getCustomerInfo(),
          purchases.getOfferings(),
        ]);

        if (!cancelled) {
          setCustomerInfo(info);
          setOfferings(offs);
          setIsReady(true);
        }
      } catch (err) {
        console.error("[RevenueCat] init error:", err);
        if (!cancelled) setIsReady(true);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [user?.id]);

  const refreshCustomerInfo = useCallback(async () => {
    if (!Purchases.isConfigured()) return;
    try {
      const info = await Purchases.getSharedInstance().getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      console.error("[RevenueCat] refresh error:", err);
    }
  }, []);

  const isSubscribed = !!customerInfo?.entitlements.active[ENTITLEMENT_MERGE];
  const hasMeetingToken = !!customerInfo?.entitlements.active[ENTITLEMENT_MEETING];

  return (
    <RevenueCatContext.Provider value={{
      customerInfo,
      offerings,
      isSubscribed,
      hasMeetingToken,
      isReady,
      refreshCustomerInfo,
    }}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export const useRevenueCat = () => useContext(RevenueCatContext);
