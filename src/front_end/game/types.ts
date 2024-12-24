export enum PlayerIndex {
  One = 0,
  Two = 1
}

export enum PlayerType {
  User,
  Bot
}

export interface PlayerUser {
  type: PlayerType.User
  name: string
}

export interface PlayerBot {
  type: PlayerType.Bot
  searchDepth: number
}

export interface ScoreRecord {
  round: number
  winningPlayerIndex: PlayerIndex
}

export type ScoreRecords = { [key: string]: ScoreRecord | null }

export type Player = PlayerUser | PlayerBot

export interface Tile {
  dots: number
  player: PlayerIndex
}

export type VoidFunction = () => void
export interface CallbackHandler {
  addCallback: (callback: VoidFunction) => void
  triggerCallbacks: () => void
}

export interface Position {
  x: number
  y: number
}

export interface Game {
  MakePlayerMove: (x: number, y: number) => Promise<boolean>
  GetWidth: () => number
  GetHeight: () => number
  GetTiles: () => Tile[]
  GetRound: () => number
  GetHasGameEnded: () => boolean
  GetPlayers: () => Player[]
  LogBoard: () => void
  NewGame: (playerOne: Player, playerTwo: Player) => void
  GetScoreRecords: () => ScoreRecords
  GetTile: (x: number, y: number) => Tile
  AddRenderCallback: (callback: VoidFunction) => void
  AddNewRoundCallback: (callback: VoidFunction) => void
  AddEndOfGameCallback: (callback: VoidFunction) => void
  GetCurrentPlayerIndex: () => number
  CanPlayerMove: (x: number, y: number) => boolean
  GetPlayerMoves: () => Position[]
}
