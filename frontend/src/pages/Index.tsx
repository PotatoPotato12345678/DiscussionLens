import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MindMapNavbar } from "@/components/MindMapNavbar";
import { BubblePanel } from "@/components/BubblePanel";
import { SharedKeywordModal } from "@/components/SharedKeywordModal";
import { ConnectionBeam } from "@/components/ConnectionBeam";
import { MergeOverlay } from "@/components/MergeOverlay";
import { MeetingSelector } from "@/components/MeetingSelector";
import { PaywallModal } from "@/components/PaywallModal";
import { useRevenueCat } from "@/contexts/RevenueCatContext";
import {
  buildMeetingPanelData,
  crossMeetingKeywords,
  fetchMeetings,
  fetchMeetingData,
  type MeetingId,
  type LoadedMeeting,
  type MeetingData,
} from "@/lib/mindMapUtils";

interface ModalState {
  keyword: string;
  sections: { speaker: string; texts: string[]; color: string; meetingId: string }[];
  /** All sections from every active meeting — used for "include" toggles in the modal */
  allSections?: { speaker: string; texts: string[]; color: string; meetingId: string; meetingTitle: string }[];
}

export default function Index() {
  const [searchParams] = useSearchParams();
  const { meetingId: urlMeetingId } = useParams<{ meetingId: string }>();
  const { isSubscribed, isReady } = useRevenueCat();

  const [activeIds, setActiveIds] = useState<MeetingId[]>(() =>
    urlMeetingId ? [urlMeetingId] : []
  );
  const [multiMode, setMultiMode] = useState(() => searchParams.get("multi") === "1");
  const [showMultiPaywall, setShowMultiPaywall] = useState(false);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);
  const [draggingMeetingIdx, setDraggingMeetingIdx] = useState<number | null>(null);
  const [minMentions, setMinMentions] = useState(1);


  // ── Guard: reset multi-mode if user is not subscribed ────────────────────
  useEffect(() => {
    if (isReady && !isSubscribed && multiMode) {
      setMultiMode(false);
      setActiveIds((prev) => [prev[0] ?? ""]);
    }
  }, [isReady, isSubscribed]);

  // ── Realtime: invalidate meeting data when new mentions arrive ───────────
  const queryClient = useQueryClient();
  useEffect(() => {
    if (activeIds.length === 0) return;
    const channel = supabase
      .channel("index-keyword-mentions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "keyword_mentions" },
        (payload) => {
          const meetingId = (payload.new as { meeting_id: string }).meeting_id;
          if (activeIds.includes(meetingId)) {
            queryClient.invalidateQueries({ queryKey: ["meeting-data", meetingId] });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeIds, queryClient]);

  // ── Fetch meetings list (for the selector sidebar) ────────────────────────
  const { data: dbMeetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
  });

  // ── Fetch data for each active meeting in parallel ────────────────────────
  const meetingDataResults = useQueries({
    queries: activeIds.map((id) => ({
      queryKey: ["meeting-data", id],
      queryFn: () => fetchMeetingData(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const loadedMeetings: LoadedMeeting[] = meetingDataResults
    .map((q, i) =>
      q.status === "success" && q.data
        ? { id: activeIds[i], title: (q.data as MeetingData).meetingTitle, data: q.data as MeetingData }
        : null
    )
    .filter((m): m is LoadedMeeting => m !== null);

  const isLoading = activeIds.length > 0 && meetingDataResults.some((q) => q.isLoading);

  // ── Derived data ──────────────────────────────────────────────────────────
  const crossShared = useMemo(
    () => crossMeetingKeywords(activeIds, loadedMeetings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIds, loadedMeetings.length]
  );

  const meetings = useMemo(
    () =>
      loadedMeetings.map((_, i) =>
        buildMeetingPanelData(loadedMeetings[i].id, i * 2, crossShared, loadedMeetings)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadedMeetings.length, crossShared]
  );

  // Filtered meetings — memoized so filter() doesn't create new array refs on every render
  const filteredMeetings = useMemo(
    () =>
      meetings.map((m) => ({
        ...m,
        panelData: m.panelData.map((p) => ({
          ...p,
          bubbles: p.bubbles.filter((b) => b.count >= minMentions),
        })),
      })),
    [meetings, minMentions]
  );

  // Collect all colorMaps in one place for beam color lookup
  const allColorMaps = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of meetings) {
      Object.assign(map, m.colorMap);
    }
    return map;
  }, [meetings]);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const buildCrossSections = (keyword: string, meetingIds: string[]) => {
    const sections: ModalState["sections"] = [];
    for (const m of meetings) {
      if (!meetingIds.includes(m.meeting.id)) continue;
      const kRes = m.meeting.data.results.find((r) => r.keyword === keyword);
      if (!kRes) continue;
      for (const [speaker, entries] of Object.entries(kRes.speakers)) {
        sections.push({
          speaker: `${speaker} (${m.meeting.title})`,
          texts: entries.map((e) => e.text),
          color: m.colorMap[speaker] ?? "#fff",
          meetingId: m.meeting.id,
        });
      }
    }
    return sections;
  };

  const buildAllCrossSections = (keyword: string) => {
    const all: NonNullable<ModalState["allSections"]> = [];
    for (const m of meetings) {
      const kRes = m.meeting.data.results.find((r) => r.keyword === keyword);
      if (!kRes) continue;
      for (const [speaker, entries] of Object.entries(kRes.speakers)) {
        all.push({
          speaker: `${speaker} (${m.meeting.title})`,
          texts: entries.map((e) => e.text),
          color: m.colorMap[speaker] ?? "#fff",
          meetingId: m.meeting.id,
          meetingTitle: m.meeting.title,
        });
      }
    }
    return all;
  };

  const openSharedModal = (keyword: string, meetingId?: MeetingId, clashedMeetingIdA?: string, clashedMeetingIdB?: string) => {
    // Cross-meeting clash between two specific meetings
    if (clashedMeetingIdA && clashedMeetingIdB) {
      const sections = buildCrossSections(keyword, [clashedMeetingIdA, clashedMeetingIdB]);
      const allSections = buildAllCrossSections(keyword);
      if (sections.length) { setModalState({ keyword, sections, allSections }); return; }
    }

    // If no meetingId supplied, go straight to cross-meeting aggregation (all meetings)
    if (!meetingId) {
      if (crossShared.has(keyword)) {
        const sections = buildCrossSections(keyword, meetings.map((m) => m.meeting.id));
        if (sections.length) { setModalState({ keyword, sections }); return; }
      }
      // fallthrough to single-meeting with first active
    }

    // Within-meeting path
    const targetId = meetingId ?? activeIds[0];
    const meetingEntry = loadedMeetings.find((m) => m.id === targetId);
    if (!meetingEntry) return;
    const result = meetingEntry.data.results.find((r) => r.keyword === keyword);
    if (result && Object.keys(result.speakers).length > 1) {
      const colorMap = meetings.find((m) => m.meeting.id === targetId)?.colorMap ?? {};
      const sections = Object.entries(result.speakers).map(([speaker, entries]) => ({
        speaker,
        texts: entries.map((e) => e.text),
        color: colorMap[speaker] ?? "#fff",
        meetingId: targetId,
      }));
      setModalState({ keyword, sections });
      return;
    }

    // Cross-meeting fallback when called with a meetingId but keyword spans meetings
    if (crossShared.has(keyword)) {
      const sections = buildCrossSections(keyword, meetings.map((m) => m.meeting.id));
      if (sections.length) setModalState({ keyword, sections });
    }
  };

  const openSingleModal = (keyword: string, speakerName: string, texts: string[]) => {
    const color = allColorMaps[speakerName] ?? "#fff";
    const ownerMeeting = meetings.find((m) => m.colorMap[speakerName] !== undefined);
    setModalState({ keyword, sections: [{ speaker: speakerName, texts, color, meetingId: ownerMeeting?.meeting.id ?? "" }] });
  };

  const openCrossMeetingRightClick = (keyword: string) => {
    const all = buildAllCrossSections(keyword);
    if (!all.length) return;
    setModalState({ keyword, sections: all, allSections: all });
  };

  // Beam colors — find the two speakers/panels that share the hovered keyword
  const beamColors = useMemo(() => {
    if (!hoveredKeyword) return { colorA: "#fff", colorB: "#fff" };
    const allPanels = meetings.flatMap((m) => m.panelData);
    const panels = allPanels.filter((p) => p.bubbles.some((b) => b.keyword === hoveredKeyword));
    return {
      colorA: panels[0]?.color ?? "#fff",
      colorB: panels[1]?.color ?? panels[0]?.color ?? "#fff",
    };
  }, [hoveredKeyword, meetings]);

  const isSingleMeeting = activeIds.length === 1;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading || (activeIds.length > 0 && loadedMeetings.length === 0)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading meeting data…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      <MindMapNavbar allColorMaps={allColorMaps} meetings={meetings} minMentions={minMentions} onMinMentionsChange={setMinMentions} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left rail: meeting selector (always visible) */}
        <MeetingSelector
          activeIds={activeIds}
          multiMode={multiMode}
          canMulti={isSubscribed}
          onMultiModeChange={(v) => {
            if (v && !isSubscribed) {
              setShowMultiPaywall(true);
              return;
            }
            setMultiMode(v);
            if (!v) setActiveIds((prev) => [prev[0] ?? dbMeetings[0]?.id ?? ""]);
          }}
          onToggle={(id) => {
            if (!multiMode) {
              setActiveIds([id]);
              return;
            }
            setActiveIds((prev) => {
              if (prev.includes(id)) {
                if (prev.length === 1) return prev;
                return prev.filter((i) => i !== id);
              }
              return [...prev, id];
            });
          }}
          meetings={dbMeetings.map((m) => ({ id: m.id, title: m.title }))}
          hoveredKeyword={hoveredKeyword}
          onHoverKeyword={setHoveredKeyword}
          activeColorMaps={Object.fromEntries(
            meetings.map((m) => [m.meeting.id, m.colorMap])
          )}
          crossShared={crossShared}
          meetingPanelData={meetings}
        />

        {/* Main content area */}
        <div className="flex flex-1 min-w-0 min-h-0" style={{ height: "calc(100dvh - var(--navbar-h))", overflow: draggingMeetingIdx !== null ? "visible" : "hidden" }}>
          {isSingleMeeting ? (
            // ── Single meeting: full view with draggable physics ──
            filteredMeetings[0]?.panelData.map(({ name, color, bubbles }, idx) => (
              <BubblePanel
                key={`${activeIds[0]}-${name}`}
                meetingId={activeIds[0]}
                speakerName={name}
                color={color}
                bubbles={bubbles}
                onSharedClick={(kw) => openSharedModal(kw, activeIds[0])}
                onBubbleDoubleClick={openSingleModal}
                onCrossMeetingRightClick={openCrossMeetingRightClick}
                hoveredKeyword={hoveredKeyword}
                onHoverKeyword={setHoveredKeyword}
                panelZIndex={draggingMeetingIdx === idx ? 10 : 0}
                onSharedDragStart={(kw) => { setDraggingMeetingIdx(idx); setHoveredKeyword(kw); }}
                onSharedDragEnd={() => setDraggingMeetingIdx(null)}
                readonly={false}
              />
            ))
          ) : (
            // ── Multi-meeting: stacked meeting rows ──
            <div className="flex flex-col flex-1 min-h-0 divide-y divide-border" style={{ overflowY: draggingMeetingIdx !== null ? "visible" : "auto" }}>
              {filteredMeetings.map((m) => (
                <div
                  key={m.meeting.id}
                  className="flex flex-col min-h-0"
                  style={{ flex: "0 0 auto", height: `${Math.floor(100 / meetings.length)}vh`, overflow: draggingMeetingIdx !== null ? "visible" : "hidden" }}
                >
                  {/* Meeting row label */}
                  <div
                    className="flex items-center gap-2 px-4 py-1.5 border-b border-border shrink-0"
                    style={{ background: "hsl(var(--card))" }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Meeting
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {m.meeting.title}
                    </span>
                  </div>

                  {/* Panels side by side — drag enabled */}
                  <div className="flex flex-1 min-h-0" style={{ overflow: draggingMeetingIdx !== null ? "visible" : "hidden" }}>
                    {m.panelData.map(({ name, color, bubbles }, pIdx) => (
                      <BubblePanel
                        key={`${m.meeting.id}-${name}`}
                        meetingId={m.meeting.id}
                        speakerName={name}
                        color={color}
                        bubbles={bubbles}
                        onSharedClick={(kw) => {
                          const isCross = crossShared.has(kw);
                          openSharedModal(kw, isCross ? undefined : m.meeting.id);
                        }}
                        onBubbleDoubleClick={openSingleModal}
                        onCrossMeetingRightClick={openCrossMeetingRightClick}
                        hoveredKeyword={hoveredKeyword}
                        onHoverKeyword={setHoveredKeyword}
                        panelZIndex={draggingMeetingIdx === pIdx ? 10 : 0}
                        onSharedDragStart={(kw) => { setDraggingMeetingIdx(pIdx); setHoveredKeyword(kw); }}
                        onSharedDragEnd={() => setDraggingMeetingIdx(null)}
                        readonly={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connection beam — always-on rAF tracker */}
      <ConnectionBeam
        hoveredKeyword={hoveredKeyword}
        colorA={beamColors.colorA}
        colorB={beamColors.colorB}
      />

      {/* Merge proximity detector + ripple animation — active in all views */}
      <MergeOverlay
        hoveredKeyword={hoveredKeyword}
        colorA={beamColors.colorA}
        colorB={beamColors.colorB}
        onMerge={(kw, meetingIdA, meetingIdB) => {
          setHoveredKeyword(null);
          setDraggingMeetingIdx(null);
          const isCross = crossShared.has(kw);
          if (isCross) {
            openSharedModal(kw, undefined, meetingIdA, meetingIdB);
          } else {
            const ownerMeetingId = activeIds.find((id) => {
              const m = meetings.find((m) => m.meeting.id === id);
              return m?.panelData.some((p) => p.bubbles.some((b) => b.keyword === kw && b.isShared));
            }) ?? activeIds[0];
            openSharedModal(kw, ownerMeetingId);
          }
        }}
      />

      {modalState && (
        <SharedKeywordModal
          keyword={modalState.keyword}
          sections={modalState.sections}
          allSections={modalState.allSections}
          onClose={() => setModalState(null)}
        />
      )}

      {showMultiPaywall && (
        <PaywallModal
          type="subscription"
          onClose={() => setShowMultiPaywall(false)}
          onSuccess={() => {
            setShowMultiPaywall(false);
            setMultiMode(true);
          }}
        />
      )}

    </div>
  );
}
