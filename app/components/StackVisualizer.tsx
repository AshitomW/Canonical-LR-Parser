"use client";

import { useEffect, useRef, useState } from "react";
import { ParseStep, grammar, Action } from "../lib/clr-parser";

interface StackVisualizerProps {
  steps: ParseStep[];
  currentStep: number;
  isPlaying: boolean;
  speed: number;
  onStepChange: (step: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
}

export default function StackVisualizer({
  steps,
  currentStep,
  isPlaying,
  speed,
  onStepChange,
  onPlayPause,
  onReset,
}: StackVisualizerProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const [animatingPush, setAnimatingPush] = useState(false);
  const [animatingPop, setAnimatingPop] = useState(false);

  const step = steps[currentStep];
  const prevStep = currentStep > 0 ? steps[currentStep - 1] : null;

  // Determine if we're pushing or popping
  useEffect(() => {
    if (!step || !prevStep) return;

    if (step.actionDetail.type === "shift") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimatingPush(true);
      setTimeout(() => setAnimatingPush(false), 300);
    } else if (step.actionDetail.type === "reduce") {
      setAnimatingPop(true);
      setTimeout(() => setAnimatingPop(false), 300);
    }
  }, [currentStep]);

  // Scroll stack to bottom
  useEffect(() => {
    if (stackRef.current) {
      stackRef.current.scrollTop = stackRef.current.scrollHeight;
    }
  }, [step?.stack]);

  if (!step) {
    return (
      <div className="stack-visualizer empty">
        <p>
          Enter a string and click &quot;Parse&quot; to see step-by-step
          visualization.
        </p>
      </div>
    );
  }

  const getActionClass = (action: Action): string => {
    switch (action.type) {
      case "shift":
        return "action-shift";
      case "reduce":
        return "action-reduce";
      case "accept":
        return "action-accept";
      case "error":
        return "action-error";
      default:
        return "";
    }
  };

  const getActionIcon = (action: Action): string => {
    switch (action.type) {
      case "shift":
        return "[^]";
      case "reduce":
        return "[v]";
      case "accept":
        return "[OK]";
      case "error":
        return "[X]";
      default:
        return "";
    }
  };

  // Build display stack (alternating symbols and states)
  const displayStack: { value: string | number; type: "state" | "symbol" }[] =
    [];
  for (let i = 0; i < step.stack.length; i++) {
    const val = step.stack[i];
    if (typeof val === "number") {
      displayStack.push({ value: val, type: "state" });
    } else {
      displayStack.push({ value: val, type: "symbol" });
    }
  }

  return (
    <div className="stack-visualizer">
      <div className="visualizer-header">
        <h3 className="section-title">
          <span className="title-icon">[P]</span>
          Parsing Visualization
        </h3>
        <div className="step-indicator">
          Step {step.step + 1} / {steps.length}
        </div>
      </div>

      <div className="visualizer-main">
        {/* Stack Section */}
        <div className="stack-section">
          <h4 className="subsection-title">Parser Stack</h4>
          <div className="stack-container" ref={stackRef}>
            <div className="stack-base">
              <span>BASE</span>
            </div>
            {displayStack.map((item, idx) => (
              <div
                key={idx}
                className={`stack-item ${item.type} ${
                  idx === displayStack.length - 1 && animatingPush
                    ? "push-animation"
                    : ""
                }`}
              >
                {item.type === "state" ? (
                  <span className="state-value">
                    s<sub>{item.value}</sub>
                  </span>
                ) : (
                  <span className="symbol-value">{item.value}</span>
                )}
              </div>
            ))}
            <div className="stack-top">
              <span>TOP</span>
            </div>
          </div>
        </div>

        {/* Input Buffer Section */}
        <div className="input-section">
          <h4 className="subsection-title">Input Buffer</h4>
          <div className="input-buffer">
            {step.input.map((token, idx) => (
              <div
                key={idx}
                className={`input-token ${idx === 0 ? "current" : ""}`}
              >
                {token}
              </div>
            ))}
          </div>
          <div className="input-pointer">
            <span className="pointer-arrow">^</span>
            <span className="pointer-label">Current Input</span>
          </div>
        </div>

        {/* Symbol Stack (for clarity) */}
        <div className="symbols-section">
          <h4 className="subsection-title">Symbol Stack</h4>
          <div className="symbols-stack">
            {step.symbols.length === 0 ? (
              <span className="empty-stack">[ empty ]</span>
            ) : (
              step.symbols.map((sym, idx) => (
                <span key={idx} className="symbol-item">
                  {sym}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Display */}
      <div className={`action-display ${getActionClass(step.actionDetail)}`}>
        <span className="action-icon">{getActionIcon(step.actionDetail)}</span>
        <span className="action-text">{step.action}</span>
      </div>

      {/* If reduce, show the production */}
      {step.actionDetail.type === "reduce" &&
        step.actionDetail.value !== undefined && (
          <div className="reduction-display">
            <span className="reduction-label">Reducing by:</span>
            <span className="reduction-production">
              {grammar[step.actionDetail.value].lhs}
              {" → "}
              {grammar[step.actionDetail.value].rhs.map((sym, idx) =>
                typeof sym === "number" ? (
                  <span key={idx}>
                    s<sub>{sym}</sub>{" "}
                  </span>
                ) : (
                  <span key={idx}>{sym} </span>
                )
              )}
            </span>
          </div>
        )}

      {/* Controls */}
      <div className="visualizer-controls">
        <button
          onClick={onReset}
          className="control-btn reset-btn"
          title="Reset"
        >
          {"[<<]"} Reset
        </button>
        <button
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="control-btn"
          title="Previous Step"
        >
          {"[<]"} Prev
        </button>
        <button
          onClick={onPlayPause}
          className={`control-btn play-btn ${isPlaying ? "playing" : ""}`}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "[||] Pause" : "[>] Play"}
        </button>
        <button
          onClick={() =>
            onStepChange(Math.min(steps.length - 1, currentStep + 1))
          }
          disabled={currentStep === steps.length - 1}
          className="control-btn"
          title="Next Step"
        >
          Next {"[>]"}
        </button>
        <button
          onClick={() => onStepChange(steps.length - 1)}
          className="control-btn"
          title="Go to End"
        >
          End {"[>>]"}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Result indicator */}
      {currentStep === steps.length - 1 && (
        <div
          className={`result-display ${
            step.actionDetail.type === "accept" ? "success" : "error"
          }`}
        >
          {step.actionDetail.type === "accept" ? (
            <>
              <span className="result-icon">[OK]</span>
              <span className="result-text">String Accepted Successfully!</span>
            </>
          ) : (
            <>
              <span className="result-icon">[X]</span>
              <span className="result-text">Parsing Error</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
