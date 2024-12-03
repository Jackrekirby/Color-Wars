package color_wars

func ConvertToBitBoard(tiles *[]Tile) []byte {
	var board []byte = make([]byte, 13)
	var x, y byte
	for y = 0; y < 5; y++ {
		for x = 0; x < 5; x++ {
			tile := (*tiles)[x+y*5]
			bitTile := SetTileInfo(byte(tile.dots), byte(tile.team-1))
			SetTile(&board, x, y, bitTile)
		}
	}
	return board
}

func ConvertFromBitBoard(board *[]byte) []Tile {
	var tiles []Tile = make([]Tile, 25)
	var x, y byte
	for y = 0; y < 5; y++ {
		for x = 0; x < 5; x++ {
			dots, team := GetTile(board, x, y)
			tiles[x+y*5] = Tile{int(dots), Team(team + 1)}
		}
	}
	return tiles
}
