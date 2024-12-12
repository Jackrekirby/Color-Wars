// color_wars.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

#include <iostream>
#include <chrono>

#define LOG(name) std::cout << name << '\n'
#define LOGI(name) std::cout << name << ", "

// color_wars.cpp : This file contains the 'main' function. Program execution begins and ends there.
//

#include <iostream>

#define LOG(name) std::cout << name << '\n'
#define RED "\033[31m"
#define GREEN "\033[32m"
#define WHITE_BG "\033[47m"
#define RESET "\033[0m"
#define RUN_IF_DEBUG(code) if(false) {code}

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

// VERSION 1

struct Tile {
    int team;
    int dots;

    Tile(int team = 0, int dots = 0): team(team), dots(dots) {}
};

struct Board {
    Tile tiles[25];
};

// Function to log the board to the terminal
void logBoard(const Board& board) {
    for (int y = 0; y < 5; ++y) {
        for (int x = 0; x < 5; ++x) {
            const int i = x + y * 5;
            const Tile& tile = board.tiles[i];
            const char* background = (i % 2 == 0) ? WHITE_BG : "";
            if (tile.dots == 0) { 
                std::cout << background << ' ' << RESET;
            } else{
                const char* color = (tile.team == 0) ? RED : GREEN;
                std::cout << background << color << tile.dots << RESET;
            }
        }
        std::cout << '\n';
    }
}

void TakeTile(Board& board, const int x, const int y, const int team) {
    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
        return;
    }
    const int i = x + y * 5;
    Tile& tile = board.tiles[i];
    tile.team = team;
    if (tile.dots < 4) {
        tile.dots++;
    }
}

void UpdateBoard(Board& board) {
    bool hasUpdated = true;
    while (hasUpdated) {
        hasUpdated = false;
        for (int y = 0; y < 5; ++y) {
            for (int x = 0; x < 5; ++x) {
                const int i = x + y * 5;
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
            logBoard(board);
        );
    }
}

int generateNextMoves(const Board& board, const int team)  {
    int numMovesGenerated = 0;
    for (int y = 0; y < 5; ++y) {
        for (int x = 0; x < 5; ++x) {
            const int i = x + y * 5;
            const Tile& tile = board.tiles[i];
            if (tile.dots > 0 && tile.team == team) {
                Board nextBoard = board;
                nextBoard.tiles[i].dots++;
                RUN_IF_DEBUG(
                    LOG(x << ' ' << y);
                    logBoard(nextBoard);
                )

                UpdateBoard(nextBoard);
                numMovesGenerated++;
            }
        }
    }
    return numMovesGenerated;
}

const int MAX_SCORE = 2147483647;
const int MIN_SCORE = -2147483648;

const int TILE_WEIGHTS[25] = {
    1, 2, 3, 2, 1,
    2, 5, 4, 5, 2,
    3, 4, 6, 4, 3,
    2, 5, 4, 5, 2,
    1, 2, 3, 2, 1,
};

int ScoreBoard(const Board& board, const int team) {
    // TODO: weight positions
    int posScore = 0;
    int negScore = 0;
    for (int y = 0; y < 5; ++y) {
        for (int x = 0; x < 5; ++x) {
            const int i = x + y * 5;
            const Tile& tile = board.tiles[i];
            if (tile.dots == 0) {
                continue;
            }
            if (tile.team == team) {
                posScore += tile.dots * TILE_WEIGHTS[i];
            }
            else {
                negScore -= tile.dots * TILE_WEIGHTS[i];
            }
        }
    }
    return posScore + negScore;
}

bool HasTeamLost(const Board& board, const int team) {
    for (int y = 0; y < 5; ++y) {
        for (int x = 0; x < 5; ++x) {
            const int i = x + y * 5;
            const Tile& tile = board.tiles[i];
            if (tile.dots > 0 && tile.team == team) {
                return false;
            }
        }
    }
    return true;
}

int minimax(const int gameIteration, const int depth, const int maxDepth, int alpha, int beta, const Board& board, const int team, int &nodesSearched) {
    nodesSearched++;
    int currentTeam = (team + depth) % 2;
    // if current team has lost then we stop search 
    const bool hasTeamLost = gameIteration > 1 && HasTeamLost(board, currentTeam);
    if (hasTeamLost) {
        // Reward computer for winning as quickly as possible
        const int bonus = 100;
        // if team = currentTeam then team has lost
        const int sign = currentTeam == team ? -1 : 1;
        const int score = (ScoreBoard(board, team) + (sign * bonus)) * (maxDepth + 1 - depth);
       /* LOG("score* " << score);
        logBoard(board);*/
        return score;
    }

    if (depth == maxDepth) {
        const int score = ScoreBoard(board, team);
       /* LOG("score " << score);
        logBoard(board);*/
        return score;
    }


    int bestMove = 25; // 25 = invalid tile position
   
    bool isMaximisingTeam = depth % 2 == 0;

    for (int y = 0; y < 5; ++y) {
        for (int x = 0; x < 5; ++x) {
            const int i = x + y * 5;
            const Tile& tile = board.tiles[i];
            Board nextBoard;
            if (gameIteration <= 1) {
                if (tile.dots != 0) {
                    continue;
                }
                nextBoard = board;
                Tile& tile = nextBoard.tiles[i];
                nextBoard.tiles[i].dots = 3;
                nextBoard.tiles[i].team = currentTeam;
            } else {
                if (!(tile.dots > 0 && tile.team == currentTeam)) {
                    continue;
                }
                nextBoard = board;
                nextBoard.tiles[i].dots++;
            }

            UpdateBoard(nextBoard);

       /*     LOG(gameIteration << ' ' << depth << ' ' << x << ' ' << y);
            logBoard(nextBoard);*/

            const int score = minimax(gameIteration + 1, depth + 1, maxDepth, alpha, beta, nextBoard, team, nodesSearched);

            // alpha-beta pruning
            if (isMaximisingTeam) {
                if (score > alpha) {
                    alpha = score;

                    bestMove = x + y * 5; // only used on depth=0
                }
            }
            else if (score < beta) {
                beta = score;
            }

            if (alpha >= beta) {
                goto ExitLoop; // no need to search other moves
            }
        }
    }

ExitLoop:
    if (depth == 0) {
        LOGI("alpha " << alpha);
        return bestMove;
    }
    else if (isMaximisingTeam) {
        return alpha;
    }
    else {
        return beta;
    }
}



extern "C" int InitialiseMiniMax(const Board& board, const int depth, const int gameIteration, const int team) {
    int nodesSearched = 0;
    const int i = minimax(gameIteration, 0, depth, MIN_SCORE, MAX_SCORE, board, team, nodesSearched);
    LOGI("nodesSearched " << nodesSearched);
    return i;
}


void simpleTest() {
    
    Board board = Board();
    board.tiles[2 + 2 * 5] = Tile(0, 3);
    //board.tiles[1 + 1 * 5] = Tile(1, 3);
    logBoard(board);

    for (int n = 1; n < 2; ++n) {
        LOGI("round " << n);
        Timer t = Timer();
        const int team = n % 2;
        if (n > 1 && HasTeamLost(board, team)) {
            LOG("team " << team << " has lost");
            break;
        }
        const int i = InitialiseMiniMax(board, 8, n, team);
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
        logBoard(board);
      
    }

    
}

void performanceTest(const int n) {
    Board board = Board();
    board.tiles[2 + 1 * 5] = Tile(0, 2);
    board.tiles[1 + 2 * 5] = Tile(0, 2);
    board.tiles[2 + 3 * 5] = Tile(1, 3);
    board.tiles[3 + 2 * 5] = Tile(1, 1);
    int numMovesGenerated = 0;

    Timer t = Timer();
    for (int i = 0; i < n; ++i) {
        numMovesGenerated += generateNextMoves(board, 0);
    }
    LOG(numMovesGenerated);
    LOG(t.elapsedMilliseconds());
}

int main()
{
    LOG("Color Wars");
    simpleTest();
    //performanceTest(1000000000); // 1_000_000_000
    return 0;
}