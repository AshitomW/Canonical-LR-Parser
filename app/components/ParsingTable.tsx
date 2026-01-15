'use client';

import { ParsingTable as ParsingTableType, terminals, nonTerminals, LR1State, Action } from '../lib/clr-parser';

interface ParsingTableProps {
  table: ParsingTableType;
  states: LR1State[];
  highlightedCell?: { state: number; symbol: string };
}

export default function ParsingTable({ 
  table, 
  states,
  highlightedCell 
}: ParsingTableProps) {
  const actionTerminals = terminals.filter(t => t !== 'ε');
  const gotoNonTerminals = nonTerminals.filter(nt => nt !== "S'");

  const formatAction = (action: Action | undefined): string => {
    if (!action) return '';
    switch (action.type) {
      case 'shift':
        return `s${action.value}`;
      case 'reduce':
        return `r${action.value}`;
      case 'accept':
        return 'acc';
      default:
        return '';
    }
  };

  const getActionClass = (action: Action | undefined): string => {
    if (!action) return '';
    switch (action.type) {
      case 'shift':
        return 'action-shift';
      case 'reduce':
        return 'action-reduce';
      case 'accept':
        return 'action-accept';
      default:
        return '';
    }
  };

  return (
    <div className="parsing-table-container">
      <h3 className="section-title">
        <span className="title-icon">📊</span>
        CLR Parsing Table
      </h3>

      {table.conflicts.length > 0 && (
        <div className="conflicts-warning">
          <span className="warning-icon">⚠️</span>
          <div className="conflicts-list">
            <strong>Conflicts detected:</strong>
            {table.conflicts.map((conflict, i) => (
              <div key={i}>{conflict}</div>
            ))}
          </div>
        </div>
      )}

      {table.conflicts.length === 0 && (
        <div className="no-conflicts">
          <span className="success-icon">✅</span>
          <span>No conflicts! This grammar is CLR(1).</span>
        </div>
      )}

      <div className="table-wrapper">
        <table className="parsing-table">
          <thead>
            <tr>
              <th rowSpan={2} className="state-header">State</th>
              <th colSpan={actionTerminals.length} className="action-header">ACTION</th>
              <th colSpan={gotoNonTerminals.length} className="goto-header">GOTO</th>
            </tr>
            <tr>
              {actionTerminals.map(t => (
                <th key={t} className="terminal-header">{t}</th>
              ))}
              {gotoNonTerminals.map(nt => (
                <th key={nt} className="non-terminal-header">{nt}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {states.map(state => (
              <tr key={state.id}>
                <td className="state-cell">{state.id}</td>
                {actionTerminals.map(t => {
                  const key = `${state.id},${t}`;
                  const action = table.action.get(key);
                  const isHighlighted = highlightedCell?.state === state.id && highlightedCell?.symbol === t;
                  
                  return (
                    <td 
                      key={t} 
                      className={`action-cell ${getActionClass(action)} ${isHighlighted ? 'highlighted' : ''}`}
                    >
                      {formatAction(action)}
                    </td>
                  );
                })}
                {gotoNonTerminals.map(nt => {
                  const key = `${state.id},${nt}`;
                  const gotoState = table.goto.get(key);
                  const isHighlighted = highlightedCell?.state === state.id && highlightedCell?.symbol === nt;
                  
                  return (
                    <td 
                      key={nt} 
                      className={`goto-cell ${gotoState !== undefined ? 'has-goto' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                    >
                      {gotoState !== undefined ? gotoState : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-legend">
        <div className="legend-item">
          <span className="legend-color action-shift"></span>
          <span>sN = Shift, go to state N</span>
        </div>
        <div className="legend-item">
          <span className="legend-color action-reduce"></span>
          <span>rN = Reduce by production N</span>
        </div>
        <div className="legend-item">
          <span className="legend-color action-accept"></span>
          <span>acc = Accept</span>
        </div>
        <div className="legend-item">
          <span className="legend-color has-goto"></span>
          <span>N = Goto state N</span>
        </div>
      </div>
    </div>
  );
}
