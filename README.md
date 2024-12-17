# Color Wars

A recreation of the game Color Wars in the terminal, using Go.

## How to Play

Fill the entire board with your color. Click on one of your tiles to increment its score. When a tile reaches four points it splits into four one-point tiles, engulfing neighbouring tiles. One your first move place a tile of 3 points anywhere on the board.

## Dev Setup

### Go

`go run .`

`go build -o color_wars.exe`

### C++

Install Emscripten to compile C++ to WASM.

`emcc ".\color_wars\color_wars_cpp\color_wars\color_wars.cpp" -o ".\color_wars\color_wars_cpp\minimax.js" -s EXPORTED_FUNCTIONS="['_InitialiseMiniMax', '_malloc', '_free']" -s EXPORTED_RUNTIME_METHODS="['cwrap', 'getValue', 'setValue']" -O3`


## Basics of Minimax

A has two options A1, A2
Next go, B has 4 options B11, B12, B21, B22
Assume next go, B will pick the option that maximises its score.
Therefore A has to pick the option that has the highest minimum score.

Example 1:
Option = Score
A1 = 3              A2 = 5
B11 = 1 B12 = 5     B21 = 2 B22 = 4

Assuming B plays optimally, A should pick A2 because B can only get a maximum of 4 with B21.

## Tasks

## Clean Up

1. Rewrite JS in TS
2. Seperate DOM and Game Logic
3. Remove GO Bot
4. Restructure files to minimise files in root and remove duplicate color_wars folders

### Optimisation

1. X Search tiles by potential for best scoring (middle, out)
2. X Weight tile score by tile position (middle, out)
3. Try and get a player out quickly (weight by rounds to win)
2. Randomise equal scoring moves

## User Interface

1. X Minimal Web Version
2. X Settings
3. X Scoreboard
4. Rewind
5. Replay
6. Show Blunders (Game Analysis)

### Features

1. Change board size
2. X Change depth
3. X Change which player is bot
4. X Choose between two players and bot
5. X Choose between two bots
6. Change number of points for tile split
7. Walls (absorbs points of neighbours)
8. Empty tiles which provide additional points
9. Defensive (tank) Tiles
10. Leaping tiles
11. Contagious tiles (deal more damage on split)