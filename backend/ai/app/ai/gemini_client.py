import time
from google import genai
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)


async def ask_gemini(prompt: str, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            return response.text
        except Exception as e:
            if "429" in str(e):
                wait = (attempt + 1) * 5
                print(f"⏳ Rate limit, {wait} sec wait... (attempt {attempt+1}/{retries})")
                time.sleep(wait)
            else:
                return f"AI Error: {str(e)}"
    return "AI Error: Quota exceeded, please try again later."


async def ask_gemini_json(prompt: str) -> str:
    full_prompt = prompt + "\n\nIMPORTANT: Return ONLY valid JSON. No explanation, no markdown, no backticks."
    return await ask_gemini(full_prompt)