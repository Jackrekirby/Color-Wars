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
        (team1UserElement.textContent !== 'User' &&
            team2UserElement.textContent !== 'User')
    ) {
        return
    }
    let userTeam = team1UserElement.textContent === 'User' ? 'team1' : 'team2'
    const teamToPlay = `team${(gameIteration % 2) + 1}`
    const round = gameIteration

    // create high score for each computer depth and team
    // {userteam: {depth: [round, didWin]}}
    const scoreboard = JSON.parse(localStorage.getItem('scoreboard')) || {
        team1: {},
        team2: {}
    }
    if (!scoreboard[userTeam]) {
        scoreboard[userTeam] = {}
    }

    let [bestRound, hasWon] = scoreboard[userTeam][
        botDepthElement.textContent
    ] || [0, false]

    // let userTeam = team1UserElement.textContent === 'User' ? 'team1' : 'team2'

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

        scoreboard[userTeam][botDepthElement.textContent] = [round, didWin]
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
        teamElapsedTimes = [0, 0]
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

const addLeadingZeros = (num, totalLength) => {
    return num.toString().padStart(totalLength, '0');
}

const millisToMMSS = (millis) => {
    totalSeconds = Math.floor(millis / 1000)
    minutes = Math.floor(totalSeconds / 60)
    seconds = totalSeconds % 60
    return `${addLeadingZeros(minutes, 2)}:${addLeadingZeros(seconds, 2)}`
}

const updateTeamElapsedTime = () => {
    if (hasGameEnded) {
        return
    }
    const now = performance.now()
    teamElapsedTimes[gameIteration % 2] += now - gameIterationStartTime
    gameIterationStartTime = now
    // console.log('teamElapsedTimes', teamElapsedTimes)

    gameTimerElement.textContent = millisToMMSS(teamElapsedTimes[0]) + ' - ' + millisToMMSS(teamElapsedTimes[1])

    requestAnimationFrame(updateTeamElapsedTime)
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

const makeComputerMove_GoBot = (dryRun = false) => {

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

    const teamNumToPlay = getTeamNumToPlay()

    // wait until the next frame to allow the UI to update
    requestAnimationFrame(async () => {
        const startTime = performance.now()
        callRunProgram(
            board,
            teamNumToPlay - 1,
            Number(botDepthElement.textContent),
            async (result) => {
                let [hasResult, x, y] = result
                const endTime = performance.now()
                const elapsedTime = endTime - startTime
                // console.log(elapsedTime);
                if (elapsedTime < botMinPlayPeriod) {
                    // console.log("sleep", 250 - elapsedTime);
                    await sleep(botMinPlayPeriod - elapsedTime)
                }
                if (hasResult) {
                    console.log('[go.]', { x, y, t: elapsedTime.toFixed(0) })
                } else {
                    console.log('[go.]', { failed: 'failed', t: elapsedTime.toFixed(0) })
                }

                if (dryRun) {
                    return
                }
                // console.log('hasResult, x, y', hasResult, x, y)
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


const makeComputerMove_CppBot = () => {
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
        board.push(teamOfTile, dots)
    }
    // RenderCppBoard(board)
    // console.log(board);

    const teamNumToPlay = getTeamNumToPlay()

    // wait until the next frame to allow the UI to update
    requestAnimationFrame(async () => {
        const startTime = performance.now()
        const team = teamNumToPlay - 1;
        const depth = Number(botDepthElement.textContent);

        const result = MiniMax(team, depth, board);

        const endTime = performance.now()
        const elapsedTime = endTime - startTime
        // console.log(elapsedTime);
        if (elapsedTime < botMinPlayPeriod) {
            // console.log("sleep", 250 - elapsedTime);
            await sleep(botMinPlayPeriod - elapsedTime)
        }


        if (result) {
            const [x, y] = result
            console.log('[c++]', { x, y, t: elapsedTime.toFixed(0) })
            const ii = x + y * 5
            await makeMove(tiles[ii])

            if (hasGameEnded) {
                return
            }
            botStatusElement.textContent = `C++ Bot ${teamNumToPlay} took ${(
                elapsedTime / 1000
            ).toFixed(1)}s`
        }

        animating = false

        if (result) {
            makeComputerMove()
        }

    })
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

    const startTime = performance.now()
    const startStr = `Bot ${teamNumToPlay} thinking...`
    const animationFrame = () => {

        if (botStatusElement.textContent.startsWith(startStr)) {
            botStatusElement.textContent = `${startStr} (${((performance.now() - startTime) / 1000).toFixed(2)}s)`
            requestAnimationFrame(animationFrame)
        }
    }
    botStatusElement.textContent = startStr
    requestAnimationFrame(animationFrame)

    const bot = [team1UserElement.textContent, team2UserElement.textContent][gameIteration % 2]
    // console.log('bot', teamToPlay, bot)
    if (bot == 'Go Bot') {
        makeComputerMove_GoBot()
    } else {
        // makeComputerMove_GoBot(true)
        makeComputerMove_CppBot()
    }

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

        await sleep(boardAnimationPeriod)
        while (updateBoard()) {
            await sleep(boardAnimationPeriod)
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
    // const initBoard = [
    //     [0, 0], [1, 2], [1, 1], [0, 1], [0, 1],
    //     [1, 1], [1, 1], [0, 0], [1, 2], [0, 2],
    //     [1, 1], [1, 1], [1, 2], [1, 3], [1, 3],
    //     [0, 0], [1, 2], [1, 2], [0, 0], [1, 2],
    //     [0, 0], [0, 0], [1, 1], [1, 2], [0, 0],
    // ]
    // Generate the grid with random numbers
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div')
        tile.className = 'tile'
        const dots = 0; //initBoard[i][1]
        const team = 0; // initBoard[i][0]
        tile.textContent = dots == 0 ? '' : dots
        const teamCls = `team${team + 1}`
        tile.classList.add(teamCls)

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
        localStorage.setItem('team1User', 'C++ Bot')
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

    const teamPlayers = ['User', 'Go Bot', 'C++ Bot']

    team1UserElement.onclick = () => {
        team1UserElement.textContent =
            teamPlayers[(teamPlayers.findIndex(item => item === team1UserElement.textContent) + 1) % teamPlayers.length]
        localStorage.setItem('team1User', team1UserElement.textContent)
    }

    team2UserElement.onclick = () => {
        team2UserElement.textContent =
            teamPlayers[(teamPlayers.findIndex(item => item === team2UserElement.textContent) + 1) % teamPlayers.length]
        localStorage.setItem('team2User', team2UserElement.textContent)
    }

    botDepthElement.onclick = () => {
        let depth = Number(botDepthElement.textContent)
        depth = (depth + 1) % 17
        if (depth === 0) {
            depth = 1
        }
        botDepthElement.textContent = depth
        localStorage.setItem('botDepth', depth)
    }
    botDepthMinusElement.onclick = () => {
        let depth = Number(botDepthElement.textContent)
        depth = (depth - 1) % 17
        if (depth === 0) {
            depth = 16
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
        console.log('Go WASM initialized')
    })
}

// CPP

// minimax-wrapper.js

let isWebAssemblyModuleInitialised = false;

const initialiseMiniMaxWebAssemblyModule = (callback) => {
    if (typeof Module === 'undefined') {
        console.error('Module is not defined. Ensure the WASM environment is properly set up.');
        return;
    }
    Module.onRuntimeInitialized = callback
}

const toCppBoard = (board) => {
    let cppBoard = ""
    for (let i = 0; i < 50; i += 2) {
        const team = board[i]
        const dots = board[i + 1]
        cppBoard += `{${team}, ${dots}}, `
        if ((i + 2) % 10 === 0) {
            cppBoard += '\n'
        }
    }
    console.log(cppBoard)
}

const MiniMax = (team, depth, board) => {
    // Create a pointer to a 'Board' structure in WASM memory
    const boardSize = 25 * 8; // 25 tiles, each 2 bytes (2 uint8)
    const boardPtr = Module._malloc(boardSize);
    const cppBoard = []

    for (let i = 0; i < 50; i += 2) {
        const team = board[i]
        const dots = board[i + 1]

        Module.setValue(boardPtr + (i), team, 'i8');
        Module.setValue(boardPtr + (i + 1), dots, 'i8');
    }

    // toCppBoard(board)

    // Wrap the `InitialiseMiniMax` function
    const InitialiseMiniMax = Module.cwrap('InitialiseMiniMax', 'number', [
        'number',
        'number',
        'number',
        'number',
    ]);

    // RenderCppBoard(board)

    // Call the function
    const result = InitialiseMiniMax(boardPtr, depth, gameIteration, team);

    // Free the allocated memory
    Module._free(boardPtr);

    // console.log('result', result)

    if (result < 0 || result >= 25) {
        console.error("Computer did not pick a move")
        return null
    } else {
        const x = result % 5;
        const y = Math.floor(result / 5);
        // console.log('Computer picked', x, y);
        return [x, y]
    }
}

const RenderCppBoard = (board) => {
    const red = '\x1b[31m';
    const green = '\x1b[32m';
    const reset = '\x1b[0m';  // Resets the color back to default

    let boardStr = ""
    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const i = (x + y * 5) * 2;
            const team = board[i];
            const dots = board[i + 1];
            if (dots === 0) {
                boardStr += "# "
            } else if (team === 0) {
                boardStr += red + dots + reset + " "
            } else {
                boardStr += green + dots + reset + " "
            }

        }
        boardStr += '\n'
    }
    console.log(boardStr);
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
const botDepthMinusElement = document.getElementById('botDepthMinus')
const newGameElement = document.getElementById('newGame')
const resetStorageElement = document.getElementById('resetStorage')
const gameTimerElement = document.getElementById('gameTimer')

const boardAnimationPeriod = 250; // milliseconds
const botMinPlayPeriod = 250; // milliseconds
let gameIteration = -1
let animating = true
let wasmInitialized = false
let hasGameEnded = false
let gameIterationStartTime = 0;
let teamElapsedTimes = [0, 0];
const VERSION = '1' // if version changes, reset storage
const tiles = []

resetStorageOnVersionChange()

initialiseMiniMaxWebAssemblyModule(() => {
    console.log('C++ WASM Initialised')
    isWebAssemblyModuleInitialised = true;
})

initialiseGo()
initialiseSettings()
updateGameIteration(true)
generateBoard()
updateTeamBackground()
renderScoreRecords()
updateTeamElapsedTime()
animating = false
console.log('color wars: loaded')