package color_wars

type Tile struct {
	dots int
	team Team
}

type Game struct {
	width     int
	height    int
	tiles     []Tile
	team      Team
	iteration int
}

func (g *Game) Initialise(width, height int) {
	g.width = width
	g.height = height
	g.team = TeamA
	g.tiles = make([]Tile, width*height)
}

func (g *Game) SwitchTeam() {
	if g.team == TeamA {
		g.team = TeamB
	} else if g.team == TeamB {
		g.team = TeamA
	} else { // g.team == NoTeam
		panic("unsupported team state")
	}
	g.iteration++
}

// returns true if tile was set
func (g *Game) SetTileUser(x, y int) bool {
	if x < 0 || y < 0 || x >= g.width || y >= g.height {
		panic("cannot set a tile outside the board")
	}

	i := x + y*g.width
	tile := &g.tiles[i]

	if tile.team != NoTeam && tile.team != g.team {
		return false
	}

	tile.team = g.team
	if g.iteration < 2 {
		tile.dots = 3
	} else {
		tile.dots += 1
	}

	return true
}

func (g *Game) SetTileInternal(x, y int, newTiles []Tile) {
	if x < 0 || y < 0 || x >= g.width || y >= g.height {
		return
	}

	i := x + y*g.width
	tile := g.tiles[i]
	tile.team = g.team

	// two tiles may simulatanously update a common neighbour from 3 to 5
	if tile.dots < 4 {
		tile.dots++
	}
	newTiles[i] = tile
}

func (g *Game) UpdateBoard() bool {
	updateCount := 0
	newTiles := make([]Tile, g.width*g.height) // not performant
	copy(newTiles[:], g.tiles[:])
	for y := 0; y < g.height; y++ {
		for x := 0; x < g.width; x++ {
			tile := g.tiles[x+y*g.width]
			if tile.dots == 4 {
				tile.dots = 0
				tile.team = NoTeam
				newTiles[x+y*g.width] = tile
				g.SetTileInternal(x+1, y, newTiles)
				g.SetTileInternal(x-1, y, newTiles)
				g.SetTileInternal(x, y+1, newTiles)
				g.SetTileInternal(x, y-1, newTiles)
				updateCount++
			}
		}
	}
	g.tiles = newTiles
	return updateCount > 0
}

func (g *Game) IsGameComplete() Team {
	teamACount, teamBCount := 0, 0
	for y := 0; y < g.height; y++ {
		for x := 0; x < g.width; x++ {
			tile := g.tiles[x+y*g.width]
			if tile.team == TeamA {
				teamACount++
			} else if tile.team == TeamB {
				teamBCount++
			}
		}
	}
	if teamACount == 0 {
		return TeamB
	} else if teamBCount == 0 {
		return TeamA
	}
	return NoTeam
}
