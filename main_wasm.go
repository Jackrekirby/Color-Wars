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
        // Ensure at least three arguments are passed
        if len(args) < 3 {
            println("Insufficient arguments provided.")
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

        // Convert the second argument to team (int)
        team := args[1].Int()
        if team < 0 || team > 1 {
            println("Expected team to be 0 or 1.")
            return nil
        }

        // Convert the third argument to depth (int)
        depth := args[2].Int()
        if depth < 0 || depth > 20 {
            println("Expected depth to be between 0 and 20.")
            return nil
        }

        // Call your wrapper function with the converted slice
        board := ConvertToBitBoard(&goSlice)
        hasResult, x, y := color_wars.MiniMaxWrapper(byte(depth), &board, byte(team))

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