
# ------------------------------------------------------------------
#
# Main functions are ONLY called inside main.py
#
# ------------------------------------------------------------------

from utilities.global_constant import (
    TRANSCRIPT_JSON_FILENAME,
    KEYWORD_EXTRACTION_MAIN_CONTEXT, 
    MODEL, 
    OVERALL_EXTRACRTED_KEYWORDS_JSON_FILENAME,
    OVERALL_GROUPED_EXTRACTED_KEYWORDS_JSON_FILENAME,
)
from utilities.small_functions import SmallFunctions
from utilities.type_def import (
    TranscriptType, 
    Output_For_ChatGPT_Keyword_Extraction,
    GROUPED_OVERALL_EXTRACTED_KEYWORDS
)


from typing import List
from collections import defaultdict
import os
from datasets import load_dataset
from openai import OpenAI

import json

class MainFunctions:
    class Transcript_Initialization:
        @staticmethod
        def read_db() ->List[TranscriptType]:
            ds = load_dataset(
                "rchiera/podcast-transcripts",
                data_files="data/transcripts.parquet"
            )["train"]
            episode_id = ds[0]["episode_id"]
            one_episode = ds.filter(lambda x: x["episode_id"] == episode_id)

            data = []
            for row in one_episode:
                for seg in row["segments"]:
                    data.append({
                        "speaker": seg["speaker_name"],
                        "text": seg["text"],
                        "timestamp": seg["timestamp_start"]
                    })
            return data
        
        @staticmethod
        def save_db(data: List[TranscriptType], filename=TRANSCRIPT_JSON_FILENAME) -> None:
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
    
        @staticmethod
        def read_transcript_json(filename=TRANSCRIPT_JSON_FILENAME) -> List[TranscriptType]:
            with open(filename, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        
    class Keyword_Extraction:
        @staticmethod
        def extract_overall_keywords(data: List[TranscriptType]) -> Output_For_ChatGPT_Keyword_Extraction:
            model = MODEL
            text_input = SmallFunctions.json_to_string(data)
            main_context = KEYWORD_EXTRACTION_MAIN_CONTEXT

            print(f"Total tokens for main context and text input: {SmallFunctions.count_tokens(main_context+text_input)}")

            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            response = client.responses.parse(
                model=model,
                input=[
                    {"role": "system", "content": main_context},
                    {"role": "user", "content": text_input},
                ],
                text_format=Output_For_ChatGPT_Keyword_Extraction,
            )

            keywords = response.output_parsed
            keywords_dict = keywords.model_dump()

            print(f"Total tokens for extracted keywords: {SmallFunctions.count_tokens(str(keywords_dict), model=model)}")
            
            return keywords


        @staticmethod
        def save_overall_keywords(keywords: Output_For_ChatGPT_Keyword_Extraction, filename=OVERALL_EXTRACRTED_KEYWORDS_JSON_FILENAME) -> None:
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(keywords.model_dump(), f, ensure_ascii=False, indent=2)
        
        @staticmethod
        def read_overall_keywords(filename=OVERALL_EXTRACRTED_KEYWORDS_JSON_FILENAME) -> Output_For_ChatGPT_Keyword_Extraction:
            with open(filename, "r", encoding="utf-8") as f:
                data = json.load(f)
            return Output_For_ChatGPT_Keyword_Extraction.model_validate(data)
        
        @staticmethod
        def group_by_speaker(data: Output_For_ChatGPT_Keyword_Extraction) -> GROUPED_OVERALL_EXTRACTED_KEYWORDS:
            grouped_results = []

            for keyword_item in data.results:
                speakers = defaultdict(list)

                for line in keyword_item.items:
                    parsed = SmallFunctions.parse_line(line)
                    if parsed:
                        timestamp, speaker, text = parsed
                        speakers[speaker].append({
                            "timestamp": timestamp,
                            "text": text
                        })

                grouped_results.append({
                    "keyword": keyword_item.keyword,
                    "speakers": dict(speakers)
                })

            return GROUPED_OVERALL_EXTRACTED_KEYWORDS.model_validate({"results": grouped_results})
        
        @staticmethod
        def save_overall_grouped_keywords(grouped_overall_keywords: GROUPED_OVERALL_EXTRACTED_KEYWORDS, filename=OVERALL_GROUPED_EXTRACTED_KEYWORDS_JSON_FILENAME) -> None:
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(grouped_overall_keywords.model_dump(), f, ensure_ascii=False, indent=2)   