import os
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

# 1. Define the Data Shape
class TriageReport(BaseModel):
    zone_id: str
    disaster_type: str
    severity_score: int
    resource_demands: dict[str, int]


genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# 3. Create the Agent Function
def triage_incident(raw_text: str) -> TriageReport:
    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a disaster triage expert. Extract incident details and assign a severity_score (1-100)."},
            {"role": "user", "content": raw_text},
        ],
        response_format=TriageReport
    )
    return response.choices[0].message.parsed

# 4. Test the Agent
if __name__ == "__main__":
    report = triage_incident("Bridge collapsed at Zone B. Need 3 rescue boats and 10 medical kits immediately.")
    print(f"Severity: {report.severity_score}, Demands: {report.resource_demands}")