from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
    ],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class SpeakerSection(BaseModel):
    speaker: str
    texts: List[str]


class SummarizeRequest(BaseModel):
    keyword: str
    sections: List[SpeakerSection]


class SummarizeResponse(BaseModel):
    similarities: List[str]
    differences: List[str]


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    # ─────────────────────────────────────────────────────────────────
    # TODO (RevenueCat): verify active subscription before processing.
    # Add an Authorization header on the frontend request, validate the
    # customer entitlement here, and raise HTTP 403 if not subscribed.
    # ─────────────────────────────────────────────────────────────────

    if not req.sections:
        raise HTTPException(status_code=400, detail="No sections provided.")

    speaker_lines = "\n\n".join(
        f"{s.speaker}:\n" + "\n".join(f'  - "{t}"' for t in s.texts)
        for s in req.sections
    )
    user_message = f'Topic: "{req.keyword}"\n\nSpeaker quotes:\n\n{speaker_lines}'

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        speaker_names = ", ".join(s.speaker for s in req.sections)
        return SummarizeResponse(
            similarities=[f"Both speakers addressed the topic of \"{req.keyword}\"."],
            differences=[
                f"[Demo] {speaker_names} — AI-powered insight extraction will be available once the backend is fully connected.",
            ],
        )

    client = OpenAI(api_key=api_key)

    import json as _json

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an impartial discussion analyst. "
                        "Analyze how the speakers addressed the given topic and return a JSON object with exactly two keys:\n"
                        "- \"similarities\": a list of 2-4 concise bullet points (1-2 sentences each) where the speakers agreed or held similar views.\n"
                        "- \"differences\": a list of 2-4 concise bullet points (1-2 sentences each) where the speakers disagreed or held distinct views.\n"
                        "If there is only one speaker, leave \"similarities\" as an empty list and use \"differences\" to summarise their key points.\n"
                        "Be specific, neutral, and factual. Do not include speaker names in every sentence — vary the phrasing."
                    ),
                },
                {"role": "user", "content": user_message},
            ],
            max_tokens=400,
        )
        raw = _json.loads(response.choices[0].message.content)
        similarities = [s for s in raw.get("similarities", []) if isinstance(s, str)]
        differences = [s for s in raw.get("differences", []) if isinstance(s, str)]
    except Exception:
        speaker_names = ", ".join(s.speaker for s in req.sections)
        similarities = []
        differences = [
            f"[Demo] The topic \"{req.keyword}\" was discussed by {speaker_names}. "
            "AI-powered insight extraction will be available once the backend is fully connected."
        ]

    return SummarizeResponse(similarities=similarities, differences=differences)
