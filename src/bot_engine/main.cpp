#include <cstdint>
#include <iostream>
#include <chrono>
#include <iostream>
#include <cmath>
#include <cstddef>

// TODO: Seperate code into Game, Local Testing & WASM Entry Point

// MACROS

#define LOG(name) std::cout << name << '\n'
#define LOGI(name) std::cout << name << ", "

#define RED "\033[31m"
#define GREEN "\033[32m"
#define WHITE_BG "\033[47m"
#define RESET "\033[0m"
#define RUN_IF_DEBUG(code) if(false) {code}

// TYPEDEFS

typedef uint8_t Team;
typedef uint8_t Dots;
typedef int BoardSize;

// CONSTANTS

const int MAX_SCORE = 2147483647;
const int MIN_SCORE = -2147483648;

int CalculateMaxTileWeight(const int width, const int height) {
    const int w2 = (width - 1) / 2;
    const int h2 = (height - 1) / 2;
    const int maxWeight = w2 + h2 + 1;
    return maxWeight;
}

void GenerateSearchPattern(const int width, const int height, const int* weights, int* searchPattern) {
    const int maxWeight = CalculateMaxTileWeight(width, height);
    int j = 0;

    for (int i = maxWeight; i > 0; i--) {
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                const int z = x + y * width;
                const int w = weights[z];
                if (w == i) {
                    searchPattern[j] = z;
                    j++;
                }
            }
        }
    }
}

int CalculateTileWeight(const int x, const int y, const int width, const int height) {
    // Returns shortest distance to a corner
    // Calculate distances to each corner
    const int dist1 = x + y;                     // Top-left corner
    const int dist2 = (width - 1 - x) + y;       // Top-right corner
    const int dist3 = x + (height - 1 - y);      // Bottom-left corner
    const int dist4 = (width - 1 - x) + (height - 1 - y); // Bottom-right corner

    // Find the minimum distance manually
    int minDistanceToCorner = dist1;
    if (dist2 < minDistanceToCorner) minDistanceToCorner = dist2;
    if (dist3 < minDistanceToCorner) minDistanceToCorner = dist3;
    if (dist4 < minDistanceToCorner) minDistanceToCorner = dist4;

    return minDistanceToCorner + 1;
}

void CalculateTileWeights(const int width, const int height, int* weights) {
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            const int z = CalculateTileWeight(x, y, width, height);
            weights[x + y * width] = z;
        }
    }
}

// UTILS

class Timer {
public:
    Timer() : start_time(std::chrono::high_resolution_clock::now()) {}

    void reset() {
        start_time = std::chrono::high_resolution_clock::now();
    }

    double elapsedMilliseconds() const {
        auto end_time = std::chrono::high_resolution_clock::now();
        return std::chrono::duration<double, std::milli>(end_time - start_time).count();
    }

    double elapsedSeconds() const {
        return elapsedMilliseconds() / 1000.0;
    }

private:
    std::chrono::high_resolution_clock::time_point start_time;
};

// GAME

struct Tile {
    Team team;
    Dots dots;

    Tile(Team team = 0, Dots dots = 0): team(team), dots(dots) {}
};

struct Board {
    Tile* tiles;
    BoardSize width;
    BoardSize height;

    Board() : tiles(nullptr), width(0), height(0) {}

    Board(BoardSize width, BoardSize height) : tiles(nullptr), width(width), height(height) {
        tiles = new Tile[width*height]; // Allocate memory for tiles
    }

    ~Board() {
        delete[] tiles; // Free allocated memory
    }

    // Copy Constructor
    Board(const Board& other)
        : tiles(nullptr), width(other.width), height(other.height) {
        if (other.tiles) {
            BoardSize n = width * height;
            tiles = new Tile[n];
            for (BoardSize i = 0; i < n; ++i) {
                tiles[i] = other.tiles[i]; // Copy each tile
            }
        }
    }

    // Copy Assignment Operator
    Board& operator=(const Board& other) {
        if (this == &other) return *this; // Handle self-assignment

        // Free existing resources
        delete[] tiles;

        // Copy dimensions
        width = other.width;
        height = other.height;
        BoardSize n = width * height;

        // Allocate new memory and copy
        if (other.tiles) {
            tiles = new Tile[n];
            for (BoardSize i = 0; i < n; ++i) {
                tiles[i] = other.tiles[i]; // Copy each tile
            }
        }
        else {
            tiles = nullptr; // Handle case where other.tiles is nullptr
        }

        return *this;
    }
};

// Function to log the board to the terminal
void LogBoard(const Board& board) {
    const BoardSize width = board.width;
    const BoardSize height = board.height;
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            const int i = x + y * width;
            const Tile& tile = board.tiles[i];
            const char* background = ((x+y) % 2 == 0) ? WHITE_BG : "";
            if (tile.dots == 0) { 
                std::cout << background << ' ' << RESET;
            } else{
                const char* color = (tile.team == 0) ? RED : GREEN;
                std::cout << background << color << int(tile.dots) << RESET;
            }
        }
        std::cout << '\n';
    }
}

void TakeTile(Board& board, const int x, const int y, const int team) {
    const BoardSize width = board.width;
    const BoardSize height = board.height;
    if (x < 0 || x >= width || y < 0 || y >= height) {
        return;
    }
    const int i = x + y * width;
    Tile& tile = board.tiles[i];
    tile.team = team;
    if (tile.dots < 4) {
        tile.dots++;
    }
}

void UpdateBoard(Board& board) {
    const BoardSize width = board.width;
    const BoardSize height = board.height;
    bool hasUpdated = true;
    while (hasUpdated) {
        hasUpdated = false;
        for (int y = 0; y < height; ++y) {
            for (int x = 0; x < width; ++x) {
                const int i = x + y * width;
                Tile& tile = board.tiles[i];
                if (tile.dots == 4) {
                    tile.dots = 0;
                    const int team = tile.team;
                    TakeTile(board, x - 1, y, team);
                    TakeTile(board, x + 1, y, team);
                    TakeTile(board, x, y - 1, team);
                    TakeTile(board, x, y + 1, team);
                    hasUpdated = true;
                }
            }
        }
        RUN_IF_DEBUG(
            LOG("update");
            LogBoard(board);
        );
    }
}


int ScoreBoard(const Board& board, const int team, const int* weights, const int maxWeight) {
    const BoardSize width = board.width;
    const BoardSize height = board.height;

    int posScore = 0;
    int negScore = 0;
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            const int i = x + y * width;
            const Tile& tile = board.tiles[i];
            if (tile.dots == 0) {
                continue;
            }
            const int w = weights[i];
            if (tile.team == team) {
                posScore += tile.dots *  w;
            }
            else {
                negScore -= tile.dots *  w;
            }
        }
    }
    return posScore + negScore;
}

bool HasTeamLost(const Board& board, const int team) {
    const BoardSize width = board.width;
    const BoardSize height = board.height;
    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            const int i = x + y * width;
            const Tile& tile = board.tiles[i];
            if (tile.dots > 0 && tile.team == team) {
                return false;
            }
        }
    }
    return true;
}


int Minimax(
    const int gameIteration, 
    const int depth,
    const int maxDepth, 
    int alpha,
    int beta, 
    const Board& board, 
    const Team team, 
    int &nodesSearched,
    const int* weights,
    const int* searchPattern,
    const int maxWeight
) {
    //LOG("MINIMAX");
    nodesSearched++;
    Team currentTeam = (team + depth) % 2;

    const BoardSize width = board.width;
    const BoardSize height = board.height;
    const int boardArea = width * height;

    // if current team has lost then we stop search 
    const bool hasTeamLost = gameIteration > 1 && HasTeamLost(board, currentTeam);
    if (hasTeamLost) {
        // Reward computer for winning as quickly as possible
        // bonus = a score greater than any possible for a board (num tiles * max weight * max dots)
        const int bonus = 100; // boardArea* maxWeight * 3;
        // if team = currentTeam then team has lost
        const int sign = currentTeam == team ? -1 : 1;
        const int score = (ScoreBoard(board, team, weights, maxWeight) + (sign * bonus)) * (maxDepth + 1 - depth);
    /*    LOG("score* " << score);
        logBoard(board);*/
        //LOG("hasTeamLost " << gameIteration << " " << score << " " << bonus);
        return score;
    }

    if (depth == maxDepth) {
        const int score = ScoreBoard(board, team, weights, maxWeight);
     /*   if (score == -29) {
            LOG("--");
            LogBoard(board);
        }*/
        return score;
    }


    int bestMove = 2147483647; // 2147483647 = invalid tile position (max int value)
   
    bool isMaximisingTeam = depth % 2 == 0;


    for(int i = 0; i < boardArea; ++i) {
        const int tileIndex = searchPattern[i];
      /*  if (tileIndex != 1 && depth == 0) {
            continue;
        }*/
        const Tile& tile = board.tiles[tileIndex];
        Board nextBoard;
        if (gameIteration <= 1) {
            if (tile.dots != 0) {
                continue;
            }
            nextBoard = board;
            Tile& tile = nextBoard.tiles[tileIndex];
            nextBoard.tiles[tileIndex].dots = 3;
            nextBoard.tiles[tileIndex].team = currentTeam;
        } else {
            if (!(tile.dots > 0 && tile.team == currentTeam)) {
                continue;
            }
            nextBoard = board;
            nextBoard.tiles[tileIndex].dots++;
        }

        UpdateBoard(nextBoard);

   /*     LOG(gameIteration << ' ' << depth << ' ' << x << ' ' << y);
        logBoard(nextBoard);*/

        const int score = Minimax(gameIteration + 1, depth + 1, maxDepth, alpha, beta, nextBoard, team, nodesSearched, weights, searchPattern, maxWeight);
  /*      LOG(depth << " " << tileIndex << " " << score << " " << maxDepth);
        if (depth == maxDepth - 1) {
            LogBoard(nextBoard);
        }*/
        

        //LOG('s' << score << ' ' << isMaximisingTeam << ' ' << alpha << ' ' << beta);
        // alpha-beta pruning
        if (isMaximisingTeam) {
            if (score > alpha) {
                alpha = score;
              /*  if (depth == 0) {
                    LOG("i " << tileIndex << " " << score);
                }*/
                bestMove = tileIndex; // only used on depth=0
            }
        }
        else if (score < beta) {
            beta = score;
        }

        if (alpha >= beta) {
            break; // no need to search other moves
        }
    }

    //LOG("bestMove, depth: " << bestMove << " " << depth);
    if (depth == 0) {
        //LOG("bestMove " << bestMove);
        return bestMove;
    }
    else if (isMaximisingTeam) {
        return alpha;
    }
    else {
        return beta;
    }
}


// ENTRY POINTS


// WASM
extern "C" int InitBotEngine(const Board& board, const int depth, const int gameIteration, const int team) {
    int nodesSearched = 0;
    const int n = board.width * board.height;
    int* weights = new int[n];
    int* searchPattern = new int[n];
    const int maxWeight = CalculateMaxTileWeight(board.width, board.height);

    CalculateTileWeights(board.width, board.height, weights);
    GenerateSearchPattern(board.width, board.height, weights, searchPattern);

    //const BoardSize width = board.width;
    //const BoardSize height = board.height;
    //for (int y = 0; y < height; ++y) {
    //    for (int x = 0; x < width; ++x) {
    //        LOGI(searchPattern[x + y * width]);
    //    }
    //    LOG(" ");
    //}

    //for (int y = 0; y < height; ++y) {
    //    for (int x = 0; x < width; ++x) {
    //        LOGI(weights[x + y * width]);
    //    }
    //    LOG(" ");
    //}

    const int i = Minimax(gameIteration, 0, depth, MIN_SCORE, MAX_SCORE, board, team, nodesSearched, weights, searchPattern, maxWeight);
    //LOGI("nodesSearched " << nodesSearched);
    return i;
}

// TESTING
void TestMultipleRounds() {
    Board board = Board(8, 8);
    //board.tiles[2 + 2 * 5] = Tile(0, 3);
    //board.tiles[1 + 1 * 5] = Tile(1, 3);
    LogBoard(board);

    for (int n = 0; n < 50; ++n) {
        LOGI("round " << n);
        Timer t = Timer();
        const int team = n % 2;
        if (n > 1 && HasTeamLost(board, team)) {
            LOG("team " << team << " has lost");
            break;
        }
        const int i = InitBotEngine(board, 8, n, team);
        if (i == 25) {
            LOG("computer did not pick move");
            break;
        }
        LOGI("elapsed " << t.elapsedMilliseconds());
        const int x = i % 5;
        const int y = i / 5;
        LOG("move " << x << ' ' << y);
        if (n <= 1) {
            board.tiles[i].dots = 3;
            board.tiles[i].team = n;
        }
        else {
            board.tiles[i].dots++;
        }
       
        UpdateBoard(board);
        LogBoard(board);
      
    }

    
}

void TestOneRound() {
    Board board = Board(8, 8);

    //const Tile tiles[25] = {
    //    {0, 3}, {0, 2}, {0, 3}, {0, 2}, {0, 0},
    //    {0, 0}, {0, 2}, {0, 0}, {0, 2}, {0, 1},
    //    {0, 2}, {0, 1}, {0, 3}, {0, 1}, {0, 2},
    //    {1, 3}, {0, 3}, {0, 3}, {0, 3}, {0, 0},
    //    {0, 2}, {0, 0}, {0, 1}, {0, 1}, {0, 0},
    //};

    //for (int i = 0; i < 25; ++i) {
    //    board.tiles[i] = tiles[i];
    //}
    LOG("AREA " << board.width * board.height);
    LOG("MAX WEIGHT " << CalculateMaxTileWeight(board.width, board.height));
    LogBoard(board);

    Timer t = Timer();

    int tileIndex = InitBotEngine(board, 9, 0, 0);
    
    const int x = tileIndex % board.width;
    const int y = tileIndex / board.width;
    LOG("move " << tileIndex << " - " << x << ' ' << y);
    LOG("elapsed milliseconds " << t.elapsedMilliseconds());
}

int main()
{
    LOG("Color Wars");
    TestOneRound();
    //TestMultipleRounds();
    return 0;
}