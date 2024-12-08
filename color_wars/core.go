package color_wars

import (
	"fmt"

	"github.com/eiannone/keyboard"
)

func RunColorWars() {
	game := Game{}
	game.Initialise(5, 5)
	inputData := InitialiseInputData(&game)
	defer InitialiseKeyboard()()
	ClearTerminal()
	welcome := "" +
		"---------------------- Color Wars -------------------\n" +
		"Use WASD keys to move, ENTER to pick tile & Q to quit\n" +
		"Press any key to start the game                      \n" +
		"-----------------------------------------------------"
	fmt.Println(welcome)
	keyboard.GetKey()

	for {
		var position *Position = inputData.GetCurrentTeamPosition(&game)

		game.Render(*position)

		userInput := GetUserInput()
		if userInput == Quit {
			break
		}
		ProcessUserInput(&game, position, userInput)
		if game.iteration > 1 {
			team := game.IsGameComplete()
			if team == TeamA {
				fmt.Println(ColorText("Team A has won!", ColorTeamA))
				break
			} else if team == TeamB {
				fmt.Println(ColorText("Team B has won!", ColorTeamB))
				break
			}
		}
	}
	fmt.Println("Press any key to exit")
}
