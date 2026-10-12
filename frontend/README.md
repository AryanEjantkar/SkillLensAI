# SkillLens AI — Frontend Application

Production React + Vite frontend for **SkillLens AI**, designed to match the SkillLens UI design system and seamlessly connect to the FastAPI backend.

---

## 🎨 Visual Identity & Layout

- **Mockup Match**: 1:1 reproduction of the SkillLens AI workspace layout.
- **Color Palette**: Lavender backgrounds (`#f4f3fb`), dark navy typography (`#141738`), crisp white elevated cards, and purple accents (`#5845d8`).
- **Interactive Workspace**: Text and image note inputs, output filters (`Explain`, `Flashcards`, `Quiz`, `All`), and dynamic study set generation.
- **Study Features**:
  - **Overview**: High-level synthesis, topic titles, and key metrics.
  - **Explanation**: Beginner-friendly breakdown of complex concepts.
  - **Flashcards**: Interactive 3D flipping flashcards with mastery tracking.
  - **Quizzes**: Multiple-choice assessment with instant answer validation, scoring, and explanations.

---

## 📁 Directory Ownership & Structure

```
frontend/
├── src/
│   ├── App.jsx                     # Top-level state and navigation controller
│   ├── main.jsx                    # React entry point
│   ├── pages/                      # Page components
│   │   ├── WorkspacePage.jsx       # Main study workspace (matching mockup)
│   │   ├── LibraryPage.jsx         # Study library of saved sessions
│   │   └── ProgressPage.jsx        # Learning mastery metrics
│   ├── components/
│   │   ├── Layout/                 # Shared UI layout
│   │   │   ├── AppLayout.jsx       # Layout wrapper
│   │   │   ├── Header.jsx          # Top navigation bar
│   │   │   └── Sidebar.jsx         # Left navigation sidebar
│   │   ├── Flashcards/             # Owned by Person 3 (FlashcardSet.jsx)
│   │   └── Quiz/                   # Owned by Person 3 (QuizSet.jsx)
│   ├── data/
│   │   └── demoContent.js          # Owned by Person 3 (Sample study set)
│   ├── services/
│   │   └── api.js                  # Centralized FastAPI backend client
│   └── styles/
│       ├── index.css               # Design tokens, variables & typography
│       ├── layout.css              # Header, sidebar & responsive grid
│       └── workspace.css           # Input cards, flashcard 3D flip & quiz
├── .env.example                    # Environment template (VITE_API_BASE_URL)
├── package.json                    # Dependencies & scripts
└── vite.config.js                  # Vite configuration with backend proxy
```

---

## 🚀 Running the Frontend

### 1. Install Dependencies
```powershell
cd frontend
npm install
```

### 2. Configure Environment
```powershell
copy .env.example .env
```
Default configuration:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server
```powershell
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Build for Production
```powershell
npm run build
```
Output bundle will be created in `frontend/dist/`.
