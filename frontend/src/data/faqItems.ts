export const FAQ_ITEMS = [
  {
    q: "What are bubbles",
    a: "Bubbles are visual representations of keywords extracted from your meeting transcripts. Each bubble represents a topic that was discussed — its size reflects how much it was talked about. Bubbles are color-coded by speaker, so you can instantly see who discussed what. White-bordered bubbles indicate a keyword shared by multiple speakers within the same meeting, and gold bubbles highlight keywords that appear across different meetings.",
  },
  {
    q: "How to compare two bubbles",
    a: "Hover over a white-bordered bubble to see a connection beam linking it to matching bubbles. Drag it toward another white bubble of the same keyword until they overlap — they'll merge with a flash and open a side-by-side comparison popup.",
  },
  {
    q: "How the gold bubbles work",
    a: "Gold bubbles appear when the same keyword is discussed across multiple meetings. Hovering one fans out beams to all its matches in other meetings. Right-click a gold bubble to open a popup showing all meetings' quotes, with toggles to show or hide each meeting.",
  },
  {
    q: "How right-click works",
    a: "Right-clicking any bubble opens its detail popup. For regular bubbles, it shows your quotes. For white shared bubbles, it shows all speakers' quotes from that meeting. For gold cross-meeting bubbles, it shows every meeting's quotes with per-meeting toggle pills.",
  },
  {
    q: "What the Agreement Score means",
    a: "The Agreement Score (0–100%) estimates how aligned the speakers are on the shared topic. Green (≥ 70%) = strong alignment, Amber (40–69%) = partial overlap, Red (< 40%) = divergent views. It's based on comparing what each speaker said about the keyword.",
  },
  {
    q: 'What "Extract Insights" means',
    a: 'Clicking "Extract Insights" generates a 2-3 sentence AI summary of the shared keyword — highlighting what was agreed, disagreed, or uniquely contributed by each speaker. It synthesises all visible quotes into a single takeaway.',
  },
];
