// npx webpack --mode production

import { BUILD_TIME } from './build_time'
import { NewGame } from './game'
import { FormatDate } from './utils'

const Main = async () => {
  console.log('Color Wars', { buildTime: FormatDate(BUILD_TIME) })

  const width: number = 5
  const height: number = 5
  const animationPeriod: number = 250 // milliseconds
  const game = NewGame(width, height, animationPeriod)

  await game.MakePlayerMove(2, 2)
  game.LogBoard()
  await game.MakePlayerMove(1, 1)
  game.LogBoard()
  await game.MakePlayerMove(2, 2)
  game.LogBoard()
}

Main()
