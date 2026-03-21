from utilities.main_functions import MainFunctions
from utilities.global_constant import SPEAKER_GROUP_KEYWORDS_JSON_FILENAME
from utilities.type_def import Original_Transcript, Output_For_ChatGPT_Keyword_Extraction

import os
import sys
from dotenv import load_dotenv
import time
from typing import Generator, List
import json

if __name__ == "__main__":
    # Load environment variables from .env file
    load_dotenv()

    # Step 1: Read a transcript from a CSV file
    data: List[Original_Transcript] = MainFunctions.Transcript_Initialization.read_transcript_csv()
    streamed_data_generator: Generator[Original_Transcript, None, None] = MainFunctions.Transcript_Initialization.stream_transcript(data)

    for next_streamed_item in streamed_data_generator:
        time.sleep(1)  # Simulate streaming delay

        print("----Data streamed-----")
        
        # Step 2: Save the transcript data to a JSON file
        MainFunctions.Transcript_Initialization.save_streamed_transcript_dict(next_streamed_item)
        
        # Step 4: Extract keywords for whole the discussionusing ChatGPT
        keywords: Output_For_ChatGPT_Keyword_Extraction = MainFunctions.Keyword_Extraction.extract_keywords(next_streamed_item)

        # Step 5: Save the extracted overall keywords to a JSON file
        MainFunctions.Keyword_Extraction.save_keywords(keywords)
        print("Process completed.")
