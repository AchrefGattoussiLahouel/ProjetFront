import { gameState } from "../core/gameState.js";

let busy = false;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function manhattan(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c); }

export async function takeTurn() {
    if (busy) return;
    busy = true;
    try {
        await sleep(200 + Math.random() * 300);
        if (gameState.currentPlayer !== 2) return;

        if (gameState.phase === 'placement') {
            const pl = gameState.players[1];
            const types = Object.keys(pl.availablePieces || {}).filter(t => pl.availablePieces[t] > 0);
            if (types.length === 0) return;
            const type = types[0];
            const mod = await import('../units/unitPlacement.js');
            const cells = mod.getPlacementCells(type, 2);
            if (!cells || cells.length === 0) return;
            const center = { r: Math.floor((gameState.board.length - 1) / 2), c: Math.floor((gameState.board.length - 1) / 2) };
            cells.sort((a, b) => (manhattan(a, center) - manhattan(b, center)) || (a.r - b.r));
            const choice = cells[0];
            mod.placeInitialUnit(type, 2, choice.r, choice.c);
            await (await import('../render.js')).render();
            return;
        }

        if (gameState.phase === 'movement') {
            const mod = await import('../units/unitMovement.js');
            const myUnits = gameState.units.filter(u => u.alive && u.player === 2 && !u.hasMoved);
            const enemyUnits = gameState.units.filter(u => u.alive && u.player === 1);

            for (const u of myUnits) {
                const moves = mod.getValidMoves(u);
                if (!moves || moves.length === 0) continue;

                const attack = moves.find(m => m.attack);
                if (attack) {
                    await sleep(200 + Math.random() * 300);
                    const res = mod.moveUnit(u.id, attack.r, attack.c);
                    await (await import('../render.js')).render();
                    if (res && res.winner) {
                        if (window.showEndPopup) window.showEndPopup(res.winner);
                        return;
                    }
                    continue;
                }

                const capture = moves.find(m => {
                    const cell = gameState.board[m.r][m.c];
                    return cell && cell.owner !== 2;
                });
                if (capture) {
                    await sleep(200 + Math.random() * 250);
                    mod.moveUnit(u.id, capture.r, capture.c);
                    await (await import('../render.js')).render();
                    continue;
                }

                if (enemyUnits.length > 0) {
                    const nearest = enemyUnits.reduce((acc, e) => {
                        const d = manhattan({ r: u.row, c: u.col }, { r: e.row, c: e.col });
                        if (!acc || d < acc.d) return { e, d };
                        return acc;
                    }, null);
                    if (nearest) {
                        let best = moves[0];
                        let bestD = manhattan({ r: best.r, c: best.c }, { r: nearest.e.row, c: nearest.e.col });
                        for (const m of moves) {
                            const d = manhattan({ r: m.r, c: m.c }, { r: nearest.e.row, c: nearest.e.col });
                            if (d < bestD) {
                                best = m;
                                bestD = d;
                            }
                        }
                        await sleep(120 + Math.random() * 200);
                        mod.moveUnit(u.id, best.r, best.c);
                        await (await import('../render.js')).render();
                        continue;
                    }
                }

                const choice = moves[Math.floor(Math.random() * moves.length)];
                await sleep(120 + Math.random() * 180);
                mod.moveUnit(u.id, choice.r, choice.c);
                await (await import('../render.js')).render();
            }

            await sleep(300);
            await import('../actions/turn.js').then(m => m.endTurn());
            return;
        }
    } finally {
        busy = false;
    }
}

export async function autoRollStart() {
    await sleep(200 + Math.random() * 300);
    await import('../actions/dice.js').then(m => m.rollStartGame(2));
}
