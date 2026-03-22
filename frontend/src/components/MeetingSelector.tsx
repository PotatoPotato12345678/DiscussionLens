import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, HelpCircle, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import type { MeetingId } from "@/lib/mindMapUtils";

interface MeetingInfo {
  readonly id: string;
  readonly title: string;
}

interface Props {
  activeIds: MeetingId[];
  multiMode: boolean;
  onMultiModeChange: (v: boolean) => void;
  onToggle: (id: MeetingId) => void;
  meetings: readonly MeetingInfo[];
  hoveredKeyword: string | null;
  onHoverKeyword: (kw: string | null) => void;
  activeColorMaps: Record<string, Record<string, string>>;
  crossShared: Set<string>;
  meetingPanelData: { meeting: MeetingInfo; speakers: string[] }[];
  canMulti: boolean;
}

import { FAQ_ITEMS } from "@/data/faqItems";
function HelpPanel() {
  const [open, setOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="mt-auto border-t border-border">
      {/* Trigger row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        <HelpCircle size={13} className="shrink-0" />
        <span className="font-medium">Help</span>
        {open ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
      </button>

      {open && (
        <div className="border-t border-border bg-card/60 overflow-hidden">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-border/50 last:border-b-0">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-start justify-between gap-2 px-3 py-2 text-left group"
              >
                <span className={`text-[11px] font-medium leading-snug transition-colors ${openIdx === i ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {item.q}
                </span>
                {openIdx === i
                  ? <ChevronUp size={10} className="shrink-0 mt-0.5 text-muted-foreground" />
                  : <ChevronDown size={10} className="shrink-0 mt-0.5 text-muted-foreground" />}
              </button>
              {openIdx === i && (
                <p className="px-3 pb-3 text-[11px] leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MeetingSelector({ activeIds, onToggle, meetings, multiMode, onMultiModeChange, canMulti }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <aside
      className="relative flex flex-col shrink-0 border-r border-border transition-all duration-200 overflow-hidden"
      style={{
        width: collapsed ? 36 : 220,
        background: "hsl(var(--card))",
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute top-2 right-2 z-10 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        title={collapsed ? "Expand meetings" : "Collapse meetings"}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Collapsed: just show dots */}
      {collapsed ? (
        <div className="flex flex-col items-center pt-10 gap-3 px-2">
          <button
            onClick={() => navigate("/app")}
            title="Back to dashboard"
            className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mb-2"
          >
            <ArrowLeft size={14} />
          </button>
          {meetings.map((m) => {
            const isActive = activeIds.includes(m.id as MeetingId);
            return (
              <button
                key={m.id}
                onClick={() => onToggle(m.id as MeetingId)}
                title={m.title}
                className="w-4 h-4 rounded-full border transition-all"
                style={{
                  background: isActive ? "hsl(var(--primary))" : "transparent",
                  borderColor: isActive ? "hsl(var(--primary))" : "hsl(var(--border))",
                  boxShadow: isActive ? "0 0 6px 1px hsl(var(--primary) / 0.4)" : "none",
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-1 p-2 pt-10 overflow-y-auto flex-1 min-h-0">
          {/* Back to dashboard */}
          <button
            onClick={() => navigate("/app")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 mb-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors border border-border"
          >
            <ArrowLeft size={12} />
            <span>Dashboard</span>
          </button>
          {/* Mode toggle */}
          <div className="mb-3 px-1">
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2" style={{ background: "hsl(var(--background) / 0.5)" }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  {multiMode ? "Multi" : "Single"}
                </span>
                {!canMulti && (
                  <span className="text-[9px] font-bold text-amber-400 border border-amber-400/40 rounded px-1">
                    PRO
                  </span>
                )}
              </div>
              <button
                onClick={() => onMultiModeChange(!multiMode)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                style={{ background: multiMode ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                title={multiMode ? "Switch to single meeting" : "Switch to multi-meeting"}
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
          </div>

          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-2 mb-1">
            Meetings
          </div>

          {meetings.map((m, idx) => {
            const isActive = activeIds.includes(m.id as MeetingId);
            const isDisabled = false;
            return (
              <button
                key={m.id}
                onClick={() => onToggle(m.id as MeetingId)}
                className={`
                  w-full text-left rounded-lg px-3 py-2.5 text-xs transition-all duration-150 border
                  ${isActive
                    ? "border-border bg-accent text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: isActive ? "hsl(var(--primary))" : "hsl(var(--border))",
                      boxShadow: isActive ? "0 0 6px 1px hsl(var(--primary) / 0.5)" : "none",
                    }}
                  />
                  <span className="truncate leading-tight">
                    <span className="text-muted-foreground font-normal mr-1">#{idx + 1}</span>
                    {m.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Description + Help panel — only visible when expanded */}
      {!collapsed && (
        <>
          <div className="px-3 py-2.5 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select meetings to compare. Shared keywords across meetings glow{" "}
              <span className="font-semibold" style={{ color: "rgba(255,220,80,0.9)" }}>gold</span>.
            </p>
          </div>
          <HelpPanel />
        </>
      )}
    </aside>
  );
}
