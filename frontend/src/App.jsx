import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  FileText,
  Flame,
  Image as ImageIcon,
  Layers3,
  Link2,
  Maximize,
  MessageCircle,
  PanelLeft,
  RotateCcw,
  Sparkles,
  Trash2,
  Trophy,
  Type,
  Upload,
  X,
  XCircle,
} from "lucide-react";

const MODEL_LABEL = "gemma-4-26b-a4b-it";
const MAX_PROMPT_CHARS = 10_000;

const initialDecks = [
  {
    id: "deck-thermo",
    topic: "Thermodynamics (Sample)",
    createdAt: "Sample Deck",
    cards: [
      {
        id: "fc-1",
        question: "What is the First Law of Thermodynamics?",
        answer: "Energy cannot be created or destroyed; it can only change form (Conservation of Energy). The change in internal energy equals heat added minus work done: ΔU = Q - W.",
        mastered: true,
      },
      {
        id: "fc-2",
        question: "How does the Second Law of Thermodynamics define Entropy?",
        answer: "The total entropy of an isolated system always increases over time, meaning natural processes are irreversible and disorder tends to maximize.",
        mastered: true,
      },
      {
        id: "fc-3",
        question: "What is an Isothermal Process?",
        answer: "A thermodynamic process in which the temperature of a system remains constant (ΔT = 0), so the internal energy of an ideal gas remains unchanged.",
        mastered: false,
      },
      {
        id: "fc-4",
        question: "What is an Adiabatic Process?",
        answer: "A process occurring without any heat transfer between the system and its surroundings (Q = 0). Temperature changes purely due to work done.",
        mastered: false,
      },
      {
        id: "fc-5",
        question: "What is the Third Law of Thermodynamics?",
        answer: "As the temperature of a system approaches absolute zero (0 Kelvin), the entropy of a pure crystalline substance approaches a minimum constant value (zero).",
        mastered: true,
      },
      {
        id: "fc-6",
        question: "What is Carnot Efficiency?",
        answer: "The maximum theoretical efficiency of any heat engine operating between two temperatures: η = 1 - (Tc / Th), where temperatures are in Kelvin.",
        mastered: false,
      },
    ],
    quizzes: [
      {
        id: "qz-1",
        question: "In an adiabatic expansion of an ideal gas, which quantity is strictly zero?",
        options: [
          { key: "A", text: "Work done by the gas" },
          { key: "B", text: "Heat exchanged (Q)" },
          { key: "C", text: "Change in internal energy (ΔU)" },
          { key: "D", text: "Change in temperature (ΔT)" },
        ],
        correctAnswer: "B",
        explanation: "By definition, an adiabatic process occurs with zero heat exchange with surroundings (Q = 0).",
      },
      {
        id: "qz-2",
        question: "Which law states that absolute zero temperature cannot be reached in a finite number of steps?",
        options: [
          { key: "A", text: "Zeroth Law" },
          { key: "B", text: "First Law" },
          { key: "C", text: "Second Law" },
          { key: "D", text: "Third Law" },
        ],
        correctAnswer: "D",
        explanation: "The Third Law of Thermodynamics implies that it is impossible to cool a system to absolute zero via a finite thermodynamic cycle.",
      },
      {
        id: "qz-3",
        question: "What happens to the entropy of an isolated system during an irreversible spontaneous process?",
        options: [
          { key: "A", text: "It decreases" },
          { key: "B", text: "It remains zero" },
          { key: "C", text: "It increases" },
          { key: "D", text: "It oscillates" },
        ],
        correctAnswer: "C",
        explanation: "The Second Law dictates that the entropy of an isolated system always increases for any irreversible spontaneous process.",
      },
      {
        id: "qz-4",
        question: "If 100 J of heat is added to a system and the system does 40 J of work, what is the change in internal energy?",
        options: [
          { key: "A", text: "60 J" },
          { key: "B", text: "140 J" },
          { key: "C", text: "-60 J" },
          { key: "D", text: "4000 J" },
        ],
        correctAnswer: "A",
        explanation: "By the First Law: ΔU = Q - W = 100 J - 40 J = 60 J.",
      },
    ],
  },
];

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

function buildPrompt(text, mode) {
  const directions = {
    Explain: "Explain the material clearly and accurately. Start with the core idea, then explain important details and give one useful example.",
    Flashcards: "Create 5 to 8 concise study flashcards for this specific topic. Format each card strictly as:\nQ: [Question or concept]\nA: [Clear, informative answer]\nFocus solely on this topic.",
    Quiz: "Create a multiple-choice quiz with 4 to 5 questions specifically for this topic. Format each question strictly as:\n1. [Question text]\nA) [Option A]\nB) [Option B]\nC) [Option C]\nD) [Option D]\nAnswer: [Letter]\nExplanation: [Why this option is correct]\nFocus solely on this topic.",
    All: "Create a complete study set with three distinct sections for this specific topic: 1) Explanation, 2) Flashcards (formatted strictly with Q: and A:), and 3) Quiz (with questions 1-4, options A-D, Answer: [Letter], and Explanation:).",
  };
  return `${directions[mode]}\n\nStudy topic or question:\n${text}`;
}

function parseFlashcardsFromText(text, topicFallback = "Study Card") {
  if (!text) return [];
  const cards = [];
  const qaRegex = /(?:^|\n)(?:\d+[\.\)]\s*|\*\*|#+\s*)?(?:Q|Question):\s*([\s\S]*?)(?:\n(?:\*\*|#+\s*)?(?:A|Answer):\s*([\s\S]*?))(?=\n(?:\d+[\.\)]\s*|\*\*|#+\s*)?(?:Q|Question):|$)/gi;
  let match;
  while ((match = qaRegex.exec(text)) !== null) {
    const q = match[1].replace(/\*\*/g, "").trim();
    const a = match[2].replace(/\*\*/g, "").trim();
    if (q && a) {
      cards.push({
        id: `fc-${Date.now()}-${cards.length + 1}`,
        question: q,
        answer: a,
        mastered: false,
      });
    }
  }

  // Fallback parser if Gemma formatted with bullet points or bold keys
  if (cards.length === 0) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      if (
        (line.startsWith("**") && line.endsWith("**")) ||
        line.toLowerCase().startsWith("concept:") ||
        line.endsWith("?")
      ) {
        cards.push({
          id: `fc-fallback-${Date.now()}-${cards.length + 1}`,
          question: line.replace(/\*\*/g, "").replace(/^concept:\s*/i, "").trim(),
          answer: nextLine.replace(/\*\*/g, "").trim(),
          mastered: false,
        });
        i++;
      }
    }
  }

  return cards;
}

function parseQuizFromText(text) {
  if (!text) return [];
  const questions = [];
  const qBlocks = text.split(/(?=\n\s*(?:\d+[\.\)]|\*\*Question\s*\d+[\.\:]\*\*)\s+)/g);

  for (const block of qBlocks) {
    const lines = block.trim().split("\n");
    if (!lines[0]) continue;
    const isNumbered = /^(?:\d+[\.\)]|\*\*Question\s*\d+)/.test(lines[0].trim());
    if (!isNumbered && questions.length > 0) continue;

    const questionText = lines[0]
      .replace(/^(?:\d+[\.\)]|\*\*Question\s*\d+[\.\:]\*\*)\s*/, "")
      .replace(/\*\*/g, "")
      .trim();

    const options = [];
    let correctAnswer = "";
    let explanation = "";

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const optMatch = line.match(/^[\*\-]?\s*\(?([A-Da-d])\)?[.:\s]\s*(.+)/);
      if (optMatch) {
        options.push({
          key: optMatch[1].toUpperCase(),
          text: optMatch[2].replace(/\*\*/g, "").trim(),
        });
      } else {
        const ansMatch = line.match(/(?:Answer|Correct Answer|Key):\s*\(?([A-Da-d])\)?(?:\s*[-:–]\s*(.*))?/i);
        if (ansMatch) {
          correctAnswer = ansMatch[1].toUpperCase();
          if (ansMatch[2]) explanation = ansMatch[2].replace(/\*\*/g, "").trim();
        } else if (/^Explanation:\s*(.+)/i.test(line)) {
          explanation = line.replace(/^Explanation:\s*/i, "").replace(/\*\*/g, "").trim();
        }
      }
    }

    if (questionText && options.length >= 2) {
      questions.push({
        id: `qz-${Date.now()}-${questions.length + 1}`,
        question: questionText,
        options,
        correctAnswer: correctAnswer || options[0].key,
        explanation: explanation || "Verified with study notes.",
      });
    }
  }

  return questions;
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

  // Topic Decks Management
  const [decks, setDecks] = useState(initialDecks);
  const [activeDeckId, setActiveDeckId] = useState(initialDecks[0].id);

  // Direct On-Demand Topic Curators in tabs
  const [quickTopicInput, setQuickTopicInput] = useState("");
  const [curatingTopic, setCuratingTopic] = useState(false);

  // Flashcards Study Interactive State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardFilter, setCardFilter] = useState("All");

  // Quiz Interactive State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Result parsed items
  const [parsedCards, setParsedCards] = useState([]);
  const [parsedQuizList, setParsedQuizList] = useState([]);
  const [activeResultTab, setActiveResultTab] = useState("Interactive");

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
  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0] || {
    id: "empty",
    topic: "No Deck",
    cards: [],
    quizzes: [],
  };

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

  // Create or update a deck with curated topic materials
  function saveCuratedDeck(topicTitle, cards, quizzesList, rawText = "") {
    const newDeckId = `deck-${Date.now()}`;
    const newDeck = {
      id: newDeckId,
      topic: topicTitle,
      createdAt: "Just now",
      cards: cards.length > 0 ? cards : [],
      quizzes: quizzesList.length > 0 ? quizzesList : [],
      rawText,
    };

    setDecks((prev) => [newDeck, ...prev]);
    setActiveDeckId(newDeckId);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    return newDeckId;
  }

  // On-demand topic curation using Gemma directly from Flashcards or Quizzes view
  async function handleDirectTopicCuration(targetMode = "Flashcards") {
    const topicToCurate = quickTopicInput.trim();
    if (!topicToCurate) {
      setError("Please type a topic first (e.g., Photosynthesis, Python OOP, Quantum Mechanics).");
      return;
    }

    setCuratingTopic(true);
    setError("");
    try {
      const modeToRequest = targetMode === "Quiz" ? "Quiz" : "All";
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt(topicToCurate, modeToRequest) }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Gemma could not curate this topic. Try again.");
      }

      const textOutput = data.response;
      const extractedCards = parseFlashcardsFromText(textOutput, topicToCurate);
      const extractedQuizzes = parseQuizFromText(textOutput);

      if (extractedCards.length === 0 && targetMode === "Flashcards") {
        // Fallback: create cards from explanation
        extractedCards.push({
          id: `fc-${Date.now()}-1`,
          question: `Core concept of ${topicToCurate}`,
          answer: textOutput.slice(0, 300),
          mastered: false,
        });
      }

      saveCuratedDeck(topicToCurate, extractedCards, extractedQuizzes, textOutput);
      setQuickTopicInput("");
      setResult(textOutput);
      setParsedCards(extractedCards);
      setParsedQuizList(extractedQuizzes);
    } catch (err) {
      setError(err.message || "Failed to curate topic.");
    } finally {
      setCuratingTopic(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    setError("");
    setResult("");
    setParsedCards([]);
    setParsedQuizList([]);

    if (activeInput === "Text" && !cleanPrompt) {
      setError("Add a topic or question first.");
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
      const textOutput = data.response;
      setResult(textOutput);

      // Determine topic title
      const topicTitle =
        cleanPrompt.length > 0 && cleanPrompt.length < 50
          ? cleanPrompt
          : selectedFile?.name
          ? selectedFile.name.replace(/\.[^/.]+$/, "")
          : cleanPrompt.slice(0, 36) || "Study Topic";

      // Parse interactive elements for this specific topic
      const extractedCards = parseFlashcardsFromText(textOutput, topicTitle);
      const extractedQuizzes = parseQuizFromText(textOutput);
      setParsedCards(extractedCards);
      setParsedQuizList(extractedQuizzes);

      // Save as dedicated topic deck and make it active!
      saveCuratedDeck(topicTitle, extractedCards, extractedQuizzes, textOutput);
    } catch (requestError) {
      setError(requestError.message || "Unable to reach the SkillLens service.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!result && !activeDeck.rawText) {
      setError("Create a study set before exporting.");
      return;
    }
    const content = result || activeDeck.rawText || JSON.stringify(activeDeck, null, 2);
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
    setCurrentCardIndex((prev) =>
      prev === 0 ? Math.max(0, filteredCards.length - 1) : prev - 1
    );
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

  // Overall calculations across all decks
  const totalCardsAllDecks = decks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
  const totalMasteredAllDecks = decks.reduce(
    (sum, d) => sum + (d.cards?.filter((c) => c.mastered).length || 0),
    0
  );
  const totalQuizzesAllDecks = decks.reduce((sum, d) => sum + (d.quizzes?.length || 0), 0);
  const totalDecksCount = decks.length;

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
            aria-label="Open chat"
            onClick={() => {
              setActiveSection("Workspace");
              promptRef.current?.focus();
            }}
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
                {activeDeck.topic.length > 15
                  ? `${activeDeck.topic.slice(0, 15)}...`
                  : activeDeck.topic}
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
                <p className="section-kicker"><span className="kicker-dot" /> YOUR STUDY WORKSPACE</p>
                <h1 id="page-title">What are you studying<br className="desktop-break" /> today?</h1>
                <p className="intro-copy">
                  Enter any topic, notes, photo, or document. Gemma 4 curates a dedicated study deck with
                  interactive flashcards and multiple-choice quizzes specifically for your topic.
                </p>
              </div>

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
                  placeholder={
                    activeInput === "Image"
                      ? "Ask a question about the image, or leave blank for a summary"
                      : activeInput === "Document"
                      ? "Ask about the document, or leave blank for a summary"
                      : activeInput === "Link"
                      ? "Ask about this page, or leave blank for a summary"
                      : "Type your topic or paste notes, e.g. 'Photosynthesis in C3 and C4 plants' or 'Recursion in Computer Science'"
                  }
                  aria-describedby="prompt-count"
                />

                <div className="composer-footer">
                  <span className="character-count" id="prompt-count">
                    {prompt.length.toLocaleString()} / {MAX_PROMPT_CHARS.toLocaleString()}
                  </span>
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
                      {loading ? (
                        <span className="button-spinner" aria-hidden="true" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      <span>{loading ? "Curating..." : "Curate with Gemma"}</span>
                    </button>
                  </div>
                </div>
              </form>

              <p className="drop-hint">
                {activeInput === "Text"
                  ? "Choose a source above, or drop a PNG, PDF, DOCX, or TXT here."
                  : activeInput === "Image"
                  ? "Drop a PNG image here or choose a file above."
                  : activeInput === "Document"
                  ? "Drop a PDF, DOCX, or TXT file here or choose a file above."
                  : "Public HTTP(S) pages are fetched and summarized by Gemma."}
              </p>

              {error && <p className="status-message error-message" role="alert">{error}</p>}

              <section
                className={`result-panel${result ? " has-result" : ""}`}
                aria-live="polite"
                aria-label="Study set result"
              >
                {result ? (
                  <>
                    <div className="result-heading">
                      <div>
                        <p className="result-eyebrow"><Check size={14} /> STUDY SET READY</p>
                        <h2>
                          {studyMode === "All"
                            ? `Curated Study Set: ${activeDeck.topic}`
                            : `${studyMode}: ${activeDeck.topic}`}
                        </h2>
                      </div>
                      <div className="result-header-actions">
                        {(parsedCards.length > 0 || parsedQuizList.length > 0) && (
                          <div className="tab-pill-group">
                            <button
                              className={`pill-btn${activeResultTab === "Interactive" ? " active" : ""}`}
                              type="button"
                              onClick={() => setActiveResultTab("Interactive")}
                            >
                              <Sparkles size={13} /> Interactive
                            </button>
                            <button
                              className={`pill-btn${activeResultTab === "Text" ? " active" : ""}`}
                              type="button"
                              onClick={() => setActiveResultTab("Text")}
                            >
                              <FileText size={13} /> Raw Output
                            </button>
                          </div>
                        )}
                        <span className="model-badge">{MODEL_LABEL}</span>
                      </div>
                    </div>

                    {activeResultTab === "Interactive" && (parsedCards.length > 0 || parsedQuizList.length > 0) ? (
                      <div className="result-interactive-view">
                        {parsedCards.length > 0 && (
                          <div className="interactive-block">
                            <div className="block-header">
                              <h3><Layers3 size={16} /> Curated Flashcards ({parsedCards.length})</h3>
                              <button
                                className="action-pill-btn"
                                type="button"
                                onClick={() => setActiveSection("Flashcards")}
                              >
                                Study This Deck Now <ArrowRight size={13} />
                              </button>
                            </div>
                            <div className="cards-preview-row">
                              {parsedCards.slice(0, 3).map((c, i) => (
                                <div key={c.id || i} className="mini-card">
                                  <span className="card-num">Q{i + 1}</span>
                                  <p className="card-q">{c.question}</p>
                                  <p className="card-a">{c.answer}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {parsedQuizList.length > 0 && (
                          <div className="interactive-block">
                            <div className="block-header">
                              <h3><CircleHelp size={16} /> Curated Quiz ({parsedQuizList.length} Questions)</h3>
                              <button
                                className="action-pill-btn"
                                type="button"
                                onClick={() => setActiveSection("Quizzes")}
                              >
                                Take Quiz Now <ArrowRight size={13} />
                              </button>
                            </div>
                            <div className="quiz-preview-list">
                              {parsedQuizList.slice(0, 2).map((q, i) => (
                                <div key={q.id || i} className="mini-quiz-item">
                                  <p className="quiz-q-title"><strong>Q{i + 1}:</strong> {q.question}</p>
                                  <div className="mini-opts">
                                    {q.options.map((opt) => (
                                      <span key={opt.key} className="mini-opt-badge">
                                        <strong>{opt.key}:</strong> {opt.text}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="result-copy">{result}</div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon"><BookOpen size={19} strokeWidth={1.7} /></span>
                    <p>Enter your topic above to curate dedicated flashcards and a quiz with Gemma.</p>
                  </div>
                )}
              </section>
            </section>
          )}

          {/* SECTION 2: FLASHCARDS */}
          {activeSection === "Flashcards" && (
            <section className="section-container">
              <div className="section-header-row">
                <div>
                  <p className="section-kicker"><span className="kicker-dot" /> FLASHCARDS STUDIO</p>
                  <h2>Study & Memorize</h2>
                  <p className="intro-copy">
                    Interactive flip-cards tailored specifically to your chosen topic.
                  </p>
                </div>
                <div className="deck-filter-pills">
                  {["All", "Review", "Mastered"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`pill-btn${cardFilter === filter ? " active" : ""}`}
                      onClick={() => {
                        setCardFilter(filter);
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Selector & Direct Gemma Generator Bar */}
              <div className="topic-toolbar-card">
                <div className="topic-selector-group">
                  <label htmlFor="deck-select">Active Topic Deck:</label>
                  <select
                    id="deck-select"
                    className="topic-dropdown"
                    value={activeDeck.id}
                    onChange={(e) => {
                      setActiveDeckId(e.target.value);
                      setCurrentCardIndex(0);
                      setIsFlipped(false);
                    }}
                  >
                    {decks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.topic} ({d.cards?.length || 0} cards)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="quick-curate-inline">
                  <input
                    type="text"
                    className="quick-curate-input"
                    placeholder="Or type a new topic (e.g. Photosynthesis, Machine Learning)..."
                    value={quickTopicInput}
                    onChange={(e) => setQuickTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleDirectTopicCuration("Flashcards");
                    }}
                  />
                  <button
                    type="button"
                    className="action-pill-btn curate-btn"
                    onClick={() => handleDirectTopicCuration("Flashcards")}
                    disabled={curatingTopic}
                  >
                    {curatingTopic ? <span className="button-spinner" /> : <Sparkles size={14} />}
                    <span>Curate with Gemma</span>
                  </button>
                </div>
              </div>

              {filteredCards.length > 0 && activeCard ? (
                <div className="flashcard-player-container">
                  <div className="player-meta-bar">
                    <span className="deck-topic-tag">
                      Topic: <strong>{activeDeck.topic}</strong> · Card {currentCardIndex + 1} of{" "}
                      {filteredCards.length}
                    </span>
                    <button
                      type="button"
                      className={`mastery-toggle-btn${activeCard.mastered ? " mastered" : ""}`}
                      onClick={() => toggleCardMastery(activeCard.id)}
                    >
                      {activeCard.mastered ? (
                        <>
                          <CheckCircle2 size={15} /> Mastered
                        </>
                      ) : (
                        <>
                          <RotateCcw size={15} /> Needs Review
                        </>
                      )}
                    </button>
                  </div>

                  {/* 3D Flip Card */}
                  <div
                    className={`flashcard-card${isFlipped ? " flipped" : ""}`}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <div className="card-face card-front">
                      <div className="card-tag">QUESTION</div>
                      <p className="card-main-text">{activeCard.question}</p>
                      <span className="card-tap-hint">
                        <Eye size={13} /> Click to reveal answer
                      </span>
                    </div>
                    <div className="card-face card-back">
                      <div className="card-tag answer-tag">ANSWER</div>
                      <p className="card-main-text">{activeCard.answer}</p>
                      <span className="card-tap-hint">
                        <RotateCcw size={13} /> Click to flip back
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="player-controls">
                    <button
                      type="button"
                      className="nav-control-btn"
                      onClick={prevCard}
                      aria-label="Previous card"
                    >
                      <ChevronLeft size={18} /> Previous
                    </button>
                    <button
                      type="button"
                      className="flip-action-btn"
                      onClick={() => setIsFlipped(!isFlipped)}
                    >
                      {isFlipped ? "Show Question" : "Reveal Answer"}
                    </button>
                    <button
                      type="button"
                      className="nav-control-btn"
                      onClick={nextCard}
                      aria-label="Next card"
                    >
                      Next <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-section-box">
                  <Layers3 size={32} />
                  <h3>No flashcards in "{activeDeck.topic}" for filter "{cardFilter}"</h3>
                  <p>Type a topic above to have Gemma curate fresh flashcards instantly.</p>
                </div>
              )}
            </section>
          )}

          {/* SECTION 3: QUIZZES */}
          {activeSection === "Quizzes" && (
            <section className="section-container">
              <div className="section-header-row">
                <div>
                  <p className="section-kicker"><span className="kicker-dot" /> KNOWLEDGE CHECK</p>
                  <h2>Interactive Quizzes</h2>
                  <p className="intro-copy">
                    Test your understanding with active recall questions tailored to your topic.
                  </p>
                </div>
                {quizSubmitted && (
                  <button
                    type="button"
                    className="action-pill-btn"
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                  >
                    <RotateCcw size={14} /> Retake Quiz
                  </button>
                )}
              </div>

              {/* Topic Selector & Direct Gemma Generator Bar */}
              <div className="topic-toolbar-card">
                <div className="topic-selector-group">
                  <label htmlFor="quiz-select">Active Quiz Topic:</label>
                  <select
                    id="quiz-select"
                    className="topic-dropdown"
                    value={activeDeck.id}
                    onChange={(e) => {
                      setActiveDeckId(e.target.value);
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                  >
                    {decks.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.topic} ({d.quizzes?.length || 0} questions)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="quick-curate-inline">
                  <input
                    type="text"
                    className="quick-curate-input"
                    placeholder="Type a new topic to generate a quiz with Gemma..."
                    value={quickTopicInput}
                    onChange={(e) => setQuickTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleDirectTopicCuration("Quiz");
                    }}
                  />
                  <button
                    type="button"
                    className="action-pill-btn curate-btn"
                    onClick={() => handleDirectTopicCuration("Quiz")}
                    disabled={curatingTopic}
                  >
                    {curatingTopic ? <span className="button-spinner" /> : <Sparkles size={14} />}
                    <span>Curate Quiz with Gemma</span>
                  </button>
                </div>
              </div>

              {deckQuizzes.length > 0 ? (
                <div className="quiz-session-wrapper">
                  {quizSubmitted && (
                    <div className="quiz-score-banner">
                      <div className="banner-score-circle">
                        <strong>
                          {Math.round((quizScore / deckQuizzes.length) * 100)}%
                        </strong>
                      </div>
                      <div>
                        <h3>
                          Topic: {activeDeck.topic} — Score: {quizScore} / {deckQuizzes.length}!
                        </h3>
                        <p>
                          {quizScore === deckQuizzes.length
                            ? "Flawless score! Full conceptual mastery."
                            : quizScore >= deckQuizzes.length / 2
                            ? "Great job! Check the explanations below to refine your answers."
                            : "Keep practicing! Review the flashcards for this topic to reinforce key ideas."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="quiz-questions-list">
                    {deckQuizzes.map((q, idx) => {
                      const selectedOpt = quizAnswers[q.id];
                      const isCorrect = selectedOpt === q.correctAnswer;
                      return (
                        <div
                          key={q.id}
                          className={`quiz-card-item${
                            quizSubmitted ? (isCorrect ? " pass" : " fail") : ""
                          }`}
                        >
                          <div className="quiz-card-header">
                            <span className="quiz-num-badge">Question {idx + 1}</span>
                            {quizSubmitted && (
                              <span
                                className={`result-tag ${
                                  isCorrect ? "correct" : "incorrect"
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <Check size={14} /> Correct
                                  </>
                                ) : (
                                  <>
                                    <X size={14} /> Incorrect
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                          <h3 className="quiz-question-title">{q.question}</h3>

                          <div className="quiz-options-grid">
                            {q.options.map((opt) => {
                              const isSelected = selectedOpt === opt.key;
                              const isTargetCorrect = opt.key === q.correctAnswer;
                              let optClassName = "quiz-opt-btn";
                              if (isSelected) optClassName += " selected";
                              if (quizSubmitted) {
                                if (isTargetCorrect) optClassName += " correct-opt";
                                else if (isSelected) optClassName += " wrong-opt";
                              }
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  className={optClassName}
                                  onClick={() => selectQuizOption(q.id, opt.key)}
                                  disabled={quizSubmitted}
                                >
                                  <span className="opt-key">{opt.key}</span>
                                  <span className="opt-text">{opt.text}</span>
                                  {quizSubmitted && isTargetCorrect && (
                                    <CheckCircle2 size={16} className="opt-status-icon" />
                                  )}
                                  {quizSubmitted && isSelected && !isCorrect && (
                                    <XCircle size={16} className="opt-status-icon" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && q.explanation && (
                            <div className="quiz-explanation-box">
                              <strong>Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!quizSubmitted && (
                    <div className="quiz-footer-actions">
                      <button
                        type="button"
                        className="create-button"
                        onClick={() => setQuizSubmitted(true)}
                        disabled={Object.keys(quizAnswers).length === 0}
                      >
                        <Trophy size={16} /> Submit & Check Answers
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-section-box">
                  <CircleHelp size={32} />
                  <h3>No quiz questions available for "{activeDeck.topic}"</h3>
                  <p>Type a topic above to have Gemma curate an interactive quiz for it.</p>
                </div>
              )}
            </section>
          )}

          {/* SECTION 4: PROGRESS */}
          {activeSection === "Progress" && (
            <section className="section-container">
              <div className="section-header-row">
                <div>
                  <p className="section-kicker"><span className="kicker-dot" /> MASTERY ANALYTICS</p>
                  <h2>Your Learning Progress</h2>
                  <p className="intro-copy">
                    Track your retention across all curated topic decks.
                  </p>
                </div>
              </div>

              <div className="progress-metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Active Deck Mastery</span>
                    <Flame className="metric-icon flame-icon" size={20} />
                  </div>
                  <div className="metric-val">{activeDeckMastery}%</div>
                  <p className="metric-desc">Topic: {activeDeck.topic}</p>
                  <div className="metric-bar">
                    <div className="metric-bar-fill" style={{ width: `${activeDeckMastery}%` }} />
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Mastered Flashcards</span>
                    <Award className="metric-icon award-icon" size={20} />
                  </div>
                  <div className="metric-val">
                    {totalMasteredAllDecks} <small>/ {totalCardsAllDecks}</small>
                  </div>
                  <p className="metric-desc">Across all {totalDecksCount} study decks</p>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill green-fill"
                      style={{
                        width: `${
                          totalCardsAllDecks > 0
                            ? (totalMasteredAllDecks / totalCardsAllDecks) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-label">Quiz Accuracy</span>
                    <Trophy className="metric-icon trophy-icon" size={20} />
                  </div>
                  <div className="metric-val">
                    {deckQuizzes.length > 0
                      ? `${Math.round(
                          ((quizSubmitted ? quizScore : deckQuizzes.length) / deckQuizzes.length) *
                            100
                        )}%`
                      : "100%"}
                  </div>
                  <p className="metric-desc">
                    {quizSubmitted
                      ? `${quizScore} of ${deckQuizzes.length} answered correctly`
                      : "Complete a quiz to update accuracy"}
                  </p>
                  <div className="metric-bar">
                    <div
                      className="metric-bar-fill purple-fill"
                      style={{
                        width: `${
                          deckQuizzes.length > 0
                            ? ((quizSubmitted ? quizScore : deckQuizzes.length) /
                                deckQuizzes.length) *
                              100
                            : 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="topics-breakdown-card">
                <h3>All Curated Topics</h3>
                <div className="breakdown-list">
                  {decks.map((d) => {
                    const mCount = d.cards?.filter((c) => c.mastered).length || 0;
                    const cCount = d.cards?.length || 0;
                    const pct = cCount > 0 ? Math.round((mCount / cCount) * 100) : 0;
                    return (
                      <div key={d.id} className="breakdown-item">
                        <div className="breakdown-info">
                          <strong>{d.topic}</strong>
                          <span>
                            {pct}% mastered ({mCount}/{cCount} cards)
                          </span>
                        </div>
                        <div className="breakdown-bar">
                          <span style={{ width: `${pct}%`, background: "var(--purple)" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 5: LIBRARY */}
          {activeSection === "Library" && (
            <section className="section-container">
              <div className="section-header-row">
                <div>
                  <p className="section-kicker"><span className="kicker-dot" /> STUDY REPOSITORY</p>
                  <h2>Your Curated Topic Decks</h2>
                  <p className="intro-copy">
                    Every topic you ask for creates a permanent study deck here.
                  </p>
                </div>
              </div>

              <div className="library-grid">
                {decks.map((deck) => (
                  <div key={deck.id} className="library-card">
                    <div className="lib-card-top">
                      <span className="lib-type-tag">Curated Deck</span>
                      <span className="lib-date">{deck.createdAt}</span>
                    </div>
                    <h3 className="lib-title">{deck.topic}</h3>
                    <div className="lib-stats">
                      <span><Layers3 size={14} /> {deck.cards?.length || 0} cards</span>
                      <span><CircleHelp size={14} /> {deck.quizzes?.length || 0} questions</span>
                    </div>
                    <div className="lib-card-actions">
                      <button
                        type="button"
                        className="lib-open-btn"
                        onClick={() => {
                          setActiveDeckId(deck.id);
                          setActiveSection("Flashcards");
                        }}
                      >
                        Study Flashcards
                      </button>
                      <button
                        type="button"
                        className="lib-quiz-btn"
                        onClick={() => {
                          setActiveDeckId(deck.id);
                          setActiveSection("Quizzes");
                        }}
                      >
                        Take Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
