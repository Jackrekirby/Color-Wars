package color_wars

import "fmt"

func (g *Game) Render(selectedTile Position) {
	board := "  "
	var boardClr string
	if g.team == TeamA {
		boardClr = Red
	} else {
		boardClr = Green
	}
	for i := 0; i < g.width; i++ {
		board += ColorText(fmt.Sprintf("%d ", i), boardClr)
	}
	board += "\n"
	for j := 0; j < g.height; j++ {
		board += ColorText(fmt.Sprintf("%d", j)+" ", boardClr)
		for i := 0; i < g.width; i++ {
			isSelected := selectedTile.x == i && selectedTile.y == j
			tile := g.tiles[i+j*g.width]
			board += tile.Render(isSelected) + " "
		}
		board += "\n"
	}
	// ClearTerminal()
	fmt.Println(board)
}

func (t *Tile) Render(isSelected bool) string {
	var clr string
	var txt string
	if t.team == NoTeam {
		txt = " "
	} else if t.team == TeamA {
		clr = ColorTeamA
		txt = fmt.Sprintf("%d", t.dots)
	} else { // t.team == TeamB
		clr = ColorTeamB
		txt = fmt.Sprintf("%d", t.dots)
	}
	if isSelected {
		clr += WhiteBg
	}
	return ColorText(txt, clr)
}
