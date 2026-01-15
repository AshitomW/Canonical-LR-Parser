// CLR (Canonical LR) Parser Implementation
// Grammar:
// S' → S
// S  → L = R
// S  → R
// L  → * R
// L  → id
// R  → L

export type Symbol = string;
export type Terminal = Symbol;
export type NonTerminal = Symbol;

export interface Production {
  id: number;
  lhs: NonTerminal;
  rhs: Symbol[];
}

export interface LR1Item {
  productionId: number;
  dotPosition: number;
  lookahead: Terminal;
}

export interface LR1State {
  id: number;
  items: LR1Item[];
  transitions: Map<Symbol, number>;
}

export type ActionType = 'shift' | 'reduce' | 'accept' | 'error';

export interface Action {
  type: ActionType;
  value?: number; // state for shift, production for reduce
}

export interface ParseStep {
  step: number;
  stack: (string | number)[];
  symbols: string[];
  input: string[];
  action: string;
  actionDetail: Action;
}

export interface ParserResult {
  success: boolean;
  steps: ParseStep[];
  error?: string;
}

// Define the grammar
export const grammar: Production[] = [
  { id: 0, lhs: "S'", rhs: ['S'] },
  { id: 1, lhs: 'S', rhs: ['L', '=', 'R'] },
  { id: 2, lhs: 'S', rhs: ['R'] },
  { id: 3, lhs: 'L', rhs: ['*', 'R'] },
  { id: 4, lhs: 'L', rhs: ['id'] },
  { id: 5, lhs: 'R', rhs: ['L'] },
];

export const terminals: Terminal[] = ['id', '*', '=', '$'];
export const nonTerminals: NonTerminal[] = ["S'", 'S', 'L', 'R'];
export const allSymbols: Symbol[] = [...terminals, ...nonTerminals];

// Check if a symbol is a terminal
export function isTerminal(symbol: Symbol): boolean {
  return terminals.includes(symbol);
}

// Check if a symbol is a non-terminal
export function isNonTerminal(symbol: Symbol): boolean {
  return nonTerminals.includes(symbol);
}

// Compute FIRST set for a sequence of symbols
const firstCache = new Map<string, Set<Terminal>>();

export function computeFirst(symbols: Symbol[]): Set<Terminal> {
  const key = symbols.join('|');
  if (firstCache.has(key)) {
    return firstCache.get(key)!;
  }

  const result = new Set<Terminal>();

  if (symbols.length === 0) {
    result.add('ε');
    return result;
  }

  const first = symbols[0];

  if (isTerminal(first)) {
    result.add(first);
  } else {
    // Get all productions for this non-terminal
    for (const prod of grammar) {
      if (prod.lhs === first) {
        if (prod.rhs.length === 0 || (prod.rhs.length === 1 && prod.rhs[0] === 'ε')) {
          // Empty production
          const rest = computeFirst(symbols.slice(1));
          rest.forEach(t => result.add(t));
        } else {
          const firstOfRhs = computeFirst(prod.rhs);
          firstOfRhs.forEach(t => {
            if (t !== 'ε') result.add(t);
          });
          if (firstOfRhs.has('ε')) {
            const rest = computeFirst(symbols.slice(1));
            rest.forEach(t => result.add(t));
          }
        }
      }
    }
  }

  firstCache.set(key, result);
  return result;
}

// Create a unique string representation of an LR(1) item
export function itemToString(item: LR1Item): string {
  const prod = grammar[item.productionId];
  const before = prod.rhs.slice(0, item.dotPosition).join(' ');
  const after = prod.rhs.slice(item.dotPosition).join(' ');
  return `[${prod.lhs} → ${before}•${after}, ${item.lookahead}]`;
}

// Create a unique key for an LR(1) item (for comparison)
function itemKey(item: LR1Item): string {
  return `${item.productionId}-${item.dotPosition}-${item.lookahead}`;
}

// Create a unique key for a set of items (for state comparison)
function stateKey(items: LR1Item[]): string {
  return items
    .map(itemKey)
    .sort()
    .join('|');
}

// Check if item set contains a specific item
function hasItem(items: LR1Item[], item: LR1Item): boolean {
  const key = itemKey(item);
  return items.some(i => itemKey(i) === key);
}

// CLOSURE function for LR(1)
export function closure(items: LR1Item[]): LR1Item[] {
  const result = [...items];
  let changed = true;

  while (changed) {
    changed = false;
    for (const item of [...result]) {
      const prod = grammar[item.productionId];
      
      // Check if dot is before a non-terminal
      if (item.dotPosition < prod.rhs.length) {
        const symbolAfterDot = prod.rhs[item.dotPosition];
        
        if (isNonTerminal(symbolAfterDot)) {
          // Compute lookaheads: FIRST(βa) where β is what follows B and a is the lookahead
          const beta = prod.rhs.slice(item.dotPosition + 1);
          const firstOfBetaA = computeFirst([...beta, item.lookahead]);
          
          // Add items for all productions of the non-terminal
          for (const p of grammar) {
            if (p.lhs === symbolAfterDot) {
              for (const lookahead of firstOfBetaA) {
                if (lookahead !== 'ε') {
                  const newItem: LR1Item = {
                    productionId: p.id,
                    dotPosition: 0,
                    lookahead,
                  };
                  if (!hasItem(result, newItem)) {
                    result.push(newItem);
                    changed = true;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return result;
}

// GOTO function for LR(1)
export function goto(items: LR1Item[], symbol: Symbol): LR1Item[] {
  const moved: LR1Item[] = [];

  for (const item of items) {
    const prod = grammar[item.productionId];
    
    if (item.dotPosition < prod.rhs.length) {
      const symbolAfterDot = prod.rhs[item.dotPosition];
      
      if (symbolAfterDot === symbol) {
        moved.push({
          productionId: item.productionId,
          dotPosition: item.dotPosition + 1,
          lookahead: item.lookahead,
        });
      }
    }
  }

  return moved.length > 0 ? closure(moved) : [];
}

// Build the canonical collection of LR(1) states
export function buildCanonicalCollection(): LR1State[] {
  const states: LR1State[] = [];
  const stateMap = new Map<string, number>();

  // Initial state: closure of [S' → •S, $]
  const initialItem: LR1Item = {
    productionId: 0,
    dotPosition: 0,
    lookahead: '$',
  };
  const initialState: LR1State = {
    id: 0,
    items: closure([initialItem]),
    transitions: new Map(),
  };
  states.push(initialState);
  stateMap.set(stateKey(initialState.items), 0);

  let i = 0;
  while (i < states.length) {
    const state = states[i];

    // Try GOTO for all symbols
    for (const symbol of allSymbols) {
      const gotoItems = goto(state.items, symbol);
      
      if (gotoItems.length > 0) {
        const key = stateKey(gotoItems);
        
        if (stateMap.has(key)) {
          // State already exists
          state.transitions.set(symbol, stateMap.get(key)!);
        } else {
          // New state
          const newState: LR1State = {
            id: states.length,
            items: gotoItems,
            transitions: new Map(),
          };
          states.push(newState);
          stateMap.set(key, newState.id);
          state.transitions.set(symbol, newState.id);
        }
      }
    }
    i++;
  }

  return states;
}

// Build the parsing table (ACTION and GOTO)
export interface ParsingTable {
  action: Map<string, Action>; // key: "state,terminal"
  goto: Map<string, number>; // key: "state,nonTerminal"
  conflicts: string[];
}

export function buildParsingTable(states: LR1State[]): ParsingTable {
  const action = new Map<string, Action>();
  const gotoTable = new Map<string, number>();
  const conflicts: string[] = [];

  for (const state of states) {
    for (const item of state.items) {
      const prod = grammar[item.productionId];

      if (item.dotPosition < prod.rhs.length) {
        // Dot is not at the end - SHIFT
        const symbol = prod.rhs[item.dotPosition];
        
        if (isTerminal(symbol)) {
          const nextState = state.transitions.get(symbol);
          if (nextState !== undefined) {
            const key = `${state.id},${symbol}`;
            const existingAction = action.get(key);
            const newAction: Action = { type: 'shift', value: nextState };
            
            if (existingAction && (existingAction.type !== 'shift' || existingAction.value !== nextState)) {
              conflicts.push(`Conflict at state ${state.id}, symbol ${symbol}: ${existingAction.type} vs shift`);
            } else {
              action.set(key, newAction);
            }
          }
        }
      } else {
        // Dot is at the end - REDUCE or ACCEPT
        if (item.productionId === 0 && item.lookahead === '$') {
          // Accept
          const key = `${state.id},$`;
          const existingAction = action.get(key);
          const newAction: Action = { type: 'accept' };
          
          if (existingAction && existingAction.type !== 'accept') {
            conflicts.push(`Conflict at state ${state.id}, symbol $: ${existingAction.type} vs accept`);
          } else {
            action.set(key, newAction);
          }
        } else {
          // Reduce
          const key = `${state.id},${item.lookahead}`;
          const existingAction = action.get(key);
          const newAction: Action = { type: 'reduce', value: item.productionId };
          
          if (existingAction) {
            if (existingAction.type === 'shift') {
              conflicts.push(`Shift-Reduce conflict at state ${state.id}, symbol ${item.lookahead}`);
            } else if (existingAction.type === 'reduce' && existingAction.value !== item.productionId) {
              conflicts.push(`Reduce-Reduce conflict at state ${state.id}, symbol ${item.lookahead}`);
            }
          } else {
            action.set(key, newAction);
          }
        }
      }
    }

    // Fill GOTO table for non-terminals
    for (const [symbol, nextState] of state.transitions) {
      if (isNonTerminal(symbol) && symbol !== "S'") {
        const key = `${state.id},${symbol}`;
        gotoTable.set(key, nextState);
      }
    }
  }

  return { action, goto: gotoTable, conflicts };
}

// Tokenize input string
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const regex = /\s*(id|\*|=)\s*/g;
  let match;
  
  while ((match = regex.exec(input)) !== null) {
    tokens.push(match[1]);
  }
  
  tokens.push('$'); // End marker
  return tokens;
}

// Parse input using the LR parser
export function parse(input: string, states: LR1State[], table: ParsingTable): ParserResult {
  const tokens = tokenize(input);
  const stack: (string | number)[] = [0]; // State stack
  const symbols: string[] = []; // Symbol stack (for display)
  const steps: ParseStep[] = [];
  let inputIndex = 0;
  let stepNum = 0;

  while (true) {
    const currentState = stack[stack.length - 1] as number;
    const currentToken = tokens[inputIndex];
    const actionKey = `${currentState},${currentToken}`;
    const actionEntry = table.action.get(actionKey);

    // Record step
    const step: ParseStep = {
      step: stepNum++,
      stack: [...stack],
      symbols: [...symbols],
      input: tokens.slice(inputIndex),
      action: '',
      actionDetail: { type: 'error' },
    };

    if (!actionEntry) {
      step.action = `Error: No action for state ${currentState}, token ${currentToken}`;
      step.actionDetail = { type: 'error' };
      steps.push(step);
      return { success: false, steps, error: step.action };
    }

    step.actionDetail = actionEntry;

    if (actionEntry.type === 'shift') {
      step.action = `Shift ${currentToken}, go to state ${actionEntry.value}`;
      steps.push(step);
      
      stack.push(currentToken);
      stack.push(actionEntry.value!);
      symbols.push(currentToken);
      inputIndex++;
    } else if (actionEntry.type === 'reduce') {
      const prodId = actionEntry.value!;
      const prod = grammar[prodId];
      step.action = `Reduce by ${prod.lhs} → ${prod.rhs.join(' ')}`;
      steps.push(step);
      
      // Pop 2 * |rhs| items from stack
      const popCount = prod.rhs.length * 2;
      for (let i = 0; i < popCount; i++) {
        stack.pop();
      }
      for (let i = 0; i < prod.rhs.length; i++) {
        symbols.pop();
      }
      
      // Push the LHS non-terminal
      const newState = stack[stack.length - 1] as number;
      const gotoKey = `${newState},${prod.lhs}`;
      const gotoState = table.goto.get(gotoKey);
      
      if (gotoState === undefined) {
        return { 
          success: false, 
          steps, 
          error: `Error: No GOTO for state ${newState}, non-terminal ${prod.lhs}` 
        };
      }
      
      stack.push(prod.lhs);
      stack.push(gotoState);
      symbols.push(prod.lhs);
    } else if (actionEntry.type === 'accept') {
      step.action = 'Accept!';
      steps.push(step);
      return { success: true, steps };
    }
  }
}

// Get production string for display
export function productionToString(prod: Production): string {
  return `${prod.lhs} → ${prod.rhs.join(' ')}`;
}

// Pre-compute everything for easy access
let cachedStates: LR1State[] | null = null;
let cachedTable: ParsingTable | null = null;

export function getStates(): LR1State[] {
  if (!cachedStates) {
    cachedStates = buildCanonicalCollection();
  }
  return cachedStates;
}

export function getParsingTable(): ParsingTable {
  if (!cachedTable) {
    cachedTable = buildParsingTable(getStates());
  }
  return cachedTable;
}

export function resetCache(): void {
  cachedStates = null;
  cachedTable = null;
  firstCache.clear();
}
