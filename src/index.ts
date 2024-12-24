// npx webpack --mode production

import { CreateBot, GameBot } from './bot_cpp'
import { BUILD_TIME } from './build_time'
import { InitialiseElementEvents } from './dom'
import { CreateGame } from './game'
import { Game } from './types'
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
