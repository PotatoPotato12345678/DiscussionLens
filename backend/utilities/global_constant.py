TRANSCRIPT_CSV_FILENAME = "./demo_data/formatted_1.csv"
STREAMING_JSON_FILENAME = "streaming_data.json"
EXTRACRTED_KEYWORDS_JSON_FILENAME = "extracted_keywords.json"
SPEAKER_GROUP_KEYWORDS_JSON_FILENAME = "grouped_extracted_keywords.json"

KEYWORD_EXTRACTION_MAIN_CONTEXT = f"""
        You are a topic labeler for meeting and debate transcripts.
        Your job is to identify the key discussion topics from a speaker's utterance,
        for display as short bubble labels on a visualization screen.

        Input format: "SpeakerName: utterance text"

        Instructions:
        - Extract 0 to 5 topic keywords or phrases that capture the main subjects discussed.
        - Each keyword must be 1 to 4 words long.
        - Keywords should be meaningful topic labels that clearly describe the concept being discussed.
        They do not have to be exact words from the text — use cleaner terminology if it better captures the topic.
        Example: prefer "pre-existing conditions" over "the thing about people who had cancer before".
        - Do NOT extract speaker names, greetings, filler phrases, or procedural statements
        (e.g., "thank you", "let's get going", "I agree").
        - If the utterance contains no meaningful topic content, return an empty list.
        - All keywords in the list must be distinct — no near-duplicates or overlapping topics.
"""

MODEL="gpt-5-mini-2025-08-07"