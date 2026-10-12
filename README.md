# SkillAI — Google Gemma 4 Integration

Integration of Google's **Gemma 4** (`gemma-4-26b-a4b-it`) multimodal model using the official Google Gen AI SDK (`@google/genai`) and Gemini API.

---

## 🌟 Key Features

1. **Explicit Model Calling**: All requests explicitly target `gemma-4-26b-a4b-it` (Google's 25.2B parameter Mixture-of-Experts model with 3.8B active parameters). No silent Gemini substitution.
2. **Multimodal Support (Image + Text)**: Gemma 4 natively supports image and text inputs. Upload PNG, JPEG, WEBP, or GIF images alongside prompts.
3. **Safe API Key Handling**: The backend reads `GEMINI_API_KEY` from the environment. The key is never exposed to the client.
4. **Input Validation & Guardrails**: Text prompt validation, file size limits (10MB), MIME type checks, and clean status codes.
5. **Standalone Test Scripts**: Independent verification scripts in both Node.js (`test-gemma.js`) and Python (`test_gemma.py`) to verify API key and model availability before launching the application.
6. **Modern Web UI**: Responsive, glassmorphic dark-theme studio interface with live status indicator, code formatting, sample prompt chips, copy button, and image attachment preview.

---

## 📁 Project Structure

```
c:\Skillai\
├── .env.example            # Environment template with placeholders
├── .gitignore              # Git ignore rules (.env, node_modules, etc.)
├── package.json            # Node.js dependencies and run scripts
├── server.js               # Express backend service & static asset server
├── services/
│   └── gemmaService.js     # Core Gemma 4 service using @google/genai
├── test-gemma.js           # Standalone integration test script (Node.js)
├── test_gemma.py           # Standalone integration test script (Python)
├── public/
│   ├── index.html          # Semantic HTML5 frontend layout
│   ├── style.css           # Modern dark-mode glassmorphic styling
│   └── app.js              # Client logic (chat, image handling, status)
└── README.md               # Project documentation
```

---

## 🚀 Quick Start Guide

### Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your Google Gemini API key:
   ```env
   GEMINI_API_KEY=AIzaSyYourActualApiKeyHere
   PORT=3000
   ```
   *(Get your API key at [Google AI Studio](https://aistudio.google.com/))*

### Step 2: Test the Gemma 4 Model Integration

Before starting the main app, verify your API key and model access:

**Node.js test:**
```bash
npm run test:gemma
# or: node test-gemma.js
```

**Python test (Optional):**
```bash
python test_gemma.py
```

### Step 3: Run the Web Application

Start the server:
```bash
npm start
# or for hot-reloading:
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns server health and model configuration status |
| `GET` | `/api/model-info` | Queries model availability for `gemma-4-26b-a4b-it` |
| `POST` | `/api/chat` | Sends prompt (and optional image) to Gemma 4 |
