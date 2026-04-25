# AI Interview Preparation Chatbot 🤖🎓

An intelligent, full-stack mock interview platform. This application allows users to simulate technical and behavioral interviews, receive real-time granular feedback on correctness and clarity via Google's Gemini AI, and review a comprehensive post-interview report.

---

## 🏗 Architecture & Project Structure

The project was recently upgraded to a **production-grade decoupled architecture**:

### Backend (Python + FastAPI)
Located in `/backend`. Uses a modular pattern optimized for scalability.
*   **`app/api/routes.py`**: The REST API endpoints (`/start`, `/chat`, and `/report`).
*   **`app/core/db.py`**: SQLite database initialization and session management.
*   **`app/models` & `app/schemas`**: Strict separation between SQLAlchemy ORM models (database) and Pydantic schemas (JSON validation).
*   **`app/services/llm_service.py`**: **Core Logic.** All AI prompting, interactions, and fallback error handling occur here, interacting with `gemini-3-flash-preview` via the `google-genai` SDK.

### Frontend (React + Vite)
Located in `/frontend`. Uses a cleanly structured component tree.
*   **`src/components/`**: Presentational React components split into domains (`/chat`, `/setup`, `/summary`).
*   **`src/hooks/useInterview.js`**: **Core Logic.** A custom React Hook that abstracts away all API fetching and state management from the UI.
*   **`src/styles/index.css`**: A premium, global styling system utilizing glassmorphism, dark mode variables, and micro-animations.

---

## 🚀 Local Development Guide

You need two terminals to run this application locally.

### 1. Backend Server
```bash
cd backend

# Create environment variables file
# Add: GEMINI_API_KEY="your_actual_api_key_here"
# Add: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/interview_db"
copy .env.example .env

# Start the PostgreSQL Database Server via Docker
docker-compose up -d

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server in development mode (auto-reload on save)
uvicorn app.main:app --reload
```
*The API will be available at `http://localhost:8000`*

### 2. Frontend React Vite Server
```bash
cd frontend

# Install dependencies Node Modules
npm install

# Start the Vite development server
npm run dev
```
*The App will be available at `http://localhost:5173`*

---

## 🛠 Making Changes in the Future

The architecture is designed to be highly extensible. Here is how you should approach modifying the app:

### Changing the Frontend UI
Because all app state logic relies on the `useInterview.js` hook, you can completely gut and redesign the UI without breaking the application!
1.  Navigate to `frontend/src/components/`. 
2.  You can redesign `SetupScreen.jsx` or `ChatInterface.jsx`. 
3.  As long as your new components call `sendMessage(text)` or `startInterview(domain, difficulty)` from the hook, the app will continue to work perfectly.
4.  **Styling**: If you want to switch to a library like TailwindCSS or Material-UI later, simply delete `/styles/index.css`, replace it with your library imports, and update the `className`s in the components.

### Modifying the AI Prompts
If the AI is grading too harshly, or you want to add new evaluation metrics (e.g. Tone, Speed):
1.  Open `backend/app/schemas/api_schemas.py` and add the new metric field to `Evaluation`.
2.  Open `backend/app/services/llm_service.py`. 
3.  Modify the `system_prompt` strings to instruct the AI on exactly how to grade the new metric.

---

## ☁️ Cloud Deployment Guide

The code includes `Dockerfile` implementations for both the frontend and backend, making it natively compatible with modern cloud hosts.

### Deploying the Backend
Since the backend uses an SQLite file natively, for a true scalable production environment you may want to swap the `SQLALCHEMY_DATABASE_URL` in `app/core/db.py` to a managed PostgreSQL database URL (like Supabase or AWS RDS).
*   **Google Cloud Run / Render / Railway**: 
    1. Connect your GitHub repository to the service.
    2. Set the Root Directory to `/backend`.
    3. The service will automatically detect the `Dockerfile` and build the container.
    4. **Crucial**: Make sure you inject your `GEMINI_API_KEY` into the deployment platform's Environment Variables settings!

### Deploying the Frontend
The frontend is built using Vite, making it perfect for static site hosts.
*   **Vercel / Netlify**: 
    1. Connect your repository.
    2. Set the Framework Preset to `Vite`.
    3. Set the Root Directory to `/frontend`.
    4. **Important**: Before deploying, you MUST change the `API_BASE` hardcoded variable in `frontend/src/services/api.js` from `localhost:8000` to the actual public URL of your newly deployed Backend!

---

*Built with FastAPI, React, and Google Gemini Integration.*
