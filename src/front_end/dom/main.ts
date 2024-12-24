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
import { FormatDate, millisToMMSS, NewCallbackHandler } from '../utils'
import { LocalStorageKeys, Elements, Page, PageManager } from './types'

const localStorageKeys: LocalStorageKeys = {
  botDepth: 'botDepth',
  boardWidth: 'boardWidth',
  boardHeight: 'boardHeight',
  botWaitPeriod: 'botWaitPeriod',
  tileUpdatePeriod: 'tileUpdatePeriod',
  player: (index: number) => `player${index}`,
  scoreRecords: 'scoreRecords'
}

const InitialiseElements = (): Elements => {
  const elementNames: string[] = [
    // pages
    'pageMenu',
    'pageSettings',
    'pageScoreRecords',
    'pageNewGame',
    'pageGame',
    // players
    'player1User',
    'player2User',
    // components
    'newGame',
    'gotoHome',
    'botDepth',
    'botDepthMinus',
    'resetStorage',
    'gameTimer',
    'botStatus',
    'gameIteration',
    'scoreRecords',
    'board',
    'openPageNewGame',
    'openPageScoreRecords',
    'openPageSettings',
    'version',
    'botWaitPeriod',
    'tileUpdatePeriod',
    'botWaitPeriodMinus',
    'tileUpdatePeriodMinus',
    'boardWidth',
    'boardWidthMinus',
    'boardHeight',
    'boardHeightMinus'
  ]

  const elements: { [key: string]: HTMLElement | null } = Object.fromEntries(
    elementNames.map(name => [name, document.getElementById(name)])
  )

  const nullElements = Object.keys(elements).filter(
    key => elements[key] === null
  )
  if (nullElements.length > 0) {
    throw new Error(
      `Not all HTML Elements could be located:\n${JSON.stringify(nullElements)}`
    )
  }
  return {
    pages: {
      Menu: elements['pageMenu'] as HTMLElement,
      NewGame: elements['pageNewGame'] as HTMLElement,
      Settings: elements['pageSettings'] as HTMLElement,
      ScoreRecords: elements['pageScoreRecords'] as HTMLElement,
      Game: elements['pageGame'] as HTMLElement
    },
    newGame: elements['newGame'] as HTMLElement,
    gotoHome: elements['gotoHome'] as HTMLElement,
    players: [
      elements['player1User'],
      elements['player2User']
    ] as HTMLElement[],
    botDepth: elements['botDepth'] as HTMLElement,
    botDepthMinus: elements['botDepthMinus'] as HTMLElement,
    resetStorage: elements['resetStorage'] as HTMLElement,
    gameTimer: elements['gameTimer'] as HTMLElement,
    botStatus: elements['botStatus'] as HTMLElement,
    round: elements['gameIteration'] as HTMLElement,
    scoreboard: elements['scoreRecords'] as HTMLElement,
    board: elements['board'] as HTMLElement,
    openPageNewGame: elements['openPageNewGame'] as HTMLElement,
    openPageScoreRecords: elements['openPageScoreRecords'] as HTMLElement,
    openPageSettings: elements['openPageSettings'] as HTMLElement,
    version: elements['version'] as HTMLElement,
    botWaitPeriod: elements['botWaitPeriod'] as HTMLElement,
    tileUpdatePeriod: elements['tileUpdatePeriod'] as HTMLElement,
    botWaitPeriodMinus: elements['botWaitPeriodMinus'] as HTMLElement,
    tileUpdatePeriodMinus: elements['tileUpdatePeriodMinus'] as HTMLElement,
    boardWidth: elements['boardWidth'] as HTMLElement,
    boardWidthMinus: elements['boardWidthMinus'] as HTMLElement,
    boardHeight: elements['boardHeight'] as HTMLElement,
    boardHeightMinus: elements['boardHeightMinus'] as HTMLElement
  }
}

const SetElementVisibility = (element: HTMLElement, visible: boolean): void => {
  if (visible) {
    element.classList.remove('hide')
  } else {
    element.classList.add('hide')
  }
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

const CyclicCounterManager = (
  min: number,
  max: number,
  defaultValue: number,
  increment: number,
  name: keyof Elements,
  onChangeCallback: (value: number) => void
) => {
  const minusElement = elements[
    (name + 'Minus') as keyof Elements
  ] as HTMLElement
  const plusElement = elements[name] as HTMLElement // also display element

  const storageKey = localStorageKeys[name as keyof LocalStorageKeys] as string

  const Initialise = () => {
    plusElement.textContent = GetLocalStorageItem(
      storageKey,
      String(defaultValue)
    )
    onChangeCallback(defaultValue)
  }
  Initialise()

  resetStorageCallbackHandler.addCallback(Initialise)

  const CycleCounter = (increment: number) => {
    let value = Number(plusElement.textContent)
    value += increment
    if (value < min) {
      value = max
    } else if (value > max) {
      value = min
    }

    const valueStr = String(value)
    plusElement.textContent = valueStr
    localStorage.setItem(storageKey, valueStr)
    onChangeCallback(value)
  }

  plusElement.onclick = () => CycleCounter(increment)
  minusElement.onclick = () => CycleCounter(-increment)
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
    const botDepth = Number(elements.botDepth.textContent)
    return NewPlayerBot(botDepth)
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

const resetStorageCallbackHandler = NewCallbackHandler()

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
    const width: number = Number(elements.boardWidth.textContent)
    const height: number = Number(elements.boardHeight.textContent)

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

  CyclicCounterManager(1, 16, 8, 1, 'botDepth', () => {})
  CyclicCounterManager(3, 9, 5, 1, 'boardWidth', () => {})
  CyclicCounterManager(3, 9, 5, 1, 'boardHeight', () => {})
  CyclicCounterManager(0, 2000, 500, 50, 'botWaitPeriod', game.SetBotWaitPeriod)
  CyclicCounterManager(
    0,
    2000,
    500,
    50,
    'tileUpdatePeriod',
    game.SetTileUpdatePeriod
  )

  InitialiseElementsPoweredByLocalStorage()
  RenderScoreRecords(game)

  resetStorageCallbackHandler.addCallback(
    InitialiseElementsPoweredByLocalStorage
  )
  resetStorageCallbackHandler.addCallback(() => RenderScoreRecords(game))

  elements.resetStorage.onclick = () => {
    localStorage.clear()
    resetStorageCallbackHandler.triggerCallbacks()
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

  const tilesInOneAxis: number = Math.max(width, height)
  const boardSize: number = 340
  const tileGapRatio: number = 10 / 60
  const tileFontRatio: number = 28 / 60
  const tileBorderRadiusRatio: number = 8 / 60
  const tileSize: number = Math.round(
    boardSize / (tilesInOneAxis + tileGapRatio * (tilesInOneAxis - 1))
  )
  const gapSize: number = Math.round(tileSize * tileGapRatio)
  const fontSize: number = Math.round(tileSize * tileFontRatio)
  const borderRadius: number = Math.round(tileSize * tileBorderRadiusRatio)

  // console.log({
  //   width,
  //   height,
  //   tilesInOneAxis,
  //   boardSize,
  //   tileGapRatio,
  //   tileSize,
  //   gapSize,
  //   fontSize,
  //   borderRadius
  // })

  const gridTemplate: string = `repeat(${tilesInOneAxis}, ${tileSize}px)`
  elements.board.style.gridTemplateColumns = gridTemplate
  elements.board.style.gridTemplateRows = gridTemplate
  elements.board.style.gap = `${gapSize}px`

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
      tileElement.style.width = `${tileSize}px`
      tileElement.style.height = `${tileSize}px`
      tileElement.style.fontSize = `${fontSize}px`
      tileElement.style.borderRadius = `${borderRadius}px`

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
