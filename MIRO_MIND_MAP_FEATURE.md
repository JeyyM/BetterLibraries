# Miro AI-Powered Mind Map Feature

## Overview
This feature uses **Gemini AI** to analyze books and create detailed mind map specifications, which are then visually built on **Miro boards** with proper nodes, connections, and relationships.

## Architecture

### Two-Step Process

#### Step 1: Gemini Creates the Blueprint 🧠
- Gemini analyzes the book content
- Generates a JSON specification with:
  - Central node (book title)
  - 4-6 main branches (themes, characters, plot, symbols, setting, quotes)
  - 2-4 subnodes under each branch
  - Relationships between nodes (cross-connections)
  - Color coding for different categories

#### Step 2: Miro Builds the Visual 🎨
- Creates visual mind map based on Gemini's design
- Uses Miro REST API v2 to create:
  - **Shapes** (round rectangles and rectangles)
  - **Connectors** (lines between nodes)
  - **Radial layout** (organized in a circle pattern)
  - **Color-coded nodes** for visual organization

## Mind Map Structure

```
                    [Book Title]
                    (Central Node)
                    Color: #FF6B6B
                          |
        +-----------------+-----------------+
        |                 |                 |
    [Themes]         [Characters]        [Plot]
   Color: #4ECDC4    Color: #95E1D3   Color: #FFD93D
        |                 |                 |
    +---+---+         +---+---+         +---+---+
    |   |   |         |   |   |         |   |   |
  Theme1 2 3        Char1 2 3          Event1 2 3
  (subnodes)       (subnodes)         (subnodes)
```

### Cross-Connections
- Dashed lines show relationships between different branches
- Example: A theme node connects to the character who embodies it
- Example: A symbol connects to the plot event where it appears

## Color Scheme

| Category   | Color     | Hex Code  | Purpose                    |
|------------|-----------|-----------|----------------------------|
| Central    | Red       | #FF6B6B   | Book title (focal point)   |
| Themes     | Teal      | #4ECDC4   | Main themes                |
| Characters | Mint      | #95E1D3   | Character analysis         |
| Plot       | Yellow    | #FFD93D   | Story events               |
| Symbols    | Purple    | #C780FA   | Symbolism & motifs         |
| Setting    | Green     | #6BCF7F   | Locations & time           |
| Quotes     | Pink      | #FF9AA2   | Important quotes           |

## Technical Implementation

### Files Modified
- `services/miroAIService.ts` - Complete rewrite
- `components/ReadingView.tsx` - Uses the new service
- `MIRO_AI_FEATURE.md` - Updated documentation

### Key Functions

#### `generateMindMapSpec(book)`
- **Input**: Book summary object
- **Process**: Sends prompt to Gemini AI
- **Output**: JSON specification with mind map structure
- **Handles**: JSON parsing with fallback structure
- **Error handling**: Returns default structure if Gemini fails

```typescript
interface MindMapSpec {
  centralNode: {
    text: string;
    color: string;
  };
  branches: {
    id: string;
    text: string;
    color: string;
    subnodes: {
      id: string;
      text: string;
      connections?: string[]; // Cross-references to other nodes
    }[];
  }[];
}
```

#### `buildMindMapOnMiro(boardId, spec)`
- **Input**: Miro board ID and mind map specification
- **Process**:
  1. Creates central node (round_rectangle, 300x150px)
  2. Creates branches in radial layout (rectangles, 220x100px)
  3. Creates subnodes for each branch (rectangles, 180x80px)
  4. Connects nodes with lines (solid for hierarchy, dashed for relationships)
- **Output**: Visual mind map on Miro board
- **Returns**: Item IDs for all created elements

#### `populateReadingBoardWithAI(boardId, book, currentPage?)`
- **Main orchestrator function**
- **Process**:
  1. Calls `generateMindMapSpec()` to get Gemini's design
  2. Logs the specification for debugging
  3. Calls `buildMindMapOnMiro()` to create visual
  4. Provides detailed console logging
- **Used by**: ReadingView component's "AI Study Tools" button

### Helper Functions

#### `createMindMapNode(boardId, text, x, y, color, width, height, shape)`
- Creates individual nodes on Miro board
- Returns the created node's ID for connecting
- Supports different shapes: round_rectangle, rectangle, circle
- Font size adapts to shape type

#### `createConnector(boardId, startItemId, endItemId, style)`
- Creates lines between nodes
- Supports solid lines (parent-child) and dashed lines (cross-references)
- Customizable stroke color and width

## Layout Algorithm

### Radial Layout
- Central node at position (0, 0)
- Branches positioned in a circle around center
- Radius: 500 pixels from center
- Calculation: `angle = (i * 2π) / branchCount - π/2` (starts from top)

### Subnode Layout
- Each branch has its own subnodes
- Positioned in an arc around the branch node
- Radius: 350 pixels from branch
- Spread: 0.3 radians between each subnode

## Usage in ReadingView

```typescript
const handleGenerateAIContent = async () => {
  if (!currentBook || !miroBoardId) return;
  
  setIsGenerating(true);
  try {
    await populateReadingBoardWithAI(
      miroBoardId,
      {
        title: currentBook.title,
        fullText: currentBook.content
      },
      currentPage
    );
    toast.success('AI mind map created!');
  } catch (error) {
    toast.error('Failed to generate AI content');
  } finally {
    setIsGenerating(false);
  }
};
```

## Console Logging

The feature provides detailed logging:

```
🤖 Starting AI-powered mind map generation...
📚 Book: "The Tell-Tale Heart"
🧠 Gemini is analyzing the book and designing the mind map...
✅ Gemini created mind map with 5 main branches
  • Main Themes (3 subnodes)
  • Characters (2 subnodes)
  • Plot Points (4 subnodes)
  • Symbolism (3 subnodes)
  • Quotes (2 subnodes)
🎨 Building visual mind map on Miro board...
✅ Created central node
✅ Mind map built successfully on Miro!
✅ AI-powered mind map completed successfully!
📍 The mind map includes:
   - Central node with book title
   - Color-coded branches for different aspects
   - Connected subnodes showing relationships
   - Visual layout optimized for understanding
```

## Error Handling

### Gemini API Failures
- Falls back to default mind map structure
- Logs error to console
- Continues with basic visualization

### Miro API Failures
- Catches and throws errors
- Displays user-friendly toast message
- Preserves error details for debugging

### JSON Parsing Issues
- Handles markdown code blocks from Gemini
- Strips ```json wrappers
- Uses fallback structure if parsing fails

## Performance

- **Gemini analysis**: ~3-5 seconds
- **Mind map creation**: ~5-10 seconds (sequential API calls)
- **Total**: ~8-15 seconds
- **Network calls**: 1 Gemini + (1 + branches + subnodes + connections) Miro calls

### Optimization Notes
- Nodes created sequentially to track IDs for connections
- Could be parallelized in the future with ID mapping
- Currently prioritizes correctness over speed

## API Requirements

### Gemini API
- Model: `gemini-2.5-flash-lite`
- SDK: `@google/genai`
- Endpoint: `genAI.models.generateContent()`
- Required env: `VITE_GEMINI_API_KEY`

### Miro REST API v2
- Endpoints:
  - `POST /v2/boards/{boardId}/shapes` - Create nodes
  - `POST /v2/boards/{boardId}/connectors` - Create lines
- Required env: `VITE_MIRO_ACCESS_TOKEN`
- Permissions: `boards:read`, `boards:write`

## Future Enhancements

### Planned Features
- [ ] Interactive node expansion (click to see more details)
- [ ] Export mind map as PNG/PDF
- [ ] Save mind map templates
- [ ] Student annotations on mind maps
- [ ] Teacher feedback on student mind maps
- [ ] Compare mind maps between students

### Potential Improvements
- [ ] Parallel node creation (faster performance)
- [ ] More layout algorithms (hierarchical, force-directed)
- [ ] Animation effects when building
- [ ] Zoom and pan controls
- [ ] Collaborative editing with live cursors

## Hackathon Demo Tips

1. **Pre-generate for popular books** to avoid wait time
2. **Show the console logs** to demonstrate AI thinking process
3. **Highlight the color coding** as smart categorization
4. **Point out cross-connections** showing relationship intelligence
5. **Emphasize** this is Gemini's analysis, not pre-programmed templates

## Troubleshooting

### Issue: JSON Parsing Errors
- **Cause**: Gemini returns text instead of JSON
- **Solution**: Fallback structure activates automatically
- **Check**: Console for the actual response from Gemini

### Issue: Nodes Not Connecting
- **Cause**: Invalid node IDs in connections array
- **Solution**: Only connects if target ID exists in itemIds map
- **Check**: Gemini spec for valid connection references

### Issue: Layout Overlaps
- **Cause**: Too many subnodes or branches
- **Solution**: Adjust radius values in code
- **Tune**: `branchRadius` and `subnodeRadius` constants

## Comparison to Previous Approach

### Old Approach (Sticky Notes)
- ❌ Just text content
- ❌ No visual structure
- ❌ No relationships shown
- ✅ Simple and fast

### New Approach (Mind Maps)
- ✅ Visual structure with hierarchy
- ✅ Shows relationships and connections
- ✅ Color-coded organization
- ✅ Professional appearance
- ⚠️ Takes longer (but worth it!)

## Demo Script

1. **Open a book** in reading view
2. **Click "AI Study Tools"** button (purple gradient with wand icon)
3. **Watch the console** as Gemini analyzes
4. **See the mind map appear** on the Miro board
5. **Zoom out** to see the full structure
6. **Point out**:
   - Color-coded categories
   - Hierarchical relationships
   - Cross-connections (dashed lines)
   - Central book title
7. **Explain**: "Gemini read the book, designed this structure, and Miro built it visually"

This feature showcases the power of combining AI analysis (Gemini) with visual collaboration tools (Miro)!
