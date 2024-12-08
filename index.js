const incrementTile = (x, y, team) => {
    if (x < 0 || x >= 5 || y < 0 || y >= 5) {
        return
    }
    const tile = tiles[x + y * 5]
    let dots = Number(tile.textContent)

    dots = Math.min(dots + 1, 4)

    tile.textContent = dots

    tile.classList.remove('team1')
    tile.classList.remove('team2')
    tile.classList.add(team)
}

const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const updateBoard = () => {
    let updateCount = 0
    for (let i = 0; i < 25; i++) {
        const tile = tiles[i]
        const dots = Number(tile.textContent)
        let team = null
        if (dots >= 4) {
            updateCount++
            if (tile.classList.contains('team1')) {
                team = 'team1'
            } else {
                team = 'team2'
            }

            tile.textContent = ''
            // tile.classList.remove(team)

            const x = i % 5
            const y = Math.floor(i / 5)
            incrementTile(x + 1, y, team)
            incrementTile(x - 1, y, team)
            incrementTile(x, y + 1, team)
            incrementTile(x, y - 1, team)
        }
    }
    return updateCount > 0
}

const updateScoreRecords = winningTeam => {
    // only score user vs computer
    if (
        (team1UserElement.textContent === 'User' &&
            team2UserElement.textContent === 'User') ||
        (team1UserElement.textContent === 'Computer' &&
            team2UserElement.textContent === 'Computer')
    ) {
        return
    }
    const teamToPlay = `team${(gameIteration % 2) + 1}`
    const round = gameIteration

    // create high score for each computer depth and team
    // {userteam: {depth: [round, didWin]}}
    const scoreboard = JSON.parse(localStorage.getItem('scoreboard')) || {
        team1: {},
        team2: {}
    }
    if (!scoreboard[teamToPlay]) {
        scoreboard[teamToPlay] = {}
    }

    let [bestRound, hasWon] = scoreboard[teamToPlay][
        botDepthElement.textContent
    ] || [0, false]

    let userTeam = team1UserElement.textContent === 'User' ? 'team1' : 'team2'

    const didWin = teamToPlay == userTeam

    // console.log(
    //   "round, bestRound, didWin, hasWon, winningTeam, teamToPlay, winningTeam",
    //   round,
    //   bestRound,
    //   didWin,
    //   hasWon,
    //   teamToPlay,
    //   winningTeam,
    //   didWin && (round < bestRound || bestRound == 0),
    //   !didWin && !hasWon && round > bestRound
    // );
    if (
        (didWin && (round < bestRound || bestRound == 0)) ||
        (!didWin && !hasWon && round > bestRound)
    ) {
        let team = ''
        if (didWin) {
            botStatusElement.textContent = 'User Wins (New Lowest Round)'
        } else {
            botStatusElement.textContent = 'User Lost (New Highest Round)'
        }

        scoreboard[teamToPlay][botDepthElement.textContent] = [round, didWin]
        localStorage.setItem('scoreboard', JSON.stringify(scoreboard))
        renderScoreRecords()
    }
}

const renderScoreRecords = () => {
    const scoreboard = JSON.parse(localStorage.getItem('scoreboard')) || {
        team1: {},
        team2: {}
    }

    const scoreboardElement = document.getElementById('scoreboard')
    scoreboardElement.innerHTML = ''

    if (
        Object.keys(scoreboard['team1']).length === 0 &&
        Object.keys(scoreboard['team2']).length === 0
    ) {
        scoreboardElement.innerHTML = 'No records'
        return
    }

    const div = document.createElement('div')
    div.className = 'record'
    div.innerHTML = `<div>Players</div><div>State</div><div>Round</div>`
    scoreboardElement.appendChild(div)

    for (let depth in scoreboard['team1']) {
        const [bestRound, hasWon] = scoreboard['team1'][depth]
        const div = document.createElement('div')
        div.className = 'record'
        div.innerHTML = `<div>User Vs Bot [${depth}]</div><div>${hasWon ? 'won' : 'lost'
            }</div><div>${bestRound}</div>`
        scoreboardElement.appendChild(div)
    }

    for (let depth in scoreboard['team2']) {
        const [bestRound, hasWon] = scoreboard['team2'][depth]
        const div = document.createElement('div')
        div.className = 'record'
        div.innerHTML = `<div>Bot [${depth}] Vs User</div></div><div>${hasWon ? 'won' : 'lost'
            }</div><div>${bestRound}</div>`
        scoreboardElement.appendChild(div)
    }
}

const updateGameIteration = (firstLoad = false) => {
    if (gameIteration == -1) {
        botStatusElement.textContent = ''
    }
    const [score1, score2] = scoreBoard()
    if (gameIteration >= 2) {
        if (score2 == 0) {
            botStatusElement.textContent = 'Player One Wins!'
            updateScoreRecords('team1')
            hasGameEnded = true
        } else if (score1 == 0) {
            botStatusElement.textContent = 'Player Two Wins!'
            updateScoreRecords('team2')
            hasGameEnded = true
        }
    }
    if (hasGameEnded) {
        return
    }
    gameIteration++
    iterationElement.textContent = `Round ${gameIteration} Score ${score1}/${score2}`
    updateTeamBackground()
    if (gameIteration == 0 && !firstLoad) {
        requestAnimationFrame(() => {
            makeComputerMove()
        })
    }
}

const getTeamToPlay = () => {
    const teamToPlay = `team${(gameIteration % 2) + 1}`
    return teamToPlay
}
const getTeamNumToPlay = () => {
    return (gameIteration % 2) + 1
}

const updateTeamBackground = () => {
    const teamToPlay = getTeamToPlay()
    if (teamToPlay == 'team1') {
        botStatusElement.style.backgroundColor = 'hsla(0, 100%, 50%, 1)'
    } else {
        botStatusElement.style.backgroundColor = 'hsla(105, 100%, 50%, 1)'
    }
}

const makeComputerMove = async () => {
    if (animating || hasGameEnded) {
        return
    }
    // console.log("makeComputerMove");

    const teamToPlay = getTeamToPlay()
    const teamNumToPlay = getTeamNumToPlay()
    // console.log(teamToPlay, teamNumToPlay, gameIteration);
    if (
        (teamToPlay == 'team1' && team1UserElement.textContent === 'User') ||
        (teamToPlay == 'team2' && team2UserElement.textContent === 'User')
    ) {
        return
    }
    animating = true

    botStatusElement.textContent = `Bot ${teamNumToPlay} thinking...`

    const startTime = performance.now()
    const board = []
    for (let i = 0; i < 25; i++) {
        const tile = tiles[i]
        let teamOfTile = 0
        if (tile.classList.contains('team1')) {
            teamOfTile = 0
        } else if (tile.classList.contains('team2')) {
            teamOfTile = 1
        }
        const dots = Number(tile.textContent)
        board.push(dots, teamOfTile)
    }
    // console.log(board);

    // wait until the next frame to allow the UI to update
    requestAnimationFrame(async () => {
        callRunProgram(
            board,
            teamNumToPlay - 1,
            Number(botDepthElement.textContent),
            async (result) => {
                let [hasResult, x, y] = result
                const endTime = performance.now()
                const elapsedTime = endTime - startTime
                // console.log(elapsedTime);
                if (elapsedTime < 250) {
                    // console.log("sleep", 250 - elapsedTime);
                    await sleep(250 - elapsedTime)
                }

                console.log('hasResult, x, y', hasResult, x, y)
                if (hasResult) {
                    const ii = x + y * 5
                    await makeMove(tiles[ii])

                    if (hasGameEnded) {
                        return
                    }
                    botStatusElement.textContent = `Bot ${teamNumToPlay} took ${(
                        elapsedTime / 1000
                    ).toFixed(1)}s`
                }

                animating = false

                if (hasResult) {
                    makeComputerMove()
                }
            }
        )
    })
}

const makeMove = async tile => {
    let teamOfTile = null
    if (tile.classList.contains('team1')) {
        teamOfTile = 'team1'
    } else if (tile.classList.contains('team2')) {
        teamOfTile = 'team2'
    }

    const teamToPlay = getTeamToPlay()
    let didPlayerMove = false

    if (teamOfTile !== null && teamToPlay === teamOfTile) {
        let dots = Number(tile.textContent)
        dots = Math.min(dots + 1, 4)
        tile.textContent = dots

        for (let tile1 of tiles) {
            tile1.classList.remove('lastMove')
        }
        tile.classList.add('lastMove')

        await sleep(250)
        while (updateBoard()) {
            await sleep(250)
        }
        updateGameIteration()
        didPlayerMove = true
    } else if (teamOfTile === null && gameIteration < 2) {
        tile.textContent = 3
        tile.classList.add(`team${gameIteration + 1}`)
        for (let tile1 of tiles) {
            tile1.classList.remove('lastMove')
        }
        tile.classList.add('lastMove')
        updateGameIteration()
        didPlayerMove = true
    }
    return didPlayerMove
}

const makeUserMove = async tile => {
    if (animating || hasGameEnded) {
        return
    }
    // console.log("makeUserMove");
    animating = true

    const didPlayerMove = await makeMove(tile)

    animating = false

    if (didPlayerMove) {
        makeComputerMove()
    }
}

const generateBoard = () => {
    // Generate the grid with random numbers
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div')
        tile.className = 'tile'
        const dots = 0
        tile.textContent = dots == 0 ? '' : dots
        // tile.textContent = i
        if (dots > 0) {
            const team = `team${Math.round(Math.random()) + 1}`
            tile.classList.add(team)
        }


        const randomColor = `hsl(30, 3%, ${Math.floor(Math.random() * 6) + 23}%)`; // Random HSL color
        tile.style.backgroundColor = randomColor;


        tile.onclick = () => makeUserMove(tile)

        gridElement.appendChild(tile)
        tiles.push(tile)
    }
}

const scoreBoard = () => {
    if (gameIteration < 1) {
        return [0, 0]
    }
    let team1Score = 0
    let team2Score = 0
    for (let i = 0; i < 25; i++) {
        const tile = tiles[i]
        const dots = Number(tile.textContent)
        if (tile.classList.contains('team1')) {
            team1Score += dots
        } else if (tile.classList.contains('team2')) {
            team2Score += dots
        }
    }
    return [team1Score, team2Score]
}

function callRunProgram(array, team, depth, callback) {
    if (!wasmInitialized) {
        console.error(
            'WASM not initialized yet. Wait for initialization to complete.'
        )
        return
    }

    // Call the Go function exposed globally
    result = runProgram(array, team, depth)
    callback(result)
}

const initialiseSettings = () => {
    // set team1UserElement based on local storage
    if (localStorage.getItem('team1User') === null) {
        localStorage.setItem('team1User', 'Computer')
    } else {
        team1UserElement.textContent = localStorage.getItem('team1User')
    }

    // set team2UserElement based on local storage
    if (localStorage.getItem('team2User') === null) {
        localStorage.setItem('team2User', 'User')
    } else {
        team2UserElement.textContent = localStorage.getItem('team2User')
    }

    // set botDepthElement based on local storage
    if (localStorage.getItem('botDepth') === null) {
        localStorage.setItem('botDepth', '8')
    } else {
        botDepthElement.textContent = localStorage.getItem('botDepth')
    }

    settingsElement.onclick = () => {
        settingsPanelElement.classList.toggle('hide')
        gameScreenElement.classList.toggle('hide')
    }

    team1UserElement.onclick = () => {
        team1UserElement.textContent =
            team1UserElement.textContent === 'User' ? 'Computer' : 'User'

        localStorage.setItem('team1User', team1UserElement.textContent)
    }

    team2UserElement.onclick = () => {
        team2UserElement.textContent =
            team2UserElement.textContent === 'User' ? 'Computer' : 'User'

        localStorage.setItem('team2User', team2UserElement.textContent)
    }

    botDepthElement.onclick = () => {
        let depth = Number(botDepthElement.textContent)
        depth = (depth + 1) % 20
        if (depth === 0) {
            depth = 1
        }
        botDepthElement.textContent = depth
        localStorage.setItem('botDepth', depth)
    }

    newGameElement.onclick = () => {
        gameIteration = -1
        hasGameEnded = false

        for (let tile of tiles) {
            tile.textContent = ''
            tile.classList.remove('team1')
            tile.classList.remove('team2')
            tile.classList.remove('lastMove')
        }
        animating = false

        settingsPanelElement.classList.toggle('hide')
        gameScreenElement.classList.toggle('hide')
        // botStatusElement.innerHTML = "Make first move for bot";

        updateGameIteration()
    }

    resetStorageElement.onclick = () => {
        localStorage.clear()
        renderScoreRecords()
        initialiseSettings()
    }
}

const resetStorageOnVersionChange = () => {
    if (localStorage.getItem('version') !== VERSION) {
        console.log('Version changed, resetting storage')
        localStorage.clear()
        localStorage.setItem('version', VERSION)
    }
}

const initialiseGo = () => {
    const go = new Go()
    WebAssembly.instantiateStreaming(
        fetch('main.wasm'),
        go.importObject
    ).then(result => {
        go.run(result.instance)
        wasmInitialized = true
        console.log('WASM initialized, you can now call runProgram.')
    })
}

// MAIN

console.log('color wars: initialise')

const gridElement = document.getElementById('grid')
const iterationElement = document.getElementById('gameIteration')
const botStatusElement = document.getElementById('botStatus')
const settingsElement = document.getElementById('settings')
const settingsPanelElement = document.getElementById('settingsPanel')
const gameScreenElement = document.getElementById('gameScreen')
const team1UserElement = document.getElementById('team1User')
const team2UserElement = document.getElementById('team2User')
const botDepthElement = document.getElementById('botDepth')
const newGameElement = document.getElementById('newGame')
const resetStorageElement = document.getElementById('resetStorage')

let gameIteration = -1
let animating = true
let wasmInitialized = false
let hasGameEnded = false
const VERSION = '1' // if version changes, reset storage
const tiles = []

resetStorageOnVersionChange()

initialiseGo()
initialiseSettings()
updateGameIteration(true)
generateBoard()
updateTeamBackground()
renderScoreRecords()
animating = false
console.log('color wars: loaded')