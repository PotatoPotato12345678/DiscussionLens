from utilities.main_functions import MainFunctions
from utilities.global_constant import TRANSCRIPT_JSON_FILENAME, OVERALL_EXTRACRTED_KEYWORDS_JSON_FILENAME

import os
from dotenv import load_dotenv
import json

if __name__ == "__main__":
    # Load environment variables from .env file
    load_dotenv()

    if not os.path.exists(TRANSCRIPT_JSON_FILENAME):
        # Step 1: Read the transcript data from the online database
        data = MainFunctions.Transcript_Initialization.read_db()

        # Step 2: Save the data to a JSON file
        MainFunctions.Transcript_Initialization.save_db(data)
    else:
        print("Step 1 and Step 2 skipped.")

    # Step 3: Read the data back from the JSON file
    data = MainFunctions.Transcript_Initialization.read_transcript_json()

    if not os.path.exists(OVERALL_EXTRACRTED_KEYWORDS_JSON_FILENAME):
        # Step 4: Extract keywords using ChatGPT
        keywords = MainFunctions.Keyword_Extraction.extract_overall_keywords(data)

        # Step 5: Save the extracted keywords to a JSON file
        MainFunctions.Keyword_Extraction.save_keywords(keywords)
    else:
        print("Step 4 and Step 5 skipped.")

    print("Process completed.")
