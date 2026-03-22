import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Send, X, GripHorizontal, Plus, Minus } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";
import { useRevenueCat } from "@/contexts/RevenueCatContext";

interface SpeakerSection {
  speaker: string;
  texts: string[];
  color: string;
  meetingId?: string;
}

interface ExtraSection extends SpeakerSection {
  meetingTitle: string;
}

interface Props {
  keyword: string;
  sections: SpeakerSection[];
  /** Extra sections from meetings not in the initial clash — user can toggle them in */
  allSections?: ExtraSection[];
  onClose: () => void;
}

interface InsightData {
  similarities: string[];
  differences: string[];
}

async function fetchSummary(keyword: string, sections: SpeakerSection[]): Promise<InsightData> {
  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

  const res = await fetch(`${backendUrl}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keyword,
      sections: sections.map(({ speaker, texts }) => ({ speaker, texts })),
    }),
  });

  if (!res.ok) throw new Error(`Backend error ${res.status}`);
  const data = await res.json();
  return {
    similarities: data.similarities ?? [],
    differences: data.differences ?? [],
  };
}

const INITIAL_W = 672;
const INITIAL_H = 520;

export function SharedKeywordModal({ keyword, sections, allSections, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<InsightData | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showInsightsPaywall, setShowInsightsPaywall] = useState(false);
  const { isSubscribed, isReady: rcReady } = useRevenueCat();
  const [agreementScore] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");

  // Build a unified list of all unique meetings from allSections
  // Initial checked state = those meetings present in the initial `sections`
  const meetingToggles = (() => {
    if (!allSections || allSections.length === 0) return [];
    const seen = new Map<string, { meetingId: string; meetingTitle: string }>();
    for (const s of allSections) {
      if (s.meetingId && !seen.has(s.meetingId)) {
        seen.set(s.meetingId, { meetingId: s.meetingId, meetingTitle: s.meetingTitle });
      }
    }
    return Array.from(seen.values());
  })();

  // Initial checked = meeting IDs that appear in the initial `sections`
  const initialChecked = new Set(sections.map((s) => s.meetingId).filter(Boolean) as string[]);
  const [checkedMeetings, setCheckedMeetings] = useState<Set<string>>(initialChecked);

  const toggleMeeting = (meetingId: string) => {
    setCheckedMeetings((prev) => {
      const next = new Set(prev);
      if (next.has(meetingId)) next.delete(meetingId);
      else next.add(meetingId);
      return next;
    });
  };

  // If no allSections toggles, just show sections directly; otherwise filter by checked
  const displayedSections: SpeakerSection[] =
    allSections && allSections.length > 0
      ? allSections.filter((s) => s.meetingId && checkedMeetings.has(s.meetingId))
      : sections;

  // Start centered
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: Math.max(0, (window.innerWidth - INITIAL_W) / 2),
    y: Math.max(0, (window.innerHeight - INITIAL_H) / 2),
  }));

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Close on backdrop click (only the raw overlay, not the card)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // ── Drag ──
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.origX + ev.clientX - dragRef.current.startX,
        y: dragRef.current.origY + ev.clientY - dragRef.current.startY,
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    console.log("Chat message (AI not yet wired):", chatInput);
    setChatInput("");
  };

  return (
    // Backdrop — translucent, blurred
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(6px)" }}
      onClick={handleOverlayClick}
    >
      {/* Modal card — draggable + resizable */}
      <div
        ref={cardRef}
        className="absolute rounded-2xl border border-border overflow-hidden shadow-2xl flex flex-col"
        style={{
          left: pos.x,
          top: pos.y,
          width: INITIAL_W,
          height: INITIAL_H,
          minWidth: 340,
          minHeight: 280,
          maxWidth: "95vw",
          maxHeight: "90vh",
          resize: "both",
          overflow: "hidden",
          background: "hsl(var(--card))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header (drag handle) ── */}
        <div
          className="flex items-center justify-between px-6 py-3 border-b border-border cursor-grab active:cursor-grabbing select-none shrink-0"
          style={{ background: "hsl(var(--background))" }}
          onMouseDown={handleHeaderMouseDown}
        >
          {/* Title */}
          <div className="flex items-center gap-2 min-w-0">
            <GripHorizontal size={14} className="text-muted-foreground opacity-50 shrink-0" />
            <span className="text-base text-muted-foreground shrink-0">⚡</span>
            <h2 className="text-base font-semibold text-foreground tracking-tight truncate">
              {sections.length === 1 ? "Topic" : "Shared topic"}:{" "}
              <span className="font-bold">"{keyword}"</span>
            </h2>
          </div>

          {agreementScore !== null && (
            <InlineAgreementBadge score={agreementScore} />
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={async () => {
                if (summaryLoading) return;
                if (rcReady && !isSubscribed) { setShowInsightsPaywall(true); return; }
                if (summaryOpen && summary) { setSummaryOpen(false); return; }
                setSummaryOpen(true);
                if (summary) return;
                setSummaryLoading(true);
                setSummaryError(null);
                try {
                  const data = await fetchSummary(keyword, displayedSections);
                  setSummary(data);
                } catch {
                  setSummaryError("Failed to generate insights. Please try again.");
                } finally {
                  setSummaryLoading(false);
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-white hover:text-white hover:bg-accent transition-colors flex items-center gap-1.5"
            >
              ✨ Extract Insights
              {summaryOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── AI Insights Panel (toggle) ── */}
        {summaryOpen && (
          <div
            className="px-5 py-4 border-b border-border shrink-0"
            style={{ background: "hsl(var(--background) / 0.6)" }}
          >
            {summaryLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm animate-pulse">
                <span>✨</span>
                <span>Generating insights…</span>
              </div>
            ) : summaryError ? (
              <p className="text-sm text-red-400">{summaryError}</p>
            ) : summary ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Similarities */}
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      In Common
                    </span>
                  </div>
                  {summary.similarities.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No common ground identified.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {summary.similarities.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-white/80">
                          <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Differences */}
                <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                      Points of Difference
                    </span>
                  </div>
                  {summary.differences.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No differences identified.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {summary.differences.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-white/80">
                          <span className="mt-0.5 shrink-0 text-amber-400">✕</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Meeting toggles (shown when allSections provided) ── */}
        {meetingToggles.length > 0 && (
          <div
            className="flex items-center gap-2 px-5 py-2 border-b border-border shrink-0 flex-wrap"
            style={{ background: "hsl(var(--background) / 0.4)" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">
              Meetings:
            </span>
            {meetingToggles.map(({ meetingId, meetingTitle }) => {
              const active = checkedMeetings.has(meetingId);
              return (
                <button
                  key={meetingId}
                  onClick={() => toggleMeeting(meetingId)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? "border-amber-400/60 text-amber-300 bg-amber-400/10"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {active ? <Minus size={10} /> : <Plus size={10} />}
                  {meetingTitle}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Body: speaker quote columns (fills remaining space) ── */}
        <div className={`grid divide-border flex-1 overflow-hidden ${displayedSections.length === 1 ? "grid-cols-1" : displayedSections.length === 2 ? "grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x" : "grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"}`}>
          {displayedSections.map(({ speaker, texts, color }, idx) => (
            <div key={`${speaker}-${idx}`} className="flex flex-col overflow-y-auto p-5 gap-3">
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color }}
              >
                {speaker}
              </div>

              {texts.map((text, i) => (
                <div
                  key={i}
                  className="rounded-lg px-3 py-2.5 text-sm leading-relaxed text-white italic"
                  style={{
                    background: hexToRgba(color, 0.07),
                    borderLeft: `3px solid ${hexToRgba(color, 0.5)}`,
                  }}
                >
                  "{text}"
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Footer: AI Chat input ── */}
        <div
          className="px-4 py-3 border-t border-border flex items-center gap-2 shrink-0"
          style={{ background: "hsl(var(--background))" }}
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            placeholder="Ask more questions…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={handleSendChat}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
            disabled={!chatInput.trim()}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
      {showInsightsPaywall && (
        <PaywallModal
          type="subscription"
          onClose={() => setShowInsightsPaywall(false)}
          onSuccess={() => {
            setShowInsightsPaywall(false);
            setSummaryOpen(true);
            setSummaryLoading(true);
            setSummaryError(null);
            fetchSummary(keyword, displayedSections)
              .then(setSummary)
              .catch(() => setSummaryError("Failed to generate insights. Please try again."))
              .finally(() => setSummaryLoading(false));
          }}
        />
      )}
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Circular Agreement Score Badge ────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return "hsl(142 71% 45%)";
  if (score >= 40) return "hsl(38 92% 50%)";
  return "hsl(0 84% 60%)";
}

const INLINE_SIZE = 72;
const INLINE_STROKE = 6;
const INLINE_R = (INLINE_SIZE - INLINE_STROKE) / 2;
const INLINE_CIRC = 2 * Math.PI * INLINE_R;

function InlineAgreementBadge({ score }: { score: number }) {
  const color = scoreColor(score);
  const offset = INLINE_CIRC - (score / 100) * INLINE_CIRC;

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0 select-none">
      {/* Circle */}
      <div className="relative flex items-center justify-center">
        <svg width={INLINE_SIZE} height={INLINE_SIZE}>
          <circle
            cx={INLINE_SIZE / 2}
            cy={INLINE_SIZE / 2}
            r={INLINE_R}
            fill="transparent"
            stroke="hsl(var(--border))"
            strokeWidth={INLINE_STROKE}
          />
          <circle
            cx={INLINE_SIZE / 2}
            cy={INLINE_SIZE / 2}
            r={INLINE_R}
            fill="none"
            stroke={color}
            strokeWidth={INLINE_STROKE}
            strokeDasharray={INLINE_CIRC}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${INLINE_SIZE / 2} ${INLINE_SIZE / 2})`}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }}
          />
        </svg>
        <span
          className="absolute text-base font-bold tabular-nums"
          style={{ color, lineHeight: 1 }}
        >
          {score}%
        </span>
      </div>
      {/* Label */}
      <span
        className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
        style={{ color }}
      >
        Agreement Score
      </span>
    </div>
  );
}
