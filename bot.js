import { gameState } from "./gameState.js";

let busy = false;
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

function manhattan(a,b){ return Math.abs(a.r-b.r)+Math.abs(a.c-b.c); }

export async function takeTurn(){
    if (busy) return;
    busy = true;
    try{
        await sleep(200 + Math.random()*300);
        if (gameState.currentPlayer !== 2) return;

        // PLACEMENT: prioritize forward / center cells
        if (gameState.phase === 'placement'){
            const pl = gameState.players[1];
            const types = Object.keys(pl.availablePieces || {}).filter(t => pl.availablePieces[t] > 0);
            if (types.length === 0) return;
            const type = types[0];
            const mod = await import('./units.js');
            const cells = mod.getPlacementCells(type, 2);
            if (!cells || cells.length === 0) return;
            // score cells: prefer those closer to center and nearer opponent front
            const center = { r: Math.floor((gameState.board.length-1)/2), c: Math.floor((gameState.board.length-1)/2) };
            cells.sort((a,b) => (manhattan(a,center) - manhattan(b,center)) || (a.r - b.r));
            const choice = cells[0];
            mod.placeInitialUnit(type, 2, choice.r, choice.c);
            await (await import('./render.js')).render();
            return;
        }

        // MOVEMENT: for each bot unit, try to act
        if (gameState.phase === 'movement'){
            const mod = await import('./units.js');
            const myUnits = gameState.units.filter(u => u.alive && u.player === 2 && !u.hasMoved);
            // sort units by proximity to enemy (frontline first)
            const enemyUnits = gameState.units.filter(u => u.alive && u.player === 1);
            for (const u of myUnits){
                const moves = mod.getValidMoves(u);
                if (!moves || moves.length === 0) continue;
                // 1) attacks that kill enemy (we can't predict kill reliably) -> prefer any attack
                let attack = moves.find(m => m.attack);
                if (attack){
                    await sleep(200 + Math.random()*300);
                    const res = mod.moveUnit(u.id, attack.r, attack.c);
                    await (await import('./render.js')).render();
                    if (res && res.winner) { if (window.showEndPopup) window.showEndPopup(res.winner); return; }
                    continue;
                }

                // 2) capture neutral or enemy-owned cell
                let capture = moves.find(m => {
                    const cell = gameState.board[m.r][m.c];
                    return cell && cell.owner !== 2;
                });
                if (capture){
                    await sleep(200 + Math.random()*250);
                    mod.moveUnit(u.id, capture.r, capture.c);
                    await (await import('./render.js')).render();
                    continue;
                }

                // 3) move toward nearest enemy unit
                if (enemyUnits.length > 0){
                    const nearest = enemyUnits.reduce((acc,e) => {
                        const d = manhattan({r:u.row,c:u.col},{r:e.row,c:e.col});
                        if (!acc || d < acc.d) return {e,d}; return acc;
                    }, null);
                    if (nearest){
                        // pick move that reduces distance
                        let best = moves[0];
                        let bestD = manhattan({r:best.r,c:best.c},{r:nearest.e.row,c:nearest.e.col});
                        for (const m of moves){
                            const d = manhattan({r:m.r,c:m.c},{r:nearest.e.row,c:nearest.e.col});
                            if (d < bestD){ best = m; bestD = d; }
                        }
                        await sleep(120 + Math.random()*200);
                        mod.moveUnit(u.id, best.r, best.c);
                        await (await import('./render.js')).render();
                        continue;
                    }
                }

                // 4) fallback random move
                const choice = moves[Math.floor(Math.random()*moves.length)];
                await sleep(120 + Math.random()*180);
                mod.moveUnit(u.id, choice.r, choice.c);
                await (await import('./render.js')).render();
            }

            // after moving available units, small delay and end turn
            await sleep(300);
            await import('./gameActions.js').then(m => m.endTurn());
            return;
        }

    } finally { busy = false; }
}

export async function autoRollStart(){
    await sleep(200 + Math.random()*300);
    await import('./gameActions.js').then(m => m.rollStartGame(2));
}
