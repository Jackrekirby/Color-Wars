/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/build_time.ts":
/*!***************************!*\
  !*** ./src/build_time.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.BUILD_TIME = void 0;\nexports.BUILD_TIME = new Date('2024-12-17T21:44:17.931Z');\n\n\n//# sourceURL=webpack:///./src/build_time.ts?");

/***/ }),

/***/ "./src/game.ts":
/*!*********************!*\
  !*** ./src/game.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.NewGame = void 0;\nconst types_1 = __webpack_require__(/*! ./types */ \"./src/types.ts\");\nconst utils_1 = __webpack_require__(/*! ./utils */ \"./src/utils.ts\");\n// GAME\nconst LOCAL_STORAGE_SCORE_RECORDS = 'score_records';\nconst NewScoreRecord = (round, scores) => {\n    return { round, scores };\n};\nconst NewPlayerUser = (name = 'User') => {\n    return { type: types_1.PlayerType.User, name };\n};\nconst NewPlayerBot = (searchDepth) => {\n    return { type: types_1.PlayerType.Bot, searchDepth };\n};\nconst IsPlayerUser = (player) => {\n    return player.type === types_1.PlayerType.User;\n};\nconst IsPlayerBot = (player) => {\n    return player.type === types_1.PlayerType.Bot;\n};\nconst PlayerToIdentifier = (player) => {\n    if (IsPlayerUser(player)) {\n        return `${player.name}`;\n    }\n    else if (IsPlayerBot(player)) {\n        return `Bot[${player.searchDepth}]`;\n    }\n    throw Error(`PlayerToIdentifier(${player}) not implemented`);\n};\nconst NewTile = (dots, player) => {\n    return { dots, player };\n};\nconst NewGame = (width, height, animationPeriod) => {\n    const tiles = [];\n    let round = 0;\n    let hasGameEnded = false;\n    const players = [NewPlayerUser(), NewPlayerUser()];\n    const InitialiseGame = () => {\n        for (let y = 0; y < height; y++) {\n            for (let x = 0; x < width; x++) {\n                tiles.push(NewTile(0, 0));\n            }\n        }\n    };\n    InitialiseGame();\n    const GetCurrentPlayerIndex = () => {\n        return round % 2;\n    };\n    const IsValidTilePosition = (x, y) => {\n        return !(x < 0 || x >= width || y < 0 || y >= height);\n    };\n    const GetOptionalTile = (x, y) => {\n        if (!IsValidTilePosition(x, y)) {\n            return null;\n        }\n        return tiles[x + y * width];\n    };\n    const GetTile = (x, y) => {\n        if (!IsValidTilePosition(x, y)) {\n            throw Error(`GetTile(${x}, ${y}) invalid position`);\n        }\n        return tiles[x + y * width];\n    };\n    const SetTile = (x, y, tile) => {\n        if (!IsValidTilePosition(x, y)) {\n            throw Error(`SetTile(${x}, ${y}) invalid position`);\n        }\n        tiles[x + y * width] = tile;\n    };\n    const TakeOverTile = (x, y, player) => {\n        const tile = GetOptionalTile(x, y);\n        if (tile === null) {\n            return;\n        }\n        const dots = Math.min(tile.dots + 1, 4);\n        SetTile(x, y, NewTile(dots, tile.player));\n    };\n    const GetTileUpdateCallbacks = () => {\n        let callbacks = [];\n        for (let y = 0; y < height; y++) {\n            for (let x = 0; x < width; x++) {\n                const tile = GetTile(x, y);\n                if (tile.dots >= 4) {\n                    callbacks.push(() => {\n                        SetTile(x, y, NewTile(0, tile.player));\n                        TakeOverTile(x + 1, y, tile.player);\n                        TakeOverTile(x - 1, y, tile.player);\n                        TakeOverTile(x, y + 1, tile.player);\n                        TakeOverTile(x, y - 1, tile.player);\n                    });\n                }\n            }\n        }\n        return callbacks;\n    };\n    const UpdateTilesOneIteration = async () => {\n        const callbacks = GetTileUpdateCallbacks();\n        if (callbacks.length > 0) {\n            await (0, utils_1.Sleep)(animationPeriod);\n            for (const callback of callbacks) {\n                callback();\n            }\n            return true;\n        }\n        return false;\n    };\n    const UpdateTiles = async () => {\n        while (await UpdateTilesOneIteration()) { }\n    };\n    const GetPlayerScores = () => {\n        let score = [0, 0]; // player 1, player 2\n        for (let y = 0; y < height; y++) {\n            for (let x = 0; x < width; x++) {\n                const tile = GetTile(x, y);\n                score[tile.player] += tile.dots;\n            }\n        }\n        return score;\n    };\n    const UpdateGameIteration = () => {\n        const playerScores = GetPlayerScores();\n        const _hasGameEnded = round >= 2 && playerScores.some(score => score === 0);\n        if (_hasGameEnded) {\n            UpdateScoreRecords(playerScores);\n            hasGameEnded = true;\n        }\n        if (hasGameEnded) {\n            return;\n        }\n        round++;\n    };\n    const UpdateScoreRecords = (playerScores) => {\n        const playersIdentifer = players\n            .map(player => PlayerToIdentifier(player))\n            .join(' Vs ');\n        const scoreRecordString = localStorage.getItem(LOCAL_STORAGE_SCORE_RECORDS);\n        const scoreRecords = scoreRecordString === null ? {} : JSON.parse(scoreRecordString);\n        if (!scoreRecords[playersIdentifer]) {\n            scoreRecords[playersIdentifer] = {};\n        }\n        let previousScoreRecord = scoreRecords[playersIdentifer] || NewScoreRecord(0, [0, 0]);\n        let doUpdateRecord = false;\n        if (players.some(IsPlayerUser) && players.some(IsPlayerBot)) {\n            const playerIndexOfUser = players.findIndex(IsPlayerUser);\n            const playerIndexOfBot = players.findIndex(IsPlayerBot);\n            const didUserWin = playerScores[playerIndexOfUser] > playerScores[playerIndexOfBot];\n            const hasUserWon = previousScoreRecord.scores[playerIndexOfUser] >\n                previousScoreRecord.scores[playerIndexOfBot];\n            // update record if user has won and won in fewer rounds OR\n            // if user has never won and lasted more rounds before losing\n            doUpdateRecord =\n                (didUserWin &&\n                    (round < previousScoreRecord.round ||\n                        previousScoreRecord.round == 0)) ||\n                    (!didUserWin && !hasUserWon && round > previousScoreRecord.round);\n        }\n        else {\n            // if user vs user or bot vs bot just record latest score\n            doUpdateRecord = false;\n        }\n        if (doUpdateRecord) {\n            scoreRecords[playersIdentifer] = NewScoreRecord(round, playerScores);\n            localStorage.setItem(LOCAL_STORAGE_SCORE_RECORDS, JSON.stringify(scoreRecords));\n        }\n    };\n    const MakePlayerMove = async (x, y) => {\n        const tile = GetTile(x, y);\n        const currentPlayerIndex = GetCurrentPlayerIndex();\n        let didPlayerMove = false;\n        if (tile.dots > 0 && tile.player === currentPlayerIndex) {\n            const dots = Math.min(tile.dots + 1, 4);\n            SetTile(x, y, NewTile(dots, currentPlayerIndex));\n            await UpdateTiles();\n            UpdateGameIteration();\n            didPlayerMove = true;\n        }\n        else if (tile.dots === 0 && round < 2) {\n            SetTile(x, y, NewTile(3, currentPlayerIndex));\n            UpdateGameIteration();\n            didPlayerMove = true;\n        }\n        return didPlayerMove;\n    };\n    const LogBoard = () => {\n        const red = '\\x1b[31m';\n        const green = '\\x1b[32m';\n        const reset = '\\x1b[0m'; // Resets the color back to default\n        let boardStr = '';\n        for (let y = 0; y < height; y++) {\n            for (let x = 0; x < width; x++) {\n                const tile = GetTile(x, y);\n                if (tile.dots === 0) {\n                    boardStr += '# ';\n                }\n                else {\n                    boardStr += tile.player === types_1.PlayerIndex.One ? red : green;\n                    boardStr += tile.dots + reset + ' ';\n                }\n            }\n            boardStr += '\\n';\n        }\n        console.log(boardStr);\n    };\n    const GetWidth = () => {\n        return width;\n    };\n    const GetHeight = () => {\n        return height;\n    };\n    const GetTiles = () => {\n        return tiles;\n    };\n    const GetRound = () => {\n        return round;\n    };\n    const GetHasGameEnded = () => {\n        return hasGameEnded;\n    };\n    const GetPlayers = () => {\n        return players;\n    };\n    return {\n        MakePlayerMove,\n        GetWidth,\n        GetHeight,\n        GetTiles,\n        GetRound,\n        GetHasGameEnded,\n        GetPlayers,\n        LogBoard\n    };\n};\nexports.NewGame = NewGame;\n\n\n//# sourceURL=webpack:///./src/game.ts?");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\n// npx webpack --mode production\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst build_time_1 = __webpack_require__(/*! ./build_time */ \"./src/build_time.ts\");\nconst game_1 = __webpack_require__(/*! ./game */ \"./src/game.ts\");\nconst utils_1 = __webpack_require__(/*! ./utils */ \"./src/utils.ts\");\nconst Main = async () => {\n    console.log('Color Wars', { buildTime: (0, utils_1.FormatDate)(build_time_1.BUILD_TIME) });\n    const width = 5;\n    const height = 5;\n    const animationPeriod = 250; // milliseconds\n    const game = (0, game_1.NewGame)(width, height, animationPeriod);\n    await game.MakePlayerMove(2, 2);\n    game.LogBoard();\n    await game.MakePlayerMove(1, 1);\n    game.LogBoard();\n    await game.MakePlayerMove(2, 2);\n    game.LogBoard();\n};\nMain();\n\n\n//# sourceURL=webpack:///./src/index.ts?");

/***/ }),

/***/ "./src/types.ts":
/*!**********************!*\
  !*** ./src/types.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.PlayerType = exports.PlayerIndex = void 0;\nvar PlayerIndex;\n(function (PlayerIndex) {\n    PlayerIndex[PlayerIndex[\"One\"] = 0] = \"One\";\n    PlayerIndex[PlayerIndex[\"Two\"] = 1] = \"Two\";\n})(PlayerIndex || (exports.PlayerIndex = PlayerIndex = {}));\nvar PlayerType;\n(function (PlayerType) {\n    PlayerType[PlayerType[\"User\"] = 0] = \"User\";\n    PlayerType[PlayerType[\"Bot\"] = 1] = \"Bot\";\n})(PlayerType || (exports.PlayerType = PlayerType = {}));\n\n\n//# sourceURL=webpack:///./src/types.ts?");

/***/ }),

/***/ "./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.Sleep = exports.FormatDate = void 0;\nconst FormatDate = (date) => {\n    const pad = (num) => (num < 10 ? '0' + num : num.toString());\n    const day = pad(date.getDate());\n    const month = pad(date.getMonth() + 1);\n    const year = date.getFullYear().toString();\n    const hours = pad(date.getHours());\n    const minutes = pad(date.getMinutes());\n    return `${year}-${month}-${day} ${hours}:${minutes}`;\n};\nexports.FormatDate = FormatDate;\nconst Sleep = (ms) => {\n    return new Promise(resolve => setTimeout(resolve, ms));\n};\nexports.Sleep = Sleep;\n\n\n//# sourceURL=webpack:///./src/utils.ts?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;