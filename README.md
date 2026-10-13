# SkillLens AI — Universal Interactive Learning Engine

SkillLens AI is an AI-powered interactive learning platform that teaches virtually any academic or professional subject through dynamic visualizations, physics/chemistry/biology simulations, guided step-by-step explanations, KaTeX mathematical typesetting, and an adaptive Socratic tutor.

---

## 1. Core Architecture & Features

- **Universal Lesson Generator**: Enter any subject (Mathematics, Physics, Chemistry, Biology, Computer Science, Economics, Law, Arts, or open-ended topics). Structured Pydantic schemas enforce lesson objectives, sections, worked problems, flashcards, quizzes, and visualizations.
- **Safe Dynamic Visualization Engine**: Strict component registry executing pure declarative JSON data. No arbitrary model-generated executable JavaScript or HTML is ever executed in the browser.
  - `math_graph` / `calculus_graph`: Dynamic functions with variable sliders ($a, b, c$), tangent slope tracker $f'(x_0)$, and Riemann sum definite integrals $\sum f(x_i) \Delta x$.
  - `physics_simulation`: Live 2D projectile kinematics with launch velocity, angle, gravity sliders (Earth, Moon, Mars presets), vectors, and trajectory trace.
  - `chemistry_reaction`: Multi-stage reaction mechanism stepper, potential energy profile ($E_a, \Delta H$), and temperature kinetics.
  - `biology_process`: Interactive cellular processes (e.g., Cellular Respiration, Photosynthesis) with clickable anatomical hotspots.
  - `algorithm_visualizer`: Algorithmic execution (e.g., Binary Search, Sorting) with pointer indices and synchronized line-by-line pseudocode.
  - `economics_market`: Supply and Demand market equilibrium with demand/supply shifters, consumer surplus, and producer surplus.
  - `probability_distribution`: Continuous Gaussian bell curve with $\mu, \sigma$ sliders, shaded cumulative probability, and $z$-scores.
  - `system_architecture`: Tiered system stacks, networking protocols, and architectural specifications.
  - `timeline_flow`: Historical timelines and legal case flows with precedent milestones.
  - `concept_map`: Universal fallback interactive knowledge graph with clickable nodes and relational links.
  - `comparison_matrix`: Multidimensional comparison tables with criteria notes.
  - `worked_example`: Step-by-step problem solver with revealable hints and verified solutions.
- **Adaptive AI Tutor**: Floating contextual Socratic tutor drawer with misconception diagnosis, progressive hints, "Explain Simpler", and dynamic practice question generation.
- **Multi-Provider AI Routing**:
  - **Gemma** (`gemma-4-26b-a4b-it`): Official Google GenAI SDK model for lesson planning and curriculum.
  - **Gemini** (`gemini-2.5-flash`): Optional cloud provider for complex multimodal analysis.
  - **Ollama** (`gemma2:9b`): Local offline inference provider with zero cloud requests.

---

## 2. Environment Configuration

Configure the following variables in `.env` (refer to `.env.example`):

| Variable | Default Value | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(required for cloud)* | Google AI Studio API key |
| `GEMMA_MODEL` | `gemma-4-26b-a4b-it` | Configured Gemma model ID |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Configured Gemini model ID |
| `DEFAULT_PROVIDER` | `gemma` | Default active inference provider (`gemma`, `gemini`, `ollama`) |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama HTTP daemon endpoint |
| `OLLAMA_MODEL` | `gemma2:9b` | Local model tag in Ollama |
| `REQUEST_TIMEOUT_SECONDS` | `30.0` | Timeout threshold for model inference |

---

## 3. Quickstart & Local Setup (PowerShell)

### Backend Setup
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

### Frontend Setup
```powershell
npm install --prefix frontend
```

### Smoke Test
Verify Gemma model connectivity:
```powershell
.\.venv\Scripts\python.exe check_gemma.py
```

### Run in Development
**Terminal 1 (Backend API):**
```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.src.main:app --reload --reload-dir backend --port 8000
```

**Terminal 2 (Frontend Dev Server):**
```powershell
npm --prefix frontend run dev
```
Open **http://127.0.0.1:5173** in your browser.

### Run in Production
```powershell
npm --prefix frontend run build
.\.venv\Scripts\python.exe -m uvicorn backend.src.main:app --host 127.0.0.1 --port 8000
```
Open **http://127.0.0.1:8000** in your browser.

---

## 4. Automated Testing

Run the offline pytest suite (22 unit tests covering schemas, providers, visualizations, tutor, and offline mode):

```powershell
.\.venv\Scripts\python.exe -m pytest
```

All unit tests use mock fixtures and do not trigger paid or external API calls.

---

## 5. Deploying to Vercel

SkillLens AI is configured as a fullstack application for Vercel (Vite React frontend on Edge CDN + FastAPI Python serverless functions for `/api`).

### Prerequisites
1. A [Vercel](https://vercel.com) account.
2. A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### Deployment Methods

#### Method A: Via GitHub (Recommended)
1. Commit and push your code to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Keep default settings (Root Directory: `./`).
4. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: `your-google-ai-studio-key`
   - `DEFAULT_PROVIDER`: `gemini` *(or `gemma`)*
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `GEMMA_MODEL`: `gemma-4-26b-a4b-it`
5. Click **Deploy**.

#### Method B: Via Vercel CLI
```powershell
npm i -g vercel
vercel
vercel env add GEMINI_API_KEY
vercel --prod
```