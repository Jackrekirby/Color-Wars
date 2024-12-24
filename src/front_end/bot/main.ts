import { Game } from '../game/types'

// records moves
// record times

export interface GameBot {
  IsReady: () => boolean
}

export const CreateBot = (): GameBot => {
  const script = document.createElement('script')
  script.src = 'src/front_end/bot/engine.js'
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

const CreateBoardPtr = (game: Game): any => {
  // struct Tile {
  //   Team team;             0 offset, 1 byte
  //   Dots dots;             1 offset, 1 byte
  // }
  // struct Board {
  //   Tile* tiles;           0 offset, 4 bytes (wasm uses 4 bytes for pointer even if C++ compiled on 64 bit system)
  //   BoardSize width;       8 offset, 4 bytes
  //   BoardSize height;      12 offset, 4 bytes
  // }

  const height = game.GetHeight()
  const width = game.GetWidth()

  const boardSize = width * height * 2 // each tile is 2 bytes (2 uint8)
  const tilesPtr = Module._malloc(boardSize)
  let i = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = game.GetTile(x, y)

      Module.setValue(tilesPtr + i, tile.player, 'i8')
      Module.setValue(tilesPtr + (i + 1), tile.dots, 'i8')
      i += 2
    }
  }

  // Allocate memory for the Board struct
  const boardPtr = Module._malloc(4 * 3)

  // Set the width and height values
  Module.setValue(boardPtr, tilesPtr, 'i32')
  Module.setValue(boardPtr + 4, width, 'i32')
  Module.setValue(boardPtr + 8, height, 'i32')

  return { tilesPtr, boardPtr }
}

export const BotMakeMove = (game: Game, depth: number) => {
  const InitBotEngine = Module.cwrap('InitBotEngine', 'number', [
    'number',
    'number',
    'number',
    'number'
  ])

  const { boardPtr, tilesPtr } = CreateBoardPtr(game)

  // Call the function
  const result = InitBotEngine(
    boardPtr,
    depth,
    game.GetRound(),
    game.GetCurrentPlayerIndex()
  )

  // Free the allocated memory
  Module._free(boardPtr)
  Module._free(tilesPtr)

  // console.log('result', result)
  const width: number = game.GetWidth()
  const maxTileIndex: number = game.GetWidth() * game.GetHeight()
  if (result < 0 || result >= maxTileIndex) {
    console.error('Computer did not pick a move', { result, maxTileIndex })
    return null
  } else {
    const x = result % width
    const y = Math.floor(result / width)
    // console.log('Computer picked', x, y);
    return [x, y]
  }
}
