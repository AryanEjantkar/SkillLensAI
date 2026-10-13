import React, { useState } from "react";
import { CheckCircle2, ChevronRight, Eye, Lightbulb } from "lucide-react";
import FormulaRenderer from "../common/FormulaRenderer";

export default function WorkedExampleStepper({ data = {}, title, description }) {
  const problem = data.problem || "Worked Example: Model Analysis and Solution Derivation";
  const defaultSteps = [
    {
      step_number: 1,
      instruction: "Identify Given Constraints & Primary Variables",
      formula_or_code: "x_0 = 0, \\quad v_0 = 20\\text{ m/s}, \\quad a = -9.8\\text{ m/s}^2",
      explanation: "Extract physical parameters from problem statement and establish reference frame coordinates.",
    },
    {
      step_number: 2,
      instruction: "Select and Apply Governing Formula",
      formula_or_code: "v^2 = v_0^2 + 2a(y - y_0)",
      explanation: "Relates velocity to displacement under constant acceleration.",
    },
    {
      step_number: 3,
      instruction: "Compute Final Target Metric & Sanity Check",
      formula_or_code: "y_{\\max} = \\frac{v_0^2}{2g} = \\frac{400}{19.6} \\approx 20.4\\text{ m}",
      explanation: "Verify units match and magnitude aligns with physical reality.",
    },
  ];

  const steps = Array.isArray(data.steps) && data.steps.length > 0 ? data.steps : defaultSteps;
  const finalAnswer = data.final_answer || "Solution verified: 20.4 meters.";

  // Stepper state: how many steps revealed so far
  const [revealedCount, setRevealedCount] = useState(1);
  const [showFinal, setShowFinal] = useState(false);

  const handleRevealNext = () => {
    if (revealedCount < steps.length) {
      setRevealedCount((c) => c + 1);
    } else {
      setShowFinal(true);
    }
  };

  return (
    <div className="vis-container worked-example-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || "Guided Step-by-Step Worked Solution"}</h4>
          <p className="vis-description">
            {description || "Work through problem solving incrementally. Reveal one logical phase at a time to build robust problem-solving intuition."}
          </p>
        </div>
      </div>

      <div className="worked-example-body">
        {/* Problem Prompt */}
        <div className="worked-problem-banner">
          <Lightbulb size={18} className="bulb-icon" />
          <div className="problem-text-wrap">
            <span className="problem-label">Problem Statement:</span>
            <p className="problem-statement">{problem}</p>
          </div>
        </div>

        {/* Steps List */}
        <div className="worked-steps-list">
          {steps.slice(0, revealedCount).map((st, idx) => (
            <div key={idx} className="worked-step-card animate-fade-in">
              <div className="step-badge-col">
                <span className="step-num-circle">{st.step_number || idx + 1}</span>
              </div>
              <div className="step-content-col">
                <h5 className="step-instruction">{st.instruction}</h5>
                {st.formula_or_code && (
                  <div className="step-formula-box">
                    <FormulaRenderer formula={st.formula_or_code} inline={false} />
                  </div>
                )}
                <p className="step-explanation">{st.explanation}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Final Solution Box */}
        {showFinal && (
          <div className="worked-final-answer-card animate-fade-in">
            <CheckCircle2 size={20} className="check-icon" />
            <div>
              <strong>Final Conclusion & Verified Answer:</strong>
              <p>{finalAnswer}</p>
            </div>
          </div>
        )}

        {/* Stepper Action Bar */}
        <div className="worked-stepper-actions">
          {revealedCount < steps.length || !showFinal ? (
            <button type="button" className="vis-btn-primary" onClick={handleRevealNext}>
              <span>{revealedCount < steps.length ? `Reveal Step ${revealedCount + 1}` : "Reveal Final Solution"}</span>
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="vis-btn-ghost"
              onClick={() => { setRevealedCount(1); setShowFinal(false); }}
            >
              Start Over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
