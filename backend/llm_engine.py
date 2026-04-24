import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# initialize the client. It expects GEMINI_API_KEY in the environment.
# If not present, it will throw an error, which we should catch in main.py to give a nice error message if needed.
try:
    client = genai.Client()
except Exception as e:
    client = None
    print(f"Failed to initialize GenAI client: {e}. Make sure GEMINI_API_KEY is set.")

MODEL_ID = "gemini-3-flash-preview"

def generate_first_question(domain: str, difficulty: str) -> str:
    if not client:
        return "Mock Question: What is a binary search tree?"
        
    prompt = f"You are an expert technical interviewer in {domain}. Generate a {difficulty} level interview question to start the interview. Return ONLY the question text without any markdown formatting or prefix."
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt
    )
    return response.text.strip()

def evaluate_and_next_question(domain: str, difficulty: str, history: list[dict], user_answer: str) -> dict:
    if not client:
        return {
            "evaluation": {
                "score": 8,
                "correctness": "Mostly correct.",
                "completeness": "Could add more details.",
                "clarity": "Very clear.",
                "strengths": "Good communication.",
                "weaknesses": "Lacked depth."
            },
            "next_question": "Mock Next Question: How do you implement load balancing?"
        }

    system_prompt = f"""You are an expert technical interviewer conducting a {difficulty} level interview on {domain}.
The user has just provided an answer. Evaluate it based on correctness, completeness, and clarity.
Also provide the next interview question in the conversation.

You MUST return a JSON object with this exact schema:
{{
  "evaluation": {{
    "score": <int 0-10>,
    "correctness": "<string feedback>",
    "completeness": "<string feedback>",
    "clarity": "<string feedback>",
    "strengths": "<string>",
    "weaknesses": "<string>"
  }},
  "next_question": "<string next question>"
}}
"""
    
    contents = []
    # history contains dicts with {"role": "user"|"assistant", "content": "..."}
    for m in history:
        # GenAI mapping: "assistant" -> "model"
        role = "user" if m["role"] == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m["content"])]))
        
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_answer)]))
    
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json"
        )
    )
    
    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        print("Failed to decode JSON from LLM response:", response.text)
        return {
            "evaluation": {
                "score": 0,
                "correctness": "Error parsing LLM response",
                "completeness": "Error",
                "clarity": "Error",
                "strengths": "None",
                "weaknesses": "None"
            },
            "next_question": "Sorry, there was an error parsing the AI response. Let's move to the next topic. What is polymorphism?"
        }

def generate_report(domain: str, difficulty: str, history: list[dict], all_evals: list[dict]) -> dict:
    if not client:
        return {
            "total_score": 80,
            "average_score": 8.0,
            "weak_areas": "Mock weak areas",
            "strong_areas": "Mock strong areas",
            "summary": "Mock summary"
        }

    system_prompt = f"""You are an expert technical interviewer. The interview on {domain} ({difficulty} level) has concluded.
Generate a final report summarizing the candidate's performance based on their answers and the provided evaluations.

You MUST return a JSON object with this exact schema:
{{
  "total_score": <int 0-100 representing overall performance>,
  "average_score": <float 0-10>,
  "weak_areas": "<string summarizing areas to improve>",
  "strong_areas": "<string summarizing areas they did well>",
  "summary": "<string paragraph of overall feedback>"
}}
"""
    
    evals_text = json.dumps(all_evals, indent=2)
    prompt = f"Here are the chronological evaluations of the candidate's answers:\n{evals_text}\n\nPlease generate the final report JSON based on these."
    
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json"
        )
    )
    
    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        return {
            "total_score": 0,
            "average_score": 0.0,
            "weak_areas": "Error",
            "strong_areas": "Error",
            "summary": "Failed to generate report JSON."
        }
