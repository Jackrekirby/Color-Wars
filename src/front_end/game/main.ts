import { BotMakeMove } from '../bot/main'
import {
  ScoreRecord,
  PlayerUser,
  PlayerType,
  PlayerBot,
  Player,
  PlayerIndex,
  Tile,
  Game,
  ScoreRecords,
  Position
} from './types'
import { NewCallbackHandler, Sleep } from '../utils'

// GAME

const LOCAL_STORAGE_SCORE_RECORDS: string = 'score_records'

const NewScoreRecord = (
  round: number,
  winningPlayerIndex: PlayerIndex
): ScoreRecord => {
  return { round, winningPlayerIndex }
}

export const NewPlayerUser = (name: string = 'User'): PlayerUser => {
  return { type: PlayerType.User, name }
}

export const NewPlayerBot = (searchDepth: number): PlayerBot => {
  return { type: PlayerType.Bot, searchDepth }
}

const IsPlayerUser = (player: Player): player is PlayerUser => {
  return player.type === PlayerType.User
}

const IsPlayerBot = (player: Player): player is PlayerBot => {
  return player.type === PlayerType.Bot
}

const PlayerToIdentifier = (player: Player) => {
  if (IsPlayerUser(player)) {
    return `${player.name}`
  } else if (IsPlayerBot(player)) {
    return `Bot[${player.searchDepth}]`
  }
  throw Error(`PlayerToIdentifier(${player}) not implemented`)
}

export const NewTile = (dots: number, player: PlayerIndex): Tile => {
  return { dots, player }
}

export const CreateGame = (
  width: number,
  height: number,
  animationPeriod: number,
  botWaitPeriod: number
): Game => {
  const tiles: Tile[] = []
  let round: number = 0
  let hasGameEnded: boolean = true
  let isPlayerMoving = false
  const playerMoves: Position[] = []
  const players: Player[] = []
  const renderCallbackHandler = NewCallbackHandler()
  const newRoundCallbackHandler = NewCallbackHandler()
  const endOfGameCallbackHandler = NewCallbackHandler()

  const MakeComputerMove = async () => {
    const nextPlayer = players[GetCurrentPlayerIndex()]
    if (IsPlayerBot(nextPlayer)) {
      await Sleep(botWaitPeriod)
      const result = BotMakeMove(state, nextPlayer.searchDepth)
      if (result) {
        const [x, y] = result
        MakePlayerMove(x, y)
      }
    }
  }

  newRoundCallbackHandler.addCallback(MakeComputerMove)

  const NewGame = async (
    playerOne: Player,
    playerTwo: Player
  ): Promise<void> => {
    if (!hasGameEnded) {
      hasGameEnded = true
      endOfGameCallbackHandler.triggerCallbacks()
    }
    // length=0 empties the array
    playerMoves.length = 0
    tiles.length = 0
    round = 0
    hasGameEnded = false
    // pass players as args
    players[0] = playerOne
    players[1] = playerTwo

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiles.push(NewTile(0, 0))
      }
    }
    newRoundCallbackHandler.triggerCallbacks()
  }

  const GetCurrentPlayerIndex = (): PlayerIndex => {
    return round % 2
  }

  const GetPlayerMoves = (): Position[] => {
    return playerMoves
  }

  const IsValidTilePosition = (x: number, y: number): boolean => {
    return !(x < 0 || x >= width || y < 0 || y >= height)
  }

  const GetOptionalTile = (x: number, y: number): Tile | null => {
    if (!IsValidTilePosition(x, y)) {
      return null
    }
    return tiles[x + y * width]
  }

  const GetTile = (x: number, y: number): Tile => {
    if (!IsValidTilePosition(x, y)) {
      throw Error(`GetTile(${x}, ${y}) invalid position`)
    }
    return tiles[x + y * width]
  }

  const SetTile = (x: number, y: number, tile: Tile): void => {
    if (!IsValidTilePosition(x, y)) {
      throw Error(`SetTile(${x}, ${y}) invalid position`)
    }
    tiles[x + y * width] = tile
  }

  const PlayerSetTile = (x: number, y: number, tile: Tile) => {
    SetTile(x, y, tile)
    playerMoves.push({ x, y })
  }

  const TakeOverTile = (x: number, y: number, player: PlayerIndex): void => {
    const tile: Tile | null = GetOptionalTile(x, y)
    if (tile === null) {
      return
    }

    const dots = Math.min(tile.dots + 1, 4)
    SetTile(x, y, NewTile(dots, player))
  }

  const GetTileUpdateCallbacks = () => {
    let callbacks = []
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = GetTile(x, y)
        if (tile.dots >= 4) {
          callbacks.push(() => {
            SetTile(x, y, NewTile(0, tile.player))
            TakeOverTile(x + 1, y, tile.player)
            TakeOverTile(x - 1, y, tile.player)
            TakeOverTile(x, y + 1, tile.player)
            TakeOverTile(x, y - 1, tile.player)
          })
        }
      }
    }
    return callbacks
  }

  const UpdateTilesOneIteration = async (): Promise<boolean> => {
    const callbacks: (() => void)[] = GetTileUpdateCallbacks()
    if (callbacks.length > 0) {
      await Sleep(animationPeriod)
      for (const callback of callbacks) {
        callback()
      }
      return true
    }
    return false
  }

  const UpdateTiles = async () => {
    while (await UpdateTilesOneIteration()) {
      renderCallbackHandler.triggerCallbacks()
    }
  }

  const GetPlayerScores = (): number[] => {
    let score = [0, 0] // player 1, player 2
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = GetTile(x, y)
        score[tile.player] += tile.dots
      }
    }
    return score
  }

  const UpdateGameIteration = () => {
    const playerScores: number[] = GetPlayerScores()
    const _hasGameEnded: boolean =
      round >= 2 && playerScores.some(score => score === 0)

    if (_hasGameEnded) {
      const winningPlayerIndex: PlayerIndex = playerScores[1] === 0 ? 0 : 1
      UpdateScoreRecords(winningPlayerIndex)
      hasGameEnded = true
      endOfGameCallbackHandler.triggerCallbacks()
    }

    if (hasGameEnded) {
      return
    }

    round++
    newRoundCallbackHandler.triggerCallbacks()
  }

  const GetScoreRecords = (): ScoreRecords => {
    const scoreRecordString: string | null = localStorage.getItem(
      LOCAL_STORAGE_SCORE_RECORDS
    )
    const scoreRecords: { [key: string]: ScoreRecord | null } =
      scoreRecordString === null ? {} : JSON.parse(scoreRecordString)
    return scoreRecords
  }

  const UpdateScoreRecords = (winningPlayerIndex: PlayerIndex) => {
    const playersIdentifer: string = players
      .map(player => PlayerToIdentifier(player))
      .join(' Vs ')
    const scoreRecords: ScoreRecords = GetScoreRecords()

    let previousScoreRecord: ScoreRecord =
      scoreRecords[playersIdentifer] || NewScoreRecord(0, 0)
    let doUpdateRecord = false
    if (players.some(IsPlayerUser) && players.some(IsPlayerBot)) {
      const playerIndexOfUser: number = players.findIndex(IsPlayerUser)
      const didUserWin: boolean = playerIndexOfUser == winningPlayerIndex
      const hasUserWon: boolean =
        playerIndexOfUser === previousScoreRecord.winningPlayerIndex

      // update record if user has won and won in fewer rounds OR
      // if user has never won and lasted more rounds before losing
      doUpdateRecord =
        (didUserWin &&
          (round < previousScoreRecord.round ||
            previousScoreRecord.round == 0)) ||
        (!didUserWin && !hasUserWon && round > previousScoreRecord.round)
    } else {
      // if user vs user or bot vs bot just record latest score
      doUpdateRecord = true
    }

    if (doUpdateRecord) {
      scoreRecords[playersIdentifer] = NewScoreRecord(
        Math.floor(round / 2), // round is realy game iteration (2 iterations = 1 round)
        winningPlayerIndex
      )
      localStorage.setItem(
        LOCAL_STORAGE_SCORE_RECORDS,
        JSON.stringify(scoreRecords)
      )
    }
  }

  const MakePlayerMove = async (x: number, y: number): Promise<boolean> => {
    if (isPlayerMoving) {
      return false
    }
    isPlayerMoving = true
    const tile: Tile = GetTile(x, y)

    const currentPlayerIndex = GetCurrentPlayerIndex()
    let didPlayerMove = false

    if (tile.dots > 0 && tile.player === currentPlayerIndex) {
      const dots = Math.min(tile.dots + 1, 4)
      PlayerSetTile(x, y, NewTile(dots, currentPlayerIndex))
      renderCallbackHandler.triggerCallbacks()
      await UpdateTiles()
      didPlayerMove = true
    } else if (tile.dots === 0 && round < 2) {
      PlayerSetTile(x, y, NewTile(3, currentPlayerIndex))
      renderCallbackHandler.triggerCallbacks()
      didPlayerMove = true
    }
    isPlayerMoving = false
    if (didPlayerMove) {
      UpdateGameIteration()
    }
    return didPlayerMove
  }

  const CanPlayerMove = (x: number, y: number): boolean => {
    if (isPlayerMoving) {
      return false
    }

    const tile: Tile = GetTile(x, y)
    const currentPlayerIndex = GetCurrentPlayerIndex()

    if (tile.dots > 0 && tile.player === currentPlayerIndex) {
      return true
    } else if (tile.dots === 0 && round < 2) {
      return true
    }
    return false
  }

  const LogBoard = (): void => {
    const red = '\x1b[31m'
    const green = '\x1b[32m'
    const reset = '\x1b[0m' // Resets the color back to default

    let boardStr = ''
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = GetTile(x, y)
        if (tile.dots === 0) {
          boardStr += '# '
        } else {
          boardStr += tile.player === PlayerIndex.One ? red : green
          boardStr += tile.dots + reset + ' '
        }
      }
      boardStr += '\n'
    }
    console.log(boardStr)
  }

  const GetWidth = (): number => {
    return width
  }
  const GetHeight = (): number => {
    return height
  }
  const GetTiles = (): Tile[] => {
    return tiles
  }
  const GetRound = (): number => {
    return round
  }
  const GetHasGameEnded = (): boolean => {
    return hasGameEnded
  }
  const GetPlayers = (): Player[] => {
    return players
  }

  const state = {
    MakePlayerMove,
    GetWidth,
    GetHeight,
    GetTiles,
    GetRound,
    GetHasGameEnded,
    GetPlayers,
    LogBoard,
    NewGame,
    GetScoreRecords,
    GetTile,
    AddRenderCallback: renderCallbackHandler.addCallback,
    AddNewRoundCallback: newRoundCallbackHandler.addCallback,
    AddEndOfGameCallback: endOfGameCallbackHandler.addCallback,
    GetCurrentPlayerIndex,
    CanPlayerMove,
    GetPlayerMoves
  }

  return state
}
