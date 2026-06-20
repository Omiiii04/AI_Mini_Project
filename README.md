# AI Interview Preparation Chatbot

This is a full-stack mock interview application. You can choose an interview topic and difficulty level, answer questions in a chat interface, ask for hints, and receive feedback after each answer. At the end of the interview, the application creates a performance report that can be downloaded as a PDF.

The application uses Google Gemini to generate questions and feedback. If no Gemini API key is provided, the backend returns mock responses so the basic flow can still be tested.

## What you can do

- Create an account and sign in
- Choose an interview topic, language, and difficulty level
- Answer questions using text or speech input
- Use the built-in code editor for programming answers
- Ask for hints when you get stuck
- Receive feedback on correctness, completeness, and clarity
- Review previous interview sessions
- Download the final report as a PDF
- Switch between light and dark themes

## Technology used

The backend is built with FastAPI, SQLAlchemy, and Pydantic. It uses JWT tokens for authentication and supports SQLite for local development or PostgreSQL for deployment.

The frontend is built with React and Vite. It also uses Monaco Editor for code input, React Markdown for formatted responses, and html2pdf.js for PDF exports.

## Project structure

```text
AI_Mini_Project/
|-- backend/
|   |-- app/
|   |   |-- api/          # Authentication and interview routes
|   |   |-- core/         # Database, security, logging, and rate limiting
|   |   |-- models/       # SQLAlchemy database models
|   |   |-- schemas/      # Request and response models
|   |   `-- services/     # Gemini integration
|   |-- .env.example
|   `-- requirements.txt
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/   # Screens and reusable UI components
|   |   |-- hooks/        # Interview state and streaming logic
|   |   |-- services/     # Backend API calls
|   |   `-- styles/       # Global styles
|   |-- package.json
|   `-- vite.config.js
`-- README.md
```

## Before you start

Install the following tools:

- Python 3.11 or newer
- Node.js and npm
- A Google Gemini API key if you want real AI responses

PostgreSQL is optional. The backend uses a local SQLite database when `DATABASE_URL` is not set.

## Run the backend

Open a terminal in the project folder and move into the backend directory:

```powershell
cd backend
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

On macOS or Linux, use:

```bash
source venv/bin/activate
```

Install the Python packages:

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env`. On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

Open `.env` and set the required values:

```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET_KEY=use_a_long_random_secret

# Optional: leave this out to use SQLite locally
DATABASE_URL=postgresql+asyncpg://user:password@host/database
```

`JWT_SECRET_KEY` is required. `GEMINI_API_KEY` can be left empty when you only want to test the application with mock AI responses.

Start the backend:

```bash
uvicorn app.main:app --reload
```

The API will run at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Run the frontend

Open a second terminal, move into the frontend directory, and install the packages:

```bash
cd frontend
npm install
npm run dev
```

Vite will print the local address in the terminal. It is usually `http://localhost:5173`.

The frontend connects to `http://127.0.0.1:8000` by default. To use a different backend address, create `frontend/.env` and add:

```env
VITE_API_URL=https://your-backend.example.com
```

Restart the Vite server after changing this value.

## Useful commands

Run the frontend linter:

```bash
cd frontend
npm run lint
```

Create a production frontend build:

```bash
cd frontend
npm run build
```

## Main API routes

- `POST /api/auth/register` creates an account
- `POST /api/auth/login` signs in and returns an access token
- `POST /api/session/start` starts a new interview
- `POST /api/session/chat` submits an answer and streams the next response
- `GET /api/session/{session_id}/hint` requests a hint
- `GET /api/session/{session_id}/report` creates the final report
- `GET /api/session/user/history` returns the signed-in user's interview history

All interview routes require a bearer token returned by the login or registration endpoint.

## Notes

- Keep `.env` private and never commit real API keys or database passwords.
- Use a long, random value for `JWT_SECRET_KEY`.
- SQLite is convenient for local testing. PostgreSQL is the better choice for a deployed application with multiple users.
- The first backend start creates the required database tables automatically.
