from typing import TypeAlias
from pydantic import BaseModel, Field

class TranscriptType(BaseModel):
    """
    Define the structure of a transcript segment.
    """
    speaker: str
    text: str
    timestamp: float

class Input_For_ChatGPT_Keyword_Extraction(BaseModel):
    """
    For input of ChatGPT for keyword extraction
    Convert: List[TranscriptType] -> Input_For_ChatGPT_Keyword_Extraction
    
    Format:
    [timestamp] speaker: text
    
    Example:
    [4238.88] Pierre Ortega: story unfolds and uh thanks to our audience uh don't forget to leave a review leave a
    [4244.6] Pierre Ortega: five-star rating on our show and we'll see you on the next one see you guys
    """
    text:str

class Output_For_ChatGPT_Keyword_Extraction(BaseModel):
    """
    For Output of ChatGPT for keyword extraction
    """
    class Keyword_Extraction_Item(BaseModel):
        keyword: str
        items: list[str] = Field(default_factory=list)

    results: list[Keyword_Extraction_Item] = Field(default_factory=list)


class GROUPED_OVERALL_EXTRACTED_KEYWORDS(BaseModel):
    """
    For Output of ChatGPT for keyword extraction
    """
    class Grouped_Keyword_Extraction_Item(BaseModel):
        class LineItem(BaseModel):
            timestamp: float
            text: str
        
        keyword: str
        speakers: dict[str, list[LineItem]] = Field(default_factory=dict)

    results: list[Grouped_Keyword_Extraction_Item] = Field(default_factory=list)