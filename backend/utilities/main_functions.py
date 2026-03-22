
# ------------------------------------------------------------------
#
# Main functions are ONLY called inside main.py
#
# ------------------------------------------------------------------

from utilities.global_constant import (
    TRANSCRIPT_CSV_DIR,
    KEYWORD_EXTRACTION_MAIN_CONTEXT,
    KEYWORD_CONSOLIDATION_CONTEXT,
    MODEL,
    EXTRACRTED_KEYWORDS_JSON_FILENAME,
    SPEAKER_GROUP_KEYWORDS_JSON_FILENAME,
    STREAMING_JSON_FILENAME,
)
from utilities.small_functions import SmallFunctions
from utilities.type_def import (
    Original_Transcript,
    Output_For_ChatGPT_Keyword_Extraction,
    GROUPED_OVERALL_EXTRACTED_KEYWORDS,
    Input_For_ChatGPT_Keyword_Extraction,
    KeywordConsolidationOutput,
    KeywordMapping,
)


from typing import Generator, List
from collections import defaultdict
import os
from openai import OpenAI
import pandas as pd

import json

class MainFunctions:
    class Transcript_Initialization:
        @staticmethod
        def read_transcript_csv(filename: str) -> List[Original_Transcript]:
            df = pd.read_csv(filename)

            def parse_minute(val) -> float:
                try:
                    parts = str(val).split(":")
                    if len(parts) == 2:
                        return int(parts[0]) * 60 + float(parts[1])
                    return float(val)
                except (ValueError, AttributeError):
                    return 0.0

            df["timestamp"] = df["minute"].apply(parse_minute)
            df = df.drop(columns=["minute"])
            return [Original_Transcript(**row) for _, row in df.iterrows()]

        @staticmethod
        def stream_transcript(df: List[Original_Transcript]) -> Generator[Original_Transcript, None, None]:
            for item in df:
                yield item

        @staticmethod
        def save_streamed_transcript_dict(data: Original_Transcript, filename=STREAMING_JSON_FILENAME) -> None:
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(data.model_dump(), f, ensure_ascii=False, indent=2)

        @staticmethod
        def read_streamed_transcript_dict(filename=STREAMING_JSON_FILENAME) -> Original_Transcript:
            with open(filename, "r", encoding="utf-8") as f:
                data = json.load(f)
            return Original_Transcript.model_validate(data)

    class Keyword_Extraction:
        @staticmethod
        def extract_keywords(data: Original_Transcript) -> Output_For_ChatGPT_Keyword_Extraction:
            model = MODEL
            text_input: Input_For_ChatGPT_Keyword_Extraction = SmallFunctions.dict_to_string(data)
            main_context: str = KEYWORD_EXTRACTION_MAIN_CONTEXT

            print(f"Total tokens for main context and text input: {SmallFunctions.count_tokens(main_context+text_input.text)}")

            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            response = client.responses.parse(
                model=model,
                reasoning={"effort":"low"},
                store=True,
                input=[
                    {"role": "system", "content": main_context},
                    {"role": "user", "content": text_input.text},
                ],
                text_format=Output_For_ChatGPT_Keyword_Extraction,
            )

            keywords = response.output_parsed
            keywords_dict = keywords.model_dump()

            print(f"Total tokens for extracted keywords: {SmallFunctions.count_tokens(str(keywords_dict), model=model)}")

            return Output_For_ChatGPT_Keyword_Extraction.model_validate(keywords_dict)

        @staticmethod
        def save_keywords(keywords: Output_For_ChatGPT_Keyword_Extraction, filename=EXTRACRTED_KEYWORDS_JSON_FILENAME) -> None:
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(keywords.model_dump(), f, ensure_ascii=False, indent=2)

        @staticmethod
        def consolidate_keywords(openai_client, supabase_client, meeting_id: str) -> None:
            """
            After all rows for a meeting are processed, fetch every unique keyword,
            ask GPT to group synonyms into canonical labels, then batch-update the DB.
            """
            from collections import defaultdict

            result = (
                supabase_client.table("keyword_mentions")
                .select("keyword")
                .eq("meeting_id", meeting_id)
                .execute()
            )
            unique_keywords = list({row["keyword"] for row in (result.data or [])})

            if not unique_keywords:
                return

            print(f"Consolidating {len(unique_keywords)} unique keywords...")

            keyword_list = "\n".join(f"- {kw}" for kw in unique_keywords)
            response = openai_client.responses.parse(
                model=MODEL,
                input=[
                    {"role": "system", "content": KEYWORD_CONSOLIDATION_CONTEXT},
                    {"role": "user", "content": keyword_list},
                ],
                text_format=KeywordConsolidationOutput,
            )
            canonical_to_originals: dict[str, list[str]] = defaultdict(list)
            for item in response.output_parsed.mapping:
                if item.original != item.canonical:
                    canonical_to_originals[item.canonical].append(item.original)

            for canonical, originals in canonical_to_originals.items():
                (
                    supabase_client.table("keyword_mentions")
                    .update({"keyword": canonical})
                    .eq("meeting_id", meeting_id)
                    .in_("keyword", originals)
                    .execute()
                )
                print(f"  Merged {originals} → '{canonical}'")

    class Supabase_Writer:
        @staticmethod
        def upsert_meeting(client, title: str, source_file: str) -> str:
            """
            Insert or retrieve a meeting row by source_file.
            On re-run: clears existing keyword_mentions for clean reinsert.
            Returns the meeting UUID.
            """
            result = (
                client.table("meetings")
                .select("id")
                .eq("source_file", source_file)
                .maybe_single()
                .execute()
            )

            if result is not None and result.data:
                meeting_id = result.data["id"]
                client.table("keyword_mentions").delete().eq("meeting_id", meeting_id).execute()
                print(f"Re-using existing meeting '{title}' ({meeting_id}). Cleared old mentions.")
                return meeting_id

            insert_result = (
                client.table("meetings")
                .insert({"title": title, "source_file": source_file})
                .execute()
            )
            meeting_id = insert_result.data[0]["id"]
            print(f"Created new meeting '{title}' ({meeting_id}).")
            return meeting_id

        @staticmethod
        def write_keyword_mentions(
            client,
            meeting_id: str,
            row: Original_Transcript,
            keywords: Output_For_ChatGPT_Keyword_Extraction,
        ) -> None:
            """
            Insert one keyword_mentions row per extracted keyword for this transcript row.
            """
            rows = [
                {
                    "meeting_id": meeting_id,
                    "keyword": kw,
                    "speaker": row.speaker,
                    "timestamp": row.timestamp,
                    "text": row.text,
                }
                for kw in keywords.keywords
            ]
            if rows:
                client.table("keyword_mentions").insert(rows).execute()
