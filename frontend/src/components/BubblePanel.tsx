import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { MeetingId } from "@/lib/mindMapUtils";

interface BubbleDatum {
  keyword: string;
  count: number;
  texts: string[];
  isShared: boolean;
  isCrossMeeting?: boolean;
}

interface SimNode extends BubbleDatum {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

interface Props {
  meetingId: MeetingId;
  speakerName: string;
  color: string;
  bubbles: BubbleDatum[];
  onSharedClick: (keyword: string) => void;
  onBubbleDoubleClick?: (keyword: string, speakerName: string, texts: string[]) => void;
  /** Called on right-click of a gold cross-meeting bubble */
  onCrossMeetingRightClick?: (keyword: string) => void;
  hoveredKeyword: string | null;
  onHoverKeyword: (keyword: string | null) => void;
  panelZIndex?: number;
  onSharedDragStart?: (keyword: string) => void;
  onSharedDragEnd?: () => void;
  /** readonly=true disables drag & physics flinging (for multi-meeting mini view) */
  readonly?: boolean;
}

interface TooltipState {
  x: number;
  y: number;
  keyword: string;
  count: number;
  snippet: string;
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

const BOUNCE_DAMPEN_FREE = 0.72;
const BOUNCE_DAMPEN = 0.62;
const MIN_R = 28;
const MAX_R = 90;

function buildFloatKeyframes(count: number): string {
  let css = "";
  for (let i = 0; i < count; i++) {
    const clamp = (v: number) => Math.max(-8, Math.min(8, v));
    const x1 = clamp(((i * 37) % 17) - 8);
    const y1 = clamp(((i * 19) % 13) - 6);
    const x2 = clamp(((i * 53) % 15) - 7);
    const y2 = clamp(((i * 31) % 17) - 8);
    const x3 = clamp(-((i * 41) % 13) + 4);
    const y3 = clamp(-((i * 23) % 11) + 3);
    css += `
      @keyframes bubbleFloat${i} {
        0%   { transform: translate(0px,0px); }
        25%  { transform: translate(${x1}px,${y1}px); }
        50%  { transform: translate(${x2}px,${y2}px); }
        75%  { transform: translate(${x3}px,${y3}px); }
        100% { transform: translate(0px,0px); }
      }`;
  }
  css += `
    @keyframes bubbleEntrance {
      0%   { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }`;
  return css;
}

const MAX_BUBBLES = 20;
const STYLE_ID = "bubble-panel-keyframes";

function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = buildFloatKeyframes(MAX_BUBBLES);
  document.head.appendChild(style);
}

export function BubblePanel({
  meetingId,
  speakerName,
  color,
  bubbles,
  onSharedClick,
  onBubbleDoubleClick,
  onCrossMeetingRightClick,
  hoveredKeyword,
  onHoverKeyword,
  panelZIndex = 0,
  onSharedDragStart,
  onSharedDragEnd,
  readonly = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, undefined> | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipRef = useRef<TooltipState | null>(null);
  const draggingRef = useRef(false);
  const crossPanelRef = useRef(false);
  const [crossPanelDrag, setCrossPanelDrag] = useState(false);
  const innerGroupMap = useRef<Map<string, SVGGElement>>(new Map());
  const dragStartTimeRef = useRef<number>(0);

  useEffect(() => { ensureKeyframes(); }, []);

  useEffect(() => {
    innerGroupMap.current.forEach((el, keyword) => {
      const isMatch = hoveredKeyword === keyword;
      const circle = el.querySelector("circle");
      if (!circle) return;
      if (isMatch) {
        el.style.transition = "transform 150ms ease-out";
        el.style.transform = "scale(1.08)";
        circle.style.filter = `drop-shadow(0 0 20px ${hexToRgba(color, 0.9)}) drop-shadow(0 0 40px ${hexToRgba(color, 0.5)})`;
      } else {
        el.style.transition = "transform 150ms ease-out";
        el.style.transform = "";
        circle.style.filter = "";
      }
    });
  }, [hoveredKeyword, color]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || bubbles.length === 0) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    simRef.current?.stop();
    innerGroupMap.current.clear();

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const defs = svg.append("defs");

    // Scale bubble radii to fit the actual container — smaller panels get smaller bubbles.
    // Baseline: 640px tall panel = full size. Clamp between 0.35 and 1.0.
    const scale = Math.min(1.0, Math.max(0.35, Math.min(width / 480, height / 420)));
    const scaledMinR = MIN_R * scale;
    const scaledMaxR = MAX_R * scale;

    const counts = bubbles.map((b) => b.count);
    const rScale = d3.scaleSqrt()
      .domain([Math.min(...counts), Math.max(...counts)])
      .range([scaledMinR, scaledMaxR]);

    const nodes: SimNode[] = bubbles.map((b, i) => {
      const r = counts.length === 1 ? (scaledMinR + scaledMaxR) / 2 : rScale(b.count);
      return {
        ...b,
        r,
        x: r + Math.random() * (width - r * 2),
        y: r + Math.random() * (height * 0.6),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        fx: null,
        fy: null,
        index: i,
      };
    });

    const gradId = (i: number) => `rg-${meetingId}-${speakerName.replace(/\s/g, "")}-${i}`;

    nodes.forEach((_, i) => {
      const grad = defs.append("radialGradient")
        .attr("id", gradId(i))
        .attr("cx", "50%").attr("cy", "50%").attr("r", "50%");
      grad.append("stop").attr("offset", "0%")
        .attr("stop-color", color).attr("stop-opacity", 0.25);
      grad.append("stop").attr("offset", "100%")
        .attr("stop-color", color).attr("stop-opacity", 0.03);
    });

    const nodeGroups = svg
      .selectAll<SVGGElement, SimNode>("g.bubble-outer")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "bubble-outer")
      .attr("data-keyword", (d) => d.keyword)
      .attr("data-speaker", speakerName)
      .attr("data-meeting", meetingId)
      .attr("data-radius", (d) => d.r)
      .style("cursor", readonly ? "default" : "grab");

    const innerGroups = nodeGroups
      .append("g")
      .attr("class", "bubble-inner")
      .style("transform-origin", "0 0")
      .style("transform-box", "fill-box");

    innerGroups.each(function (_, i) {
      const el = this as SVGGElement;
      innerGroupMap.current.set(nodes[i].keyword, el);
      const floatDuration = 6 + ((i * 37) % 40) / 10;
      const floatDelay = i * 0.4;
      el.style.animation = `bubbleFloat${i % MAX_BUBBLES} ${floatDuration}s ease-in-out ${floatDelay}s infinite`;
    });

    innerGroups.append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (_, i) => `url(#${gradId(i)})`)
      .attr("stroke", (d) => {
        if (d.isCrossMeeting) return "rgba(255,220,80,0.70)";
        if (d.isShared) return "rgba(255,255,255,0.50)";
        return hexToRgba(color, 0.70);
      })
      .attr("stroke-width", 1.5)
      .style("filter", (d) => {
        if (d.isCrossMeeting) return "drop-shadow(0 0 22px rgba(255,220,80,0.30)) drop-shadow(0 0 8px rgba(255,220,80,0.50))";
        if (d.isShared) return "drop-shadow(0 0 22px rgba(255,255,255,0.25)) drop-shadow(0 0 8px rgba(255,255,255,0.35))";
        return `drop-shadow(0 0 18px ${hexToRgba(color, 0.40)}) drop-shadow(0 0 6px ${hexToRgba(color, 0.60)})`;
      });

    // Shared dot (within-meeting)
    innerGroups.filter((d) => d.isShared && !d.isCrossMeeting)
      .append("circle")
      .attr("r", 3)
      .attr("cy", (d) => -d.r + 8)
      .attr("fill", "rgba(255,255,255,0.85)")
      .attr("pointer-events", "none")
      .style("filter", "drop-shadow(0 0 4px rgba(255,255,255,0.9))");

    // Cross-meeting star dot
    innerGroups.filter((d) => !!d.isCrossMeeting)
      .append("circle")
      .attr("r", 4)
      .attr("cy", (d) => -d.r + 8)
      .attr("fill", "rgba(255,220,80,0.95)")
      .attr("pointer-events", "none")
      .style("filter", "drop-shadow(0 0 6px rgba(255,220,80,0.9))");

    innerGroups.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("y", (d) => (d.count > 1 ? -7 : 0))
      .attr("pointer-events", "none")
      .each(function (d) {
        const el = d3.select(this);
        const word = d.keyword;
        const maxWidth = d.r * 1.44;
        let fs = Math.max(9, Math.min(15, d.r * 0.40));
        while (fs > 8 && word.length * fs * 0.58 > maxWidth) fs -= 0.5;
        el.attr("font-size", fs)
          .attr("font-weight", "600")
          .attr("fill", "rgba(255,255,255,0.92)")
          .attr("letter-spacing", "0.02em")
          .text(word);
      });

    innerGroups.filter((d) => d.r > 20)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("y", 9)
      .attr("font-size", (d) => Math.max(8, Math.min(11, d.r * 0.26)))
      .attr("fill", hexToRgba(color, 0.60))
      .attr("pointer-events", "none")
      .text((d) => `×${d.count}`);

    nodeGroups
      .on("mouseenter", function (event: MouseEvent, d: SimNode) {
        if (draggingRef.current) return;
        const inner = this.querySelector<SVGGElement>(".bubble-inner");
        const circle = inner?.querySelector("circle");
        if (inner) { inner.style.transform = "scale(1.12)"; inner.style.transition = "transform 150ms ease-out"; }
        if (circle) circle.style.filter = `drop-shadow(0 0 28px ${hexToRgba(color, 0.85)}) drop-shadow(0 0 12px ${hexToRgba(color, 0.9)})`;
        if (d.isShared || d.isCrossMeeting) {
          onHoverKeyword(d.keyword);
          // Mark this as the source bubble for multi-beam
          this.setAttribute("data-hovered", "true");
        }
        const rect = container.getBoundingClientRect();
        const tip: TooltipState = { x: event.clientX - rect.left, y: event.clientY - rect.top, keyword: d.keyword, count: d.count, snippet: truncateWords(d.texts[0] ?? "", 50) };
        tooltipRef.current = tip;
        setTooltip(tip);
      })
      .on("mousemove", function (event: MouseEvent) {
        if (draggingRef.current) return;
        const rect = container.getBoundingClientRect();
        const tip = tooltipRef.current ? { ...tooltipRef.current, x: event.clientX - rect.left, y: event.clientY - rect.top } : null;
        tooltipRef.current = tip;
        setTooltip(tip);
      })
      .on("mouseleave", function (_event: MouseEvent, d: SimNode) {
        if (draggingRef.current && crossPanelRef.current) return;
        this.removeAttribute("data-hovered");
        const inner = this.querySelector<SVGGElement>(".bubble-inner");
        const circle = inner?.querySelector("circle");
        if (inner) inner.style.transform = "";
        if (circle) circle.style.filter = d.isCrossMeeting
          ? "drop-shadow(0 0 22px rgba(255,220,80,0.30)) drop-shadow(0 0 8px rgba(255,220,80,0.50))"
          : d.isShared
          ? "drop-shadow(0 0 22px rgba(255,255,255,0.25)) drop-shadow(0 0 8px rgba(255,255,255,0.35))"
          : `drop-shadow(0 0 18px ${hexToRgba(color, 0.40)}) drop-shadow(0 0 6px ${hexToRgba(color, 0.60)})`;
        if (d.isShared || d.isCrossMeeting) onHoverKeyword(null);
        tooltipRef.current = null;
        setTooltip(null);
      })
      .on("click", (_event: MouseEvent, d: SimNode) => {
        if (draggingRef.current || crossPanelRef.current) return;
        if (d.isShared || d.isCrossMeeting) {
          onSharedClick(d.keyword);
        } else {
          onBubbleDoubleClick?.(d.keyword, speakerName, d.texts);
        }
      })
      .on("contextmenu", (event: MouseEvent, d: SimNode) => {
        event.preventDefault();
        if (d.isCrossMeeting) {
          onCrossMeetingRightClick?.(d.keyword);
        } else {
          onBubbleDoubleClick?.(d.keyword, speakerName, d.texts);
        }
      });

    if (!readonly) {
      const dragHistory: { x: number; y: number; t: number }[] = [];

      const drag = d3.drag<SVGGElement, SimNode>()
        .on("start", function (_event, d) {
          dragStartTimeRef.current = performance.now();
          draggingRef.current = true;
          tooltipRef.current = null;
          setTooltip(null);
          dragHistory.length = 0;
          d.fx = d.x; d.fy = d.y;
          d3.select(this).style("cursor", "grabbing");

          if (d.isShared && !d.isCrossMeeting) {
            crossPanelRef.current = true;
            setCrossPanelDrag(true);
            onHoverKeyword(d.keyword);
            // Mark this as the hovered source so beams anchor correctly during drag
            this.setAttribute("data-hovered", "true");
            onSharedDragStart?.(d.keyword);
          }
        })
        .on("drag", function (event, d) {
          const r = d.r;
          if (crossPanelRef.current) {
            // No clamping — allow bubble to travel freely across panel boundaries
            d.fx = event.x;
            d.fy = event.y;
          } else {
            d.fx = Math.max(r, Math.min(width - r, event.x));
            d.fy = Math.max(r, Math.min(height - r, event.y));
          }
          dragHistory.push({ x: d.fx!, y: d.fy!, t: performance.now() });
          if (dragHistory.length > 6) dragHistory.shift();
        })
        .on("end", function (_event, d) {
          const dragDuration = performance.now() - dragStartTimeRef.current;
          const isAccidentalDrag = dragDuration < 300 && dragHistory.length <= 1;

          if (crossPanelRef.current) {
            this.removeAttribute("data-hovered");
            if (isAccidentalDrag) {
              d.vx = 0; d.vy = 0;
            } else {
              const padding = d.r + 20;
              d.x = padding + Math.random() * (width - padding * 2);
              d.y = padding + Math.random() * (height - padding * 2);
              d.vx = (Math.random() - 0.5) * 2;
              d.vy = (Math.random() - 0.5) * 2;
            }
            crossPanelRef.current = false;
            setCrossPanelDrag(false);
            onSharedDragEnd?.();
          } else if (dragHistory.length >= 2) {
            const a = dragHistory[dragHistory.length - 2];
            const b = dragHistory[dragHistory.length - 1];
            const dt = (b.t - a.t) / 16;
            d.vx = dt > 0 ? (b.x - a.x) / dt : 0;
            d.vy = dt > 0 ? (b.y - a.y) / dt : 0;
            const speed = Math.sqrt(d.vx ** 2 + d.vy ** 2);
            if (speed > 16) { d.vx = (d.vx / speed) * 16; d.vy = (d.vy / speed) * 16; }
          } else { d.vx = 0; d.vy = 0; }

          d.fx = null; d.fy = null;
          d3.select(this).style("cursor", "grab");
          setTimeout(() => { draggingRef.current = false; }, 80);
        });

      nodeGroups.call(drag);
    }

    const sim = d3.forceSimulation<SimNode>(nodes)
      .alphaDecay(0)
      .velocityDecay(readonly ? 0.08 : 0.012)
      .force("collide",
        d3.forceCollide<SimNode>().radius((d) => d.r + 2).strength(1.0).iterations(8)
      )
      .on("tick", () => {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            const dx = b.x! - a.x!;
            const dy = b.y! - a.y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
            const minDist = a.r + b.r + 2;
            if (dist < minDist) {
              const overlap = (minDist - dist) / 2;
              const ux = dx / dist, uy = dy / dist;
              if (a.fx == null) { a.x! -= ux * overlap; a.y! -= uy * overlap; }
              if (b.fx == null) { b.x! += ux * overlap; b.y! += uy * overlap; }
              if (a.fx == null && b.fx == null) {
                const dot = (a.vx! - b.vx!) * ux + (a.vy! - b.vy!) * uy;
                if (dot > 0) {
                  a.vx! -= dot * ux * BOUNCE_DAMPEN; a.vy! -= dot * uy * BOUNCE_DAMPEN;
                  b.vx! += dot * ux * BOUNCE_DAMPEN; b.vy! += dot * uy * BOUNCE_DAMPEN;
                }
              }
            }
          }
        }

        for (const d of nodes) {
          if (d.fx != null) continue;
          const r = d.r;
          if (d.x! - r < 0)      { d.x = r;         d.vx =  Math.abs(d.vx!) * BOUNCE_DAMPEN; }
          if (d.x! + r > width)   { d.x = width - r; d.vx = -Math.abs(d.vx!) * BOUNCE_DAMPEN; }
          if (d.y! - r < 0)       { d.y = r;         d.vy =  Math.abs(d.vy!) * BOUNCE_DAMPEN; }
          if (d.y! + r > height) {
            d.y = height - r;
            d.vy = -Math.abs(d.vy!) * BOUNCE_DAMPEN;
            d.vx = (d.vx! + (Math.random() - 0.5) * 0.15) * 0.98;
            if (Math.abs(d.vy!) < 0.3) d.vy = 0;
          }
          const speed = Math.sqrt(d.vx! ** 2 + d.vy! ** 2);
          if (speed > 14) { d.vx = (d.vx! / speed) * 14; d.vy = (d.vy! / speed) * 14; }
        }

        nodeGroups.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

    simRef.current = sim;
    return () => { sim.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbles, color, speakerName, meetingId, readonly]);

  useEffect(() => {
    let skip = true;
    const obs = new ResizeObserver(() => {
      if (skip) { skip = false; return; }
      if (svgRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        svgRef.current.setAttribute("width", String(width));
        svgRef.current.setAttribute("height", String(height));
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 min-w-0 border-r border-border last:border-r-0 ${crossPanelDrag ? "" : "overflow-hidden"}`}
      style={{
        background: `radial-gradient(ellipse at center, ${hexToRgba(color, 0.04)} 0%, transparent 70%), hsl(var(--background))`,
        zIndex: crossPanelDrag ? 10 : panelZIndex,
      }}
    >
      <div
        className="absolute top-3 left-4 text-xs font-semibold tracking-widest uppercase z-10 select-none pointer-events-none"
        style={{ color, textShadow: `0 0 12px ${hexToRgba(color, 0.6)}` }}
      >
        {speakerName}
      </div>

      <svg ref={svgRef} className="w-full h-full block"
        style={{ overflow: crossPanelDrag ? "visible" : "hidden" }} />

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border border-border px-3 py-2 shadow-xl text-xs"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
            width: 200,
            transform: tooltip.x > 160 ? "translateX(-100%)" : undefined,
            boxShadow: `0 0 20px ${hexToRgba(color, 0.15)}, 0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <div className="font-semibold mb-0.5" style={{ color }}>{tooltip.keyword}</div>
          <div className="text-muted-foreground mb-1">{tooltip.count} mention{tooltip.count !== 1 ? "s" : ""}</div>
          {tooltip.snippet && (
            <div className="italic text-muted-foreground leading-relaxed">"{tooltip.snippet}"</div>
          )}
        </div>
      )}
    </div>
  );
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
