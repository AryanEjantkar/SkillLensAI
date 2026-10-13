import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  RotateCcw,
  X,
  PlusCircle,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function AdaptiveTutorDrawer({
  isOpen,
  onClose,
  topic,
  difficulty,
  lessonSummary,
  provider = "gemma",
  onAddPracticeQuiz,
}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hello! I'm your **SkillLens Adaptive AI Tutor** for **${topic || "your study session"}** (${difficulty} level). Ask me to explain a concept, give you a hint on difficult steps, test your understanding, or simplify the explanation!`,
      hints: [],
      misconceptions: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingPractice, setGeneratingPractice] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textToSend = null) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const newHistory = [...messages, { role: "user", content: text }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || "Study Topic",
          difficulty,
          lesson_summary: lessonSummary || "",
          user_message: text,
          history: newHistory.map((m) => ({ role: m.role, content: m.content })),
          provider,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to reach AI Tutor.");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          hints: data.hints || [],
          misconceptions: data.detected_misconceptions || [],
          followups: data.suggested_followups || [],
          provider: data.provider,
          model: data.model,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I couldn't process that question right now (${err.message}). Try asking another question or rephrasing!`,
          hints: [],
          misconceptions: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPractice = async () => {
    if (generatingPractice) return;
    setGeneratingPractice(true);
    try {
      const res = await fetch("/api/tutor/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || "Study Topic",
          difficulty,
          provider,
        }),
      });
      if (!res.ok) throw new Error("Could not generate practice questions.");
      const data = await res.json();
      if (data.practice_questions && data.practice_questions.length > 0) {
        if (onAddPracticeQuiz) {
          onAddPracticeQuiz(data.practice_questions);
        }
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I've generated **${data.practice_questions.length} new practice question(s)** for you and added them to your quiz deck! You can test yourself in the Quizzes tab or right here.`,
            hints: [],
            misconceptions: [],
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Failed to create practice questions: ${err.message}`,
        },
      ]);
    } finally {
      setGeneratingPractice(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tutor-drawer-overlay">
      <div className="tutor-drawer-panel" role="dialog" aria-label="Adaptive AI Tutor">
        {/* Drawer Header */}
        <div className="tutor-header">
          <div className="tutor-title-group">
            <div className="tutor-avatar-icon">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="tutor-heading">SkillLens Adaptive Tutor</h4>
              <span className="tutor-sub">
                Anchored on <strong>{topic}</strong> · {difficulty}
              </span>
            </div>
          </div>
          <button type="button" className="tutor-close-btn" onClick={onClose} aria-label="Close Tutor">
            <X size={18} />
          </button>
        </div>

        {/* Quick Socratic Prompt Buttons */}
        <div className="tutor-quick-prompts">
          <button
            type="button"
            className="tutor-quick-btn"
            onClick={() => sendMessage("Can you explain this concept in simpler terms with an analogy?")}
          >
            <Lightbulb size={13} />
            <span>Explain Simpler</span>
          </button>
          <button
            type="button"
            className="tutor-quick-btn"
            onClick={() => sendMessage("Give me a hint on how to think about this without giving away the full answer.")}
          >
            <HelpCircle size={13} />
            <span>Give Me a Hint</span>
          </button>
          <button
            type="button"
            className="tutor-quick-btn"
            onClick={handleRequestPractice}
            disabled={generatingPractice}
          >
            <PlusCircle size={13} />
            <span>{generatingPractice ? "Generating..." : "Generate Practice"}</span>
          </button>
        </div>

        {/* Chat message history */}
        <div className="tutor-messages-scroll">
          {messages.map((msg, idx) => (
            <div key={idx} className={`tutor-msg-bubble-wrap ${msg.role}`}>
              <div className="tutor-bubble">
                <p className="tutor-text">{msg.content}</p>

                {/* Misconceptions detected */}
                {msg.misconceptions && msg.misconceptions.length > 0 && (
                  <div className="tutor-misconception-callout">
                    <AlertTriangle size={14} />
                    <div>
                      <strong>Likely Misconception Diagnosed:</strong>
                      <ul>
                        {msg.misconceptions.map((m, mIdx) => (
                          <li key={mIdx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Hints */}
                {msg.hints && msg.hints.length > 0 && (
                  <div className="tutor-hints-callout">
                    <Lightbulb size={14} />
                    <div>
                      <strong>Socratic Hints:</strong>
                      <ul>
                        {msg.hints.map((h, hIdx) => (
                          <li key={hIdx}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Suggested follow-ups */}
                {msg.followups && msg.followups.length > 0 && (
                  <div className="tutor-followup-suggestions">
                    <span className="followup-heading">Suggested Inquiries:</span>
                    {msg.followups.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        type="button"
                        className="tutor-suggested-q"
                        onClick={() => sendMessage(f)}
                      >
                        <ChevronRight size={12} />
                        <span>{f}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="tutor-msg-bubble-wrap assistant">
              <div className="tutor-bubble tutor-typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Fallibility disclaimer */}
        <div className="tutor-disclaimer-bar">
          <ShieldAlert size={12} />
          <span>AI educational tutor may make mistakes; cross-check with academic source materials.</span>
        </div>

        {/* Chat Input Bar */}
        <form
          className="tutor-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            type="text"
            className="tutor-text-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or explain your reasoning..."
            disabled={loading}
          />
          <button type="submit" className="tutor-send-btn" disabled={loading || !input.trim()}>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
