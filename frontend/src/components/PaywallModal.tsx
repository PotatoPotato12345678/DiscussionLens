import { useState } from "react";
import { X, Loader2, Sparkles, Coins } from "lucide-react";
import { Purchases } from "@revenuecat/purchases-js";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

interface Props {
  type: "subscription" | "consumable";
  onClose: () => void;
  onSuccess: () => void;
}

const COPY = {
  subscription: {
    icon: Sparkles,
    title: "Unlock Merge Insights",
    description:
      "Combine keywords across meetings to discover shared themes and cross-session patterns. Requires an active subscription.",
    cta: "View Plans",
    badge: "PRO",
  },
  consumable: {
    icon: Coins,
    title: "Meeting Token Required",
    description:
      "Each new meeting consumes one meeting token. Purchase a token to create a new meeting and start capturing insights.",
    cta: "Buy Token",
    badge: "ONE-TIME",
  },
};

export function PaywallModal({ type, onClose, onSuccess }: Props) {
  const { refreshCustomerInfo, offerings } = useRevenueCat();
  const [loading, setLoading] = useState(false);

  const copy = COPY[type];
  const Icon = copy.icon;

  const handlePurchase = async () => {
    if (!Purchases.isConfigured()) return;
    setLoading(true);
    try {
      const offering = offerings?.current ?? (offerings?.all ? Object.values(offerings.all)[0] : undefined);
      await Purchases.getSharedInstance().presentPaywall(offering ? { offering } : undefined);
      await refreshCustomerInfo();
      onSuccess();
    } catch (err: unknown) {
      const isCancel =
        err instanceof Error &&
        (err.message.toLowerCase().includes("cancel") || err.message.toLowerCase().includes("dismiss"));
      if (!isCancel) console.error("[RC] PaywallModal purchase error:", err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center gap-4 px-8 py-8">
          <div className="rounded-full bg-primary/10 p-4">
            <Icon size={28} className="text-primary" />
          </div>

          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground border border-border rounded-full px-3 py-0.5">
            {copy.badge}
          </span>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-lg font-bold text-foreground">{copy.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{copy.description}</p>
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
            {loading ? "Loading…" : copy.cta}
          </button>

          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
