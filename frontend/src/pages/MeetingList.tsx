import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Crown, HelpCircle, ChevronDown, ChevronUp, X, ArrowRight, Plus } from "lucide-react";
import polrityLogo from "@/assets/polrity-logo.svg";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMeetings, type DbMeeting } from "@/lib/mindMapUtils";
import { supabase } from "@/integrations/supabase/client";
import { FAQ_ITEMS } from "@/data/faqItems";
import { PaywallModal } from "@/components/PaywallModal";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

function HelpDialog({ onClose }: { onClose: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-primary" />
            <span className="text-base font-semibold text-foreground">How it works</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* FAQ accordion */}
        <div className="max-h-[60vh] overflow-y-auto">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-border/50 last:border-b-0">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-start justify-between gap-3 px-6 py-4 text-left group"
              >
                <span
                  className={`text-sm font-medium leading-snug transition-colors ${
                    openIdx === i
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.q}
                </span>
                {openIdx === i ? (
                  <ChevronUp size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                ) : (
                  <ChevronDown size={14} className="shrink-0 mt-0.5 text-muted-foreground" />
                )}
              </button>
              {openIdx === i && (
                <p className="px-6 pb-4 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MeetingList() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showTokenPaywall, setShowTokenPaywall] = useState(false);
  const [freeMeetingsUsed, setFreeMeetingsUsed] = useState(0);
  const { hasMeetingToken, isSubscribed } = useRevenueCat();

  const FREE_MEETING_LIMIT = 3;
  const hasFreeMeetingsLeft = freeMeetingsUsed < FREE_MEETING_LIMIT;

  const queryClient = useQueryClient();

  // Load meetings_created from Supabase profiles table
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("meetings_created")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFreeMeetingsUsed(data.meetings_created ?? 0);
      });
  }, [user?.id]);

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<DbMeeting[]>({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
  });

  useEffect(() => {
    const channel = supabase
      .channel("meetinglist-meetings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "meetings" },
        () => { queryClient.invalidateQueries({ queryKey: ["meetings"] }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const generateCode = useCallback(async () => {
    const segment = () => String(Math.floor(1000 + Math.random() * 9000));
    const code = `${segment()}-${segment()}-${segment()}`;
    const newCount = freeMeetingsUsed + 1;
    // Upsert meeting count into profiles table
    if (user) {
      await supabase
        .from("profiles")
        .upsert({ user_id: user.id, meetings_created: newCount }, { onConflict: "user_id" });
      setFreeMeetingsUsed(newCount);
    }
    setGeneratedCode(code);
  }, [user, freeMeetingsUsed]);

  const handleAddMeeting = () => {
    if (!hasFreeMeetingsLeft && !hasMeetingToken) {
      setShowTokenPaywall(true);
      return;
    }
    generateCode();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <img src={polrityLogo} alt="Polarity" className="h-5 w-auto object-contain" />
          <span className="text-sm font-semibold tracking-tight text-foreground">Polarity</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user.user_metadata?.username ?? user.email?.split("@")[0]}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground border border-border hover:text-foreground hover:bg-accent active:scale-95 transition-all"
          >
            <LogOut size={13} />
            Sign out
          </button>
          {!isSubscribed && (
            <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all">
              <Crown size={12} />
              Upgrade
            </button>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">

        {generatedCode ? (
          /* ── Meeting code screen ── */
          <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your meeting code</span>
              <span className="text-5xl font-bold tracking-[0.18em] text-foreground select-all">{generatedCode}</span>
              <span className="text-sm text-muted-foreground mt-1">Share this code with participants to join the session.</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => navigate(`/app/meeting/${meetings[0]?.id ?? ""}`)}
                className="flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-lg"
              >
                Continue to Meeting
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => setGeneratedCode(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        ) : (
          /* ── Default: two action buttons ── */
          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col items-center gap-2">
              <img src={polrityLogo} alt="Polarity" className="h-10 w-auto object-contain mb-2 opacity-80" />
              <h1 className="text-2xl font-bold text-foreground tracking-tight">What would you like to do?</h1>
              <p className="text-sm text-muted-foreground">Choose an option to get started.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleAddMeeting}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-10 py-8 w-56 hover:bg-accent hover:border-primary/40 active:scale-95 transition-all group shadow-sm"
              >
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <Plus size={22} className="text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-semibold text-foreground">Create New Meeting</span>
                  <span className="text-xs text-muted-foreground text-center leading-relaxed">
                    {hasFreeMeetingsLeft
                      ? `${FREE_MEETING_LIMIT - freeMeetingsUsed} free meeting${FREE_MEETING_LIMIT - freeMeetingsUsed !== 1 ? "s" : ""} remaining`
                      : "Token required"}
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate(`/app/meeting/${meetings[0]?.id ?? ""}`)}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-10 py-8 w-56 hover:bg-accent hover:border-primary/40 active:scale-95 transition-all group shadow-sm"
              >
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <ArrowRight size={22} className="text-primary" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-semibold text-foreground">Explore Old Insights</span>
                  <span className="text-xs text-muted-foreground text-center leading-relaxed">Review keyword maps from past meetings</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <HelpCircle size={13} />
              How it works
            </button>
          </div>
        )}
      </main>

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}

      {showTokenPaywall && (
        <PaywallModal
          type="consumable"
          onClose={() => setShowTokenPaywall(false)}
          onSuccess={() => {
            setShowTokenPaywall(false);
            generateCode();
          }}
        />
      )}
    </div>
  );
}
