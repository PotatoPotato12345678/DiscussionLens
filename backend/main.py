from utilities.main_functions import MainFunctions
from utilities.global_constant import TRANSCRIPT_JSON_FILENAME, OVERALL_EXTRACRTED_KEYWORDS_JSON_FILENAME, OVERALL_GROUPED_EXTRACTED_KEYWORDS_JSON_FILENAME

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
        # Step 4: Extract keywords for whole the discussionusing ChatGPT
        keywords = MainFunctions.Keyword_Extraction.extract_overall_keywords(data)

        # Step 5: Save the extracted overall keywords to a JSON file
        MainFunctions.Keyword_Extraction.save_overall_keywords(keywords)
    else:
        print("Step 4 and Step 5 skipped.")

    if not os.path.exists(OVERALL_GROUPED_EXTRACTED_KEYWORDS_JSON_FILENAME):
        # Step 6: Read the extracted overall keywords from the JSON file
        keywords = MainFunctions.Keyword_Extraction.read_overall_keywords()

        # Step 7: Group the overall keywords by speaker
        grouped_keywords = MainFunctions.Keyword_Extraction.group_by_speaker(keywords)

        # Step 8: Save the grouped keywords to a JSON file
        MainFunctions.Keyword_Extraction.save_overall_grouped_keywords(grouped_keywords)

    print("Process completed.")
