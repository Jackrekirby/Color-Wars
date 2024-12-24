// npx webpack --mode production

import { CreateBot, GameBot } from './bot/main'
import { BUILD_TIME } from './build_time'
import { InitialiseElementEvents } from './dom/main'
import { CreateGame } from './game/main'
import { Game } from './game/types'
import { FormatDate } from './utils'

const Main = async () => {
  console.log('Color Wars', { buildTime: FormatDate(BUILD_TIME) })

  const game: Game = CreateGame()
  const bot: GameBot = CreateBot()

  InitialiseElementEvents(game, bot)
}

Main()
