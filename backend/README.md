# SkillLens AI — Backend Service

Production-quality modular backend for **SkillLens AI**, an educational platform that generates structured learning materials (explanations, summaries, flashcards, and multiple-choice quizzes) using Google's **Gemma 4** (`gemma-4-26b-a4b-it`) model via the official Google Gen AI SDK.

---

## 🏗️ Architecture & Design Principles

The backend is built adhering to **SOLID principles** and clean architectural patterns:

- **Single Responsibility Principle (SRP)**:
  - `app.api.routes`: Pure HTTP request handling and response mapping.
  - `app.services.learning_service`: Business orchestration and input validation.
  - `app.services.prompt_builder`: Prompt formatting and instructions.
  - `app.services.output_validator`: Extracting and validating untrusted model JSON.
  - `app.providers.gemma_provider`: Encapsulating Google Gen AI SDK calls.
- **Open/Closed Principle (OCP) & Strategy Pattern**:
  - `AIProvider` defines the abstraction contract. New models or providers can be introduced without modifying business workflows.
- **Liskov Substitution Principle (LSP)**:
  - Both `GemmaProvider` and `MockAIProvider` honor the identical `AIProvider` contract.
- **Interface Segregation Principle (ISP)**:
  - Segregated contracts: `TextGenerationProvider` and `MultimodalGenerationProvider`.
- **Dependency Inversion Principle (DIP)**:
  - `LearningService` depends on `AIProvider`, injected via FastAPI dependencies (`app.dependencies`).
- **Adapter Pattern**:
  - `GemmaProvider` adapts the `google-genai` SDK into application interfaces.
- **Centralized Settings**:
  - Pydantic Settings (`app.core.config.Settings`) loads environment variables safely.

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # Application entry point (FastAPI, middleware, error handlers)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py               # Combined API router
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py           # GET /api/health
│   │       └── learning.py         # POST /api/analyze, /api/generate/flashcards, /api/generate/quiz
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py               # Pydantic BaseSettings & configuration
│   │   ├── logging.py              # Centralized logging configuration
│   │   └── exceptions.py           # Explicit application exception hierarchy
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py               # HealthResponse schema
│   │   ├── learning.py             # AnalysisResponse, Flashcard, QuizQuestion schemas
│   │   └── errors.py               # Standard ErrorResponse envelope
│   ├── interfaces/
│   │   ├── __init__.py
│   │   └── ai_provider.py          # AIProvider, TextGenerationProvider, MultimodalGenerationProvider
│   ├── providers/
│   │   ├── __init__.py
│   │   └── gemma_provider.py       # Live Gemma 4 SDK implementation (bounded retries & timeouts)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── learning_service.py     # Main educational orchestration & image validation
│   │   ├── prompt_builder.py       # Structured prompt construction
│   │   └── output_validator.py     # Untrusted model output parsing and validation
│   └── dependencies.py             # FastAPI dependency injection definitions
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # MockAIProvider, fixtures, test client
│   ├── test_health.py              # Health check unit test
│   ├── test_learning_api.py        # API endpoint integration tests
│   ├── test_learning_service.py    # Service layer unit tests
│   ├── test_output_validator.py    # OutputValidator parsing tests
│   └── manual_integration_test.py # Live Gemma 4 model integration verification script
├── .env.example                    # Configuration template with placeholders
├── .gitignore                      # Git exclusion rules
├── requirements.txt                # Production & test dependencies
├── pytest.ini                      # Pytest runner configuration
└── README.md                       # Documentation
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Python 3.11+
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### 2. Virtual Environment
From the repository root or `backend/` directory:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```powershell
pip install -r backend/requirements.txt
```

### 4. Configure Environment
Copy `.env.example` to `.env` inside `backend/`:
```powershell
copy backend\.env.example backend\.env
```
Inside `backend/.env`:
```env
GEMINI_API_KEY=AIzaSy...your_actual_key...
GEMMA_MODEL=gemma-4-26b-a4b-it
APP_ENV=development
PORT=8000
CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
MAX_UPLOAD_SIZE_MB=5
MAX_TEXT_LENGTH=20000
REQUEST_TIMEOUT_SECONDS=90
```

---

## 🏃 Starting the Server

From the `backend/` directory:
```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```
Interactive OpenAPI Documentation will be available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 📡 API Endpoints

### 1. `GET /api/health`
Health check endpoint reporting API status without invoking external AI models.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "app": "SkillLens AI Backend",
  "version": "1.0.0",
  "model_configured": "gemma-4-26b-a4b-it"
}
```

---

### 2. `POST /api/analyze`
Generates comprehensive structured learning material (title, summary, explanation, flashcards, quiz) from text notes or diagrams.

**Request:** `multipart/form-data`
- `text`: *(Optional)* User notes, questions, or conceptual text.
- `image`: *(Optional)* Uploaded image file (JPEG, PNG, WEBP, GIF; max 5MB).
*(At least one of `text` or `image` is required)*

**Response (200 OK):**
```json
{
  "title": "Introduction to Neural Networks",
  "summary": "A concise summary of the submitted material.",
  "explanation": "A beginner-friendly explanation of the main concepts.",
  "flashcards": [
    {
      "question": "What is a neuron?",
      "answer": "A computational unit in a neural network."
    }
  ],
  "quiz": [
    {
      "question": "What does an activation function do?",
      "options": [
        "Introduces non-linearity",
        "Stores images",
        "Deletes weights",
        "Connects to the internet"
      ],
      "correct_answer": 0,
      "explanation": "It enables the network to learn nonlinear relationships."
    }
  ]
}
```

> **Note on Multimodal Images**: The Gemma 4 model (`gemma-4-26b-a4b-it`) via the Gemini API currently returns upstream server errors when processing image parts. If an image is provided, the backend validates the image with Pillow and returns a clear `MULTIMODAL_UNSUPPORTED` (422) error advising the user to provide text notes, rather than claiming image analysis succeeded.

---

### 3. `POST /api/generate/flashcards`
Generates study flashcards from source text.

**Request Body:** `application/json`
```json
{
  "text": "Mitochondria are membrane-bound cell organelles that generate most of the chemical energy needed to power the cell."
}
```

**Response (200 OK):**
```json
{
  "flashcards": [
    {
      "question": "What is the primary function of mitochondria?",
      "answer": "To generate chemical energy to fuel cellular activities."
    }
  ]
}
```

---

### 4. `POST /api/generate/quiz`
Generates multiple-choice quiz questions with verified `correct_answer` zero-based index.

**Request Body:** `application/json`
```json
{
  "text": "Binary search has a logarithmic time complexity of O(log n)."
}
```

**Response (200 OK):**
```json
{
  "quiz": [
    {
      "question": "What is the time complexity of binary search?",
      "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
      "correct_answer": 1,
      "explanation": "Binary search divides the search space in half each iteration."
    }
  ]
}
```

---

## 🧪 Testing

### Automated Unit & API Tests (Zero Network / Zero Quota)
Uses `pytest` and `MockAIProvider` to run isolated tests:
```powershell
# From backend/ directory
pytest -v

# Or from repository root
pytest backend/tests -v
```

### Live Gemma 4 Model Integration Test
Verifies live connectivity to Google's `gemma-4-26b-a4b-it` model using your real `GEMINI_API_KEY`:
```powershell
python backend/tests/manual_integration_test.py
```

---

## 🛡️ Error Handling & Status Codes

All errors return a consistent envelope:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": null
  }
}
```

| HTTP Status | Error Code | Scenario |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Empty input or malformed image data |
| `422` | `MULTIMODAL_UNSUPPORTED` | Image provided but model cannot ingest images |
| `422` | `REQUEST_VALIDATION_ERROR` | Pydantic payload schema validation failure |
| `502` | `AI_PROVIDER_ERROR` | Upstream model failure or quota exhausted |
| `502` | `INVALID_MODEL_OUTPUT` | Model returned unparseable JSON or invalid index |
| `504` | `AI_TIMEOUT` | Upstream model request exceeded timeout limit |
