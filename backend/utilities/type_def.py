from typing import TypeAlias
from pydantic import BaseModel, Field

class Original_Transcript(BaseModel):
    """
    Define the structure of a transcript segment.
    """
    speaker: str
    timestamp: float
    text: str
class Input_For_ChatGPT_Keyword_Extraction(BaseModel):
    """
    For input of ChatGPT for keyword extraction
    Convert: Original_Transcript -> Input_For_ChatGPT_Keyword_Extraction
    
    Format:
    speaker: text
    
    Example:
    Pierre Ortega: story unfolds and uh thanks to our audience uh don't forget to leave a review leave a
    Pierre Ortega: five-star rating on our show and we'll see you on the next one see you guys
    """
    text: str

class Output_For_ChatGPT_Keyword_Extraction(BaseModel):
    """
    For Output of ChatGPT for keyword extraction
    """
    keywords: list[str] = Field(default_factory=list)


class Text_Keywords(BaseModel):
    """
    To send to frontend for visualization
    """
    text : str
    keywords: list[str] = Field(default_factory=list)

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