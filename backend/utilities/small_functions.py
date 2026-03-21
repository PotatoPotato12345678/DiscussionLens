
# ------------------------------------------------------------------
#
# Small functions are ONLY called inside main_functions.py
#
# ------------------------------------------------------------------

from utilities.type_def import Original_Transcript, Input_For_ChatGPT_Keyword_Extraction
from utilities.global_constant import MODEL

import tiktoken
import re
class SmallFunctions:
    @staticmethod
    def dict_to_string(data: Original_Transcript) -> Input_For_ChatGPT_Keyword_Extraction:
        """
        Called in extract_keywords
        """
        lines = []
        speaker: str = data.speaker
        text: str = data.text
        string_output = f"{speaker}: {text}"
        return Input_For_ChatGPT_Keyword_Extraction(text=string_output)

    @staticmethod
    def count_tokens(text: str, model: str = MODEL) -> int:
        """
        Called in extract_keywords
        """
        encoding = tiktoken.encoding_for_model(model)
        tokens = encoding.encode(text)
        return len(tokens)
    
    @staticmethod
    def parse_line(line: str) -> tuple[float, str, str] | None:
        pattern = r"\[(\d+\.\d+)\]\s*([^:]+):\s*(.+)"
        match = re.match(pattern, line)

        if match:
            return (
                float(match.group(1)),  # timestamp
                match.group(2),         # speaker
                match.group(3)          # text
            )
        return None