package main

import (
	"fmt"
	"log"

	"github.com/eiannone/keyboard"
)

type Team int

const (
	NoTeam Team = iota
	TeamA
	TeamB
)

type UserInput int

const (
	Left UserInput = iota
	Right
	Up
	Down
	Quit
	Pick
)

// Color codes
const (
	Red       = "\033[31m"
	Green     = "\033[32m"
	Reset     = "\033[0m"
	Orange    = "\033[38;5;214m"
	LimeGreen = "\033[38;5;10m"
)

type Tile struct {
	dots int
	team Team
}

func (t *Tile) Render(isSelected bool) string {
	var clr string
	if t.team == NoTeam {
		if isSelected {
			return "#"
		}
		return " "
	} else if t.team == TeamA {
		if isSelected {
			clr = Orange
		} else {
			clr = Red
		}

	} else { // t.team == TeamB
		if isSelected {
			clr = LimeGreen
		} else {
			clr = Green
		}
	}
	return colorText(fmt.Sprintf("%d", t.dots), clr)
}

type Game struct {
	width  int
	height int
	tiles  []Tile
	team   Team
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
}

func colorText(text, color string) string {
	return color + text + Reset
}

// returns true if tile was set
func (g *Game) SetTile(x, y int) bool {
	if x < 0 || y < 0 || x >= g.width || y >= g.height {
		panic("cannot set a tile outside the board")
	}

	i := x + y*g.width
	tile := &g.tiles[i]

	if tile.team != NoTeam && tile.team != g.team {
		return false
	}
	tile.team = g.team
	tile.dots += 1

	if tile.dots > 4 {
		panic("a tile should never have more than 4 dots")
	} else if tile.dots == 4 {
		tile.dots = 0
		tile.team = NoTeam
		g.SetTileFromMitosis(x+1, y)
		g.SetTileFromMitosis(x-1, y)
		g.SetTileFromMitosis(x, y+1)
		g.SetTileFromMitosis(x, y-1)
	}

	return true
}

func (g *Game) SetTileFromMitosis(x, y int) error {
	if x < 0 || y < 0 || x >= g.width || y >= g.height {
		return fmt.Errorf("cannot set a tile outside the board")
	}

	i := x + y*g.width
	tile := &g.tiles[i]

	tile.team = g.team
	tile.dots += 1

	if tile.dots > 4 {
		panic("a tile should never have more than 4 dots")
	} else if tile.dots == 4 {
		tile.dots = 0
		tile.team = NoTeam
		g.SetTileFromMitosis(x+1, y)
		g.SetTileFromMitosis(x-1, y)
		g.SetTileFromMitosis(x, y+1)
		g.SetTileFromMitosis(x, y-1)
	}

	return nil
}

func (g *Game) Render(selectedTile Position) {
	board := "  "
	var boardClr string
	if g.team == TeamA {
		boardClr = Red
	} else {
		boardClr = Green
	}
	for i := 0; i < g.width; i++ {
		board += colorText(fmt.Sprintf("%d ", i), boardClr)
	}
	board += "\n"
	for j := 0; j < g.height; j++ {
		board += colorText(fmt.Sprintf("%d", j)+" ", boardClr)
		for i := 0; i < g.width; i++ {
			isSelected := selectedTile.x == i && selectedTile.y == j
			tile := g.tiles[i+j*g.width]
			board += tile.Render(isSelected) + " "
		}
		board += "\n"
	}
	fmt.Print("\033[2J\033[H")
	fmt.Println(board)
}

type Position struct {
	x, y int
}

// func runColorWars() {
// 	fmt.Println("Color Wars")
// 	game := Game{}
// 	game.Initialise(5, 5)
// 	// var positions []Position = []Position{
// 	// 	{2, 2},
// 	// 	{1, 1},
// 	// }
// 	// for _, p := range positions {
// 	// 	err := game.SetTile(p.x, p.y)
// 	// 	game.SwitchTeam()
// 	// 	if err != nil {
// 	// 		fmt.Println(err)
// 	// 	}
// 	// 	game.Render()
// 	// }

// 	var position *Position
// 	var err error
// 	for {
// 		for {
// 			game.Render()
// 			position, err = GetUserInputToSelectTile()
// 			if err == nil {
// 				break
// 			} else {
// 				fmt.Println(err)
// 			}
// 		}

// 		err = game.SetTile(position.x, position.y)
// 		game.SwitchTeam()
// 		if err != nil {
// 			fmt.Println(err)
// 		}
// 		game.Render()
// 	}
// }

// func GetUserInputToSelectTile() (*Position, error) {
// 	reader := bufio.NewReader(os.Stdin)
// 	fmt.Print("Select Tile (x y): ")
// 	input, _ := reader.ReadString('\n')
// 	input = strings.TrimSpace(input)

// 	// Split the input
// 	parts := strings.Split(input, " ")
// 	if len(parts) != 2 {
// 		return nil, fmt.Errorf("invalid input. please enter two integers separated by a space.")
// 	}

// 	// Convert strings to integers
// 	x, err1 := strconv.Atoi(parts[0])
// 	y, err2 := strconv.Atoi(parts[1])
// 	if err1 != nil || err2 != nil {
// 		return nil, fmt.Errorf("invalid input. both x and y must be integers.")
// 	}

// 	return &Position{x, y}, nil
// }

func GetUserInput() UserInput {
	for {
		char, key, err := keyboard.GetKey()
		if err != nil {
			log.Fatal(err)
		}

		switch char {
		case 'w':
			return Up
		case 'a':
			return Left
		case 's':
			return Down
		case 'd':
			return Right
		case 'q':
			return Quit
		}

		if key == keyboard.KeyEnter {
			return Pick
		}
	}
}

func runColorWars() {
	fmt.Println("Color Wars")
	game := Game{}
	game.Initialise(5, 5)
	position := Position{(game.width + 1) / 2, (game.height + 1) / 2}

	err := keyboard.Open()
	if err != nil {
		log.Fatal(err)
	}
	defer keyboard.Close()

	fmt.Println("Use WASD keys for movement. Press Q to quit.")

	for {
		game.Render(position)
		userInput := GetUserInput()
		if userInput == Quit {
			break
		}

		switch userInput {
		case Quit:
			return
		case Left:
			position.x--
			if position.x < 0 {
				position.x = 0
			}
		case Right:
			position.x++
			if position.x >= game.width {
				position.x = game.width - 1
			}
		case Up:
			position.y--
			if position.y < 0 {
				position.y = 0
			}
		case Down:
			position.y++
			if position.y >= game.height {
				position.y = game.height - 1
			}
		case Pick:
			didUpdate := game.SetTile(position.x, position.y)
			if didUpdate {
				game.SwitchTeam()
			}
		}
	}
	fmt.Println("Press any key to exit")
}

func main() {
	runColorWars()
}
