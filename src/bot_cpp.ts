import { Game } from './types'

// records moves
// record times

export interface GameBot {
  IsReady: () => boolean
}

export const CreateBot = (): GameBot => {
  const script = document.createElement('script')
  script.src = 'src/minimax.js'
  document.head.appendChild(script)
  let isReady = false

  script.onload = () => {
    if (typeof Module === 'undefined') {
      console.error(
        'Module is not defined. Ensure the WASM environment is properly set up.'
      )
      return
    }
    Module.onRuntimeInitialized = () => {
      isReady = true
    }
  }

  const IsReady = (): boolean => {
    return isReady
  }

  return { IsReady }
}

export const BotMakeMove = (game: Game, depth: number) => {
  // Create a pointer to a 'Board' structure in WASM memory
  const boardSize = 25 * 8 // 25 tiles, each 2 bytes (2 uint8)
  const boardPtr = Module._malloc(boardSize)

  const height = game.GetHeight()
  const width = game.GetWidth()
  let i = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = game.GetTile(x, y)

      Module.setValue(boardPtr + i, tile.player, 'i8')
      Module.setValue(boardPtr + (i + 1), tile.dots, 'i8')
      i += 2
    }
  }

  // Wrap the `InitialiseMiniMax` function
  const InitialiseMiniMax = Module.cwrap('InitialiseMiniMax', 'number', [
    'number',
    'number',
    'number',
    'number'
  ])

  // Call the function
  const result = InitialiseMiniMax(
    boardPtr,
    depth,
    game.GetRound(),
    game.GetCurrentPlayerIndex()
  )

  // Free the allocated memory
  Module._free(boardPtr)

  // console.log('result', result)

  if (result < 0 || result >= 25) {
    console.error('Computer did not pick a move')
    return null
  } else {
    const x = result % 5
    const y = Math.floor(result / 5)
    // console.log('Computer picked', x, y);
    return [x, y]
  }
}
