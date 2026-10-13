import { useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Image as ImageIcon,
  Layers3,
  Link2,
  Loader2,
  Maximize,
  MessageCircle,
  PanelLeft,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Type,
  Upload,
  X,
  XCircle,
  Cpu,
  GraduationCap,
  Sliders,
  Layers,
} from "lucide-react";

import { sampleLessons } from "./data/sampleLessons";
import VisualizationRegistry from "./components/visualizations/VisualizationRegistry";
import AdaptiveTutorDrawer from "./components/tutor/AdaptiveTutorDrawer";
import DifficultySelector from "./components/common/DifficultySelector";
import ProviderSelector from "./components/common/ProviderSelector";
import LessonHeader from "./components/lesson/LessonHeader";
import LessonContent from "./components/lesson/LessonContent";
import WorkedExampleStepper from "./components/visualizations/WorkedExampleStepper";

const MODEL_LABEL = "gemma-4-26b-a4b-it";
const MAX_PROMPT_CHARS = 10_000;

// Transform initial sample lessons into active study decks
const initialDecks = sampleLessons.map((l) => ({
  id: l.id,
  topic: l.topic,
  createdAt: "Interactive Curriculum",
  difficulty: l.difficulty,
  subject: l.subject,
  lessonPlan: l,
  cards: l.flashcards.map((fc, idx) => ({
    id: fc.id || `fc-${idx + 1}`,
    question: fc.question,
    answer: fc.answer,
    mastered: idx % 2 === 0,
  })),
  quizzes: l.quiz.map((q, idx) => ({
    id: q.id || `qz-${idx + 1}`,
    question: q.question,
    options: q.options,
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
  })),
  rawText: l.sections.map((s) => `### ${s.title}\n${s.content}`).join("\n\n"),
}));

const navigation = [
  { label: "Workspace", icon: PanelLeft },
  { label: "Flashcards", icon: Layers3 },
  { label: "Quizzes", icon: CircleHelp },
  { label: "Progress", icon: Sparkles },
  { label: "Library", icon: BookOpen },
];

const inputModes = [
  { label: "Text", icon: Type, enabled: true },
  { label: "Image", icon: ImageIcon, enabled: true },
  { label: "Document", icon: FileText, enabled: true },
  { label: "Link", icon: Link2, enabled: true },
];

const studyModes = ["Explain", "Flashcards", "Quiz", "All"];

function cleanMarkdownArtifacts(str) {
  if (!str) return "";
  return str.replace(/^(\s*[-*_]{3,}\s*)$/gm, "").replace(/\r\n/g, "\n");
}

function renderInlineNodes(text) {
  if (!text) return null;
  const str = String(text).replace(/^[-*_]{3,}$/g, "").trim();

  const parts = [];
  const tokenRegex = /(\*\*([^*]+?)\*\*|__([^_]+?)__|`([^`]+?)`)/g;
  let lastIdx = 0;
  let match;

  while ((match = tokenRegex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      const plain = str.substring(lastIdx, match.index).replace(/\*/g, "");
      if (plain) parts.push(plain);
    }
    if (match[2] || match[3]) {
      parts.push(<strong key={parts.length}>{(match[2] || match[3]).trim()}</strong>);
    } else if (match[4]) {
      parts.push(<code key={parts.length} className="inline-code">{match[4].trim()}</code>);
    }
    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < str.length) {
    const plain = str.substring(lastIdx).replace(/\*/g, "");
    if (plain) parts.push(plain);
  }

  return parts.length > 0 ? parts : str.replace(/\*/g, "");
}

function FormattedContent({ text, className = "" }) {
  if (!text) return null;

  const clean = text.replace(/^(\s*[-*_]{3,}\s*)$/gm, "").replace(/\r\n/g, "\n");
  const rawLines = clean.split("\n");
  const elements = [];
  let currentList = null;

  function flushList() {
    if (currentList) {
      if (currentList.type === "bullet") {
        elements.push(
          <ul key={`list-${elements.length}`} className="content-bullet-list">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="bullet-item">
                <span className="bullet-disc" aria-hidden="true">•</span>
                <span className="bullet-text">{renderInlineNodes(item)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`list-${elements.length}`} className="content-num-list">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="num-item">
                <span className="num-badge">{item.num}</span>
                <span className="num-text">{renderInlineNodes(item.text)}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) {
      flushList();
      continue;
    }
    if (/^[-*_]{3,}$/.test(line)) {
      flushList();
      continue;
    }

    const headerMatch = line.match(/^(#{1,6})\s*(.+)/);
    if (headerMatch) {
      flushList();
      const level = headerMatch[1].length;
      const headingText = headerMatch[2].replace(/^[-*_]{3,}/, "").trim();
      if (level <= 2) {
        elements.push(<h2 key={`h2-${elements.length}`} className="content-heading">{renderInlineNodes(headingText)}</h2>);
      } else {
        elements.push(<h3 key={`h3-${elements.length}`} className="content-subheading">{renderInlineNodes(headingText)}</h3>);
      }
      continue;
    }

    const bulletMatch = line.match(/^[\*\-\+]\s+(.+)/);
    if (bulletMatch) {
      const itemText = bulletMatch[1].trim();
      if (!currentList || currentList.type !== "bullet") {
        flushList();
        currentList = { type: "bullet", items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    flushList();
    elements.push(<p key={`p-${elements.length}`} className="content-p">{renderInlineNodes(line)}</p>);
  }

  flushList();
  return <div className={`formatted-content-root ${className}`}>{elements}</div>;
}

export default function App() {
  const [activeSection, setActiveSection] = useState("Workspace");
  const [activeInput, setActiveInput] = useState("Text");
  const [studyMode, setStudyMode] = useState("Explain");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [provider, setProvider] = useState("gemma");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const promptRef = useRef(null);
  const fileInputRef = useRef(null);

  // Topic Decks Management (Load from localStorage if available, or fallback to initial sample decks)
  const [decks, setDecks] = useState(() => {
    try {
      const saved = localStorage.getItem("skilllens_decks_v2");
      return saved ? JSON.parse(saved) : initialDecks;
    } catch {
      return initialDecks;
    }
  });

  const [activeDeckId, setActiveDeckId] = useState(initialDecks[0].id);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("skilllens_decks_v2", JSON.stringify(decks));
    } catch {}
  }, [decks]);

  // Flashcards Study Interactive State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardFilter, setCardFilter] = useState("All");
  const [generatingMoreCards, setGeneratingMoreCards] = useState(false);

  // Quiz Interactive State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [generatingMoreQuestions, setGeneratingMoreQuestions] = useState(false);

  // Library Search and Filter State
  const [librarySearch, setLibrarySearch] = useState("");
  const [librarySubjectFilter, setLibrarySubjectFilter] = useState("All");

  // Result tabs
  const [activeResultTab, setActiveResultTab] = useState("Visualization");

  // Adaptive Tutor Drawer State
  const [isTutorOpen, setIsTutorOpen] = useState(false);

  useEffect(() => {
    if (activeInput !== "Image" || !selectedFile) {
      setImagePreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(selectedFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [activeInput, selectedFile]);

  // Active Deck Reference
  const activeDeck = useMemo(() => {
    return decks.find((d) => d.id === activeDeckId) || decks[0] || initialDecks[0];
  }, [decks, activeDeckId]);

  const activeLesson = activeDeck.lessonPlan || null;

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

  // Handle Dynamic Universal Lesson Generation
  async function executeCuration(customPrompt = null) {
    const targetPrompt = (customPrompt !== null ? customPrompt : prompt).trim();

    setError("");
    if (activeInput === "Text" && !targetPrompt) {
      setError("Enter a topic or study objective first.");
      promptRef.current?.focus();
      return;
    }
    if ((activeInput === "Image" || activeInput === "Document") && !selectedFile) {
      setError(activeInput === "Image" ? "Choose a PNG image first." : "Choose a document first.");
      fileInputRef.current?.click();
      return;
    }
    if (activeInput === "Link" && !linkUrl.trim()) {
      setError("Paste a page URL link first.");
      return;
    }

    setLoading(true);
    try {
      let lessonData = null;

      if (activeInput === "Text") {
        const response = await fetch("/api/lesson/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: targetPrompt,
            difficulty,
            provider,
            source_type: "text",
          }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to generate lesson with selected provider.");
        }
        lessonData = await response.json();
      } else if (activeInput === "Link") {
        const response = await fetch("/api/lesson/generate/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: linkUrl.trim(),
            topic: targetPrompt,
            difficulty,
            provider,
          }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to fetch linked content.");
        }
        lessonData = await response.json();
      } else {
        const formData = new FormData();
        formData.set("file", selectedFile);
        formData.set("topic", targetPrompt);
        formData.set("difficulty", difficulty);
        formData.set("provider", provider);

        const response = await fetch("/api/lesson/generate/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Upload analysis failed.");
        }
        lessonData = await response.json();
      }

      // Convert generated lesson into active topic deck
      const newDeckId = `deck-${Date.now()}`;
      const rawText = lessonData.sections?.map((s) => `### ${s.title}\n${s.content}`).join("\n\n") || "";

      const newDeck = {
        id: newDeckId,
        topic: lessonData.topic,
        createdAt: "Just now",
        difficulty: lessonData.difficulty,
        subject: lessonData.subject,
        lessonPlan: lessonData,
        cards: (lessonData.flashcards || []).map((fc, idx) => ({
          id: fc.id || `fc-${Date.now()}-${idx + 1}`,
          question: fc.question,
          answer: fc.answer,
          mastered: false,
        })),
        quizzes: (lessonData.quiz || []).map((q, idx) => ({
          id: q.id || `qz-${Date.now()}-${idx + 1}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
        })),
        rawText,
      };

      setDecks((prev) => [newDeck, ...prev]);
      setActiveDeckId(newDeckId);
      setResult(rawText);
      setActiveResultTab("Visualization");
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setQuizAnswers({});
    } catch (requestError) {
      const msg = requestError.message || "";
      if (msg === "Failed to fetch" || msg.toLowerCase().includes("failed to fetch")) {
        setError("Unable to connect to the backend server. Please make sure the FastAPI server is running on port 8000.");
      } else {
        setError(msg || "Unable to reach the SkillLens lesson service.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    if (event && event.preventDefault) event.preventDefault();
    executeCuration();
  }

  function handleAddPracticeQuestions(newQuestions) {
    if (!newQuestions || newQuestions.length === 0) return;
    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id !== activeDeck.id) return d;
        const formatted = newQuestions.map((q, idx) => ({
          id: q.id || `qz-practice-${Date.now()}-${idx}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
        }));
        return {
          ...d,
          quizzes: [...d.quizzes, ...formatted],
        };
      })
    );
  }

  async function handleGenerateMoreFlashcards() {
    if (generatingMoreCards) return;
    setGeneratingMoreCards(true);
    setError("");
    try {
      const res = await fetch("/api/tutor/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeDeck.topic || "Core Concepts",
          difficulty: activeDeck.difficulty || difficulty || "intermediate",
          count: 4,
          provider: provider || "gemma",
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate additional flashcards.");
      }
      const data = await res.json();
      if (data.flashcards && data.flashcards.length > 0) {
        const formattedNew = data.flashcards.map((fc, idx) => ({
          id: fc.id || `fc-more-${Date.now()}-${idx + 1}`,
          question: fc.question,
          answer: fc.answer,
          mastered: false,
        }));
        setDecks((prevDecks) =>
          prevDecks.map((d) => {
            if (d.id !== activeDeck.id) return d;
            return {
              ...d,
              cards: [...(d.cards || []), ...formattedNew],
            };
          })
        );
      }
    } catch (err) {
      console.error("Flashcards generation error:", err);
      setError(err.message || "Could not generate additional flashcards.");
    } finally {
      setGeneratingMoreCards(false);
    }
  }

  async function handleGenerateMoreQuizQuestions() {
    if (generatingMoreQuestions) return;
    setGeneratingMoreQuestions(true);
    setError("");
    try {
      const res = await fetch("/api/tutor/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeDeck.topic || "Knowledge Evaluation",
          difficulty: activeDeck.difficulty || difficulty || "intermediate",
          provider: provider || "gemma",
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to generate practice quiz questions.");
      }
      const data = await res.json();
      if (data.practice_questions && data.practice_questions.length > 0) {
        handleAddPracticeQuestions(data.practice_questions);
      }
    } catch (err) {
      console.error("Quiz questions generation error:", err);
      setError(err.message || "Could not generate more quiz questions.");
    } finally {
      setGeneratingMoreQuestions(false);
    }
  }

  async function handleExport() {
    const content =
      activeDeck.rawText ||
      JSON.stringify(activeDeck.lessonPlan || activeDeck, null, 2);
    const file = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDeck.topic.toLowerCase().replace(/\s+/g, "-")}-study-set.txt`;
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

  // Active Deck Flashcard Helpers
  const deckCards = activeDeck.cards || [];
  const filteredCards = deckCards.filter((card) => {
    if (cardFilter === "Mastered") return card.mastered;
    if (cardFilter === "Review") return !card.mastered;
    return true;
  });

  const activeCard = filteredCards[currentCardIndex] || filteredCards[0];

  function toggleCardMastery(cardId) {
    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id !== activeDeck.id) return d;
        return {
          ...d,
          cards: d.cards.map((c) => (c.id === cardId ? { ...c, mastered: !c.mastered } : c)),
        };
      })
    );
  }

  function nextCard() {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % (filteredCards.length || 1));
  }

  function prevCard() {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev === 0 ? Math.max(0, filteredCards.length - 1) : prev - 1));
  }

  // Quiz Helpers
  const deckQuizzes = activeDeck.quizzes || [];
  function selectQuizOption(questionId, optionKey) {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  }

  const quizScore = deckQuizzes.reduce((score, q) => {
    return quizAnswers[q.id] === q.correctAnswer ? score + 1 : score;
  }, 0);

  // Mastery Calculations
  const masteredInActiveDeck = deckCards.filter((c) => c.mastered).length;
  const activeDeckMastery =
    deckCards.length > 0 ? Math.round((masteredInActiveDeck / deckCards.length) * 100) : 0;

  const totalCardsAllDecks = decks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
  const totalMasteredAllDecks = decks.reduce(
    (sum, d) => sum + (d.cards?.filter((c) => c.mastered).length || 0),
    0
  );
  const totalQuizzesAllDecks = decks.reduce((sum, d) => sum + (d.quizzes?.length || 0), 0);
  const totalDecksCount = decks.length;
  const overallMasteryPct =
    totalCardsAllDecks > 0 ? Math.round((totalMasteredAllDecks / totalCardsAllDecks) * 100) : 0;

  const subjectBreakdown = useMemo(() => {
    const map = {};
    decks.forEach((d) => {
      const subj = d.subject || "General";
      if (!map[subj]) {
        map[subj] = { subject: subj, totalCards: 0, masteredCards: 0, deckCount: 0, totalQuizzes: 0 };
      }
      map[subj].deckCount += 1;
      const c = d.cards?.length || 0;
      const m = d.cards?.filter((card) => card.mastered).length || 0;
      const q = d.quizzes?.length || 0;
      map[subj].totalCards += c;
      map[subj].masteredCards += m;
      map[subj].totalQuizzes += q;
    });
    return Object.values(map).map((s) => ({
      ...s,
      pct: s.totalCards > 0 ? Math.round((s.masteredCards / s.totalCards) * 100) : 0,
    }));
  }, [decks]);

  const filteredLibraryDecks = useMemo(() => {
    return decks.filter((d) => {
      const matchesSearch =
        librarySearch.trim() === "" ||
        d.topic.toLowerCase().includes(librarySearch.toLowerCase()) ||
        (d.subject && d.subject.toLowerCase().includes(librarySearch.toLowerCase()));
      const matchesSubject =
        librarySubjectFilter === "All" ||
        (d.subject && d.subject.toLowerCase() === librarySubjectFilter.toLowerCase());
      return matchesSearch && matchesSubject;
    });
  }, [decks, librarySearch, librarySubjectFilter]);

  function handleDeleteDeck(e, deckId) {
    e.stopPropagation();
    if (decks.length <= 1) return;
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    if (activeDeckId === deckId) {
      const remaining = decks.filter((d) => d.id !== deckId);
      if (remaining.length > 0) setActiveDeckId(remaining[0].id);
    }
  }

  const acceptedFiles = activeInput === "Image" ? "image/png,.png" : ".pdf,.docx,.txt";
  const fileHint =
    activeInput === "Image" ? "PNG image · up to 10 MB" : "PDF, DOCX, or TXT · up to 10 MB";

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
          <button
            className="topbar-icon"
            type="button"
            aria-label="Open Adaptive AI Tutor"
            onClick={() => setIsTutorOpen(true)}
            title="Open Adaptive AI Tutor"
          >
            <MessageCircle size={16} />
          </button>
          <button className="topbar-action" type="button" onClick={handleExport}>
            <ArrowDownToLine size={15} />
            <span>Export</span>
          </button>
          <button
            className="topbar-icon fullscreen-button"
            type="button"
            aria-label="Toggle fullscreen"
            onClick={handleFullscreen}
          >
            <Maximize size={15} />
          </button>
        </div>
      </header>

      <div className="workspace-frame">
        <aside className="sidebar">
          <a
            className="brand"
            href="#workspace"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection("Workspace");
            }}
          >
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>SkillLens</span>
          </a>

          <nav className="primary-nav" aria-label="Main navigation">
            {navigation.map(({ label, icon: Icon }) => {
              const count =
                label === "Flashcards"
                  ? totalCardsAllDecks
                  : label === "Quizzes"
                  ? totalQuizzesAllDecks
                  : label === "Library"
                  ? totalDecksCount
                  : null;
              return (
                <button
                  className={`nav-item${activeSection === label ? " active" : ""}`}
                  key={label}
                  type="button"
                  onClick={() => setActiveSection(label)}
                  aria-current={activeSection === label ? "page" : undefined}
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span>{label}</span>
                  {count !== null && <span className="nav-count">{count}</span>}
                </button>
              );
            })}
          </nav>

          {/* Dynamic Sidebar Progress Widget */}
          <div
            className="sidebar-progress"
            style={{ cursor: "pointer" }}
            onClick={() => setActiveSection("Progress")}
            title="Click to view full progress"
          >
            <div className="progress-title-row">
              <span className="progress-title" title={activeDeck.topic}>
                {activeDeck.topic.length > 15 ? `${activeDeck.topic.slice(0, 15)}...` : activeDeck.topic}
              </span>
              <span className="progress-badge">{activeDeckMastery}%</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Active deck mastery"
              aria-valuenow={activeDeckMastery}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span style={{ width: `${activeDeckMastery}%` }} />
            </div>
            <p>
              <strong>{masteredInActiveDeck} of {deckCards.length} cards</strong> mastered ·{" "}
              {deckCards.length - masteredInActiveDeck} to revisit
            </p>
          </div>
        </aside>

        <main className="main-content" id="workspace">
          {/* SECTION 1: WORKSPACE */}
          {activeSection === "Workspace" && (
            <section className="study-workspace" aria-labelledby="page-title">
              <div className="page-intro">
                <p className="section-kicker"><span className="kicker-dot" /> UNIVERSAL LEARNING ENGINE</p>
                <h1 id="page-title">What are you studying<br className="desktop-break" /> today?</h1>
                <p className="intro-copy">
                  Enter any topic across Mathematics, Physics, Chemistry, Biology, Computer Science, Law, Economics, or Arts.
                  SkillLens dynamically generates interactive visualizations, simulations, guided explanations, and adaptive practice.
                </p>
              </div>

              {/* Composer */}
              <form
                className="composer"
                onSubmit={handleSubmit}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleFileDrop}
              >
                <div className="input-tabs" role="tablist" aria-label="Study material type">
                  {inputModes.map(({ label, icon: Icon, enabled }) => (
                    <button
                      className={`input-tab${activeInput === label ? " selected" : ""}${
                        !enabled ? " unavailable" : ""
                      }`}
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
                        {imagePreview && (
                          <img
                            className="image-preview"
                            src={imagePreview}
                            alt="Selected image preview"
                          />
                        )}
                        <div className="selected-file-info">
                          <strong>{selectedFile.name}</strong>
                          <span>{(selectedFile.size / 1024).toFixed(0)} KB · PNG</span>
                        </div>
                        <button
                          className="remove-file"
                          type="button"
                          aria-label="Remove image"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="upload-prompt"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                      >
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
                        <button
                          className="remove-file"
                          type="button"
                          aria-label="Remove document"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="upload-prompt"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                      >
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
                      placeholder="Paste an academic article or Wikipedia URL..."
                      aria-label="Page URL"
                    />
                  </label>
                )}

                <label className="visually-hidden" htmlFor="study-prompt">Topic or learning objective</label>
                <textarea
                  id="study-prompt"
                  ref={promptRef}
                  value={prompt}
                  maxLength={MAX_PROMPT_CHARS}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      executeCuration();
                    }
                  }}
                  placeholder={
                    activeInput === "Image"
                      ? "Ask a question about the image or diagram, or leave blank for a complete lesson..."
                      : activeInput === "Document"
                      ? "Focus on a chapter, or leave blank to synthesize full document..."
                      : activeInput === "Link"
                      ? "Add specific questions about the linked resource, or leave blank..."
                      : "e.g., Calculus Tangents and Integrals, Projectile Motion, Photosynthesis, Binary Search, Contract Law..."
                  }
                  rows={2}
                />

                {/* Controls Bar: Difficulty & Providers */}
                <div className="composer-controls-row">
                  <DifficultySelector value={difficulty} onChange={setDifficulty} disabled={loading} />
                  <ProviderSelector value={provider} onChange={setProvider} disabled={loading} />
                </div>

                <div className="composer-footer">
                  <span className="char-counter">{prompt.length.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()}</span>
                  <div className="footer-actions">
                    <button className="create-button" type="submit" disabled={loading}>
                      {loading ? (
                        <span className="button-spinner" aria-hidden="true" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      <span>{loading ? "Planning Lesson..." : "Generate Interactive Lesson"}</span>
                    </button>
                  </div>
                </div>
              </form>

              <p className="drop-hint">
                {activeInput === "Text"
                  ? "Type any topic above and press Enter, or choose another input format."
                  : activeInput === "Image"
                  ? "Drop a PNG image here or choose a file above."
                  : activeInput === "Document"
                  ? "Drop a PDF, DOCX, or TXT file here or choose a file above."
                  : "Public HTTP(S) pages are fetched and converted into an interactive lesson."}
              </p>

              {error && <p className="status-message error-message" role="alert">{error}</p>}

              {/* ACTIVE LESSON WORKSPACE VIEW */}
              <section className="result-panel has-result" aria-live="polite">
                {/* Lesson Header Banner */}
                {activeLesson ? (
                  <LessonHeader lesson={activeLesson} onOpenTutor={() => setIsTutorOpen(true)} />
                ) : (
                  <div className="result-heading">
                    <div>
                      <p className="result-eyebrow"><Check size={14} /> STUDY SET ACTIVE</p>
                      <h2>{activeDeck.topic}</h2>
                    </div>
                  </div>
                )}

                {/* Tab Pill Group */}
                <div className="tab-pill-group" style={{ marginBottom: 18 }}>
                  {activeLesson?.visualization && (
                    <button
                      className={`pill-btn${activeResultTab === "Visualization" ? " active" : ""}`}
                      type="button"
                      onClick={() => setActiveResultTab("Visualization")}
                    >
                      <Sliders size={13} /> Interactive Simulation
                    </button>
                  )}
                  <button
                    className={`pill-btn${activeResultTab === "Explanation" ? " active" : ""}`}
                    type="button"
                    onClick={() => setActiveResultTab("Explanation")}
                  >
                    <BookOpen size={13} /> Guided Lesson
                  </button>
                  {activeLesson?.worked_examples && activeLesson.worked_examples.length > 0 && (
                    <button
                      className={`pill-btn${activeResultTab === "Worked Examples" ? " active" : ""}`}
                      type="button"
                      onClick={() => setActiveResultTab("Worked Examples")}
                    >
                      <CheckCircle2 size={13} /> Worked Problem
                    </button>
                  )}
                  <button
                    className={`pill-btn${activeResultTab === "Flashcards" ? " active" : ""}`}
                    type="button"
                    onClick={() => setActiveSection("Flashcards")}
                  >
                    <Layers3 size={13} /> Flashcards ({deckCards.length})
                  </button>
                  <button
                    className={`pill-btn${activeResultTab === "Quiz" ? " active" : ""}`}
                    type="button"
                    onClick={() => setActiveSection("Quizzes")}
                  >
                    <CircleHelp size={13} /> Quiz ({deckQuizzes.length})
                  </button>
                </div>

                {/* TAB 1: VISUALIZATION */}
                {activeResultTab === "Visualization" && (
                  <VisualizationRegistry
                    visualization={activeLesson?.visualization}
                    topic={activeDeck.topic}
                    difficulty={difficulty}
                  />
                )}

                {/* TAB 2: EXPLANATION / SECTIONS */}
                {activeResultTab === "Explanation" && (
                  activeLesson?.sections ? (
                    <LessonContent
                      sections={activeLesson.sections}
                      sources={activeLesson.sources}
                      disclaimer={activeLesson.metadata?.disclaimer}
                    />
                  ) : (
                    <div className="explanation-view-card">
                      <div className="explanation-body-text">
                        <FormattedContent text={activeDeck.rawText || result} />
                      </div>
                    </div>
                  )
                )}

                {/* TAB 3: WORKED EXAMPLES */}
                {activeResultTab === "Worked Examples" && activeLesson?.worked_examples && (
                  <WorkedExampleStepper
                    data={activeLesson.worked_examples[0]}
                    title={`Worked Exercise: ${activeDeck.topic}`}
                    description="Step through the mathematical and logical derivation phase by phase."
                  />
                )}
              </section>
            </section>
          )}

          {/* SECTION 2: FLASHCARDS */}
          {activeSection === "Flashcards" && (
            <section className="study-section flashcards-section">
              <div className="section-header-row">
                <div>
                  <p className="section-kicker"><Layers3 size={13} /> INTERACTIVE FLASHCARDS</p>
                  <h2>{activeDeck.topic}</h2>
                </div>
                <div className="section-actions-row">
                  <div className="card-filters">
                    {["All", "Review", "Mastered"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={`filter-btn ${cardFilter === f ? "active" : ""}`}
                        onClick={() => { setCardFilter(f); setCurrentCardIndex(0); setIsFlipped(false); }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="generate-more-btn"
                    onClick={handleGenerateMoreFlashcards}
                    disabled={generatingMoreCards}
                    title="Generate 4 more interactive flashcards with AI"
                  >
                    {generatingMoreCards ? <Loader2 size={14} className="spin-icon" /> : <Sparkles size={14} />}
                    <span>{generatingMoreCards ? "Generating Cards..." : "Generate More Flashcards"}</span>
                  </button>
                </div>
              </div>

              {filteredCards.length > 0 && activeCard ? (
                <div className="flashcard-study-container">
                  <div
                    className={`flashcard-3d ${isFlipped ? "flipped" : ""}`}
                    onClick={() => setIsFlipped((prev) => !prev)}
                    role="button"
                    tabIndex={0}
                    aria-label={isFlipped ? "Flashcard showing answer. Click to reveal question." : "Flashcard showing question. Click to reveal answer."}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setIsFlipped((prev) => !prev);
                      }
                    }}
                  >
                    <div className="flashcard-face flashcard-front">
                      <div className="card-face-header">
                        <span className="card-badge question-badge">Question • Card {currentCardIndex + 1} of {filteredCards.length}</span>
                        <span className="card-tap-indicator"><Eye size={12} /> Click card to flip</span>
                      </div>
                      <div className="card-body">
                        <p className="card-text">{activeCard.question}</p>
                      </div>
                      <div className="card-face-footer">
                        <button
                          type="button"
                          className="reveal-answer-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(true);
                          }}
                        >
                          <Eye size={14} /> Reveal Answer
                        </button>
                      </div>
                    </div>

                    <div className="flashcard-face flashcard-back">
                      <div className="card-face-header">
                        <span className="card-badge answer-badge">Answer • Card {currentCardIndex + 1} of {filteredCards.length}</span>
                        <span className="card-tap-indicator"><RotateCcw size={12} /> Click card to flip</span>
                      </div>
                      <div className="card-body">
                        <p className="card-text answer-text">{activeCard.answer}</p>
                      </div>
                      <div className="card-face-footer">
                        <button
                          type="button"
                          className="reveal-answer-btn flip-back-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(false);
                          }}
                        >
                          <RotateCcw size={14} /> Show Question
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fallback Direct Answer Bar (guarantees answer is always accessible) */}
                  <div className="flashcard-quick-toggle">
                    <button
                      type="button"
                      className={`reveal-toggle-pill ${isFlipped ? "active" : ""}`}
                      onClick={() => setIsFlipped((prev) => !prev)}
                    >
                      {isFlipped ? (
                        <>
                          <EyeOff size={14} /> Flip Back to Question
                        </>
                      ) : (
                        <>
                          <Eye size={14} /> Reveal Answer Now
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flashcard-controls">
                    <button type="button" className="fc-btn" onClick={prevCard} disabled={filteredCards.length <= 1}>
                      <ChevronLeft size={18} /> Prev
                    </button>
                    <button
                      type="button"
                      className="fc-btn flip-action-btn"
                      onClick={() => setIsFlipped((prev) => !prev)}
                    >
                      <RotateCcw size={15} />
                      <span>{isFlipped ? "Show Question" : "Reveal Answer"}</span>
                    </button>
                    <button
                      type="button"
                      className={`fc-btn mastery-btn ${activeCard.mastered ? "mastered" : ""}`}
                      onClick={() => toggleCardMastery(activeCard.id)}
                    >
                      {activeCard.mastered ? <CheckCircle2 size={16} /> : <Check size={16} />}
                      <span>{activeCard.mastered ? "Mastered" : "Mark Mastered"}</span>
                    </button>
                    <button type="button" className="fc-btn" onClick={nextCard} disabled={filteredCards.length <= 1}>
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-deck-notice">
                  <p>No cards match the filter &ldquo;{cardFilter}&rdquo;.</p>
                  <button
                    type="button"
                    className="vis-btn-primary"
                    onClick={handleGenerateMoreFlashcards}
                    disabled={generatingMoreCards}
                  >
                    {generatingMoreCards ? "Generating Cards..." : "Generate More Flashcards"}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* SECTION 3: QUIZZES */}
          {activeSection === "Quizzes" && (
            <section className="study-section quizzes-section">
              <div className="section-header-row">
                <div>
                  <p className="section-kicker"><CircleHelp size={13} /> KNOWLEDGE CHECK</p>
                  <h2>Diagnostic Quiz: {activeDeck.topic}</h2>
                </div>
                <div className="section-actions-row">
                  {quizSubmitted && (
                    <div className="quiz-score-badge">
                      <Trophy size={16} />
                      <span>Score: {quizScore} / {deckQuizzes.length} ({Math.round((quizScore / (deckQuizzes.length || 1)) * 100)}%)</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="generate-more-btn"
                    onClick={handleGenerateMoreQuizQuestions}
                    disabled={generatingMoreQuestions}
                    title="Generate additional adaptive practice questions with AI"
                  >
                    {generatingMoreQuestions ? <Loader2 size={14} className="spin-icon" /> : <Sparkles size={14} />}
                    <span>{generatingMoreQuestions ? "Generating Questions..." : "Generate More Questions"}</span>
                  </button>
                </div>
              </div>

              <div className="quiz-questions-list">
                {deckQuizzes.map((q, idx) => {
                  const selectedKey = quizAnswers[q.id];
                  const isCorrect = selectedKey === q.correctAnswer;
                  return (
                    <div key={q.id || idx} className="quiz-question-card">
                      <span className="q-number">Question {idx + 1} of {deckQuizzes.length}</span>
                      <h4 className="q-title">{q.question}</h4>
                      <div className="q-options-grid">
                        {q.options.map((opt) => {
                          const isOptionSelected = selectedKey === opt.key;
                          let optClass = "quiz-opt-btn";
                          if (isOptionSelected) optClass += " selected";
                          if (quizSubmitted) {
                            if (opt.key === q.correctAnswer) optClass += " correct-opt";
                            else if (isOptionSelected) optClass += " wrong-opt";
                          }

                          return (
                            <button
                              key={opt.key}
                              type="button"
                              className={optClass}
                              onClick={() => selectQuizOption(q.id, opt.key)}
                              disabled={quizSubmitted}
                            >
                              <span className="opt-key">{opt.key}</span>
                              <span className="opt-text">{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className={`quiz-feedback-box ${isCorrect ? "correct" : "incorrect"}`}>
                          <div className="feedback-status">
                            {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            <span>{isCorrect ? "Correct!" : `Incorrect. Correct answer is ${q.correctAnswer}`}</span>
                          </div>
                          {q.explanation && <p className="feedback-explanation">{q.explanation}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="quiz-submit-bar">
                {!quizSubmitted ? (
                  <button
                    type="button"
                    className="vis-btn-primary"
                    disabled={Object.keys(quizAnswers).length === 0}
                    onClick={() => setQuizSubmitted(true)}
                  >
                    Submit Quiz Answers
                  </button>
                ) : (
                  <button
                    type="button"
                    className="vis-btn-ghost"
                    onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}
                  >
                    <RotateCcw size={14} /> Retake Quiz
                  </button>
                )}
                <button
                  type="button"
                  className="vis-btn-ghost generate-quiz-bar-btn"
                  onClick={handleGenerateMoreQuizQuestions}
                  disabled={generatingMoreQuestions}
                >
                  {generatingMoreQuestions ? <Loader2 size={14} className="spin-icon" /> : <Plus size={14} />}
                  <span>{generatingMoreQuestions ? "Generating..." : "Add More Questions"}</span>
                </button>
              </div>
            </section>
          )}

          {/* SECTION 4: PROGRESS */}
          {activeSection === "Progress" && (
            <section className="study-section progress-section">
              <div className="section-header-row">
                <div>
                  <p className="section-kicker"><BarChart3 size={13} /> LEARNING ANALYTICS</p>
                  <h2>Mastery & Progress Dashboard</h2>
                  <p className="section-subtitle">
                    Real-time retention metrics, topic completion bars, and curriculum-wide readiness.
                  </p>
                </div>
              </div>

              {/* Master Curriculum Progress Hero Bar */}
              <div className="progress-hero-card">
                <div className="hero-progress-top">
                  <div>
                    <span className="hero-kicker">CURRICULUM COMPLETION</span>
                    <h3 className="hero-title">Overall Knowledge Mastery</h3>
                  </div>
                  <div className="hero-score-pill">
                    <Trophy size={18} className="trophy-icon" />
                    <span className="hero-pct">{overallMasteryPct}%</span>
                  </div>
                </div>

                <div className="curriculum-progress-track" role="progressbar" aria-valuenow={overallMasteryPct}>
                  <div
                    className="curriculum-progress-fill"
                    style={{ width: `${overallMasteryPct}%` }}
                  />
                </div>

                <div className="hero-meta-row">
                  <span className="meta-item">
                    <strong>{totalMasteredAllDecks}</strong> of <strong>{totalCardsAllDecks}</strong> total cards mastered
                  </span>
                  <span className="meta-item">
                    <strong>{totalQuizzesAllDecks}</strong> assessment questions across <strong>{totalDecksCount}</strong> decks
                  </span>
                </div>
              </div>

              {/* Stat Highlights Grid */}
              <div className="progress-stats-grid">
                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Active Deck Mastery</span>
                    <Target size={16} className="stat-icon" />
                  </div>
                  <span className="stat-value">{activeDeckMastery}%</span>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill" style={{ width: `${activeDeckMastery}%` }} />
                  </div>
                  <span className="stat-sub">{masteredInActiveDeck} of {deckCards.length} cards in &ldquo;{activeDeck.topic}&rdquo;</span>
                </div>

                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Total Retention</span>
                    <Award size={16} className="stat-icon" />
                  </div>
                  <span className="stat-value">{totalMasteredAllDecks} Cards</span>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill green" style={{ width: `${overallMasteryPct}%` }} />
                  </div>
                  <span className="stat-sub">Across all {totalDecksCount} active modules</span>
                </div>

                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Diagnostic Quizzes</span>
                    <CircleHelp size={16} className="stat-icon" />
                  </div>
                  <span className="stat-value">{totalQuizzesAllDecks}</span>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill purple" style={{ width: `${Math.min(100, totalQuizzesAllDecks * 12)}%` }} />
                  </div>
                  <span className="stat-sub">Dynamic practice items ready</span>
                </div>

                <div className="stat-card">
                  <div className="stat-card-header">
                    <span className="stat-label">Study Streak</span>
                    <Flame size={16} className="stat-icon streak" />
                  </div>
                  <span className="stat-value">5 Days 🔥</span>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill amber" style={{ width: "71%" }} />
                  </div>
                  <span className="stat-sub">Consistent active study habits</span>
                </div>
              </div>

              {/* Active Deck In-Depth Breakdown */}
              <div className="progress-deck-deepdive">
                <div className="deepdive-header">
                  <div>
                    <span className="deepdive-kicker">CURRENT TOPIC BREAKDOWN</span>
                    <h4>{activeDeck.topic}</h4>
                  </div>
                  <div className="deepdive-actions">
                    <button
                      type="button"
                      className="vis-btn-primary"
                      onClick={() => setActiveSection("Flashcards")}
                    >
                      <Layers3 size={14} /> Study Flashcards
                    </button>
                    <button
                      type="button"
                      className="vis-btn-ghost"
                      onClick={() => setActiveSection("Quizzes")}
                    >
                      <CircleHelp size={14} /> Practice Quiz
                    </button>
                  </div>
                </div>

                {/* Segmented Retention Bar */}
                <div className="segmented-progress-wrapper">
                  <div className="segmented-meta">
                    <span>Card Retention Breakdown</span>
                    <span>{masteredInActiveDeck} mastered · {deckCards.length - masteredInActiveDeck} in review</span>
                  </div>
                  <div className="segmented-bar">
                    <div
                      className="seg-mastered"
                      style={{ width: `${activeDeckMastery}%` }}
                      title={`Mastered: ${activeDeckMastery}%`}
                    />
                    <div
                      className="seg-review"
                      style={{ width: `${100 - activeDeckMastery}%` }}
                      title={`Review Needed: ${100 - activeDeckMastery}%`}
                    />
                  </div>
                  <div className="segmented-legend">
                    <span className="legend-item"><span className="legend-dot green" /> Mastered ({masteredInActiveDeck})</span>
                    <span className="legend-item"><span className="legend-dot purple" /> To Review ({deckCards.length - masteredInActiveDeck})</span>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Progress Bars */}
              {subjectBreakdown.length > 0 && (
                <div className="subject-mastery-card">
                  <h4>Curriculum by Subject Domain</h4>
                  <div className="subject-progress-list">
                    {subjectBreakdown.map((sb) => (
                      <div key={sb.subject} className="subject-progress-row">
                        <div className="sp-info">
                          <span className="sp-name">{sb.subject}</span>
                          <span className="sp-stats">{sb.deckCount} deck(s) · {sb.masteredCards}/{sb.totalCards} cards</span>
                        </div>
                        <div className="sp-bar-container">
                          <div className="sp-bar-track">
                            <div className="sp-bar-fill" style={{ width: `${sb.pct}%` }} />
                          </div>
                          <span className="sp-pct">{sb.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SECTION 5: LIBRARY */}
          {activeSection === "Library" && (
            <section className="study-section library-section">
              <div className="section-header-row">
                <div>
                  <p className="section-kicker"><BookOpen size={13} /> CURRICULUM LIBRARY</p>
                  <h2>Your Study Decks ({decks.length})</h2>
                  <p className="section-subtitle">
                    Manage, review, and jump directly into your interactive learning modules.
                  </p>
                </div>
                <button
                  type="button"
                  className="vis-btn-primary new-lesson-btn"
                  onClick={() => {
                    setActiveSection("Workspace");
                    promptRef.current?.focus();
                  }}
                >
                  <Plus size={15} />
                  <span>New Study Topic</span>
                </button>
              </div>

              {/* Library Search & Filter Bar */}
              <div className="library-toolbar">
                <div className="library-search-box">
                  <Search size={15} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search decks by topic or subject..."
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    className="library-search-input"
                  />
                  {librarySearch && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setLibrarySearch("")}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="library-subject-pills">
                  {["All", "Computer Science", "Physics", "Chemistry", "Biology", "Mathematics", "General"].map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      className={`subject-pill ${librarySubjectFilter === subj ? "active" : ""}`}
                      onClick={() => setLibrarySubjectFilter(subj)}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Decks Grid with Improvised Progress Bars */}
              {filteredLibraryDecks.length > 0 ? (
                <div className="decks-grid">
                  {filteredLibraryDecks.map((d) => {
                    const isActive = d.id === activeDeck.id;
                    const cardCount = d.cards?.length || 0;
                    const quizCount = d.quizzes?.length || 0;
                    const masteredCount = d.cards?.filter((c) => c.mastered).length || 0;
                    const masteryPct = cardCount > 0 ? Math.round((masteredCount / cardCount) * 100) : 0;
                    const subjectKey = (d.subject || "general").toLowerCase().replace(/\s+/g, "_");

                    return (
                      <div
                        key={d.id}
                        className={`deck-card ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setActiveDeckId(d.id);
                          setActiveSection("Workspace");
                          setActiveResultTab("Visualization");
                        }}
                      >
                        <div className="deck-card-top">
                          <span className={`deck-subject-badge subject-${subjectKey}`}>
                            {d.subject || "General"}
                          </span>
                          <div className="deck-card-badges-right">
                            {isActive && <span className="active-tag"><Sparkles size={11} /> Current</span>}
                            <span className={`deck-mastery-tag ${masteryPct === 100 ? "complete" : masteryPct > 0 ? "in-progress" : ""}`}>
                              {masteryPct}% Mastered
                            </span>
                          </div>
                        </div>

                        <h4 className="deck-title" title={d.topic}>{d.topic}</h4>

                        {/* Interactive Progress Bar */}
                        <div className="deck-progress-wrapper">
                          <div className="deck-progress-meta">
                            <span className="dp-label">Topic Mastery</span>
                            <span className="dp-pct">{masteryPct}%</span>
                          </div>
                          <div
                            className="deck-progress-bar"
                            role="progressbar"
                            aria-valuenow={masteryPct}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            <div
                              className="deck-progress-fill"
                              style={{ width: `${masteryPct}%` }}
                            />
                          </div>
                          <span className="deck-progress-sub">
                            {masteredCount} of {cardCount} cards mastered
                          </span>
                        </div>

                        <div className="deck-stats-chips">
                          <span className="stat-chip"><Layers3 size={13} /> {cardCount} cards</span>
                          <span className="stat-chip"><CircleHelp size={13} /> {quizCount} questions</span>
                        </div>

                        {/* Card Hover Action Bar */}
                        <div className="deck-card-actions">
                          <button
                            type="button"
                            className="deck-action-btn primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDeckId(d.id);
                              setActiveSection("Workspace");
                              setActiveResultTab("Visualization");
                            }}
                          >
                            <Play size={12} /> Study
                          </button>
                          <button
                            type="button"
                            className="deck-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDeckId(d.id);
                              setActiveSection("Flashcards");
                            }}
                          >
                            <Layers3 size={12} /> Cards
                          </button>
                          <button
                            type="button"
                            className="deck-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDeckId(d.id);
                              setActiveSection("Quizzes");
                            }}
                          >
                            <CircleHelp size={12} /> Quiz
                          </button>
                          {decks.length > 1 && (
                            <button
                              type="button"
                              className="deck-delete-btn"
                              title="Delete deck"
                              onClick={(e) => handleDeleteDeck(e, d.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-deck-notice">
                  <BookOpen size={32} />
                  <p>No study decks match &ldquo;{librarySearch}&rdquo; in {librarySubjectFilter}.</p>
                  <button
                    type="button"
                    className="vis-btn-ghost"
                    onClick={() => { setLibrarySearch(""); setLibrarySubjectFilter("All"); }}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* ADAPTIVE AI TUTOR DRAWER */}
      <AdaptiveTutorDrawer
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        topic={activeDeck.topic}
        difficulty={difficulty}
        lessonSummary={activeDeck.rawText}
        provider={provider}
        onAddPracticeQuiz={handleAddPracticeQuestions}
      />
    </div>
  );
}
