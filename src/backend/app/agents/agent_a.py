"""
Agent A — Ingestion & Prioritization
Uses Google Gemini API (new google.genai SDK) to extract structured
disaster data from raw field reports.
Falls back to rule-based extraction if API fails.
"""
import json
from app.core.config import settings

SYSTEM_PROMPT = """You are an AI disaster-relief intelligence agent. Given a raw field report about a disaster, extract the following structured JSON. Be precise and conservative — only include what the report supports.

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "location": {"lat": <float>, "lng": <float>, "name": "<string>"},
  "disaster_type": "<flood|earthquake|fire|landslide|hurricane|tsunami|other>",
  "population_affected_est": <integer>,
  "casualties": <integer>,
  "needs": [{"type": "<medical|shelter|food|rescue|water>", "urgency": "<critical|high|medium|low>"}],
  "severity_score": <integer 0-100>,
  "priority_tier": "<Critical|High|Medium|Low>",
  "source_confidence": <float 0.0-1.0>
}

Scoring rubric for severity_score:
- casualties > 10 OR population > 10000 → 80-100 (Critical)
- casualties > 0 OR population > 3000 → 60-79 (High)
- population > 500 → 40-59 (Medium)
- else → 20-39 (Low)

If location coordinates cannot be determined, estimate based on the place name.
If population/casualties are not mentioned, estimate conservatively.
"""


async def process_report_with_agent_a(raw_text: str, report_id: str) -> dict:
    """
    Process a raw disaster report through Gemini API for structured extraction.
    Falls back to rule-based extraction if API fails.
    """
    print(f"🤖 [Agent A] Processing report ID: {report_id}")
    print(f"📝 Raw text: {raw_text[:200]}...")

    if settings.GEMINI_API_KEY:
        try:
            return await _gemini_extract(raw_text, report_id)
        except Exception as e:
            print(f"⚠️  [Agent A] Gemini API failed: {e}. Falling back to rule-based extraction.")

    return _fallback_extract(raw_text, report_id)


async def _gemini_extract(raw_text: str, report_id: str) -> dict:
    """Call Gemini API via the new google.genai SDK."""
    from google import genai

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"{SYSTEM_PROMPT}\n\n--- RAW REPORT ---\n{raw_text}\n--- END REPORT ---"

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    response_text = response.text.strip()
    # Strip markdown code fence if present
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        response_text = "\n".join(lines[1:])
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

    parsed = json.loads(response_text)

    required = ["location", "disaster_type", "severity_score", "priority_tier", "needs"]
    for field in required:
        if field not in parsed:
            raise ValueError(f"Gemini response missing required field: {field}")

    parsed.setdefault("population_affected_est", 0)
    parsed.setdefault("casualties", 0)
    parsed.setdefault("source_confidence", 0.75)
    parsed["source_refs"] = [report_id]

    print(f"✅ [Agent A] Gemini extraction — severity: {parsed['severity_score']}, tier: {parsed['priority_tier']}")
    return parsed


def _fallback_extract(raw_text: str, report_id: str) -> dict:
    """Simple rule-based fallback when Gemini API is unavailable."""
    text_lower = raw_text.lower()

    disaster_type = "other"
    for dt in ["flood", "earthquake", "fire", "landslide", "hurricane", "tsunami"]:
        if dt in text_lower:
            disaster_type = dt
            break

    severity = 50
    priority = "Medium"
    if any(w in text_lower for w in ["critical", "urgent", "severe", "catastrophic", "devastating"]):
        severity = 85
        priority = "Critical"
    elif any(w in text_lower for w in ["major", "significant", "serious", "heavy"]):
        severity = 70
        priority = "High"
    elif any(w in text_lower for w in ["minor", "slight", "minimal"]):
        severity = 30
        priority = "Low"

    needs = []
    need_map = {
        "medical": "medical", "hospital": "medical", "doctor": "medical",
        "shelter": "shelter", "housing": "shelter", "tent": "shelter",
        "food": "food", "hunger": "food", "ration": "food",
        "rescue": "rescue", "trapped": "rescue", "missing": "rescue",
        "water": "water", "drinking": "water", "dehydrat": "water"
    }
    detected_needs: set = set()
    for keyword, need_type in need_map.items():
        if keyword in text_lower and need_type not in detected_needs:
            detected_needs.add(need_type)
            urgency = "critical" if severity >= 80 else "high" if severity >= 60 else "medium"
            needs.append({"type": need_type, "urgency": urgency})

    if not needs:
        needs = [{"type": "rescue", "urgency": "high"}]

    return {
        "location": {"lat": 20.5937, "lng": 78.9629, "name": raw_text[:60].strip()},
        "disaster_type": disaster_type,
        "population_affected_est": 1000,
        "casualties": 0,
        "needs": needs,
        "severity_score": severity,
        "priority_tier": priority,
        "source_confidence": 0.6,
        "source_refs": [report_id],
    }