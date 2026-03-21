import { useEffect, useRef } from "react";

interface Props {
  hoveredKeyword: string | null;
  colorA: string;
  colorB: string;
}

const FILTER_ID = "beam-glow";
const GOLD = "rgba(255,220,80,0.9)";

export function ConnectionBeam({ hoveredKeyword, colorA, colorB }: Props) {
  const svgRef   = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const frameRef = useRef<number | null>(null);
  const visRef   = useRef(false);

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const svg   = svgRef.current;
    const group = groupRef.current;

    if (!hoveredKeyword) {
      if (svg) svg.style.opacity = "0";
      visRef.current = false;
      return;
    }

    const update = () => {
      const allEls = Array.from(
        document.querySelectorAll<Element>(`[data-keyword="${CSS.escape(hoveredKeyword)}"]`)
      );

      if (allEls.length < 2 || !group || !svg) {
        frameRef.current = requestAnimationFrame(update);
        return;
      }

      // Find the hovered source — the one with data-hovered="true"
      const sourceEl = allEls.find((el) => el.getAttribute("data-hovered") === "true") ?? allEls[0];
      const targets  = allEls.filter((el) => el !== sourceEl);

      // Determine if this is a cross-meeting beam (gold) or within-meeting (colorA/colorB)
      const isCross = allEls.length > 2 ||
        new Set(allEls.map((el) => el.getAttribute("data-meeting"))).size > 1;

      const getCenter = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, rad: r.width / 2 };
      };

      const src = getCenter(sourceEl);

      // Build all beam paths from source to each target
      let paths = "";
      let dots  = "";

      for (let i = 0; i < targets.length; i++) {
        const tgt = getCenter(targets[i]);

        const dx   = tgt.x - src.x;
        const dy   = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux   = dx / dist;
        const uy   = dy / dist;

        const x1 = src.x + ux * src.rad;
        const y1 = src.y + uy * src.rad;
        const x2 = tgt.x - ux * tgt.rad;
        const y2 = tgt.y - uy * tgt.rad;

        // Curve perpendicular offset — alternate sides for fan effect
        const sign = i % 2 === 0 ? -1 : 1;
        const bow  = targets.length > 1 ? sign * 60 : -70;
        const mx   = (x1 + x2) / 2 - uy * bow;
        const my   = (y1 + y2) / 2 + ux * bow;

        const pathD  = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
        const beamColor = isCross ? GOLD : (i === 0 ? colorA : colorB);
        const beamId = `beam-grad-${i}`;

        paths += `
          <path d="${pathD}" stroke="url(#${beamId})" stroke-width="8"
            fill="none" opacity="0.25" filter="url(#${FILTER_ID})" />
          <path d="${pathD}" stroke="url(#${beamId})" stroke-width="2"
            fill="none" stroke-dasharray="8 4" opacity="0.9"
            style="animation: beamDash 1.4s linear infinite" />
        `;

        dots += `
          <circle cx="${x2}" cy="${y2}" r="3.5" fill="${beamColor}" opacity="0.95"
            style="filter: drop-shadow(0 0 6px ${beamColor})" />
        `;

        // Inject gradient def dynamically
        let gradEl = svg.querySelector<SVGLinearGradientElement>(`#${beamId}`);
        if (!gradEl) {
          const defs = svg.querySelector("defs")!;
          gradEl = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
          gradEl.id = beamId;
          gradEl.setAttribute("gradientUnits", "userSpaceOnUse");
          const s1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
          s1.setAttribute("offset", "0%");
          const s2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
          s2.setAttribute("offset", "50%");
          s2.setAttribute("stop-color", "#ffffff");
          s2.setAttribute("stop-opacity", "0.7");
          const s3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
          s3.setAttribute("offset", "100%");
          gradEl.appendChild(s1); gradEl.appendChild(s2); gradEl.appendChild(s3);
          defs.appendChild(gradEl);
        }
        // Update gradient coords + colors
        gradEl.setAttribute("x1", String(x1));
        gradEl.setAttribute("y1", String(y1));
        gradEl.setAttribute("x2", String(x2));
        gradEl.setAttribute("y2", String(y2));
        gradEl.children[0].setAttribute("stop-color", isCross ? GOLD : colorA);
        gradEl.children[0].setAttribute("stop-opacity", "0.9");
        gradEl.children[2].setAttribute("stop-color", isCross ? GOLD : beamColor);
        gradEl.children[2].setAttribute("stop-opacity", "0.9");
      }

      // Source dot
      const srcDotColor = isCross ? GOLD : colorA;
      dots += `<circle cx="${src.x}" cy="${src.y}" r="4" fill="${srcDotColor}" opacity="0.95"
        style="filter: drop-shadow(0 0 8px ${srcDotColor})" />`;

      group.innerHTML = paths + dots;

      if (!visRef.current) {
        svg.style.transition = "opacity 200ms ease-out";
        svg.style.opacity    = "1";
        visRef.current = true;
      }

      frameRef.current = requestAnimationFrame(update);
    };

    frameRef.current = requestAnimationFrame(update);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [hoveredKeyword, colorA, colorB]);

  return (
    <svg
      ref={svgRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 50,
        overflow: "visible",
        opacity: 0,
      }}
    >
      <defs>
        <filter id={FILTER_ID} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <style>{`
          @keyframes beamDash {
            from { stroke-dashoffset: 24; }
            to   { stroke-dashoffset: 0; }
          }
        `}</style>
      </defs>

      {/* All beams rendered here by the rAF loop */}
      <g ref={groupRef} />
    </svg>
  );
}
