import React from "react";
import { Lightbulb, Bookmark, ShieldAlert, ExternalLink } from "lucide-react";
import FormulaRenderer from "../common/FormulaRenderer";

function renderFormattedMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");

  const rendered = [];
  let currentBullets = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      rendered.push(
        <ul key={`ul-${rendered.length}`} className="content-bullet-list">
          {currentBullets.map((b, bIdx) => (
            <li key={bIdx} className="bullet-item">
              <span className="bullet-disc">•</span>
              <span className="bullet-text">{renderInlineElements(b)}</span>
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      flushBullets();
      return;
    }

    if (line.startsWith("* ") || line.startsWith("- ")) {
      currentBullets.push(line.slice(2));
      return;
    }

    flushBullets();

    if (line.startsWith("### ")) {
      rendered.push(
        <h4 key={`h4-${idx}`} className="content-subheading">
          {renderInlineElements(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      rendered.push(
        <h3 key={`h3-${idx}`} className="content-heading">
          {renderInlineElements(line.slice(3))}
        </h3>
      );
    } else {
      rendered.push(
        <p key={`p-${idx}`} className="content-p">
          {renderInlineElements(line)}
        </p>
      );
    }
  });

  flushBullets();
  return rendered;
}

function renderInlineElements(str) {
  if (!str) return null;
  // Match bold **text** or inline math $formula$
  const regex = /(\*\*([^*]+?)\*\*|\$([^$]+?)\$)/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.substring(lastIdx, match.index));
    }
    if (match[2]) {
      // Bold
      parts.push(<strong key={parts.length}>{match[2]}</strong>);
    } else if (match[3]) {
      // Math formula
      parts.push(<FormulaRenderer key={parts.length} formula={match[3]} inline={true} />);
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < str.length) {
    parts.push(str.substring(lastIdx));
  }

  return parts.length > 0 ? parts : str;
}

export default function LessonContent({ sections = [], sources = [], disclaimer }) {
  return (
    <div className="lesson-content-body">
      {sections.map((section, idx) => (
        <section key={idx} className="lesson-section-card">
          <h3 className="section-title">{section.title}</h3>

          <div className="section-text-flow">{renderFormattedMarkdown(section.content)}</div>

          {/* Key Concepts Pills */}
          {section.key_concepts && section.key_concepts.length > 0 && (
            <div className="section-concepts-row">
              <span className="concepts-label">
                <Bookmark size={13} /> Key Concepts:
              </span>
              <div className="concepts-pills">
                {section.key_concepts.map((kc, kIdx) => (
                  <span key={kIdx} className="concept-pill">
                    {kc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analogies Callout */}
          {section.analogies && section.analogies.length > 0 && (
            <div className="section-analogy-callout">
              <Lightbulb size={16} className="analogy-icon" />
              <div>
                <strong>Intuitive Analogy:</strong>
                {section.analogies.map((an, aIdx) => (
                  <p key={aIdx}>{an}</p>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}

      {/* Sources and Fallibility Disclaimer */}
      <footer className="lesson-footer-meta">
        {sources && sources.length > 0 && (
          <div className="sources-block">
            <span className="sources-label">Curriculum References & Sources:</span>
            <ul>
              {sources.map((src, idx) => (
                <li key={idx}>
                  <ExternalLink size={12} />
                  <span>{src}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="disclaimer-callout">
          <ShieldAlert size={14} />
          <span>
            {disclaimer ||
              "AI educational content is generated for exploratory learning; consult verified textbooks or primary literature for critical applications."}
          </span>
        </div>
      </footer>
    </div>
  );
}
