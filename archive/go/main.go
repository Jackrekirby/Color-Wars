//go:build !js && !wasm
// +build !js,!wasm

package main

import "color_wars/color_wars"

func main() {
	color_wars.RunColorWars()
	// color_wars.RunBit()
	// color_wars.TestMinimax()
}
