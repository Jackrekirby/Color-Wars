//go:build !js && !wasm
// +build !js,!wasm

package color_wars

import (
	"fmt"
	"time"

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

		if userInput == Pick && game.team == TeamA {
			bitBoard := ConvertToBitBoard(&game.tiles)
			alphaBoard = nil
			fmt.Println("Bot thinking...")
			minimax3(0, 10, -128, 127, &bitBoard, byte(game.team-1))
			if alphaBoard != nil {
				x, y := alphaIndex%5, alphaIndex/5

				didUpdateTile := game.SetTileUser(x, y)
				if didUpdateTile {
					for game.UpdateBoard() {
						ClearTerminal()
						game.Render(*position)
						time.Sleep(SleepTimeOfMitosis * time.Millisecond)
					}
					game.SwitchTeam()
				} else {
					panic("bot choose invalid tile")
				}

				ClearTerminal()
				// fmt.Println(alphaIndex, x, y)
				RenderBoard(alphaBoard)
				// game.Render(*position)

			}
		} else {
			ClearTerminal()
			if alphaBoard != nil {
				RenderBoard(alphaBoard)
			}
			// game.Render(*position)
		}

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
