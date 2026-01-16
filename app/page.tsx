"use client";

import { useState, useEffect, useCallback } from "react";
import GrammarDisplay from "./components/GrammarDisplay";
import LR1ItemSets from "./components/LR1ItemSets";
import ParsingTable from "./components/ParsingTable";
import StackVisualizer from "./components/StackVisualizer";
import StateGraph from "./components/StateGraph";
import {
  getStates,
  getParsingTable,
  parse,
  ParseStep,
  LR1State,
  ParsingTable as ParsingTableType,
} from "./lib/clr-parser";

type TabType = "grammar" | "itemsets" | "table" | "graph" | "parse";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("grammar");
  const [inputString, setInputString] = useState("id = * id");
  const [parseSteps, setParseSteps] = useState<ParseStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [states, setStates] = useState<LR1State[]>([]);
  const [table, setTable] = useState<ParsingTableType | null>(null);
  const [highlightedProduction, setHighlightedProduction] = useState<
    number | undefined
  >();
  const [highlightedState, setHighlightedState] = useState<
    number | undefined
  >();
  const [highlightedCell, setHighlightedCell] = useState<
    { state: number; symbol: string } | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize states and table
  useEffect(() => {
    const s = getStates();
    const t = getParsingTable();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStates(s);
    setTable(t);
    setIsLoading(false);
  }, []);

  // Handle parsing
  const handleParse = useCallback(() => {
    if (!table) return;
    const result = parse(inputString, states, table);
    setParseSteps(result.steps);
    setCurrentStep(0);
    setIsPlaying(false);
    setActiveTab("parse");
  }, [inputString, states, table]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || parseSteps.length === 0) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= parseSteps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, parseSteps.length, speed]);

  // Update highlights based on current step
  useEffect(() => {
    if (parseSteps.length === 0 || currentStep >= parseSteps.length) return;

    const step = parseSteps[currentStep];
    const currentState = step.stack[step.stack.length - 1] as number;
    const currentToken = step.input[0];

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightedState(currentState);
    setHighlightedCell({ state: currentState, symbol: currentToken });

    if (
      step.actionDetail.type === "reduce" &&
      step.actionDetail.value !== undefined
    ) {
      setHighlightedProduction(step.actionDetail.value);
    } else {
      setHighlightedProduction(undefined);
    }
  }, [currentStep, parseSteps]);

  const handleReset = () => {
    setParseSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setHighlightedProduction(undefined);
    setHighlightedState(undefined);
    setHighlightedCell(undefined);
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "grammar", label: "Grammar", icon: "[G]" },
    { id: "itemsets", label: "LR(1) Item Sets", icon: "[I]" },
    { id: "table", label: "Parsing Table", icon: "[T]" },
    { id: "graph", label: "State Graph", icon: "[S]" },
    { id: "parse", label: "Parse String", icon: "[>]" },
  ];

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Building CLR parser...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">[*]</span>
            CLR Parser Visualization
          </h1>
          <p className="app-subtitle">Canonical LR(1) Parsing</p>
        </div>
        <div className="header-badge">
          <span className="badge-text">No Conflicts</span>
          <span className="badge-icon">[OK]</span>
        </div>
      </header>

      {/* Input Section */}
      <div className="input-section-header">
        <div className="input-group">
          <label htmlFor="parse-input">Input String:</label>
          <input
            id="parse-input"
            type="text"
            value={inputString}
            onChange={(e) => setInputString(e.target.value)}
            placeholder="Enter string to parse (e.g., id = * id)"
            className="parse-input"
          />
          <button onClick={handleParse} className="parse-button">
            <span className="btn-icon">{"[>]"}</span>
            Parse
          </button>
        </div>
        <div className="speed-control">
          <label htmlFor="speed">Animation Speed:</label>
          <input
            id="speed"
            type="range"
            min="200"
            max="2000"
            step="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="speed-slider"
          />
          <span className="speed-value">{speed}ms</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === "grammar" && (
          <div className="tab-panel animate-in">
            <GrammarDisplay
              highlightedProduction={highlightedProduction}
              isAnimating={parseSteps.length > 0}
            />
          </div>
        )}

        {activeTab === "itemsets" && (
          <div className="tab-panel animate-in">
            <LR1ItemSets states={states} highlightedState={highlightedState} />
          </div>
        )}

        {activeTab === "table" && table && (
          <div className="tab-panel animate-in">
            <ParsingTable
              table={table}
              states={states}
              highlightedCell={highlightedCell}
            />
          </div>
        )}

        {activeTab === "graph" && (
          <div className="tab-panel animate-in">
            <StateGraph states={states} highlightedState={highlightedState} />
          </div>
        )}

        {activeTab === "parse" && (
          <div className="tab-panel animate-in">
            <StackVisualizer
              steps={parseSteps}
              currentStep={currentStep}
              isPlaying={isPlaying}
              speed={speed}
              onStepChange={setCurrentStep}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onReset={handleReset}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-info">
          <p>
            Grammar: S&apos; → S | S → L = R | S → R | L → * R | L → id | R → L
          </p>
          <p>
            States: {states.length} | Test String: {inputString}
          </p>
        </div>
      </footer>
    </div>
  );
}
