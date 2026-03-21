import { useEffect, useRef, useState } from "react";

interface Props {
  hoveredKeyword: string | null;
  colorA: string;
  colorB: string;
  onMerge: (keyword: string, meetingIdA: string, meetingIdB: string) => void;
}

interface BubblePos {
  el: HTMLElement;
  x: number;
  y: number;
  r: number;
  meetingId: string;
}

function getBubbleData(keyword: string): { a: BubblePos; b: BubblePos } | null {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-keyword="${CSS.escape(keyword)}"]`)
  );
  if (els.length < 2) return null;

  const get = (el: HTMLElement): BubblePos => {
    const rect = el.getBoundingClientRect();
    return {
      el,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      r: parseFloat(el.dataset.radius ?? "40"),
      meetingId: el.dataset.meeting ?? "",
    };
  };

  // Use the actively hovered bubble as source; fall back to first element
  const sourceEl = els.find((e) => e.getAttribute("data-hovered") === "true") ?? els[0];
  const sourcePos = get(sourceEl);

  // Find the nearest other bubble to the source
  let nearest: BubblePos | null = null;
  let nearestDist = Infinity;
  for (const el of els) {
    if (el === sourceEl) continue;
    const pos = get(el);
    const d = Math.hypot(pos.x - sourcePos.x, pos.y - sourcePos.y);
    if (d < nearestDist) { nearestDist = d; nearest = pos; }
  }

  if (!nearest) return null;
  return { a: sourcePos, b: nearest };
}

const THRESHOLD = -30; // requires ~30px of actual overlap before triggering

// Phase: idle | pop | hold | split
type Phase = "idle" | "pop" | "hold" | "split";

interface MergeState {
  mx: number;
  my: number;
  r: number;
  colorA: string;
  colorB: string;
  phase: Phase;
  meetingIdA: string;
  meetingIdB: string;
}

export function MergeOverlay({ hoveredKeyword, colorA, colorB, onMerge }: Props) {
  const rafRef       = useRef<number | null>(null);
  const triggeredRef = useRef(false);
  const [state, setState] = useState<MergeState | null>(null);
  const stateRef = useRef<MergeState | null>(null);
  const keywordRef = useRef<string | null>(null);

  const cancelRaf = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  };

  // Reset on keyword change
  useEffect(() => {
    cancelRaf();
    triggeredRef.current = false;
    // Only reset if we're not mid-animation
    if (!stateRef.current || stateRef.current.phase === "idle") {
      setState(null);
      stateRef.current = null;
    }
    keywordRef.current = hoveredKeyword;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredKeyword]);

  // Proximity detection loop
  useEffect(() => {
    if (!hoveredKeyword) return;

    const detect = () => {
      if (triggeredRef.current) return;
      const data = getBubbleData(hoveredKeyword);
      if (data) {
        const { a, b } = data;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        if (dist < a.r + b.r + THRESHOLD) {
          triggeredRef.current = true;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const r  = (a.r + b.r) * 0.58;
          const meetingIdA = a.meetingId;
          const meetingIdB = b.meetingId;

          // --- Phase 1: POP (380ms) ---
          const popState: MergeState = { mx, my, r, colorA, colorB, phase: "pop", meetingIdA, meetingIdB };
          stateRef.current = popState;
          setState(popState);

          // Hide both source bubbles immediately
          a.el.style.transition = "opacity 200ms ease";
          b.el.style.transition = "opacity 200ms ease";
          a.el.style.opacity = "0";
          b.el.style.opacity = "0";

          // --- Phase 2: HOLD (after pop finishes at ~600ms, hold for 5000ms) ---
          setTimeout(() => {
            const holdState: MergeState = { mx, my, r, colorA, colorB, phase: "hold", meetingIdA, meetingIdB };
            stateRef.current = holdState;
            setState(holdState);

            // --- Phase 3: OPEN MODAL (after 800ms into hold so user sees merged state first) ---
            setTimeout(() => {
              if (keywordRef.current === hoveredKeyword || keywordRef.current === null) {
                onMerge(hoveredKeyword, meetingIdA, meetingIdB);
              }

              // --- Phase 4: SPLIT (after hold duration = 1000ms total from hold start) ---
              setTimeout(() => {
                const splitState: MergeState = { mx, my, r, colorA, colorB, phase: "split", meetingIdA, meetingIdB };
                stateRef.current = splitState;
                setState(splitState);

                // Restore source bubbles as split animation plays
                setTimeout(() => {
                  a.el.style.transition = "opacity 250ms ease";
                  b.el.style.transition = "opacity 250ms ease";
                  a.el.style.opacity = "1";
                  b.el.style.opacity = "1";
                }, 100);

                // Clean up overlay after split animation
                setTimeout(() => {
                  stateRef.current = null;
                  setState(null);
                  triggeredRef.current = false;
                }, 380);

              }, 80);
            }, 250);
          }, 220);

          return;
        }
      }
      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
    return cancelRaf;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredKeyword]);

  if (!state || state.phase === "idle") return null;

  const { mx, my, r, phase } = state;

  return (
    <svg
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 60,
        overflow: "visible",
      }}
    >
      <defs>
        <radialGradient id="merge-grad" cx="40%" cy="38%" r="60%">
          <stop offset="0%"   stopColor={colorA} stopOpacity="0.95" />
          <stop offset="100%" stopColor={colorB} stopOpacity="0.75" />
        </radialGradient>

        <radialGradient id="merge-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={colorA} stopOpacity="0.35" />
          <stop offset="100%" stopColor={colorA} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer glow ring */}
      <circle
        cx={mx}
        cy={my}
        r={r * 1.5}
        fill="url(#merge-glow)"
        style={{
          animation: phase === "pop"
            ? `mergeGlowIn 220ms cubic-bezier(0.22,1,0.36,1) forwards`
            : phase === "hold"
            ? `mergeGlowPulse 2s ease-in-out infinite`
            : `mergeGlowOut 350ms ease-in forwards`,
        }}
      />

      {/* Main merged blob */}
      <circle
        cx={mx}
        cy={my}
        r={r}
        fill="url(#merge-grad)"
        stroke={colorA}
        strokeWidth="1.5"
        strokeOpacity="0.5"
        style={{
          animation: phase === "pop"
            ? `mergeBlobIn 220ms cubic-bezier(0.22,1,0.36,1) forwards`
            : phase === "hold"
            ? `mergeBlobHold 2s ease-in-out infinite`
            : `mergeBlobOut 350ms cubic-bezier(0.55,0,1,0.45) forwards`,
          filter: `drop-shadow(0 0 18px ${colorA}88) drop-shadow(0 0 8px ${colorB}66)`,
        }}
      />

      {/* Merge label shown during hold */}
      {phase === "hold" && (
        <text
          x={mx}
          y={my}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.max(11, Math.min(16, r * 0.28))}
          fontWeight="700"
          fill="rgba(0,0,0,0.88)"
          letterSpacing="0.03em"
          style={{ animation: "mergeLabelIn 400ms ease-out forwards", pointerEvents: "none" }}
        >
          ⚡ merged
        </text>
      )}

      <style>{`
        @keyframes mergeBlobIn {
          0%   { transform: scale(0.3); opacity: 0; transform-origin: ${mx}px ${my}px; }
          55%  { transform: scale(1.18); opacity: 1; transform-origin: ${mx}px ${my}px; }
          75%  { transform: scale(0.94); transform-origin: ${mx}px ${my}px; }
          100% { transform: scale(1.0);  opacity: 1; transform-origin: ${mx}px ${my}px; }
        }
        @keyframes mergeBlobHold {
          0%,100% { transform: scale(1.0); transform-origin: ${mx}px ${my}px; }
          50%     { transform: scale(1.04); transform-origin: ${mx}px ${my}px; }
        }
        @keyframes mergeBlobOut {
          0%   { transform: scale(1.0); opacity: 1; transform-origin: ${mx}px ${my}px; }
          30%  { transform: scale(1.2); opacity: 0.9; transform-origin: ${mx}px ${my}px; }
          100% { transform: scale(0); opacity: 0; transform-origin: ${mx}px ${my}px; }
        }
        @keyframes mergeGlowIn {
          0%   { transform: scale(0.2); opacity: 0; transform-origin: ${mx}px ${my}px; }
          100% { transform: scale(1.0); opacity: 1; transform-origin: ${mx}px ${my}px; }
        }
        @keyframes mergeGlowPulse {
          0%,100% { opacity: 0.7; transform: scale(1.0); transform-origin: ${mx}px ${my}px; }
          50%     { opacity: 1.0; transform: scale(1.1); transform-origin: ${mx}px ${my}px; }
        }
        @keyframes mergeGlowOut {
          0%   { opacity: 1; transform-origin: ${mx}px ${my}px; }
          100% { opacity: 0; transform-origin: ${mx}px ${my}px; }
        }
        @keyframes mergeLabelIn {
          0%   { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </svg>
  );
}
