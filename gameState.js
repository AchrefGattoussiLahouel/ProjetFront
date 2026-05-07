export const size = 8;

export const gameState = {
    board: [],
    units: [],          // all units in the game
    unitIdCounter: 0,   // increments each time we create a unit
    currentPlayer: 1,
    phase: 'placement', // 'placement' | 'buy' | 'movement' | 'action' | 'end'
    turn: 1,
    selected: null,     // selected unit id
    highlighted: [],    // array of {r,c} for UI highlighting valid moves
    startedRoll: false, // whether the initial dice roll was done
    turnRolls: { 1: null, 2: null },
    requireTurnRolls: false,
    // which player started the placement phase (set after initial roll)
    placementStarter: null,
    tempRolls: { 1: null, 2: null },
    players: [
        { id:1, gold:50, cells:[], units:[], placed:0, availablePieces: { Soldat:3, Cavalier:1, Tank:1 } },
        { id:2, gold:50, cells:[], units:[], placed:0, availablePieces: { Soldat:3, Cavalier:1, Tank:1 } },
    ]
};

export const STARTING_UNITS = 5;

export function initBoard() {

for (let r = 0; r < size; r++) {
    gameState.board[r] = [];

    for (let c = 0; c < size; c++) {

        let cell = {
            zone: "neutral",
            owner: null,
            content: null,
            used: false,
            units: []
        };

        if (r <= 1) {
            // mark as player 1's placement zone, but do NOT mark as captured
            cell.zone = "zone-j1";
            // owner remains null so initial captured count is 0
        }
        else if (r >= size - 2) {
            // mark as player 2's placement zone, but do NOT mark as captured
            cell.zone = "zone-j2";
            // owner remains null so initial captured count is 0
        }
        else {
            const rand = Math.random();

            if (rand < 0.1) {
                cell.content = { type: "bonus", subtype: "atk" };
            }
            else if (rand < 0.2) {
                cell.content = { type: "bonus", subtype: "def" };
            }
            else if (rand < 0.3) {
                cell.content = { type: "trap" };
            }
        }

        gameState.board[r][c] = cell;
    }
}


}

export const UNIT_STATS = {
    Soldat:    { force: 2, move: 1, cost: 10, range: 1, health:50 },
    Cavalier:  { force: 1, move: 2, cost: 15, range: 1, health:30 },
    Tank:      { force: 3, move: 1, cost: 25, range: 1, health:150 },
    Archer:    { force: 1, move: 1, cost: 20, range: 2, health:20 },
    Bombardier:{ force: 2, move: 1, cost: 40, range: 1, health:10 },
    Heros:     { force: 4, move: 2, cost: 100, range: 1, health:200 },
};

export function checkVictory() {
    // Count owned cells per player by owner property
    const counts = { 1: 0, 2: 0 };
    for (let r = 0; r < gameState.board.length; r++) {
        for (let c = 0; c < gameState.board[r].length; c++) {
            const owner = gameState.board[r][c].owner;
            if (owner === 1) counts[1]++;
            else if (owner === 2) counts[2]++;
        }
    }

    if (counts[1] >= 33) return 1;
    if (counts[2] >= 33) return 2;

    // Check remaining units for each player
    const aliveUnits = gameState.units.filter(u => u.alive);
    const p1 = aliveUnits.filter(u => u.player === 1).length;
    const p2 = aliveUnits.filter(u => u.player === 2).length;

    if (p1 === 0 && p2 > 0) return 2;
    if (p2 === 0 && p1 > 0) return 1;

    return null;
}