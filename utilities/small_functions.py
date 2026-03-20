
# ------------------------------------------------------------------
#
# Small functions are ONLY called inside main_functions.py
#
# ------------------------------------------------------------------

from utilities.type_def import TranscriptType, Input_For_ChatGPT_Keyword_Extraction
from utilities.global_constant import MODEL

from typing import List
import tiktoken

class SmallFunctions:
    @staticmethod
    def json_to_string(data: List[TranscriptType]) -> Input_For_ChatGPT_Keyword_Extraction:
        """
        Called in extract_overall_keywords
        """
        lines = []
        for item in data:
            timestamp = round(item["timestamp"], 2)
            speaker = item["speaker"]
            text = item["text"]
            lines.append(f"[{timestamp}] {speaker}: {text}")
        return "\n".join(lines)

    @staticmethod
    def count_tokens(text: str, model: str = MODEL) -> int:
        """
        Called in extract_overall_keywords
        """
        encoding = tiktoken.encoding_for_model(model)
        tokens = encoding.encode(text)
        return len(tokens)