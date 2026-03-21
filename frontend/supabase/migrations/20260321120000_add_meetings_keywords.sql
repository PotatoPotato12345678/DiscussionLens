-- ============================================================
-- Table: meetings
-- One row per processed CSV file / simulated meeting
-- ============================================================
CREATE TABLE public.meetings (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  source_file TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT meetings_source_file_key UNIQUE (source_file)
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_select_anon"
  ON public.meetings FOR SELECT
  USING (true);

CREATE POLICY "meetings_insert_service"
  ON public.meetings FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Table: keyword_mentions
-- One row per (meeting, keyword, speaker, timestamp) occurrence
-- ============================================================
CREATE TABLE public.keyword_mentions (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id  UUID        NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  keyword     TEXT        NOT NULL,
  speaker     TEXT        NOT NULL,
  timestamp   FLOAT8      NOT NULL,
  text        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.keyword_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "keyword_mentions_select_anon"
  ON public.keyword_mentions FOR SELECT
  USING (true);

CREATE POLICY "keyword_mentions_insert_service"
  ON public.keyword_mentions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "keyword_mentions_delete_service"
  ON public.keyword_mentions FOR DELETE
  USING (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_keyword_mentions_meeting_id
  ON public.keyword_mentions (meeting_id);

CREATE INDEX idx_keyword_mentions_meeting_keyword
  ON public.keyword_mentions (meeting_id, keyword);
