"use client";

import { useEffect, useRef, useState, JSX } from "react";
import {
  ParseStep,
  grammar,
  Action,
  ParsingTable as ParsingTableType,
  LR1State,
  terminals,
  nonTerminals,
} from "../lib/clr-parser";

interface StackVisualizerProps {
  steps: ParseStep[];
  currentStep: number;
  isPlaying: boolean;
  speed: number;
  onStepChange: (step: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
  table: ParsingTableType;
  states: LR1State[];
}

export default function StackVisualizer({
  steps,
  currentStep,
  isPlaying,
  speed,
  onStepChange,
  onPlayPause,
  onReset,
  table,
  states,
}: StackVisualizerProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const [animatingPush, setAnimatingPush] = useState(false);
  const [animatingPop, setAnimatingPop] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const step = steps[currentStep];
  const prevStep = currentStep > 0 ? steps[currentStep - 1] : null;

  const actionTerminals = terminals.filter((t) => t !== "ε");
  const gotoNonTerminals = nonTerminals.filter((nt) => nt !== "S'");

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

  const formatAction = (action: Action | undefined): string | JSX.Element => {
    if (!action) return "";
    switch (action.type) {
      case "shift":
        return (
          <>
            s<sub>{action.value}</sub>
          </>
        );
      case "reduce":
        return (
          <>
            r<sub>{action.value}</sub>
          </>
        );
      case "accept":
        return "accept";
      default:
        return "";
    }
  };

  const getTableActionClass = (action: Action | undefined): string => {
    if (!action) return "";
    switch (action.type) {
      case "shift":
        return "action-shift";
      case "reduce":
        return "action-reduce";
      case "accept":
        return "action-accept";
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

  // Get current state for table lookup
  const currentStateId = step.stack[step.stack.length - 1] as number;
  const currentSymbol = step.input[0];

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
      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="visualizer-main">
        {/* Stack Section */}
        <div className="stack-section">
          <h4 className="subsection-title">Parser Stack</h4>
          <div className="stack-container" ref={stackRef}>
            <div className="stack-base">
              <span>BASE</span>
            </div>
            {displayStack.map((item, idx) => {
              // Calculate if this item is part of the reduction
              let isBeingReduced = false;
              let isExposedState = false;

              if (
                step.actionDetail.type === "reduce" &&
                step.actionDetail.value !== undefined
              ) {
                const prod = grammar[step.actionDetail.value];
                const itemsToPop = prod.rhs.length * 2;
                const startHighlightIndex = displayStack.length - itemsToPop;

                if (idx >= startHighlightIndex) {
                  isBeingReduced = true;
                }

                // Identify exposed state (the one right before the reduced items)
                if (idx === startHighlightIndex - 1 && item.type === "state") {
                  isExposedState = true;
                }
              }

              return (
                <div
                  key={idx}
                  className={`stack-item ${item.type} ${
                    idx === displayStack.length - 1 && animatingPush
                      ? "push-animation"
                      : ""
                  } ${isBeingReduced ? "being-reduced" : ""} ${isExposedState ? "exposed-state" : ""}`}
                >
                  {item.type === "state" ? (
                    <span className="state-value">
                      s<sub>{item.value}</sub>
                    </span>
                  ) : (
                    <span className="symbol-value">{item.value}</span>
                  )}
                </div>
              );
            })}
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
          <button
            onClick={() => setShowTable(!showTable)}
            className={`control-btn toggle-btn ${showTable ? "active" : ""}`}
            title="Toggle Table Display"
          >
            {showTable ? "[−] Table" : "[+] Table"}
          </button>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`control-btn toggle-btn ${showHelp ? "active" : ""}`}
            title="Toggle Help Display"
          >
            {showHelp ? "[−] Help" : "[+] Help"}
          </button>
        </div>


      {/* Relevant Table Row Display */}
      {showTable && (
      <div className="table-row-display mb-6">
        <h4 className="subsection-title">
          Relevant Table Row (State {currentStateId})
        </h4>
        <div className="overflow-x-auto border border-[var(--border-color)]">
          <table className="parsing-table w-full">
            <thead>
              <tr>
                <th rowSpan={2} className="parsing-state-header">
                  State
                </th>
                <th colSpan={actionTerminals.length} className="action-header">
                  ACTION
                </th>
                <th colSpan={gotoNonTerminals.length} className="goto-header">
                  GOTO
                </th>
              </tr>
              <tr>
                {actionTerminals.map((t) => (
                  <th key={t} className="terminal-header">
                    {t}
                  </th>
                ))}
                {gotoNonTerminals.map((nt) => (
                  <th key={nt} className="non-terminal-header">
                    {nt}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* CURRENT STATE ROW */}
              <tr>
                <td className="state-cell">{currentStateId}</td>
                {actionTerminals.map((t) => {
                  const key = `${currentStateId},${t}`;
                  const action = table.action.get(key);
                  const isHighlighted = currentSymbol === t;

                  return (
                    <td
                      key={t}
                      className={`action-cell ${getTableActionClass(action)} ${
                        isHighlighted ? "highlighted" : ""
                      }`}
                    >
                      {formatAction(action)}
                    </td>
                  );
                })}
                {gotoNonTerminals.map((nt) => {
                  const key = `${currentStateId},${nt}`;
                  const gotoState = table.goto.get(key);

                  return (
                    <td
                      key={nt}
                      className={`goto-cell ${
                        gotoState !== undefined ? "has-goto" : ""
                      }`}
                    >
                      {gotoState !== undefined ? gotoState : ""}
                    </td>
                  );
                })}
              </tr>

              {/* EXPOSED STATE ROW (Only for REDUCE actions) */}
              {step.actionDetail.type === "reduce" &&
                step.actionDetail.value !== undefined &&
                (() => {
                  const prod = grammar[step.actionDetail.value];
                  // Calculate exposed state: current stack length - 2 * rhs_length
                  // Stack structure: [state, symbol, state, symbol, state]
                  // We want the state at index: length - 1 - (2 * rhs.length)
                  const exposedStateIndex =
                    step.stack.length - 1 - 2 * prod.rhs.length;
                  const exposedState = step.stack[exposedStateIndex] as number;

                  // If for some reason index is invalid (shouldn't happen in valid parse), don't render
                  if (exposedStateIndex < 0 || typeof exposedState !== "number")
                    return null;

                  return (
                    <tr className="goto-transition-row">
                      <td className="state-cell exposed-state-cell highlighted-goto-source">
                        <div className="flex flex-col items-center">
                          <span>{exposedState}</span>
                          <span className="text-[10px] opacity-70">
                            (Exposed)
                          </span>
                        </div>
                      </td>

                      {/* ACTION columns - dimmed/irrelevant for GOTO lookup */}
                      {actionTerminals.map((t) => (
                        <td key={t} className="action-cell opacity-30"></td>
                      ))}

                      {/* GOTO columns - Highlight the transition */}
                      {gotoNonTerminals.map((nt) => {
                        const key = `${exposedState},${nt}`;
                        const gotoState = table.goto.get(key);
                        const isHighlighted = nt === prod.lhs;

                        return (
                          <td
                            key={nt}
                            className={`goto-cell ${
                              gotoState !== undefined ? "has-goto" : ""
                            } ${isHighlighted ? "highlighted-goto" : ""}`}
                          >
                            {isHighlighted ? (
                              <div className="flex flex-col items-center">
                                <span>{gotoState}</span>
                              </div>
                            ) : gotoState !== undefined ? (
                              gotoState
                            ) : (
                              ""
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })()}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Action Display */}
      <div className={`action-display ${getActionClass(step.actionDetail)}`}>
        <span className="action-icon">{getActionIcon(step.actionDetail)}</span>
        <span className="action-text">{step.action}</span>
      </div>

      {/* Hints Section */}
      {showHelp && (
      <div className="hints-section mb-6">
        <h4 className="subsection-title">
          <span className="title-icon">[?]</span>
          Step Explanation
        </h4>
        <div className="hint-content p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md font-mono text-sm leading-6">
          {step.actionDetail.type === "shift" && (
            <p>
              <span className="text-[var(--accent-color)] font-bold">
                SHIFT
              </span>
              : Pushing symbol{" "}
              <span className="highlight-text">
                &apos;{currentSymbol}&apos;
              </span>{" "}
              and next state onto the stack.
            </p>
          )}

          {step.actionDetail.type === "reduce" &&
            step.actionDetail.value !== undefined &&
            (() => {
              const prod = grammar[step.actionDetail.value];
              const exposedStateIndex =
                step.stack.length - 1 - 2 * prod.rhs.length;
              const exposedState = step.stack[exposedStateIndex];
              const gotoKey = `${exposedState},${prod.lhs}`;
              const gotoState = table.goto.get(gotoKey);

              return (
                <>
                  <p className="mb-2">
                    <span className="text-[var(--delete-color)] font-bold">
                      REDUCE
                    </span>
                    : Using production{" "}
                    <span className="highlight-text">
                      {prod.lhs} → {prod.rhs.join(" ")}
                    </span>
                    .
                  </p>
                  <p className="mb-2">
                    1. Pop{" "}
                    <span className="highlight-text">
                      {prod.rhs.length * 2}
                    </span>{" "}
                    items from stack ({prod.rhs.length} symbols +{" "}
                    {prod.rhs.length} states).
                  </p>
                  <p className="mb-2">
                    2. Top of stack becomes{" "}
                    <span className="highlight-goto-source-text font-bold">
                      State {exposedState}
                    </span>{" "}
                    (Exposed State).
                  </p>
                  <p>
                    3. Check GOTO table:{" "}
                    <span className="highlight-goto-source-text">
                      State {exposedState}
                    </span>{" "}
                    + Non-terminal{" "}
                    <span className="highlight-goto-text">{prod.lhs}</span> ={" "}
                    <span className="highlight-goto-text font-bold">
                      State {gotoState}
                    </span>
                    .
                    <br />
                    4. Push{" "}
                    <span className="highlight-goto-text">
                      {prod.lhs}
                    </span> and{" "}
                    <span className="highlight-goto-text font-bold">
                      State {gotoState}
                    </span>{" "}
                    onto stack.
                  </p>
                </>
              );
            })()}

          {step.actionDetail.type === "accept" && (
            <p>
              <span className="text-[var(--success-color)] font-bold">
                ACCEPT
              </span>
              : Parsing completed successfully!
            </p>
          )}

          {step.actionDetail.type === "error" && (
            <p>
              <span className="text-[var(--error-color)] font-bold">ERROR</span>
              : No valid action for State {currentStateId} and input '
              {currentSymbol}'.
            </p>
          )}
        </div>
      </div>
      )}

      {/* Controls */}

      {/* Progress Bar */}

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
