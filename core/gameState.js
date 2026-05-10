export const gameState = {
    board: [],
    units: [],
    unitIdCounter: 0,
    currentPlayer: 1,
    phase: 'placement',
    turn: 1,
    selected: null,
    highlighted: [],
    startRolls: { 1: null, 2: null },
    gameStarted: false,
    placementStarter: null,
    turnBonus: { 1: 0, 2: 0 },
    turnRolls: { 1: null, 2: null },
    requireTurnRolls: false,
    tempRolls: { 1: null, 2: null },
    players: [
        { id: 1, gold: 50, cells: [], units: [], placed: 0, availablePieces: { Soldat: 3, Cavalier: 1, Tank: 1 } },
        { id: 2, gold: 50, cells: [], units: [], placed: 0, availablePieces: { Soldat: 3, Cavalier: 1, Tank: 1 } },
    ],
};

gameState.size = 8;

export const trap_damage = 20;
export const STARTING_UNITS = 5;

export const UNIT_STATS = {
    Soldat: { force: 2, move: 1, cost: 10, range: 1, health: 50, armor: 0 },
    Cavalier: { force: 1, move: 2, cost: 15, range: 1, health: 30, armor: 0 },
    Tank: { force: 3, move: 1, cost: 25, range: 1, health: 150, armor: 20 },
    Archer: { force: 1, move: 1, cost: 20, range: 2, health: 20, armor: 0 },
    Bombardier: { force: 2, move: 1, cost: 40, range: 1, health: 60, armor: 0 },
    Heros: { force: 4, move: 2, cost: 100, range: 1, health: 200, armor: 10 },
};
