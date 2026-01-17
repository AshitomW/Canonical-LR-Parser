# CLR Parser

An interactive visualization of Canonical LR(1) parsing implemented with Next.js and TypeScript. This project demonstrates the complete LR(1) parsing process including grammar definition, item sets construction, parsing table generation, and step-by-step parsing visualization.

## Features

- **Interactive Grammar Display** - View the grammar rules with highlighting during parsing
- **LR(1) Item Sets** - Explore all canonical LR(1) states with closure and goto operations
- **Parsing Table** - View the complete ACTION and GOTO tables with conflict detection
- **State Graph** - Visual representation of state transitions
- **Step-by-Step Parsing** - Watch the parser process input strings with stack visualization
- **Animation Controls** - Play, pause, and adjust animation speed
- **Dark/Light Theme** - Switch between visual themes
- **Conflict Detection** - Automatic detection of shift-reduce and reduce-reduce conflicts

## Grammar

The parser implements the following augmented grammar:

```
S' → S
S  → L = R
S  → R
L  → * R
L  → id
R  → L
```

Terminals: `id`, `*`, `=`, `$`

Non-terminals: `S'`, `S`, `L`, `R`

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd clr-parser
```

2. Install dependencies:

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Parsing a String

1. Enter an input string in the input field (e.g., `id = * id`)
2. Click "Parse" to generate the parsing steps
3. Navigate to the "Parse String" tab to see step-by-step execution
4. Use playback controls to play, pause, or step through the parsing process
5. Adjust animation speed with the slider

### Exploring the Parser

- **Grammar Tab**: View all production rules
- **LR(1) Item Sets Tab**: Browse all canonical LR(1) states with their items
- **Parsing Table Tab**: Examine the complete ACTION and GOTO tables
- **State Graph Tab**: Visualize the finite automaton of LR(1) states
- **Parse String Tab**: Watch the parsing process in real-time

## Project Structure

```
app/
├── lib/
│   └── clr-parser.ts     # Core CLR parser implementation
├── components/
│   ├── GrammarDisplay.tsx      # Grammar visualization
│   ├── LR1ItemSets.tsx         # LR(1) item sets display
│   ├── ParsingTable.tsx        # ACTION/GOTO table
│   ├── StackVisualizer.tsx     # Parsing animation
│   ├── StateGraph.tsx          # State transition graph
│   └── ThemeSwitcher.tsx       # Dark/light theme toggle
├── layout.tsx            # Root layout
└── page.tsx              # Main application page
```

## Implementation Details

### Core Functions

- `closure(items: LR1Item[])` - Computes the closure of LR(1) items
- `goto(items: LR1Item[], symbol: Symbol)` - Computes the goto function
- `buildCanonicalCollection()` - Builds the canonical collection of LR(1) states
- `buildParsingTable(states: LR1State[])` - Constructs the parsing table
- `parse(input: string, states: LR1State[], table: ParsingTable)` - Parses input strings

### Data Structures

- `Production` - Grammar production rule
- `LR1Item` - LR(1) item with lookahead
- `LR1State` - Collection of LR(1) items with transitions
- `ParsingTable` - ACTION and GOTO tables with conflict detection

## Build for Production

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Vercel Analytics** - Usage analytics

## Acknowledgments

- Based on the Dragon Book (Compilers: Principles, Techniques, and Tools)
- Implemented as part of a compiler design project demonstrating Canonical LR parsing
