import {
  ScoreRecord,
  PlayerUser,
  PlayerType,
  PlayerBot,
  Player,
  PlayerIndex,
  Tile,
  Game
} from './types'
import { Sleep } from './utils'

// GAME

const LOCAL_STORAGE_SCORE_RECORDS: string = 'score_records'

const NewScoreRecord = (round: number, scores: number[]): ScoreRecord => {
  return { round, scores }
}

const NewPlayerUser = (name: string = 'User'): PlayerUser => {
  return { type: PlayerType.User, name }
}

const NewPlayerBot = (searchDepth: number): PlayerBot => {
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

const NewTile = (dots: number, player: PlayerIndex): Tile => {
  return { dots, player }
}

export const NewGame = (
  width: number,
  height: number,
  animationPeriod: number
): Game => {
  const tiles: Tile[] = []
  let round: number = 0
  let hasGameEnded: boolean = false
  const players: Player[] = [NewPlayerUser(), NewPlayerUser()]

  const InitialiseGame = (): void => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiles.push(NewTile(0, 0))
      }
    }
  }

  InitialiseGame()

  const GetCurrentPlayerIndex = (): PlayerIndex => {
    return round % 2
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

  const TakeOverTile = (x: number, y: number, player: PlayerIndex): void => {
    const tile: Tile | null = GetOptionalTile(x, y)
    if (tile === null) {
      return
    }

    const dots = Math.min(tile.dots + 1, 4)
    SetTile(x, y, NewTile(dots, tile.player))
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
    while (await UpdateTilesOneIteration()) {}
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
      UpdateScoreRecords(playerScores)
      hasGameEnded = true
    }

    if (hasGameEnded) {
      return
    }

    round++
  }

  const UpdateScoreRecords = (playerScores: number[]) => {
    const playersIdentifer: string = players
      .map(player => PlayerToIdentifier(player))
      .join(' Vs ')
    const scoreRecordString: string | null = localStorage.getItem(
      LOCAL_STORAGE_SCORE_RECORDS
    )
    const scoreRecords =
      scoreRecordString === null ? {} : JSON.parse(scoreRecordString)
    if (!scoreRecords[playersIdentifer]) {
      scoreRecords[playersIdentifer] = {}
    }

    let previousScoreRecord: ScoreRecord =
      scoreRecords[playersIdentifer] || NewScoreRecord(0, [0, 0])
    let doUpdateRecord = false
    if (players.some(IsPlayerUser) && players.some(IsPlayerBot)) {
      const playerIndexOfUser: number = players.findIndex(IsPlayerUser)
      const playerIndexOfBot: number = players.findIndex(IsPlayerBot)
      const didUserWin: boolean =
        playerScores[playerIndexOfUser] > playerScores[playerIndexOfBot]
      const hasUserWon: boolean =
        previousScoreRecord.scores[playerIndexOfUser] >
        previousScoreRecord.scores[playerIndexOfBot]

      // update record if user has won and won in fewer rounds OR
      // if user has never won and lasted more rounds before losing
      doUpdateRecord =
        (didUserWin &&
          (round < previousScoreRecord.round ||
            previousScoreRecord.round == 0)) ||
        (!didUserWin && !hasUserWon && round > previousScoreRecord.round)
    } else {
      // if user vs user or bot vs bot just record latest score
      doUpdateRecord = false
    }

    if (doUpdateRecord) {
      scoreRecords[playersIdentifer] = NewScoreRecord(round, playerScores)
      localStorage.setItem(
        LOCAL_STORAGE_SCORE_RECORDS,
        JSON.stringify(scoreRecords)
      )
    }
  }

  const MakePlayerMove = async (x: number, y: number): Promise<boolean> => {
    const tile: Tile = GetTile(x, y)

    const currentPlayerIndex = GetCurrentPlayerIndex()
    let didPlayerMove = false

    if (tile.dots > 0 && tile.player === currentPlayerIndex) {
      const dots = Math.min(tile.dots + 1, 4)
      SetTile(x, y, NewTile(dots, currentPlayerIndex))

      await UpdateTiles()
      UpdateGameIteration()
      didPlayerMove = true
    } else if (tile.dots === 0 && round < 2) {
      SetTile(x, y, NewTile(3, currentPlayerIndex))
      UpdateGameIteration()
      didPlayerMove = true
    }
    return didPlayerMove
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

  return {
    MakePlayerMove,
    GetWidth,
    GetHeight,
    GetTiles,
    GetRound,
    GetHasGameEnded,
    GetPlayers,
    LogBoard
  }
}
