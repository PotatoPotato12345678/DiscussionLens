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
    summary: str


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
            summary=(
                f"[Demo] The topic \"{req.keyword}\" was discussed by {speaker_names}. "
                "AI-powered insight extraction will be available once the backend is fully connected. "
                "This is a placeholder summary shown in sandbox mode."
            )
        )

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an impartial discussion analyst. "
                        "Write a concise 2-3 sentence unbiased summary of how the speakers addressed the given topic. "
                        "Highlight agreements, disagreements, and unique perspectives. Be neutral and factual."
                    ),
                },
                {"role": "user", "content": user_message},
            ],
            max_tokens=180,
        )
        summary = response.choices[0].message.content.strip()
    except Exception:
        speaker_names = ", ".join(s.speaker for s in req.sections)
        summary = (
            f"[Demo] The topic \"{req.keyword}\" was discussed by {speaker_names}. "
            "AI-powered insight extraction will be available once the backend is fully connected."
        )

    return SummarizeResponse(summary=summary)
