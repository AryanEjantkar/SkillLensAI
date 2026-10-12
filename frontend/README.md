# SkillLens Study Workspace

React/Vite frontend for the existing Python Gemma backend.

## Development

Start the backend from the repository root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.src.main:app --reload --reload-dir backend
```

In a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open <http://127.0.0.1:5173>. Vite proxies `/api` to the backend on port 8000. The workspace supports text prompts, verified PNG image uploads, PDF/DOCX/TXT documents, and public HTTP(S) HTML/text/PDF links; all are answered by the pinned Gemma 4 model.

Uploads are limited to 10 MB, extracted document/link text to 40,000 characters. Scanned PDFs are not OCR-processed. Redirects and private/reserved link targets are rejected.

## Production build

From `frontend/`, run `npm run build`. Vite writes the bundle to `backend/src/static/frontend`, which FastAPI serves at `/` and `/frontend/*`.
