from utilities.main_functions import MainFunctions
from utilities.global_constant import TRANSCRIPT_CSV_DIR
from utilities.type_def import Original_Transcript, Output_For_ChatGPT_Keyword_Extraction
from utilities.supabase_client import get_supabase_client

import os
import glob
from dotenv import load_dotenv
import time
from typing import Generator, List
from openai import OpenAI

if __name__ == "__main__":
    load_dotenv()

    supabase = get_supabase_client()

    csv_files = sorted(glob.glob(os.path.join(TRANSCRIPT_CSV_DIR, "*.csv")))

    if not csv_files:
        print(f"No CSV files found in {TRANSCRIPT_CSV_DIR}")
        exit(1)

    for csv_path in csv_files:
        meeting_title = os.path.splitext(os.path.basename(csv_path))[0]
        source_file = os.path.basename(csv_path)

        print(f"\n=== Processing: {source_file} ===")

        meeting_id = MainFunctions.Supabase_Writer.upsert_meeting(supabase, meeting_title, source_file)

        data: List[Original_Transcript] = MainFunctions.Transcript_Initialization.read_transcript_csv(csv_path)
        streamed_data_generator: Generator[Original_Transcript, None, None] = \
            MainFunctions.Transcript_Initialization.stream_transcript(data)

        for next_streamed_item in streamed_data_generator:
            time.sleep(1)

            print("----Data streamed-----")

            MainFunctions.Transcript_Initialization.save_streamed_transcript_dict(next_streamed_item)

            keywords: Output_For_ChatGPT_Keyword_Extraction = \
                MainFunctions.Keyword_Extraction.extract_keywords(next_streamed_item)

            MainFunctions.Keyword_Extraction.save_keywords(keywords)

            MainFunctions.Supabase_Writer.write_keyword_mentions(
                supabase, meeting_id, next_streamed_item, keywords
            )

            print("Row processed.")

        print(f"Consolidating keywords for '{meeting_title}'...")
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        MainFunctions.Keyword_Extraction.consolidate_keywords(openai_client, supabase, meeting_id)
        print(f"=== Done: {source_file} ===")

    print("\n=== All meetings processed. ===")
