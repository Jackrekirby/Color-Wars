package color_wars

import (
	"log"
	"time"

	"github.com/eiannone/keyboard"
)

type InputData struct {
	PositionTeamA Position
	PositionTeamB Position
}

func InitialiseInputData(game *Game) *InputData {
	p := Position{(game.width - 1) / 2, (game.height - 1) / 2}
	inputData := InputData{
		PositionTeamA: p,
		PositionTeamB: p,
	}
	return &inputData
}

func InitialiseKeyboard() func() {
	err := keyboard.Open()
	if err != nil {
		log.Fatal(err)
	}
	return func() { defer keyboard.Close() }
}

func (inputData *InputData) GetCurrentTeamPosition(game *Game) *Position {
	var position *Position
	if game.team == TeamA {
		position = &inputData.PositionTeamA
	} else {
		position = &inputData.PositionTeamB
	}
	return position
}

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

func ProcessUserInput(game *Game, position *Position, userInput UserInput) {
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
		didUpdateTile := game.SetTileUser(position.x, position.y)
		if didUpdateTile {
			for game.UpdateBoard() {
				ClearTerminal()
				game.Render(*position)
				time.Sleep(SleepTimeOfMitosis * time.Millisecond)
			}
			game.SwitchTeam()
		}
	}
}
