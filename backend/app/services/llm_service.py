import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# We will initialize the client. It expects GEMINI_API_KEY in the environment.
try:
    client = genai.Client()
except Exception as e:
    client = None
    print(f"Failed to initialize GenAI client: {e}. Make sure GEMINI_API_KEY is set.")

MODEL_ID = "gemini-3-flash-preview"

class LLMService:
    @staticmethod
    def generate_first_question(domain: str, difficulty: str) -> str:
        if not client:
            return f"Mock Question: What is a key concept in {domain}?"
            
        prompt = f"You are an expert technical interviewer in {domain}. Generate a {difficulty} level interview question to start the interview. Return ONLY the question text without any markdown formatting or prefix."
        try:
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"API Error during generate_first_question: {e}")
            return f"Error: The AI model is currently overloaded. Please wait a minute and try again. [Fallback: Explain the basics of {domain}.]"

    @staticmethod
    def evaluate_and_next_question(domain: str, difficulty: str, history: list[dict], user_answer: str) -> dict:
        if not client:
            return {
                "next_question": "Mock Next Question: Can you elaborate on that?",
                "evaluation": {
                    "score": 8,
                    "correctness": "Mostly correct.",
                    "completeness": "Could add more details.",
                    "clarity": "Very clear.",
                    "strengths": "Good communication.",
                    "weaknesses": "Lacked depth."
                }
            }

        system_prompt = f"""You are an expert technical interviewer conducting a {difficulty} level interview on {domain}.
The user has just provided an answer. Evaluate it based on correctness, completeness, and clarity.
Also provide the next interview question in the conversation.

You MUST return a JSON object with this exact schema:
{{
  "next_question": "<string next question>",
  "evaluation": {{
    "score": <int 0-10>,
    "correctness": "<string feedback>",
    "completeness": "<string feedback>",
    "clarity": "<string feedback>",
    "strengths": "<string>",
    "weaknesses": "<string>"
  }}
}}
"""
        
        contents = []
        for m in history:
            role = "user" if m["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m["content"])]))
            
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_answer)]))
        
        try:
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json"
                )
            )
        except Exception as e:
            print(f"API Error during evaluate_and_next_question: {e}")
            return {
                "next_question": "My AI brain just got an overload of requests from Google's servers. Could you wait a few seconds and try answering again?",
                "evaluation": {
                    "score": 0,
                    "correctness": "API Unavailable.",
                    "completeness": "The Gemini service is temporarily experiencing high demand (Error 503).",
                    "clarity": "Could not score your answer.",
                    "strengths": "N/A",
                    "weaknesses": "N/A"
                }
            }
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            print("Failed to decode JSON from LLM response:", response.text)
            return {
                "next_question": "Sorry, there was an error parsing my response. Let's move onto the next topic.",
                "evaluation": {
                    "score": 0,
                    "correctness": "Error parsing LLM response",
                    "completeness": "Error",
                    "clarity": "Error",
                    "strengths": "None",
                    "weaknesses": "None"
                }
            }

    @staticmethod
    def evaluate_and_next_question_stream(domain: str, difficulty: str, history: list[dict], user_answer: str, time_spent: int = 0, hints_used: int = 0):
        if not client:
            yield '{"next_question": "Mock streaming question?", "evaluation": {"score": 8, "correctness": "Mock.", "completeness": "Mock.", "clarity": "Mock.", "strengths": "Mock.", "weaknesses": "Mock."}}'
            return

        time_instructions = ""
        if time_spent > 0:
            if time_spent > 300:
                time_instructions = f"\n<IMPORTANT>\nThe user took {time_spent} seconds (over the 5-minute limit) to answer this question. You MUST deduct points from their evaluation score as a time penalty, and note this timing penalty explicitly in their weaknesses.</IMPORTANT>"
            else:
                time_instructions = f"\nThe user took {time_spent} seconds to answer. This is within the 5-minute acceptable limit."
                
        hint_instructions = ""
        if hints_used > 0:
            hint_instructions = f"\n<IMPORTANT>\nThe user requested {hints_used} hints to answer this question. You MUST deduct {hints_used * 1.0} points strictly from their final score, explicitly mentioning the hint penalty in their weaknesses.</IMPORTANT>"

        system_prompt = f"""You are an expert technical interviewer conducting a {difficulty} level interview on {domain}.
The user has just provided an answer. Evaluate it based on correctness, completeness, and clarity.
Also provide the next interview question in the conversation.{time_instructions}{hint_instructions}

You MUST return a JSON object with this exact schema:
{{
  "next_question": "<string next question>",
  "evaluation": {{
    "score": <int 0-10>,
    "correctness": "<string feedback>",
    "completeness": "<string feedback>",
    "clarity": "<string feedback>",
    "strengths": "<string>",
    "weaknesses": "<string>"
  }}
}}
"""
        contents = []
        for m in history:
            role = "user" if m["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m["content"])]))
            
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_answer)]))

        try:
            response_stream = client.models.generate_content_stream(
                model=MODEL_ID,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json"
                )
            )
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"API Error during evaluate_and_next_question_stream: {e}")
            error_msg = json.dumps({
                "next_question": "Error connecting to AI.",
                "evaluation": {"score": 0, "correctness": "Error", "completeness": "Error", "clarity": "Error", "strengths": "Error", "weaknesses": "Error"}
            })
            yield error_msg

    @staticmethod
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
        
        try:
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json"
                )
            )
        except Exception as e:
            print(f"API Error during generate_report: {e}")
            return {
                "total_score": 0,
                "average_score": 0.0,
                "weak_areas": "Service Unavailable",
                "strong_areas": "Service Unavailable",
                "summary": "The AI model is currently experiencing high demand. Please refresh or try again later to generate your report."
            }
        
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
            
    @staticmethod
    def generate_hint(domain: str, difficulty: str, history: list[dict], hints_used: int) -> str:
        if not client:
            return f"Mock Hint: Consider X and Y for {domain}."

        level_instruction = ""
        if hints_used == 0:
            level_instruction = "Provide a high-level conceptual nudge. DO NOT give the answer."
        elif hints_used == 1:
            level_instruction = "Provide a specific approach or structural suggestion. DO NOT write the exact code or final answer."
        else:
            level_instruction = "Provide a near-full solution walkthrough to help the user learn."

        system_prompt = f"""You are an expert technical interviewer conducting a {difficulty} level interview on {domain}.
The user is stuck and has requested a hint for the CURRENT open question.
{level_instruction}

Keep your hint concise (1-3 sentences maximum). Return ONLY the hint text. Do not return JSON.
"""
        contents = []
        for m in history:
            role = "user" if m["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=m["content"])]))

        try:
            response = client.models.generate_content(
                model=MODEL_ID,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                )
            )
            return response.text.strip()
        except Exception as e:
            print(f"API Error during generate_hint: {e}")
            return "Hint unavailable due to system overload."

