import { mindMapData } from "@/data/mindMapData";
import { mindMapData2 } from "@/data/mindMapData2";
import { mindMapData3 } from "@/data/mindMapData3";
import { supabase } from "@/integrations/supabase/client";

export const SPEAKER_COLORS = ["#3b82f6", "#f97316", "#22c55e", "#e879f9"];

// Static fallback data for offline / dev use
export const STATIC_MEETINGS = [
  { id: "m1", title: "Nakamoto Investment Deep Dive", data: mindMapData },
  { id: "m2", title: mindMapData2.meetingTitle, data: mindMapData2 },
  { id: "m3", title: mindMapData3.meetingTitle, data: mindMapData3 },
] as const;

export type MeetingId = string;

// ─── Core data types ─────────────────────────────────────────────────────────

export type MentionEntry = { timestamp: number; text: string };
export type SpeakerMentions = Record<string, MentionEntry[]>;

export type MeetingData = {
  meetingTitle: string;
  results: Array<{
    keyword: string;
    speakers: SpeakerMentions;
  }>;
};

export type DbMeeting = {
  id: string;
  title: string;
  source_file: string;
  created_at: string;
};

export type LoadedMeeting = {
  id: string;
  title: string;
  data: MeetingData;
};

// ─── Supabase fetch functions ─────────────────────────────────────────────────

export async function fetchMeetings(): Promise<DbMeeting[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("id, title, source_file, created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchMeetingData(meetingId: string): Promise<MeetingData> {
  const { data: meetingRow, error: mErr } = await supabase
    .from("meetings")
    .select("title")
    .eq("id", meetingId)
    .single();

  if (mErr) throw new Error(mErr.message);

  const { data: mentions, error: kErr } = await supabase
    .from("keyword_mentions")
    .select("keyword, speaker, timestamp, text")
    .eq("meeting_id", meetingId)
    .order("timestamp", { ascending: true });

  if (kErr) throw new Error(kErr.message);

  return transformMentionsToMeetingData(meetingRow.title, mentions ?? []);
}

export function transformMentionsToMeetingData(
  title: string,
  mentions: { keyword: string; speaker: string; timestamp: number; text: string }[]
): MeetingData {
  const keywordMap = new Map<string, Map<string, MentionEntry[]>>();

  for (const mention of mentions) {
    if (!keywordMap.has(mention.keyword)) {
      keywordMap.set(mention.keyword, new Map());
    }
    const speakerMap = keywordMap.get(mention.keyword)!;
    if (!speakerMap.has(mention.speaker)) {
      speakerMap.set(mention.speaker, []);
    }
    speakerMap.get(mention.speaker)!.push({
      timestamp: mention.timestamp,
      text: mention.text,
    });
  }

  const results = Array.from(keywordMap.entries()).map(([keyword, speakerMap]) => ({
    keyword,
    speakers: Object.fromEntries(speakerMap.entries()),
  }));

  return { meetingTitle: title, results };
}

// ─── Utility functions (work on data passed as arguments) ────────────────────

/** Collect all unique speaker names in a dataset, preserving first-seen order */
export function detectSpeakers(data: { results: readonly { keyword: string; speakers: Record<string, unknown> }[] }): string[] {
  const seen = new Set<string>();
  for (const result of data.results) {
    for (const name of Object.keys(result.speakers)) {
      seen.add(name);
    }
  }
  return Array.from(seen);
}

/** Map speaker name → hex color. Offset by a base index to avoid color collisions across meetings. */
export function buildSpeakerColorMap(speakers: string[], colorOffset = 0): Record<string, string> {
  return Object.fromEntries(speakers.map((name, i) => [name, SPEAKER_COLORS[(i + colorOffset) % SPEAKER_COLORS.length]]));
}

/** Keywords spoken by 2+ speakers within a dataset */
export function sharedKeywords(data: { results: readonly { keyword: string; speakers: Record<string, unknown> }[] }): Set<string> {
  return new Set(
    data.results
      .filter((r) => Object.keys(r.speakers).length > 1)
      .map((r) => r.keyword)
  );
}

/** All keywords a speaker has mentioned in a dataset, with their mention count */
export function speakerBubbles(
  data: { results: readonly { keyword: string; speakers: Record<string, unknown> }[] },
  speakerName: string
): Array<{ keyword: string; count: number; texts: string[] }> {
  return data.results
    .filter((r) => speakerName in r.speakers)
    .map((r) => {
      const sp = r.speakers as unknown as SpeakerMentions;
      return {
        keyword: r.keyword,
        count: sp[speakerName].length,
        texts: sp[speakerName].map((e) => e.text),
      };
    });
}

/** Full data for a shared keyword modal within a single meeting */
export function sharedKeywordData(
  data: { results: readonly { keyword: string; speakers: Record<string, unknown> }[] },
  keyword: string
): {
  keyword: string;
  bySpeaker: Array<{ speaker: string; texts: string[] }>;
} | null {
  const result = data.results.find((r) => r.keyword === keyword);
  if (!result) return null;
  const sp = result.speakers as unknown as SpeakerMentions;
  return {
    keyword,
    bySpeaker: Object.entries(sp).map(([speaker, entries]) => ({
      speaker,
      texts: entries.map((e) => e.text),
    })),
  };
}

/** Find keywords that appear across multiple meetings (cross-meeting shared keywords) */
export function crossMeetingKeywords(
  meetingIds: MeetingId[],
  meetings: LoadedMeeting[]
): Set<string> {
  const filtered = meetings.filter((m) => meetingIds.includes(m.id));
  const keywordsByMeeting = filtered.map((m) =>
    new Set(m.data.results.map((r) => r.keyword))
  );
  if (keywordsByMeeting.length < 2) return new Set();

  const [first, ...rest] = keywordsByMeeting;
  const shared = new Set<string>();
  for (const kw of first) {
    if (rest.every((s) => s.has(kw))) shared.add(kw);
  }
  return shared;
}

/** Build per-meeting panel data (speakers + bubbles) */
export function buildMeetingPanelData(
  meetingId: MeetingId,
  colorOffset: number,
  crossMeetingShared: Set<string>,
  meetings: LoadedMeeting[]
) {
  const meeting = meetings.find((m) => m.id === meetingId)!;
  const speakers = detectSpeakers(meeting.data as Parameters<typeof detectSpeakers>[0]);
  const colorMap = buildSpeakerColorMap(speakers, colorOffset);
  const withinShared = sharedKeywords(meeting.data as Parameters<typeof sharedKeywords>[0]);

  const panelData = speakers.map((name) => ({
    name,
    color: colorMap[name],
    bubbles: speakerBubbles(meeting.data as Parameters<typeof speakerBubbles>[0], name).map((b) => ({
      ...b,
      isShared: withinShared.has(b.keyword),
      isCrossMeeting: crossMeetingShared.has(b.keyword),
    })),
  }));

  return { meeting, speakers, colorMap, withinShared, panelData };
}
