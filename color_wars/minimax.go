package color_wars

import (
	"fmt"
	"math/rand"
)

func minimax(depth, maxDepth byte, adjScore int8) int8 {
	if depth == maxDepth {
		score := int8(rand.Intn(256) - 128)
		fmt.Println(depth, score)
		return score
	}

	var bestScore int8 = adjScore
	var scoreSign int8
	if depth%2 == 0 {
		scoreSign = 1
	} else {
		scoreSign = -1
	}

	n := 2 // calculate board options (up to 24)
	for i := 0; i < n; i++ {
		score := minimax(depth+1, maxDepth, bestScore)
		// fmt.Println("iii", depth, n, adjScore, score)
		// if score*scoreSign < adjScore*scoreSign {
		// 	fmt.Println("pru", depth, adjScore, score)
		// 	return score // this score will never be chosen
		// }
		if score*scoreSign > bestScore*scoreSign {
			bestScore = score
		}
	}
	fmt.Println("end", depth, adjScore, bestScore)
	return bestScore
}

const doPrune = true

func minimax2(depth, maxDepth byte, alpha, beta int8) int8 {
	if depth == maxDepth {
		// Simulating a score (replace with actual evaluation function).
		score := int8(rand.Intn(256) - 128)
		fmt.Println(depth, score)
		return score
	}

	n := 2 // Number of available moves (adjust based on your game logic).
	for i := 0; i < n; i++ {
		score := minimax2(depth+1, maxDepth, alpha, beta)
		if depth%2 == 0 {
			// Maximizing player
			if score > alpha {
				alpha = score
			}
		} else {
			// Minimizing player
			if score < beta {
				beta = score
			}
		}

		// Pruning
		if doPrune && alpha >= beta && i+1 < n {
			fmt.Println("prune", depth, alpha, beta)
			break
		}
	}

	if depth%2 == 0 {
		fmt.Println("alpha", depth, alpha)
		return alpha
	}
	fmt.Println("beta", depth, beta)
	return beta
}

var alphaIndex = 0
var alphaBoard *[]byte
var nodesSearched = 0

func MiniMaxWrapper(maxDepth byte,
	board *[]byte, team byte) (r bool, x, y int) {
	alphaIndex = 0
	alphaBoard = nil
	nodesSearched = 0
	minimax3(0, maxDepth, -32768, 32767, board, team)
	if alphaBoard != nil {
		r = true
		x, y = alphaIndex%5, alphaIndex/5
	} else {
		r = false
		x, y = 0, 0
	}
	fmt.Println("minimax [nodesSearched]", nodesSearched)
	return
}

func minimax3(depth, maxDepth byte, alpha, beta int16,
	board *[]byte, team byte,
) int16 {
	nodesSearched += 1
	// fmt.Println("minimax3", nodesSearched)
	isBoardEmpty := false
	onlyOneMove := false
	currentTeam := (team + depth) % 2
	if depth == 0 {
		numTeamTiles, _ := CountTilesOfTeam(board, currentTeam)
		if numTeamTiles == 1 {
			onlyOneMove = true
		}
	}
	if depth <= 1 {
		// in the first two moves, check if the board is empty
		// should be count not points
		posScore, _ := ScoreBoardOfTeam(board, currentTeam)
		if posScore == 0 {
			isBoardEmpty = true
			// fmt.Println("empty board", team)
		}
	}
	if depth == maxDepth {
		
		score := ScoreBoardWeighted(board, team)
		// fmt.Println("hit max depth", depth, team, score)
		// fmt.Print(score, " ")
		// fmt.Println(depth, score)
		// PrintAssignableByteArray(board)
		// RenderBoard(board)
		return score
	}

	dotBitMasks := [2]byte{0b00010000, 0b00000001}
	

PerTwoTilesLoop:
	for i := 0; i < 13; i++ {
		twoTiles := (*board)[i]
		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
		tiles := [2]byte{tile1, tile2}
		for j := 0; j < 2; j++ {
			tile := tiles[j]
			teamOfTile := (tile - 1) >> 2
			if isBoardEmpty {
				// if board is empty for user
				// then tiles with dots belong to other team
				dots, _  := ExtractTileInfo(tile)
				if dots > 0 {
					continue
				}
			} else if teamOfTile != currentTeam {
				continue
			}

			boardCopy := make([]byte, 13)
			copy(boardCopy, *board)
			if isBoardEmpty {
				// fmt.Println("set first tile", team, i, j)
				SetTileByIndex(&boardCopy, byte(i*2+j), SetTileInfo(3, currentTeam))
				// boardCopy[i] += SetTileInfo(3, currentTeam) // set 3 dots to the tile
			} else {
				boardCopy[i] += dotBitMasks[j] // add a dot to the tile
			}
			
			for UpdateBoard(&boardCopy) {
				// keep updating until no more updates
			}

			// score1 := ScoreBoard(&boardCopy, team)
		

			score := minimax3(depth+1, maxDepth, alpha, beta, &boardCopy, team)

			// fmt.Println("d, s", depth, score)
			// RenderBoard(board)
			// RenderBoard(&boardCopy)
			if depth%2 == 0 {
				// fmt.Println("here", depth, score)
				// Maximizing player
				if score > alpha || (onlyOneMove && score == alpha) {
					// if only one move we just want the alphaIndex
					alpha = score
					if depth == 0 {
						// fmt.Println("alphaBoard", depth, alpha)
						alphaBoard = &boardCopy
						alphaIndex = i*2 + j
					}

				}
			} else {
				// Minimizing player
				if score < beta {
					beta = score
					// if depth == 0 {
					// 	betaBoard = &boardCopy
					// }
				}
			}
			if i+1 == 13 {
				// fmt.Println("end of loop", depth, i, j, alpha, beta)
				break PerTwoTilesLoop
			}
			// Pruning
			if (doPrune && alpha >= beta) {
				// fmt.Println("prune", depth, alpha, beta, score)
				break PerTwoTilesLoop
			}
		}
	}

	if depth%2 == 0 {
		// fmt.Println("alpha", depth, alpha)
		return alpha
	}
	// fmt.Println("beta", depth, beta)
	return beta
}

func PrintAssignableByteArray(board *[]byte) {
	fmt.Print("[]byte{")
	for i := 0; i < 13; i++ {
		if i > 0 {
			fmt.Print(", ")
		}
		fmt.Printf("%d", (*board)[i]) // Hexadecimal representation
	}
	fmt.Println("}")
}

func TestMinimax() {
	// rand.Seed(3)
	// minimax2(0, 3, -128, 127)

	// var board []byte = make([]byte, 13)
	// SetTile(&board, 2, 2, A3)
	// SetTile(&board, 1, 1, B3)

	board := []byte{0, 0, 0, 113, 0, 1, 1, 0, 1, 0, 0, 0, 0}
	RenderBoard(&board)

	alpha := minimax3(0, 1, -128, 127, &board, 1)
	fmt.Println("alpha", alpha)
	if alphaBoard != nil {
		RenderBoard(alphaBoard)
		PrintAssignableByteArray(alphaBoard)
	}

	fmt.Println("nodes searched", nodesSearched)
}
