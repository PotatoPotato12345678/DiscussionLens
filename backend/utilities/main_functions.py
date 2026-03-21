
# ------------------------------------------------------------------
#
# Main functions are ONLY called inside main.py
#
# ------------------------------------------------------------------

from utilities.global_constant import (
    TRANSCRIPT_CSV_FILENAME,
    KEYWORD_EXTRACTION_MAIN_CONTEXT, 
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
    Input_For_ChatGPT_Keyword_Extraction
)


from typing import Generator, List
from collections import defaultdict
import os
from datasets import load_dataset
from openai import OpenAI
import pandas as pd

import json

class MainFunctions:
    class Transcript_Initialization:        
        @staticmethod
        def read_transcript_csv(filename=TRANSCRIPT_CSV_FILENAME) -> List[Original_Transcript]:
            df = pd.read_csv(filename)
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
                store= True,
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