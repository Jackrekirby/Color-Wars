import { GameBot } from '../bot/main'
import { BUILD_TIME } from '../build_time'
import { NewPlayerBot, NewPlayerUser, NewTile } from '../game/main'
import {
  Game,
  Player,
  PlayerIndex,
  Position,
  ScoreRecord,
  ScoreRecords,
  Tile
} from '../game/types'
import { FormatDate, millisToMMSS } from '../utils'
import { LocalStorageKeys, Elements, Page, PageManager } from './types'

const localStorageKeys: LocalStorageKeys = {
  botDepth: 'botDepth',
  player: (index: number) => `player${index}`,
  scoreRecords: 'scoreRecords'
}

const InitialiseElements = (): Elements => {
  // all pages
  const gotoHomeElement = document.getElementById('gotoHome')

  // game page
  const boardElement = document.getElementById('grid')
  const gameTimerElement = document.getElementById('gameTimer')
  const botStatusElement = document.getElementById('botStatus')

  // new game page
  const iterationElement = document.getElementById('gameIteration')
  const player1Element = document.getElementById('team1User')
  const player2Element = document.getElementById('team2User')
  const botDepthElement = document.getElementById('botDepth')
  const botDepthMinusElement = document.getElementById('botDepthMinus')
  const newGameElement = document.getElementById('newGame')

  // settings page
  const resetStorageElement = document.getElementById('resetStorage')
  const versionElement = document.getElementById('version')

  // score records page
  const scoreboardElement = document.getElementById('scoreRecords')

  // menu page
  const openPageNewGameElement = document.getElementById('openPageNewGame')
  const openPageScoreRecordsElement = document.getElementById(
    'openPageScoreRecords'
  )
  const openPageSettingsElement = document.getElementById('openPageSettings')

  // pages
  const pageMenuElement = document.getElementById('pageMenu')
  const pageNewGameElement = document.getElementById('pageNewGame')
  const pageSettingsElement = document.getElementById('pageSettings')
  const pageScoreRecordsElement = document.getElementById('pageScoreRecords')
  const pageGameElement = document.getElementById('pageGame')

  const allElements: { [key: string]: HTMLElement | null } = {
    boardElement,
    iterationElement,
    botStatusElement,
    gotoHomeElement,
    pageMenuElement,
    pageNewGameElement,
    pageSettingsElement,
    pageScoreRecordsElement,
    pageGameElement,
    player1Element,
    player2Element,
    botDepthElement,
    botDepthMinusElement,
    newGameElement,
    resetStorageElement,
    gameTimerElement,
    scoreboardElement,
    openPageNewGameElement,
    openPageScoreRecordsElement,
    openPageSettingsElement,
    versionElement
  }
  const nullElements = Object.keys(allElements).filter(
    key => allElements[key] === null
  )
  if (nullElements.length > 0) {
    throw new Error(
      `Not all HTML Elements could be located:\n${JSON.stringify(nullElements)}`
    )
  }
  return {
    pages: {
      Menu: pageMenuElement as HTMLElement,
      NewGame: pageNewGameElement as HTMLElement,
      Settings: pageSettingsElement as HTMLElement,
      ScoreRecords: pageScoreRecordsElement as HTMLElement,
      Game: pageGameElement as HTMLElement
    },
    newGame: newGameElement as HTMLElement,
    gotoHome: gotoHomeElement as HTMLElement,
    players: [player1Element, player2Element] as HTMLElement[],
    botDepth: botDepthElement as HTMLElement,
    botDepthMinus: botDepthMinusElement as HTMLElement,
    resetStorage: resetStorageElement as HTMLElement,
    gameTimer: gameTimerElement as HTMLElement,
    botStatus: botStatusElement as HTMLElement,
    round: iterationElement as HTMLElement,
    scoreboard: scoreboardElement as HTMLElement,
    board: boardElement as HTMLElement,
    openPageNewGame: openPageNewGameElement as HTMLElement,
    openPageScoreRecords: openPageScoreRecordsElement as HTMLElement,
    openPageSettings: openPageSettingsElement as HTMLElement,
    version: versionElement as HTMLElement
  }
}

const SetElementVisibility = (element: HTMLElement, visible: boolean): void => {
  if (visible) {
    element.classList.remove('hide')
  } else {
    element.classList.add('hide')
  }
}

const ToggleElementVisibility = (element: HTMLElement): void => {
  element.classList.toggle('hide')
}

const GetLocalStorageItem = (
  key: string,
  defaultValue: string
): string | null => {
  if (localStorage.getItem(key) === null) {
    localStorage.setItem(key, defaultValue)
    return defaultValue
  } else {
    return localStorage.getItem(key)
  }
}

const CyclePlayerOption = (playerIndex: number) => {
  const element = elements.players[playerIndex]
  const playerOptionIndex =
    (playerOptions.findIndex(item => item === element.textContent) + 1) %
    playerOptions.length
  element.textContent = playerOptions[playerOptionIndex]
  localStorage.setItem(
    localStorageKeys.player(playerIndex),
    element.textContent
  )
}

const CycleBotDepth = (increment: number) => {
  let depth = Number(elements.botDepth.textContent)
  depth += increment
  if (depth <= 0) {
    depth = 16
  } else if (depth > 16) {
    depth = 1
  }

  const depthStr = String(depth)
  elements.botDepth.textContent = depthStr
  localStorage.setItem(localStorageKeys.botDepth, depthStr)
}

enum PlayerOption {
  User = 'User',
  Bot = 'Bot'
}

const playerOptions: PlayerOption[] = [PlayerOption.User, PlayerOption.Bot]

const MakePlayer = (playerIndex: PlayerIndex): Player => {
  const playerOption: PlayerOption = elements.players[playerIndex]
    .textContent as PlayerOption

  if (playerOption === PlayerOption.User) {
    return NewPlayerUser()
  } else {
    const botSearchDepth = Number(elements.botDepth.textContent)
    return NewPlayerBot(botSearchDepth)
  }
}

const InitialiseElementsPoweredByLocalStorage = () => {
  elements.players[0].textContent = GetLocalStorageItem(
    localStorageKeys.player(0),
    PlayerOption.Bot
  )
  elements.players[1].textContent = GetLocalStorageItem(
    localStorageKeys.player(1),
    PlayerOption.User
  )
  elements.botDepth.textContent = GetLocalStorageItem(
    localStorageKeys.botDepth,
    '8'
  )
}

const CreatePageManager = (initialPage: Page): PageManager => {
  let currentPage = initialPage

  const GetPage = (): Page => {
    return currentPage
  }

  const SetPage = (page: Page) => {
    if (page === currentPage) {
      console.warn(`Attempting to set page to current page ${page}`)
      return
    }

    // only show goto home button when not on home page
    SetElementVisibility(elements.gotoHome, page !== Page.Menu)

    SetElementVisibility(elements.pages[currentPage], false)
    SetElementVisibility(elements.pages[page], true)
    currentPage = page
  }

  return {
    GetPage,
    SetPage
  }
}

export const InitialiseElementEvents = (game: Game, bot: GameBot) => {
  const pageManager = CreatePageManager(Page.Menu)

  game.AddNewRoundCallback(() => {
    const playerIndex = game.GetCurrentPlayerIndex()
    elements.botStatus.style.backgroundColor = GetPlayerColor(playerIndex)
  })

  game.AddRenderCallback(() => {
    UpdateBoard(game)

    const playerMoves: Position[] = game.GetPlayerMoves()

    if (playerMoves.length > 0) {
      const playerIndex: PlayerIndex = game.GetCurrentPlayerIndex()
      RemoveLastPlayerMoveStyle()
      const { x, y } = playerMoves.at(-1) as Position
      const tileElement = GetTileElement(x, y)
      tileElement.classList.add(`lastMoveOfPlayer${playerIndex + 1}`)
    }
  })

  game.AddEndOfGameCallback(() => {
    const playerIndex = game.GetCurrentPlayerIndex()
    elements.botStatus.textContent = `Player ${
      playerIndex === 0 ? 'One' : 'Two'
    } has Won!`
    RenderScoreRecords(game)
  })

  elements.newGame.onclick = () => {
    if (!bot.IsReady()) {
      console.warn('Bot is not ready for a new game')
    }
    const width: number = 5
    const height: number = 5

    game.NewGame(width, height, MakePlayer(0), MakePlayer(1))

    InitialiseBoard(game)

    InitialiseUpdateTeamElapsedTime(game)

    UpdateBoard(game)
    RemoveLastPlayerMoveStyle()
    pageManager.SetPage(Page.Game)
  }

  elements.gotoHome.onclick = () => {
    pageManager.SetPage(Page.Menu)
    game.TerminateGame()
  }

  elements.openPageNewGame.onclick = () => {
    pageManager.SetPage(Page.NewGame)
  }

  elements.openPageScoreRecords.onclick = () => {
    pageManager.SetPage(Page.ScoreRecords)
  }

  elements.openPageSettings.onclick = () => {
    pageManager.SetPage(Page.Settings)
  }

  elements.players.forEach(
    (element, index) => (element.onclick = () => CyclePlayerOption(index))
  )

  elements.version.textContent = `Version ${VERSION} (Build ${FormatDate(
    BUILD_TIME
  )})`

  elements.botDepth.onclick = () => CycleBotDepth(1)
  elements.botDepthMinus.onclick = () => CycleBotDepth(-1)

  InitialiseElementsPoweredByLocalStorage()
  RenderScoreRecords(game)

  elements.resetStorage.onclick = () => {
    localStorage.clear()
    InitialiseElementsPoweredByLocalStorage()
    RenderScoreRecords(game)
  }
}

const RenderScoreRecords = (game: Game) => {
  const scoreRecords: ScoreRecords = game.GetScoreRecords()
  elements.scoreboard.innerHTML = ''

  if (Object.keys(scoreRecords).length === 0) {
    elements.scoreboard.innerHTML = 'No records'
    return
  }

  const div = document.createElement('div')
  div.className = 'record'
  div.innerHTML = `<div>Players</div><div>Winner</div><div>Round</div>`
  elements.scoreboard.appendChild(div)

  Object.keys(scoreRecords).forEach(key => {
    const scoreRecord: ScoreRecord | null = scoreRecords[key]
    if (scoreRecord === null) {
      return
    }
    const div = document.createElement('div')
    div.className = 'record'
    div.innerHTML = `<div>${key}</div><div>${
      scoreRecord.winningPlayerIndex === 0 ? 'One' : 'Two'
    }</div><div>${scoreRecord.round}</div>`
    elements.scoreboard.appendChild(div)
  })
}

const GetTileElementId = (x: number, y: number): string => {
  return `tile${x}_${y}`
}

const RemoveClassFromElementByPrefix = (
  element: HTMLElement,
  prefix: string
): void => {
  const totalDotsClass = Array.from(element.classList).find(className =>
    className.startsWith(prefix)
  )
  if (totalDotsClass) {
    element.classList.remove(totalDotsClass)
  }
}

const GetTileElement = (x: number, y: number): HTMLElement => {
  const tileElement = document.getElementById(GetTileElementId(x, y))
  if (tileElement === null) {
    throw new Error(`Tile element at (${x}, ${y}) is null`)
  }
  return tileElement
}

const GetDotElementOfTile = (
  x: number,
  y: number,
  dot: number
): HTMLElement => {
  const tileElement = document.getElementById(GetTileElementId(x, y))
  if (tileElement === null) {
    throw new Error(`Tile element at (${x}, ${y}) is null`)
  }

  const dotElements = tileElement.getElementsByClassName(`dotNo${dot}`)
  if (dotElements.length !== 1) {
    throw new Error(
      `Expected exactly one dot element with ${dot} dots at tile (${x}, ${y})`
    )
  }
  const dotElement = dotElements[0] as HTMLElement
  return dotElement
}

const GetPlayerColor = (
  playerIndex: PlayerIndex,
  delta: number = 0
): string => {
  const lightness = Math.floor(Math.random() * delta + (50 - delta / 2))
  const hue = playerIndex === 0 ? 0 : 135
  const color = `hsl(${hue}, 100%, ${lightness}%)`
  return color
}

const UpdateTile = (x: number, y: number, tile: Tile) => {
  for (let dot = 1; dot <= tile.dots; dot++) {
    const dotElement = GetDotElementOfTile(x, y, dot)
    dotElement.style.opacity = '1'

    RemoveClassFromElementByPrefix(dotElement, 'totalDots')
    RemoveClassFromElementByPrefix(dotElement, 'dotNo')
    dotElement.classList.add(`totalDots${tile.dots}`)
    dotElement.classList.add(`dotNo${dot}`)

    dotElement.style.backgroundColor = GetPlayerColor(tile.player, 0)
  }
  for (let dot = tile.dots + 1; dot <= 4; dot++) {
    const dotElement = GetDotElementOfTile(x, y, dot)
    dotElement.style.opacity = '0'
    RemoveClassFromElementByPrefix(dotElement, 'totalDots')
  }
}

const UpdateRound = (game: Game) => {
  const round = Math.floor(game.GetRound() / 2) + 1
  elements.round.textContent = `Round ${round}`
}

const UpdateBoard = (game: Game) => {
  const height = game.GetHeight()
  const width = game.GetWidth()
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = game.GetTile(x, y)
      UpdateTile(x, y, tile)
    }
  }
  UpdateRound(game)
}

const RemoveLastPlayerMoveStyle = () => {
  for (const i of [1, 2]) {
    const clsName = `lastMoveOfPlayer${i}`

    for (let tile of document.getElementsByClassName(clsName)) {
      tile.classList.remove(clsName)
    }
  }
}

const InitialiseBoard = (game: Game): void => {
  const height = game.GetHeight()
  const width = game.GetWidth()

  // delete board children
  while (elements.board.firstChild) {
    elements.board.removeChild(elements.board.firstChild)
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tileElement = document.createElement('div')

      tileElement.className = 'tile'
      tileElement.id = GetTileElementId(x, y)

      for (let dot = 1; dot <= 4; dot++) {
        const dotElement = document.createElement('div')
        dotElement.classList.add('dot')
        dotElement.classList.add(`dotNo${dot}`)
        dotElement.style.opacity = '0'
        tileElement.appendChild(dotElement)
      }

      const randomColor = `hsl(30, 3%, ${Math.floor(Math.random() * 6) + 23}%)` // Random HSL color
      tileElement.style.backgroundColor = randomColor

      tileElement.onclick = async () => {
        const canPlayerMove: boolean = game.CanPlayerMove(x, y)
        if (!canPlayerMove) {
          return
        }

        await game.MakePlayerMove(x, y)

        UpdateRound(game)
      }
      elements.board.appendChild(tileElement)
    }
  }
}
const InitialiseUpdateTeamElapsedTime = (game: Game) => {
  // TODO: move player time record into game
  let playerElapsedTimes = [0, 0]
  let lastTime = performance.now()
  let startOfRoundTime = lastTime
  let lastRound = 0
  const UpdateTeamElapsedTime = () => {
    if (game.GetHasGameEnded()) {
      return
    }

    const now = performance.now()
    const playerIndex = game.GetCurrentPlayerIndex()

    if (lastRound !== game.GetRound()) {
      startOfRoundTime = now
      lastRound = game.GetRound()
    }

    playerElapsedTimes[playerIndex] += now - lastTime
    lastTime = now

    elements.gameTimer.textContent =
      millisToMMSS(playerElapsedTimes[0]) +
      ' - ' +
      millisToMMSS(playerElapsedTimes[1])

    elements.botStatus.textContent = `Player ${
      playerIndex === 0 ? 'One' : 'Two'
    } (${millisToMMSS(now - startOfRoundTime)})`

    requestAnimationFrame(UpdateTeamElapsedTime)
  }
  UpdateTeamElapsedTime()
}

const ResetStorageOnVersionChange = () => {
  if (localStorage.getItem('version') !== VERSION) {
    console.log('Version changed, resetting storage')
    localStorage.clear()
    localStorage.setItem('version', VERSION)
  }
}

const VERSION = '2' // if version changes, reset storage

ResetStorageOnVersionChange()

const elements: Elements = InitialiseElements()
