//go:build js && wasm
// +build js,wasm

package main

import (
	"color_wars/color_wars"
	"syscall/js"
)

func ConvertToBitBoard(tiles *[]int) []byte {
	var board []byte = make([]byte, 13)
	var x, y byte
	for i := 0; i < 50; i += 2 {
		dots := (*tiles)[i]
		team := (*tiles)[i+1]
		x, y = byte((i/2)%5), byte((i/2)/5)
		bitTile := color_wars.SetTileInfo(byte(dots), byte(team))
		color_wars.SetTile(&board, x, y, bitTile)
	}
	return board
}

func main() {
	jsProgramWrapper := func(_ js.Value, args []js.Value) interface{} {
		// Ensure at least one argument is passed
		if len(args) < 1 {
			println("No array argument provided.")
			return nil
		}

		// Convert the first argument (assumed to be an array) to a Go slice
		jsArray := args[0]
		if jsArray.Type() != js.TypeObject || !jsArray.InstanceOf(js.Global().Get("Array")) {
			println("Expected an array as the first argument.")
			return nil
		}

		// Convert JavaScript array to Go slice
		length := jsArray.Length()
		if length != 50 {
			println("Expected the array to be of length 50 (25*[dots, team]).")
			return nil
		}
		goSlice := make([]int, length)
		for i := 0; i < length; i++ {
			goSlice[i] = jsArray.Index(i).Int()
		}

		// Call your wrapper function with the converted slice
		board := ConvertToBitBoard(&goSlice)
		hasResult, x, y := color_wars.MiniMaxWrapper(8, &board, 0)

		result := js.Global().Get("Array").New()
		result.Call("push", hasResult)
		result.Call("push", x)
		result.Call("push", y)

		return result
	}

	js.Global().Set("runProgram", js.FuncOf(jsProgramWrapper))

	// This is required to prevent the Go runtime from exiting.
	select {}
}
