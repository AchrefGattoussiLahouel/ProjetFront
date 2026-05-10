import { gameState, STARTING_UNITS } from "../core/gameState.js";
import { createUnit } from "./unitFactory.js";

export function canPlaceUnit(player, r, c) {
    const cell = gameState.board[r][c];
    if (!cell) return false;
    if (player === 1 && cell.zone !== 'zone-j1') return false;
    if (player === 2 && cell.zone !== 'zone-j2') return false;
    if ((cell.units?.length || 0) > 0) {
        const otherUnit = cell.units
            .map(id => gameState.units.find(u => u.id === id))
            .find(u => u && u.player !== player);
        if (otherUnit) return false;
    }
    return true;
}

export function getPlacementCells(type, player) {
    const cells = [];
    for (let r = 0; r < gameState.board.length; r++) {
        for (let c = 0; c < gameState.board[r].length; c++) {
            const cell = gameState.board[r][c];
            if (player === 1 && cell.zone !== 'zone-j1') continue;
            if (player === 2 && cell.zone !== 'zone-j2') continue;
            if ((cell.units?.length || 0) > 0) continue;
            cells.push({ r, c });
        }
    }
    return cells;
}

export function placeInitialUnit(type, player, r, c) {
    if (gameState.phase !== 'placement') return { ok: false, reason: 'not-placement' };
    if (!gameState.gameStarted) return { ok: false, reason: 'need-start-rolls' };
    if (gameState.currentPlayer !== player) return { ok: false, reason: 'not-your-turn' };
    if (!canPlaceUnit(player, r, c)) return { ok: false, reason: 'invalid-cell' };

    createUnit(type, player, r, c);
    if (!gameState.placementStarter) gameState.placementStarter = player;

    const pl = gameState.players[player - 1];
    pl.placed = (pl.placed || 0) + 1;
    if (pl.availablePieces && typeof pl.availablePieces[type] === 'number') {
        pl.availablePieces[type] = Math.max(0, pl.availablePieces[type] - 1);
    }
    gameState.highlighted = [];

    const other = player === 1 ? 2 : 1;
    const bothPlaced = gameState.players.every(p => p.placed >= STARTING_UNITS);
    if (bothPlaced) {
        gameState.phase = 'movement';
        gameState.currentPlayer = gameState.placementStarter || player;

        for (let rr = 0; rr < gameState.board.length; rr++) {
            for (let cc = 0; cc < gameState.board[rr].length; cc++) {
                gameState.board[rr][cc].owner = null;
            }
        }

        gameState.players.forEach(p => p.cells = []);
        gameState.units.filter(u => u.alive).forEach(u => {
            const cell = gameState.board[u.row][u.col];
            cell.owner = u.player;
            const unitPlayer = gameState.players[u.player - 1];
            if (!unitPlayer.cells.some(x => x.r === u.row && x.c === u.col)) {
                unitPlayer.cells.push({ r: u.row, c: u.col });
            }
        });

        import('../actions/turn.js').then(m => m.startFirstTurnTimer());
        import('../actions/dice.js').then(m => m.startFirstTurnAutoRoll());
    } else {
        gameState.currentPlayer = other;
    }

    return { ok: true };
}
