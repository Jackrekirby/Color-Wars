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
  scores: number[]
}

export type Player = PlayerUser | PlayerBot

export interface Tile {
  dots: number
  player: PlayerIndex
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
}
