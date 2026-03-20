model = "gpt-5-mini-2025-08-07"
import tiktoken
from openai import OpenAI
from pydantic import BaseModel
def count_tokens(text: str, model: str = model) -> int:
    encoding = tiktoken.encoding_for_model(model)
    tokens = encoding.encode(text)
    return len(tokens)


text_input = """

"""
main_context = f"""

Task:
- Extract keywords from the given text input.

Output Format:
- a list of keywords, where each keyword is a string.
- Example:
  {[
      {
          "keyword": "keyword1",
            "items":["sentence1", "sentence2", "sentence3"]
      },{
            "keyword": "keyword2",
            "items":["sentence1", "sentence2", "sentence3"]
      }
  ]
    
  }


Instructions:

"""


print(count_tokens(main_context+text_input))
print(main_context+text_input)

from typing import List, Tuple
client = OpenAI(api_key="")
class Keywords(BaseModel):
    word: str

# Define the structure for shift willingness

class ShiftWillingness(BaseModel):
    keywords: List[Keywords]


response = client.responses.parse(
    model=model,
    input=[
        {"role": "system", "content": main_context},
        {"role": "user", "content": text_input},
    ],
    text_format=ShiftWillingness,
)

shift_schedule = response.output_parsed
print(shift_schedule)

shift_schedule.model_dump()
count_tokens(str(shift_schedule.model_dump()), model=model)