# Pet Connect AI Assistant (Agno)

Python service that powers in-app FAQ answers with Agno Knowledge + guardrails.

## Layout

```
ai_assistant/
  main.py                 FastAPI (/chat, /intent, /health)
  agent/
    assistant.py          Agno Agent wiring
    guardrails.py         Prompt-injection + scope guardrails
    intent.py             Query scraping + intent match
  knowledge/
    loader.py             Loads markdown KBs into Chroma
    content/
      greetings.md
      general_faq.md
      app_features.md
      dogs/breeds.md
      cats/breeds.md
```

## Run

```bash
cd backend/ai_assistant
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # set GOOGLE_API_KEY (Gemini)
uvicorn main:app --reload --port 8787
```

Point the Expo app at the API with `EXPO_PUBLIC_AI_API_URL` (default `http://localhost:8787`).
On a physical device, use your machine's LAN IP instead of localhost.

Uses **Gemini** (`GOOGLE_API_KEY`) for both chat and embeddings — no OpenAI key needed.

## Behaviour

1. User text is scraped/normalised (typos, casing).
2. Intent is matched to `greeting | app_faq | dog_breed | cat_breed | out_of_scope`.
3. Guardrails block jailbreaks and off-topic questions.
4. Agno searches the combined knowledge base and replies in-scope only.

The mobile app also ships a local KB fallback so chat works when this service is offline.
