// npx webpack --mode production

import { CreateBot, GameBot } from './bot/main'
import { BUILD_TIME } from './build_time'
import { InitialiseElementEvents } from './dom/main'
import { CreateGame } from './game/main'
import { Game } from './game/types'
import { FormatDate } from './utils'

const Main = async () => {
  console.log('Color Wars', { buildTime: FormatDate(BUILD_TIME) })

  const width: number = 5
  const height: number = 5
  const animationPeriod: number = 500 // milliseconds
  const botWaitPeriod: number = 500 // milliseconds
  const game: Game = CreateGame(width, height, animationPeriod, botWaitPeriod)
  const bot: GameBot = CreateBot()

  InitialiseElementEvents(game, bot)
}

Main()
