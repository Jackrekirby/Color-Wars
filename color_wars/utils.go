package color_wars

import "fmt"

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
	Red       = "\033[31m"       // Red
	Orange    = "\033[38;5;214m" // Approximate orange (using 256-color palette)
	Yellow    = "\033[33m"       // Yellow
	Green     = "\033[32m"       // Green
	LimeGreen = "\033[38;5;10m"  // Lime green (from 256-color palette)
	Blue      = "\033[34m"       // Blue
	Indigo    = "\033[38;5;54m"  // Approximate indigo (using 256-color palette)
	Violet    = "\033[38;5;129m" // Approximate violet (using 256-color palette)
	Reset     = "\033[0m"        // Reset to default color

	// Background Colors
	WhiteBg = "\033[48;2;100;100;100m" // White background using 256-color palette
)

const (
	ColorTeamA = Red
	ColorTeamB = Green
)

const (
	SleepTimeOfMitosis = 500 // milliseconds
)

func ColorText(text, color string) string {
	return color + text + Reset
}

func ClearTerminal() {
	fmt.Print("\033[2J\033[H")
}

type Position struct {
	x, y int
}
