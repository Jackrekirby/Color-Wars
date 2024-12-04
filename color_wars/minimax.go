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
var alphaBoard, betaBoard *[]byte
var nodesSearched = 0

func MiniMaxWrapper(maxDepth byte,
	board *[]byte, team byte) (r bool, x, y int) {
	alphaIndex = 0
	alphaBoard = nil
	minimax3(0, maxDepth, -128, 127, board, team)
	if alphaBoard != nil {
		r = true
		x, y = alphaIndex%5, alphaIndex/5
	} else {
		r = false
		x, y = 0, 0
	}
	return
}

func minimax3(depth, maxDepth byte, alpha, beta int8,
	board *[]byte, team byte,
) int8 {
	nodesSearched += 1
	if depth == maxDepth {
		score := ScoreBoard(board, team)
		// fmt.Print(score, " ")
		// fmt.Println(depth, score)
		// PrintAssignableByteArray(board)
		// RenderBoard(board)
		return score
	}

	dotBitMasks := [2]byte{0b00010000, 0b00000001}
	currentTeam := (team + depth) % 2

PerTwoTilesLoop:
	for i := 0; i < 13; i++ {
		twoTiles := (*board)[i]
		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
		tiles := [2]byte{tile1, tile2}
		for j := 0; j < 2; j++ {
			tile := tiles[j]
			teamOfTile := (tile - 1) >> 2
			if teamOfTile != currentTeam {
				continue
			}

			boardCopy := make([]byte, 13)
			copy(boardCopy, *board)
			boardCopy[i] += dotBitMasks[j] // add a dot to the tile
			for UpdateBoard(&boardCopy) {
				// keep updating until no more updates
			}

			// score1 := ScoreBoard(&boardCopy, team)
			// fmt.Println(depth, i, j, score1)
			// RenderBoard(&boardCopy)

			score := minimax3(depth+1, maxDepth, alpha, beta, &boardCopy, team)
			if depth%2 == 0 {
				// Maximizing player
				if score > alpha {
					alpha = score
					if depth == 0 {
						alphaBoard = &boardCopy
						alphaIndex = i*2 + j
					}

				}
			} else {
				// Minimizing player
				if score < beta {
					beta = score
					if depth == 0 {
						betaBoard = &boardCopy
					}
				}
			}

			// Pruning
			if doPrune && alpha >= beta && i+1 < 13 {
				// fmt.Println("prune", depth, alpha, beta)
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
