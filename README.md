# AI Interview Preparation Chatbot 🤖🎓

An intelligent, full-stack mock interview platform. This application allows users to simulate technical and behavioral interviews, receive real-time granular feedback on correctness and clarity via Google's Gemini AI, and review a comprehensive post-interview report.

The project recently underwent a major architecture overhaul to achieve **production-grade asynchronous performance, enhanced security, and containerization.**

---

## 🏗 Architecture & Project Structure

The platform uses a decoupled client-server architecture:

### Backend (Python + FastAPI)
Located in `/backend`. Uses a modular, fully asynchronous pattern optimized for high concurrency.
*   **`app/api/routes.py`**: The REST API endpoints (`/start`, `/chat`, and `/report`). Features Server-Sent Events (SSE) for streaming AI responses.
*   **`app/core/db.py`**: PostgreSQL database initialization and asynchronous session management (`asyncpg`).
*   **`app/models` & `app/schemas`**: Strict separation between SQLAlchemy ORM models and Pydantic schemas (with strict input validation to prevent DoS attacks).
*   **`app/services/llm_service.py`**: **Core Logic.** Asynchronous AI prompting, streaming, and JSON repair, interacting with `gemini-3-flash-preview` via the `google-genai` SDK.

### Frontend (React + Vite)
Located in `/frontend`. Uses a cleanly structured component tree.
*   **`src/components/`**: Presentational React components split into domains (`/chat`, `/setup`, `/summary`).
*   **`src/hooks/useInterview.js`**: **Core Logic.** A custom React Hook that abstracts away API fetching, streaming text parsing, and state management.
*   **`src/styles/index.css`**: A premium, global styling system utilizing glassmorphism, dark mode variables, and micro-animations.

---

## 💡 Important Code Snippets

### 1. Robust Async LLM Streaming (`llm_service.py`)
To prevent the application from freezing under load, the AI service uses asynchronous generators to stream chunks to the client without blocking the worker threads.

```python
@staticmethod
async def evaluate_and_next_question_stream(domain: str, difficulty: str, history: list[dict], user_answer: str, time_spent: int = 0, hints_used: int = 0):
    # ... system prompt construction ...
    try:
        response_stream = await client.aio.models.generate_content_stream(
            model=MODEL_ID,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json"
            )
        )
        async for chunk in response_stream:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        logger.error(f"API Error during evaluate_and_next_question_stream: {e}")
```

### 2. Secure Async Database Setup (`db.py`)
The platform uses SQLAlchemy 2.0 with the `asyncpg` driver to ensure high-performance concurrent database transactions.

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args, echo=False
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False
)

async def get_db():
    async with SessionLocal() as db:
        yield db
```

### 3. Resilient JSON Parsing
LLMs occasionally hallucinate markdown blocks or trailing commas when requested to return JSON. The application uses `json_repair` to robustly catch and fix these errors, preventing silent data loss.

```python
try:
    # Use json_repair here so streaming failures resolve smoothly
    result = json_repair.loads(full_json)
    
    # Save the parsed evaluation and question directly to the database
    async with SessionLocal() as bg_db:
        # ... db commit logic ...
except Exception as e:
    logger.error(f"Error persisting stream to storage: {e}")
```

---

## 🐳 Running with Docker (Recommended)

The easiest way to run the application (FastAPI + Vite) is via Docker Compose. The database is hosted externally (e.g. Render).

1. Ensure Docker Desktop is running.
2. In the `backend` folder, duplicate `.env.example` and rename it to `.env`. Fill in your secrets:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET_KEY=a_secure_random_string

   DATABASE_URL=postgresql+asyncpg://user:password@hostname.oregon-postgres.render.com/dbname
   ```
3. From the root directory containing `docker-compose.yml`, run:
   ```bash
   docker-compose up -d --build
   ```
4. Access the application:
   - **Frontend UI**: `http://localhost:80`
   - **Backend Swagger Docs**: `http://localhost:8000/docs`

---

## 🚀 Local Development Guide (Without Docker)

You need two terminals to run this application locally without Docker.

### 1. Backend Server
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Ensure your .env file has the correct Render DATABASE_URL 
# DATABASE_URL=postgresql+asyncpg://user:password@hostname.render.com/dbname

# Run the FastAPI server in development mode
uvicorn app.main:app --reload
```
*The API will be available at `http://localhost:8000`*

### 2. Frontend React Vite Server
```bash
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
*The App will be available at `http://localhost:5173`*

---

## 🔐 Security Features
- **Strict CORS**: The API explicitly rejects cross-origin credentialed requests unless they originate from allowed domains.
- **JWT Authentication**: Secure stateless token validation using `bcrypt` and HS256 signatures.
- **Payload Constraints**: Max-length validations enforced via Pydantic on incoming prompts to prevent Token Exhaustion DoS attacks.
- **Dependency Locking**: Exact dependency versions are pinned in `requirements.txt` to prevent supply chain breaks.
