import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Safely renders LaTeX mathematical notation via KaTeX.
 * If expression is plain text or invalid LaTeX, falls back gracefully.
 */
export default function FormulaRenderer({ formula, inline = true, className = "" }) {
  const renderedHtml = useMemo(() => {
    if (!formula || typeof formula !== "string") return null;

    const trimmed = formula.trim().replace(/^[\$]{1,2}|[\$]{1,2}$/g, "");
    try {
      return katex.renderToString(trimmed, {
        displayMode: !inline,
        throwOnError: false,
      });
    } catch {
      return null;
    }
  }, [formula, inline]);

  if (!formula) return null;

  if (renderedHtml) {
    return (
      <span
        className={`formula-wrapper ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return <code className={`formula-fallback ${className}`}>{formula}</code>;
}
