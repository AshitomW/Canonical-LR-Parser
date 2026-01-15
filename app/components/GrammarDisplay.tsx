'use client';

import { grammar, productionToString, isTerminal } from '../lib/clr-parser';

interface GrammarDisplayProps {
  highlightedProduction?: number;
  isAnimating?: boolean;
}

export default function GrammarDisplay({ 
  highlightedProduction, 
  isAnimating = false 
}: GrammarDisplayProps) {
  return (
    <div className="grammar-display">
      <h3 className="section-title">
        <span className="title-icon">[G]</span>
        Augmented Grammar
      </h3>
      <div className="grammar-container">
        {grammar.map((prod, index) => (
          <div
            key={prod.id}
            className={`production ${highlightedProduction === prod.id ? 'highlighted' : ''} ${isAnimating && highlightedProduction === prod.id ? 'pulse' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="production-number">{prod.id}</span>
            <span className="production-content">
              <span className="non-terminal">{prod.lhs}</span>
              <span className="arrow">→</span>
              <span className="rhs">
                {prod.rhs.map((symbol, i) => (
                  <span
                    key={i}
                    className={isTerminal(symbol) ? 'terminal' : 'non-terminal'}
                  >
                    {symbol}
                  </span>
                ))}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="grammar-legend">
        <div className="legend-item">
          <span className="terminal-badge">terminal</span>
          <span className="legend-text">Terminals: id, *, =, $</span>
        </div>
        <div className="legend-item">
          <span className="non-terminal-badge">non-terminal</span>
          <span className="legend-text">Non-terminals: S', S, L, R</span>
        </div>
      </div>
    </div>
  );
}
