import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Image as ImageIcon,
  Layers3,
  Link2,
  Maximize,
  MessageCircle,
  PanelLeft,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";

const MODEL_LABEL = "gemma-4-26b-a4b-it";
const MAX_PROMPT_CHARS = 10_000;

const navigation = [
  { label: "Workspace", icon: PanelLeft },
  { label: "Library", icon: BookOpen, count: "12" },
  { label: "Flashcards", icon: Layers3, count: "48" },
  { label: "Quizzes", icon: CircleHelp, count: "6" },
  { label: "Progress", icon: Sparkles },
];

const inputModes = [
  { label: "Text", icon: Type, enabled: true },
  { label: "Image", icon: ImageIcon, enabled: true },
  { label: "Document", icon: FileText, enabled: true },
  { label: "Link", icon: Link2, enabled: true },
];

const studyModes = ["Explain", "Flashcards", "Quiz", "All"];

function buildPrompt(text, mode) {
  const directions = {
    Explain: "Explain the material clearly and accurately. Start with the core idea, then explain important details and give one useful example.",
    Flashcards: "Create concise study flashcards from the material. Format each as 'Q:' followed by 'A:'. Focus on the most important concepts.",
    Quiz: "Create a short quiz from the material. Include a mix of question types and put the answer key after the questions.",
    All: "Create a compact study set with three sections: Explanation, Flashcards, and Quiz. Include answers for the flashcards and an answer key for the quiz.",
  };

  return `${directions[mode]}\n\nStudy material or question:\n${text}`;
}

export default function App() {
  const [activeSection, setActiveSection] = useState("Workspace");
  const [activeInput, setActiveInput] = useState("Text");
  const [studyMode, setStudyMode] = useState("Explain");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const promptRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (activeInput !== "Image" || !selectedFile) {
      setImagePreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(selectedFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [activeInput, selectedFile]);

  function acceptSelectedFile(file, inputType = activeInput) {
    if (!file) return;
    const filename = file.name.toLowerCase();
    if (inputType === "Image" && !filename.endsWith(".png")) {
      setError("PNG images are supported for image questions.");
      return;
    }
    if (inputType === "Document" && !/\.(pdf|docx|txt)$/.test(filename)) {
      setError("Choose a PDF, DOCX, or TXT document.");
      return;
    }
    setError("");
    setSelectedFile(file);
    setActiveInput(inputType);
  }

  function handleFileDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const filename = file.name.toLowerCase();
    if (filename.endsWith(".png")) acceptSelectedFile(file, "Image");
    else if (/\.(pdf|docx|txt)$/.test(filename)) acceptSelectedFile(file, "Document");
    else setError("Drop a PNG image, PDF, DOCX, or TXT file.");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    setError("");
    setResult("");

    if (activeInput === "Text" && !cleanPrompt) {
      setError("Add a question or some study notes first.");
      promptRef.current?.focus();
      return;
    }
    if ((activeInput === "Image" || activeInput === "Document") && !selectedFile) {
      setError(activeInput === "Image" ? "Choose a PNG image first." : "Choose a document first.");
      fileInputRef.current?.click();
      return;
    }
    if (activeInput === "Link" && !linkUrl.trim()) {
      setError("Paste a page link first.");
      return;
    }

    setLoading(true);
    try {
      let response;
      if (activeInput === "Text") {
        response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: buildPrompt(cleanPrompt, studyMode) }),
        });
      } else if (activeInput === "Link") {
        response = await fetch("/api/generate/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: linkUrl.trim(),
            prompt: cleanPrompt,
            study_mode: studyMode,
          }),
        });
      } else {
        const formData = new FormData();
        formData.set("file", selectedFile);
        formData.set("prompt", cleanPrompt);
        formData.set("study_mode", studyMode);
        const endpoint = activeInput === "Image" ? "/api/generate/image" : "/api/generate/document";
        response = await fetch(endpoint, { method: "POST", body: formData });
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "We couldn't create your study set. Try again.");
      }
      setResult(data.response);
    } catch (requestError) {
      setError(requestError.message || "Unable to reach the SkillLens service.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!result) {
      setError("Create a study set before exporting.");
      return;
    }
    const file = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "skilllens-study-set.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }

  const acceptedFiles = activeInput === "Image" ? "image/png,.png" : ".pdf,.docx,.txt";
  const fileHint = activeInput === "Image" ? "PNG image · up to 10 MB" : "PDF, DOCX, or TXT · up to 10 MB";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="workspace-switcher" aria-label="Current workspace">
          <span className="topbar-home" aria-hidden="true">⌂</span>
          <span>SkillLens AI</span>
          <ChevronDown size={14} aria-hidden="true" />
        </div>
        <div className="topbar-actions">
          <button className="avatar" type="button" aria-label="Account">A</button>
          <button className="topbar-icon" type="button" aria-label="Open chat" onClick={() => promptRef.current?.focus()}>
            <MessageCircle size={16} />
          </button>
          <button className="topbar-action" type="button" onClick={handleExport}>
            <ArrowDownToLine size={15} />
            <span>Export</span>
          </button>
          <button className="topbar-icon fullscreen-button" type="button" aria-label="Toggle fullscreen" onClick={handleFullscreen}>
            <Maximize size={15} />
          </button>
        </div>
      </header>

      <div className="workspace-frame">
        <aside className="sidebar">
          <a className="brand" href="#workspace" onClick={() => setActiveSection("Workspace")}>
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>SkillLens</span>
          </a>

          <nav className="primary-nav" aria-label="Main navigation">
            {navigation.map(({ label, icon: Icon, count }) => (
              <button
                className={`nav-item${activeSection === label ? " active" : ""}`}
                key={label}
                type="button"
                onClick={() => setActiveSection(label)}
                aria-current={activeSection === label ? "page" : undefined}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {count && <span className="nav-count">{count}</span>}
              </button>
            ))}
          </nav>

          <div className="sidebar-progress">
            <div className="progress-title-row">
              <span className="progress-title">Thermodynamics</span>
              <span className="progress-menu" aria-hidden="true">···</span>
            </div>
            <div className="progress-track" role="progressbar" aria-label="Thermodynamics mastery" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100">
              <span />
            </div>
            <p><strong>64% mastered</strong> · 3<br />concepts to revisit</p>
          </div>
        </aside>

        <main className="main-content" id="workspace">
          <section className="study-workspace" aria-labelledby="page-title">
            <div className="page-intro">
              <p className="section-kicker"><span className="kicker-dot" /> YOUR STUDY WORKSPACE</p>
              <h1 id="page-title">What are you studying<br className="desktop-break" /> today?</h1>
              <p className="intro-copy">Add notes, a photo, a slide or a question. SkillLens turns it into an explanation, flashcards and a quiz.</p>
            </div>

            <form className="composer" onSubmit={handleSubmit} onDragOver={(event) => event.preventDefault()} onDrop={handleFileDrop}>
              <div className="input-tabs" role="tablist" aria-label="Study material type">
                {inputModes.map(({ label, icon: Icon, enabled }) => (
                  <button
                    className={`input-tab${activeInput === label ? " selected" : ""}${!enabled ? " unavailable" : ""}`}
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={activeInput === label}
                    aria-disabled={!enabled}
                    title={label}
                    onClick={() => {
                      if (enabled) {
                        setActiveInput(label);
                        setSelectedFile(null);
                        setError("");
                      }
                    }}
                  >
                    <Icon size={15} strokeWidth={1.9} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <input
                className="visually-hidden"
                ref={fileInputRef}
                type="file"
                accept={acceptedFiles}
                onChange={(event) => acceptSelectedFile(event.target.files?.[0])}
                tabIndex={-1}
              />

              {activeInput === "Image" && (
                <div className="source-picker">
                  {selectedFile ? (
                    <div className="selected-file">
                      {imagePreview && <img className="image-preview" src={imagePreview} alt="Selected image preview" />}
                      <div className="selected-file-info">
                        <strong>{selectedFile.name}</strong>
                        <span>{(selectedFile.size / 1024).toFixed(0)} KB · PNG</span>
                      </div>
                      <button className="remove-file" type="button" aria-label="Remove image" onClick={() => setSelectedFile(null)}><X size={16} /></button>
                    </div>
                  ) : (
                    <button className="upload-prompt" type="button" onClick={() => fileInputRef.current?.click()}>
                      <span className="upload-icon"><Upload size={17} /></span>
                      <span><strong>Choose an image</strong><small>{fileHint}</small></span>
                    </button>
                  )}
                </div>
              )}

              {activeInput === "Document" && (
                <div className="source-picker">
                  {selectedFile ? (
                    <div className="selected-file document-selected">
                      <span className="document-file-icon"><FileText size={18} /></span>
                      <div className="selected-file-info">
                        <strong>{selectedFile.name}</strong>
                        <span>{(selectedFile.size / 1024).toFixed(0)} KB · document</span>
                      </div>
                      <button className="remove-file" type="button" aria-label="Remove document" onClick={() => setSelectedFile(null)}><X size={16} /></button>
                    </div>
                  ) : (
                    <button className="upload-prompt" type="button" onClick={() => fileInputRef.current?.click()}>
                      <span className="upload-icon"><Upload size={17} /></span>
                      <span><strong>Choose a document</strong><small>{fileHint}</small></span>
                    </button>
                  )}
                </div>
              )}

              {activeInput === "Link" && (
                <label className="link-field">
                  <Link2 size={16} aria-hidden="true" />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(event) => setLinkUrl(event.target.value)}
                    placeholder="Paste an article or study page URL"
                    aria-label="Page URL"
                  />
                </label>
              )}

              <label className="visually-hidden" htmlFor="study-prompt">Study notes or question</label>
              <textarea
                id="study-prompt"
                ref={promptRef}
                value={prompt}
                maxLength={MAX_PROMPT_CHARS}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={activeInput === "Image" ? "Ask a question about the image, or leave blank for a summary" : activeInput === "Document" ? "Ask about the document, or leave blank for a summary" : activeInput === "Link" ? "Ask about this page, or leave blank for a summary" : "Paste notes or ask a question, e.g. Explain entropy like I'm new to physics"}
                aria-describedby="prompt-count"
              />

              <div className="composer-footer">
                <span className="character-count" id="prompt-count">{prompt.length.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()}</span>
                <div className="composer-actions">
                  <div className="mode-picker" role="group" aria-label="Study set type">
                    {studyModes.map((mode) => (
                      <button
                        className={`mode-button${studyMode === mode ? " selected" : ""}`}
                        key={mode}
                        type="button"
                        aria-pressed={studyMode === mode}
                        onClick={() => setStudyMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <button className="create-button" type="submit" disabled={loading}>
                    {loading ? <span className="button-spinner" aria-hidden="true" /> : <Sparkles size={16} />}
                    <span>{loading ? "Creating..." : "Create study set"}</span>
                  </button>
                </div>
              </div>
            </form>

            <p className="drop-hint">{activeInput === "Text" ? "Choose a source above, or drop a PNG, PDF, DOCX, or TXT here." : activeInput === "Image" ? "Drop a PNG image here or choose a file above." : activeInput === "Document" ? "Drop a PDF, DOCX, or TXT file here or choose a file above." : "Public HTTP(S) pages are fetched and summarized by Gemma."}</p>

            {error && <p className="status-message error-message" role="alert">{error}</p>}

            <section className={`result-panel${result ? " has-result" : ""}`} aria-live="polite" aria-label="Study set result">
              {result ? (
                <>
                  <div className="result-heading">
                    <div>
                      <p className="result-eyebrow"><Check size={14} /> STUDY SET READY</p>
                      <h2>{studyMode === "All" ? "Your complete study set" : `${studyMode} your material`}</h2>
                    </div>
                    <span className="model-badge">{MODEL_LABEL}</span>
                  </div>
                  <div className="result-copy">{result}</div>
                </>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon"><BookOpen size={19} strokeWidth={1.7} /></span>
                  <p>Your explanation, flashcards and quiz will appear here.</p>
                </div>
              )}
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
