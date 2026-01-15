'use client';

import { useState } from 'react';
import { LR1State, grammar, itemToString, isTerminal } from '../lib/clr-parser';

interface LR1ItemSetsProps {
  states: LR1State[];
  highlightedState?: number;
  highlightedTransition?: { from: number; to: number; symbol: string };
}

export default function LR1ItemSets({ 
  states, 
  highlightedState,
  highlightedTransition 
}: LR1ItemSetsProps) {
  const [expandedStates, setExpandedStates] = useState<Set<number>>(new Set([0]));

  const toggleState = (stateId: number) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(stateId)) {
      newExpanded.delete(stateId);
    } else {
      newExpanded.add(stateId);
    }
    setExpandedStates(newExpanded);
  };

  const expandAll = () => {
    setExpandedStates(new Set(states.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedStates(new Set());
  };

  return (
    <div className="lr1-item-sets">
      <div className="section-header">
        <h3 className="section-title">
          <span className="title-icon">[I]</span>
          LR(1) Item Sets (States)
        </h3>
        <div className="section-controls">
          <button onClick={expandAll} className="control-btn">
            Expand All
          </button>
          <button onClick={collapseAll} className="control-btn">
            Collapse All
          </button>
        </div>
      </div>
      
      <div className="states-info">
        <span className="info-badge">Total States: {states.length}</span>
      </div>

      <div className="states-grid">
        {states.map((state) => (
          <div
            key={state.id}
            className={`state-card ${highlightedState === state.id ? 'highlighted' : ''} ${
              highlightedTransition?.from === state.id || highlightedTransition?.to === state.id 
                ? 'transition-active' 
                : ''
            }`}
          >
            <div 
              className="state-header"
              onClick={() => toggleState(state.id)}
            >
              <div className="state-id">I{state.id}</div>
              <div className="state-meta">
                <span className="item-count">{state.items.length} items</span>
                <span className="expand-icon">
                  {expandedStates.has(state.id) ? '▼' : '▶'}
                </span>
              </div>
            </div>

            {expandedStates.has(state.id) && (
              <div className="state-content">
                <div className="items-list">
                  {state.items.map((item, idx) => {
                    const prod = grammar[item.productionId];
                    const before = prod.rhs.slice(0, item.dotPosition);
                    const after = prod.rhs.slice(item.dotPosition);
                    
                    return (
                      <div key={idx} className="lr1-item">
                        <span className="item-lhs">{prod.lhs}</span>
                        <span className="item-arrow">→</span>
                        <span className="item-rhs">
                          {before.map((s, i) => (
                            <span key={`b${i}`} className={isTerminal(s) ? 'terminal' : 'non-terminal'}>
                              {s}
                            </span>
                          ))}
                          <span className="dot">•</span>
                          {after.map((s, i) => (
                            <span key={`a${i}`} className={isTerminal(s) ? 'terminal' : 'non-terminal'}>
                              {s}
                            </span>
                          ))}
                        </span>
                        <span className="item-lookahead">, {item.lookahead}</span>
                      </div>
                    );
                  })}
                </div>

                {state.transitions.size > 0 && (
                  <div className="transitions">
                    <div className="transitions-title">Transitions:</div>
                    <div className="transitions-list">
                      {Array.from(state.transitions.entries()).map(([symbol, targetState]) => (
                        <div 
                          key={symbol} 
                          className={`transition ${
                            highlightedTransition?.from === state.id && 
                            highlightedTransition?.symbol === symbol 
                              ? 'highlighted' 
                              : ''
                          }`}
                        >
                          <span className={isTerminal(symbol) ? 'terminal' : 'non-terminal'}>
                            {symbol}
                          </span>
                          <span className="transition-arrow">→</span>
                          <span className="target-state">I{targetState}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
