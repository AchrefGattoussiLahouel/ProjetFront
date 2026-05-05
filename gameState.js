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
            content: null,
            used: false,
            units: []
        };

        if (r <= 1) {
            cell.zone = "zone-j1";
        }
        else if (r >= size - 2) {
            cell.zone = "zone-j2";
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