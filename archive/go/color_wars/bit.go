package color_wars

import (
	"fmt"
	"strconv"
)

// 9 states per tile = 4 bits
// 0, 1a, 2a, 3a, 4a, 1b, 2b, 3b, 4b
// 25 tiles
// 25 * 4 bits = 100 bits for board
// 12 * 1 byte = 100 bits for board + 4 spare bits

// 12 bytes * 25 possibilities on iteration
// 12 bytes * 25 ^ (depth of moves)

const (
	Empty byte = iota
	A1
	A2
	A3
	A4
	B1
	B2
	B3
	B4
)

// RENDER

const (
	ClrOddTile    = "\033[0m"
	ClrEvenTile   = "\033[48;2;0;0;0m"
	ClrUnusedBits = "\033[48;2;255;0;0m"
	ClrTeamA      = "\033[38;2;255;0;0m"
	ClrTeamB      = "\033[38;2;0;255;0m"
	ClrReset      = "\033[0m"
)

func RenderTile(tile byte) string {
	if tile == 0 {
		return " "
	} else if tile <= 4 {
		return ClrTeamA + strconv.Itoa(int(tile))
	} else if tile <= 8 {
		return ClrTeamB + strconv.Itoa(int(tile)-4)
	} else {
		panic(fmt.Sprintf("invalid tile value %08b", tile))
	}
}

func RenderBoard(board *[]byte) {
	render := ""
	j := 0
	for i := 0; i < 13; i++ {
		twoTiles := (*board)[i]
		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
		render += ClrEvenTile + RenderTile(tile1)
		j++
		if j == 5 {
			j = 0
			render += ClrReset + "\n"
		}
		if i == 12 {
			break
		}
		render += ClrOddTile + RenderTile(tile2)
		j++
		if j == 5 {
			j = 0
			render += ClrReset + "\n"
		}
	}

	fmt.Println(render)
}

func RenderBoardBits(board *[]byte) {
	render := ""
	for i := 0; i < 13; i++ {
		twoTiles := (*board)[i]
		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
		render += ClrEvenTile + fmt.Sprintf("%04b", tile1)
		if i == 12 {
			render += ClrUnusedBits + fmt.Sprintf("%04b", tile2)
		} else {
			render += ClrOddTile + fmt.Sprintf("%04b", tile2)
		}
		render += ClrReset + " "
	}
	render += ClrReset
	fmt.Println(render)
}

// GAME

func SetTileByIndex(board *[]byte, i, tile byte) {
	bi := i >> 1
	ti := i % 2
	// fmt.Println(i, bi, ti)

	if ti == 0 {
		(*board)[bi] = tile<<4 + (*board)[bi]&0b00001111
	} else {
		(*board)[bi] = tile + (*board)[bi]&0b11110000
	}
}

func SetTile(board *[]byte, x, y byte, tile byte) {
	i := x + y*5
	SetTileByIndex(board, i, tile)
}

func GetTile(board *[]byte, x, y byte) (dots byte, team byte) {
	i := x + y*5
	bi := i >> 1
	ti := i % 2

	twoTiles := (*board)[bi]
	var tile byte
	if ti == 0 {
		tile = twoTiles >> 4
	} else {
		tile = twoTiles & 15
	}

	return ExtractTileInfo(tile)
}

func ExtractTileTeam(tile byte) byte {
	return (tile - 1) >> 2
}

func ExtractTileInfo(tile byte) (dots byte, team byte) {
	if tile == 0 {
		return 0, 0
	} else if tile <= 4 {
		return tile, 0
	} else if tile <= 8 {
		return tile - 4, 1
	} else {
		panic(fmt.Sprintf("invalid tile value %08b", tile))
	}
}

func SetTileInfo(dots byte, team byte) (tile byte) {
	if dots == 0 {
		return 0
	}
	// team 0 -> 0, team 1 -> 4
	return team<<2 + dots
}

var boardWeights = []byte{
	0, 1, 2, 1, 0,
	1, 4, 3, 4, 1,
	2, 3, 5, 3, 2,
	1, 4, 3, 4, 1,
	0, 1, 2, 1, 0,
}

func ScoreBoardWeighted(board *[]byte, team byte) int16 {
	var posScore int16 = 0
	var negScore int16 = 0
	for i := 0; i < 13; i++ {
		twoTiles := (*board)[i]
		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
		dots1, team1 := ExtractTileInfo(tile1)

		if dots1 > 0 {
			if team1 == team {
				// fmt.Println(dots1, boardWeights[i*2], int16(dots1) * 5, int16(boardWeights[i*2]))
				posScore += int16(dots1)*6 + int16(boardWeights[i*2])
			} else {
				negScore -= int16(dots1)*6 + int16(boardWeights[i*2])
			}
		}

		if i == 12 {
			break
		}
		dots2, team2 := ExtractTileInfo(tile2)

		if dots2 > 0 {
			if team2 == team {
				posScore += int16(dots2)*6 + int16(boardWeights[i*2+1])
			} else {
				negScore -= int16(dots2)*6 + int16(boardWeights[i*2+1])
			}
		}
		// fmt.Println(dots1, team1, dots2, team2, score)
	}
	if negScore == 0 { // you have won
		return 32767 // max int16
	} else if posScore == 0 { // you have lost
		return -32768 // min int16
	}
	return posScore + negScore
}

func ScoreBoard(board *[]byte, team byte) int8 {
	var score int8 = 0
	for i := 0; i < 13; i++ {
		twoTiles := (*board)[i]
		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
		dots1, team1 := ExtractTileInfo(tile1)

		if team1 == team {
			score += int8(dots1)
		} else {
			score -= int8(dots1)
		}

		dots2, team2 := ExtractTileInfo(tile2)

		if team2 == team {
			score += int8(dots2)
		} else {
			score -= int8(dots2)
		}
		// fmt.Println(dots1, team1, dots2, team2, score)
	}
	return score
}

func CountTilesOfTeam(board *[]byte, team byte) (posScore int8, negScore int8) {
	posScore, negScore = 0, 0
	for i := 0; i < 13; i++ {
		twoTiles := (*board)[i]
		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
		dots1, team1 := ExtractTileInfo(tile1)
		if dots1 > 0 {
			if team1 == team {
				posScore++
			} else {
				negScore--
			}
		}

		dots2, team2 := ExtractTileInfo(tile2)

		if dots2 > 0 {
			if team2 == team {
				posScore++
			} else {
				negScore--
			}
		}
		// fmt.Println(dots1, team1, dots2, team2, score)
	}
	return
}

func ScoreBoardOfTeam(board *[]byte, team byte) (posScore int8, negScore int8) {
	posScore, negScore = 0, 0
	for i := 0; i < 13; i++ {
		twoTiles := (*board)[i]
		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
		dots1, team1 := ExtractTileInfo(tile1)

		if team1 == team {
			posScore += int8(dots1)
		} else {
			negScore -= int8(dots1)
		}

		dots2, team2 := ExtractTileInfo(tile2)

		if team2 == team {
			posScore += int8(dots2)
		} else {
			negScore -= int8(dots2)
		}
		// fmt.Println(dots1, team1, dots2, team2, score)
	}
	return
}

func GenerateNextBoardOptions(board *[]byte, team byte, depth byte) {
	if depth == 0 {
		return
	}
	var boards [][]byte

	// add a dot to each tile owned by the team
	for i := 0; i < 13; i++ {
		twoTiles := (*board)[i]
		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
		team1 := (tile1 - 1) >> 2
		if team1 == team {
			boardCopy := make([]byte, 13)
			copy(boardCopy, *board)
			boardCopy[i] += 0b00010000 // add a dot to the tile
			for UpdateBoard(&boardCopy) {
				// keep updating until no more updates
			}
			boards = append(boards, boardCopy)
		}

		team2 := (tile2 - 1) >> 2
		if team2 == team {
			boardCopy := make([]byte, 13)
			copy(boardCopy, *board)
			boardCopy[i] += 0b00000001 // add a dot to the tile
			for UpdateBoard(&boardCopy) {
				// keep updating until no more updates
			}
			boards = append(boards, boardCopy)
		}
	}
	if depth == 1 {
		PrintBoards(&boards, team, depth)
	}

	n := len(boards)
	numOptionsGenerated += n
	nextTeam := (team + 1) % 2
	for i := 0; i < n; i++ {
		GenerateNextBoardOptions(&boards[i], nextTeam, depth-1)
	}
}

func UpdateBoard(board *[]byte) bool {
	updateCount := 0
	newBoard := make([]byte, 13)
	copy(newBoard, *board)
	var x, y byte
	for y = 0; y < 5; y++ {
		for x = 0; x < 5; x++ {
			dots, team := GetTile(board, x, y)
			if dots == 4 {
				SetTile(&newBoard, x, y, Empty)
				teamShift := team << 2 // team 0 -> 0, team 1 -> 4
				SetTileWithBoundCheck(&newBoard, x+1, y, teamShift)
				SetTileWithBoundCheck(&newBoard, x-1, y, teamShift)
				SetTileWithBoundCheck(&newBoard, x, y+1, teamShift)
				SetTileWithBoundCheck(&newBoard, x, y-1, teamShift)
				updateCount++
			}
		}
	}
	if updateCount > 0 {
		*board = newBoard
		return true
	}
	return false

}

func SetTileWithBoundCheck(board *[]byte, x, y byte, newTeam byte) {
	if x >= 5 || y >= 5 { // integer overload means anything less than 0 will be > 5
		return
	}
	dots, _ := GetTile(board, x, y)
	// two tiles may simulatanously update a common neighbour from 3 to 5
	if dots < 4 {
		dots++
	}
	SetTile(board, x, y, newTeam+dots)
}

var bestScore int8 = 0
var bestScoreBoard []byte
var numOptionsGenerated = 0

func PrintBoards(boards *[][]byte, team byte, depth byte) {
	n := len(*boards)
	// fmt.Println("(depth team)", depth, team)
	for i := 0; i < n; i++ {
		b := (*boards)[i]
		score := ScoreBoard(&b, team)
		if score > bestScore {
			bestScoreBoard = b
			bestScore = score
			// fmt.Println("(depth team, i score)", depth, team, i, score)
			// fmt.Println("   (i score)", i)
			// RenderBoard(&b)
		}
		// RenderBoardBits(b)
	}
}

// version 2

// func GetNextBoardBestOption(board *[]byte, team byte, depth byte, maxDepth byte) {
// 	if depth == maxDepth {
// 		return
// 	}
// 	var bestBoard []byte
// 	var bestScore int8
// 	var scoreSign int8
// 	if depth%2 == 0 { // even depth = minimise other players score
// 		bestScore = 127
// 		scoreSign = 1
// 	} else { // odd depth = maximise your score
// 		bestScore = -128
// 		scoreSign = -1
// 	}

// 	// add a dot to each tile owned by the team
// 	for i := 0; i < 13; i++ {
// 		twoTiles := (*board)[i]
// 		tile1, tile2 := twoTiles>>4, twoTiles&0b00001111
// 		team1 := (tile1 - 1) >> 2

// 		if team1 == team {
// 			boardCopy := make([]byte, 13)
// 			copy(boardCopy, *board)
// 			boardCopy[i] += 0b00010000 // add a dot to the tile
// 			for UpdateBoard(&boardCopy) {
// 				// keep updating until no more updates
// 			}
// 			score := ScoreBoard(&boardCopy, team) * scoreSign
// 			if score > bestScore { // which equality???
// 				bestScore = score
// 				bestBoard = boardCopy
// 			}
// 		}

// 		team2 := (tile2 - 1) >> 2
// 		if team2 == team {
// 			boardCopy := make([]byte, 13)
// 			copy(boardCopy, *board)
// 			boardCopy[i] += 0b00000001 // add a dot to the tile
// 			for UpdateBoard(&boardCopy) {
// 				// keep updating until no more updates
// 			}
// 			score := ScoreBoard(&boardCopy, team) * scoreSign
// 			if score > bestScore { // which equality???
// 				bestScore = score
// 				bestBoard = boardCopy
// 			}
// 		}
// 	}

// 	n := len(boards)
// 	numOptionsGenerated += n
// 	nextTeam := (team + 1) % 2
// 	for i := 0; i < n; i++ {
// 		GenerateNextBoardOptions(&boards[i], nextTeam, depth+1, maxDepth)
// 	}
// }

func RunBit() {
	fmt.Println("\n\n-------------------------------- COLORS WARS --------------------------------\n\n")
	// ClearTerminal()
	// use the last byte to store whether board has updated
	// copy board 25 times still with 1d byte array
	// score board
	// probably do not want to store all board combos due to 25^depth
	var board []byte = make([]byte, 13)

	SetTile(&board, 2, 2, A3)
	SetTile(&board, 1, 1, B3)

	RenderBoard(&board)

	// RenderBoard(&board)
	// RenderBoardBits(&board)

	// fmt.Println(GetTile(&board, 2, 2))
	GenerateNextBoardOptions(&board, 0, 14)
	fmt.Println(bestScore, numOptionsGenerated)
	RenderBoard(&bestScoreBoard)
}
