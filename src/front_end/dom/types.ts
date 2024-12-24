export enum Page {
  Menu = 'Menu',
  Settings = 'Settings',
  ScoreRecords = 'ScoreRecords',
  NewGame = 'NewGame',
  Game = 'Game'
}

export interface PageElements {
  Menu: HTMLElement
  Settings: HTMLElement
  ScoreRecords: HTMLElement
  NewGame: HTMLElement
  Game: HTMLElement
}

// TODO: consider seperating elements into pages
export interface Elements {
  newGame: HTMLElement // start new game
  gotoHome: HTMLElement // TODO: make this a go home button
  players: HTMLElement[]
  botDepth: HTMLElement
  botDepthMinus: HTMLElement
  resetStorage: HTMLElement
  gameTimer: HTMLElement
  botStatus: HTMLElement
  round: HTMLElement
  scoreboard: HTMLElement
  board: HTMLElement
  pages: PageElements
  openPageNewGame: HTMLElement
  openPageScoreRecords: HTMLElement
  openPageSettings: HTMLElement
  version: HTMLElement
}

export interface LocalStorageKeys {
  botDepth: 'botDepth'
  player: (index: number) => string
  scoreRecords: 'scoreRecords'
}

export interface PageManager {
  GetPage: () => Page
  SetPage: (page: Page) => void
}
