import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Crown, ArrowRight, HelpCircle, ChevronDown, ChevronUp, X, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import polrityLogo from "@/assets/polrity-logo.svg";
import { useQuery } from "@tanstack/react-query";
import { fetchMeetings, type DbMeeting } from "@/lib/mindMapUtils";
import { FAQ_ITEMS } from "@/data/faqItems";

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
  const [multiMode, setMultiMode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<DbMeeting[]>({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
  });

  // TODO: replace with real value from user's account / purchase state
  // Pro/monthly subscribers → Infinity; free users → credits remaining
  const remainingMeetings = 3;

  // TODO: wire to meeting creation flow
  // Generates a random meeting code in "xxxx-xxxx-xxxx" format (numerical)
  // that can be used on any platform (Zoom, Teams, Meet, etc.)
  const handleAddMeeting = () => {
    const segment = () => String(Math.floor(1000 + Math.random() * 9000));
    const code = `${segment()}-${segment()}-${segment()}`;
    setGeneratedCode(code);
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
          <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all">
            <Crown size={12} />
            Upgrade
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-8">Meeting Dashboard</h1>

        {/* Meeting credits counter & add button
            - remainingMeetings: number of single-meeting credits the user has left
            - TODO: wire handleAddMeeting to purchase flow or meeting creation logic
            - Pro/monthly users have unlimited meetings; free users consume credits per meeting */}
        <div className="w-full max-w-2xl flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{remainingMeetings}</span> meetings remaining
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleAddMeeting}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-accent active:scale-95 transition-all"
              >
                <Plus size={16} />
                New meeting
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] text-center">
              <p className="text-xs">Generate a meeting code (xxxx-xxxx-xxxx) you can use on any platform to start recording insights.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="w-full max-w-2xl flex flex-col gap-3">
          {meetingsLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Loading meetings…
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No meetings found. Run the backend to process transcripts.
            </div>
          ) : (
            meetings.map((m, idx) => (
              <div
                key={m.id}
                className="w-full rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">
                    Meeting #{idx + 1}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {m.title}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 mt-8">
          {/* Mode toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5 bg-card cursor-default">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  {multiMode ? "Multi" : "Single"}
                </span>
                <button
                  onClick={() => setMultiMode(!multiMode)}
                  className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                  style={{ background: multiMode ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                >
                  <span
                    className="pointer-events-none inline-block h-4 w-4 rounded-full shadow-sm transition-transform duration-200"
                    style={{
                      background: "hsl(var(--background))",
                      transform: multiMode ? "translateX(16px)" : "translateX(0px)",
                    }}
                  />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[240px] text-center">
              <p className="text-xs">
                {multiMode
                  ? "Multi mode lets you compare keywords across all meetings side by side."
                  : "Single mode focuses on one meeting at a time for detailed analysis."}
              </p>
            </TooltipContent>
          </Tooltip>

          <button
            onClick={() => navigate(`/app/meeting/${meetings[0]?.id ?? ""}${multiMode ? "?multi=1" : ""}`)}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
          >
            Explore Insights
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent active:scale-95 transition-all"
          >
            <HelpCircle size={18} />
            How it works
          </button>
        </div>
      </main>

      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}

      {/* Generated meeting code badge — bottom right */}
      {generatedCode && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-4 shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-300">
          <span className="text-sm text-muted-foreground font-medium">Meeting Code:</span>
          <span className="text-lg font-bold text-foreground tracking-widest">{generatedCode}</span>
          <button
            onClick={() => setGeneratedCode(null)}
            className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
