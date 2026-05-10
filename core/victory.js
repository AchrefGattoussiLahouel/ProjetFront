import { gameState } from "./gameState.js";

export function checkVictory() {
    const counts = { 1: 0, 2: 0 };
    for (let r = 0; r < gameState.board.length; r++) {
        for (let c = 0; c < gameState.board[r].length; c++) {
            const owner = gameState.board[r][c].owner;
            if (owner === 1) counts[1]++;
            else if (owner === 2) counts[2]++;
        }
    }

    const sz = (gameState && gameState.board && gameState.board.length) ? gameState.board.length : (gameState.size || 8);
    const majority = Math.floor((sz * sz) / 2) + 1;
    if (counts[1] >= majority) return 1;
    if (counts[2] >= majority) return 2;

    const aliveUnits = gameState.units.filter(u => u.alive);
    const p1 = aliveUnits.filter(u => u.player === 1).length;
    const p2 = aliveUnits.filter(u => u.player === 2).length;

    if (p1 === 0 && p2 > 0) return 2;
    if (p2 === 0 && p1 > 0) return 1;

    return null;
}
