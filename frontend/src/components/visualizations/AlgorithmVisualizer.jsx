import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Code2 } from "lucide-react";

export default function AlgorithmVisualizer({ data = {}, title, description }) {
  const algoName = data.algorithm_name || "Algorithm Execution";
  const complexity = data.complexity || { time: "O(log n)", space: "O(1)" };

  const defaultArray = [4, 9, 15, 23, 31, 42, 57, 68, 81, 95];
  const array = Array.isArray(data.initial_array) ? data.initial_array : defaultArray;
  const target = data.target_value ?? 42;

  const defaultSteps = [
    { step: 1, low: 0, high: 9, mid: 4, val: 31, explanation: "Compute mid index 4 (val=31). Target 42 > 31 \u2192 shift search to right subarray [5..9].", highlight_line: 4 },
    { step: 2, low: 5, high: 9, mid: 7, val: 68, explanation: "Compute mid index 7 (val=68). Target 42 < 68 \u2192 shift search to left subarray [5..6].", highlight_line: 5 },
    { step: 3, low: 5, high: 6, mid: 5, val: 42, explanation: "Compute mid index 5 (val=42). Match found! Target 42 successfully located at index 5.", highlight_line: 3 },
  ];

  const steps = Array.isArray(data.trace_steps) && data.trace_steps.length > 0 ? data.trace_steps : defaultSteps;

  const defaultPseudocode = [
    "function binarySearch(arr, target):",
    "    low = 0, high = arr.length - 1",
    "    while low <= high:",
    "        mid = Math.floor((low + high) / 2)",
    "        if arr[mid] == target: return mid",
    "        else if arr[mid] < target: low = mid + 1",
    "        else: high = mid - 1",
    "    return -1 // not found",
  ];

  const pseudocode = Array.isArray(data.pseudocode) && data.pseudocode.length > 0 ? data.pseudocode : defaultPseudocode;

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  const step = steps[currentStepIdx] || steps[0];

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, steps.length]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  return (
    <div className="vis-container algo-vis">
      <div className="vis-header">
        <div>
          <h4 className="vis-title">{title || algoName}</h4>
          <p className="vis-description">
            {description || "Step-by-step trace of algorithmic memory states, pointer movements, and pseudocode execution."}
          </p>
        </div>

        <div className="vis-playback-bar">
          <button
            type="button"
            className="vis-btn-primary"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? "Pause" : "Auto Trace"}</span>
          </button>
          <button
            type="button"
            className="vis-btn-ghost"
            disabled={currentStepIdx === 0}
            onClick={() => { setIsPlaying(false); setCurrentStepIdx((i) => Math.max(0, i - 1)); }}
          >
            <SkipBack size={14} />
          </button>
          <button
            type="button"
            className="vis-btn-ghost"
            disabled={currentStepIdx === steps.length - 1}
            onClick={() => { setIsPlaying(false); setCurrentStepIdx((i) => Math.min(steps.length - 1, i + 1)); }}
          >
            <SkipForward size={14} />
          </button>
          <button type="button" className="vis-btn-ghost" onClick={handleReset}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="vis-workspace-grid">
        {/* Array Visualization Canvas */}
        <div className="vis-canvas-card">
          <div className="algo-array-display">
            <div className="array-elements-row">
              {array.map((val, idx) => {
                const isMid = step.mid === idx;
                const isLow = step.low === idx;
                const isHigh = step.high === idx;
                const isInRange = idx >= (step.low ?? 0) && idx <= (step.high ?? array.length - 1);
                const isFound = isMid && val === target;

                return (
                  <div key={idx} className={`array-cell-wrapper ${!isInRange ? "dimmed" : ""}`}>
                    <div className="cell-pointers">
                      {isLow && <span className="ptr-tag ptr-low">L</span>}
                      {isMid && <span className="ptr-tag ptr-mid">M</span>}
                      {isHigh && <span className="ptr-tag ptr-high">H</span>}
                    </div>

                    <div className={`array-cell ${isMid ? "active-mid" : ""} ${isFound ? "found" : ""}`}>
                      <span className="cell-value">{val}</span>
                    </div>

                    <span className="cell-index">[{idx}]</span>
                  </div>
                );
              })}
            </div>

            {/* Explanation box */}
            <div className="algo-explanation-box">
              <span className="step-label">Step {currentStepIdx + 1} of {steps.length}:</span>
              <p>{step.explanation}</p>
            </div>
          </div>

          <div className="vis-metric-badges">
            <div className="vis-badge">
              <span className="badge-label">Target Search</span>
              <span className="badge-value">{target}</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Time Complexity</span>
              <span className="badge-value">{complexity.time || "O(log n)"}</span>
            </div>
            <div className="vis-badge">
              <span className="badge-label">Space Complexity</span>
              <span className="badge-value">{complexity.space || "O(1)"}</span>
            </div>
          </div>
        </div>

        {/* Synchronized Pseudocode Window */}
        <div className="vis-controls-card">
          <div className="vis-control-group">
            <span className="control-section-title"><Code2 size={14} /> Pseudocode Trace</span>
            <div className="pseudocode-editor">
              {pseudocode.map((line, idx) => {
                const isHighlighted = step.highlight_line === idx;
                return (
                  <div key={idx} className={`pseudocode-line ${isHighlighted ? "active" : ""}`}>
                    <span className="line-num">{idx + 1}</span>
                    <pre className="line-text">{line}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
