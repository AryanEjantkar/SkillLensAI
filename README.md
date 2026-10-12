# SkillLens Study Workspace

SkillLens is a React study workspace backed by a Python API. It uses Google's official Gen AI SDK and explicitly calls `gemma-4-26b-a4b-it`; it never substitutes a Gemini model.

## Setup (PowerShell)

From the repository root, create the backend environment and install its dependencies:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install --prefix frontend
```

Edit `.env` locally and set `GEMINI_API_KEY` to a newly rotated API key. Never commit `.env` or paste the key into chat; `.gitignore` excludes it. `.env.example` contains a placeholder only.

## Verify Gemma before using the web page

Run a direct prompt through the backend service first:

```powershell
\.venv\Scripts\python.exe -m backend.src.smoke_test
```

This sends a short prompt using `gemma-4-26b-a4b-it`. The authenticated model list for this account includes this ID, and the live smoke prompt succeeded. A failure is reported rather than silently retrying with a different model.

The root-level shortcut is also available: `\.venv\Scripts\python.exe check_gemma.py`.

## Development

Start the backend in one terminal:

```powershell
\.venv\Scripts\python.exe -m uvicorn backend.src.main:app --reload --reload-dir backend
```

In a second terminal, start Vite:

```powershell
npm --prefix frontend run dev
```

Open <http://127.0.0.1:5173>. Vite proxies `/api/*` to FastAPI on port 8000. Text prompts, uploaded source material, loading, result, and error states are handled in the workspace.

## Supported sources

- Images: PNG upload with an optional question. PNG plus text was verified against `gemma-4-26b-a4b-it`; other image formats are rejected until verified.
- Documents: PDF, DOCX, and TXT uploads. Text is extracted locally and sent to Gemma with the user query. Scanned/image-only PDFs do not include OCR.
- Links: public HTTP(S) HTML, plain-text, and PDF pages. Redirects, non-standard ports, private/reserved hosts, unsupported media types, and content over 10 MB are rejected.
- Uploads are limited to 10 MB and extracted text to 40,000 characters. Source content and the query are processed by the backend and sent to Gemma; the API key stays on the backend.

## Production

Build the React frontend, then run the backend:

```powershell
npm --prefix frontend run build
\.venv\Scripts\python.exe -m uvicorn backend.src.main:app --host 127.0.0.1 --port 8000
```

FastAPI serves the built UI at <http://127.0.0.1:8000>. Before a frontend build exists, `/` falls back to the original simple prompt page.

## Run automated tests

```powershell
\.venv\Scripts\python.exe -m pytest
```

The automated tests use a mock SDK client to verify the exact model ID and API behavior; they do not make a billable network call. The separate smoke test makes the real API request.

## Files

- `.gitignore`: excludes secrets, virtual environments, bytecode, and test cache.
- `.env`: local, git-ignored backend API key configuration; set a rotated key locally.
- `.env.example`: placeholder-only template for `GEMINI_API_KEY`.
- `requirements.txt` and `requirements-dev.txt`: runtime and test dependencies, including Google's `google-genai` SDK.
- `frontend/package.json` and `frontend/vite.config.js`: React/Vite framework setup and the development API proxy.
- `frontend/src/App.jsx` and `frontend/src/styles.css`: responsive SkillLens workspace interface based on the supplied screenshot.
- `frontend/src/main.jsx` and `frontend/index.html`: React entry point and document shell.
- `backend/src/config/settings.py`: loads local `.env`, reads `GEMINI_API_KEY`, and pins the model ID.
- `backend/src/services/gemma_service.py`: makes the SDK request and normalizes configuration/API failures.
- `backend/src/main.py`: validates prompts/uploads, extracts document/link text, blocks private link targets, and exposes the text/image/document/link generation endpoints.
- `backend/src/static/index.html`: standalone prompt form with loading, validation, and error states.
- `backend/src/smoke_test.py`: direct API smoke test, run before connecting another application.
- `check_gemma.py`: root-level shortcut to the same smoke test, using the fixed model ID.
- `backend/tests/`: offline tests for the explicit model ID, input validation, and API responses.

Image, document, and link queries are sent to the same pinned Gemma model. Image input is enabled for PNG only because PNG compatibility was verified directly against the selected model.