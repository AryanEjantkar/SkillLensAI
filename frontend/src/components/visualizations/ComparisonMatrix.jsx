import React, { useState } from "react";
import { Table, Check, X, HelpCircle } from "lucide-react";

export default function ComparisonMatrix({ data = {}, title, description }) {
  const items = Array.isArray(data.items) && data.items.length > 0 ? data.items : ["Paradigm A", "Paradigm B"];
  const defaultCriteria = [
    { name: "Core Philosophy", values: ["Deterministic principles", "Probabilistic / Adaptive"], notes: "Underlying theoretical assumption" },
    { name: "Computational / Resource Cost", values: ["Low / Constant", "Moderate / Dynamic"], notes: "Resource efficiency profile" },
    { name: "Scalability Under Load", values: ["Linear Scaling", "Exponential Optimization"], notes: "Behavior in high-stress regimes" },
    { name: "Primary Trade-off", values: ["Rigid predictability", "Contextual variance"], notes: "Key operational limitation" },
  ];

  const criteria = Array.isArray(data.criteria) && data.criteria.length > 0 ? data.criteria : defaultCriteria;
  const [activeCriterionIdx, setActiveCriterionIdx] = useState(0);

  return (
    <div className="vis-container comparison-matrix-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || "Comparative Analytical Matrix"}</h4>
          <p className="vis-description">
            {description || "Side-by-side multidimensional breakdown contrasting fundamental traits, trade-offs, and behavioral nuances."}
          </p>
        </div>
      </div>

      <div className="vis-workspace-grid">
        {/* Comparison Table */}
        <div className="vis-canvas-card">
          <div className="matrix-table-container">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Criteria</th>
                  {items.map((it, idx) => (
                    <th key={idx} className="matrix-col-header">{it}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((cr, idx) => {
                  const isSelected = idx === activeCriterionIdx;
                  return (
                    <tr
                      key={idx}
                      className={isSelected ? "selected-row" : ""}
                      onClick={() => setActiveCriterionIdx(idx)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="criterion-name-cell">
                        <strong>{cr.name}</strong>
                      </td>
                      {items.map((_, iIdx) => (
                        <td key={iIdx} className="criterion-val-cell">
                          {cr.values?.[iIdx] ?? "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Criterion Inspector */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <span className="control-section-title"><Table size={14} /> Criterion Analysis</span>
            {criteria[activeCriterionIdx] && (
              <div className="matrix-detail-card">
                <span className="matrix-badge">Dimension {activeCriterionIdx + 1} of {criteria.length}</span>
                <h4>{criteria[activeCriterionIdx].name}</h4>
                <div className="matrix-values-summary">
                  {items.map((it, idx) => (
                    <div key={idx} className="matrix-val-row">
                      <span className="it-label">{it}:</span>
                      <strong className="it-val">{criteria[activeCriterionIdx].values?.[idx] ?? "Standard"}</strong>
                    </div>
                  ))}
                </div>
                {criteria[activeCriterionIdx].notes && (
                  <p className="matrix-notes">
                    <strong>Pedagogical Context:</strong> {criteria[activeCriterionIdx].notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
