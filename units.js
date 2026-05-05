import { gameState, UNIT_STATS } from "./gameState.js";
import { STARTING_UNITS } from "./gameState.js";

export function createUnit(type, player, row, col) {
    // 1. get stats from catalogue
    const stats = UNIT_STATS[type];

    // 2. increment the id counter
    gameState.unitIdCounter++;

    // 3. create the unit object
    const unit = {
        id:          gameState.unitIdCounter,
        type:        type,
        player:      player,
        row:         row,
        col:         col,
        health:      stats.health,  
        maxHealth:   stats.health,  
        armor:       stats.armor,
        force:       stats.force,
        move:        stats.move,
        range:       stats.range,
        hasMoved:    false,
        alive:       true,
    };

    // 4. add to global units list
    gameState.units.push(unit);

    // 5. add id to the board cell
    gameState.board[row][col].units.push(unit.id);

    // 6. add id to the player's units list
    gameState.players[player - 1].units.push(unit.id);

    return unit;
}

export function removeUnit(unitId) {
    // find the unit
    const unit = gameState.units.find(u => u.id === unitId);
    if (!unit) return;

    // mark as dead
    unit.alive = false;

    // remove from board cell
    const cell = gameState.board[unit.row][unit.col];
    cell.units = cell.units.filter(id => id !== unitId);

    // remove from player's units list
    const player = gameState.players[unit.player - 1];
    player.units = player.units.filter(id => id !== unitId);
}

export function canPlaceUnit(player, r, c) {
    const cell = gameState.board[r][c];
    if (!cell) return false;
    if (player === 1 && cell.zone !== 'zone-j1') return false;
    if (player === 2 && cell.zone !== 'zone-j2') return false;
    // allow multiple units if they belong to the same player
    if ((cell.units?.length || 0) > 0) {
        // if any unit belongs to the other player, cannot place
        const otherUnit = cell.units.map(id => gameState.units.find(u => u.id === id)).find(u => u && u.player !== player);
        if (otherUnit) return false;
    }
    return true;
}

export function placeInitialUnit(type, player, r, c) {
    if (gameState.phase !== 'placement') return { ok: false, reason: 'not-placement' };
    if (gameState.currentPlayer !== player) return { ok: false, reason: 'not-your-turn' };
    if (!canPlaceUnit(player, r, c)) return { ok: false, reason: 'invalid-cell' };

    createUnit(type, player, r, c);
    const pl = gameState.players[player - 1];
    pl.placed = (pl.placed || 0) + 1;
    // decrement available pieces for player
    if (pl.availablePieces && typeof pl.availablePieces[type] === 'number') {
        pl.availablePieces[type] = Math.max(0, pl.availablePieces[type] - 1);
    }
    // clear any placement highlights
    gameState.highlighted = [];

    // switch player unless both finished
    const other = player === 1 ? 2 : 1;
    // if both players placed STARTING_UNITS -> go to movement
    const bothPlaced = gameState.players.every(p => p.placed >= STARTING_UNITS);
    if (bothPlaced) {
        gameState.phase = 'movement';
    } else {
        gameState.currentPlayer = other;
    }

    return { ok: true };
}

function inBounds(r, c) {
    return r >= 0 && c >= 0 && r < gameState.board.length && c < gameState.board.length;
}

export function getValidMoves(unit) {
    const moves = [];
    if (!unit || !unit.alive) return moves;
    const max = unit.move || 1;
    // four directions
    const dirs = [ [1,0], [-1,0], [0,1], [0,-1] ];

    for (const [dr,dc] of dirs) {
        for (let step = 1; step <= max; step++) {
            const nr = unit.row + dr * step;
            const nc = unit.col + dc * step;
            if (!inBounds(nr,nc)) break;
            // path must be clear for intermediate step
            if (step > 1) {
                const midr = unit.row + dr * (step - 1);
                const midc = unit.col + dc * (step - 1);
                if ((gameState.board[midr][midc].units?.length || 0) > 0) break;
            }
            // destination: allow landing if empty or contains only friendly units
            const destUnits = gameState.board[nr][nc].units || [];
            if (destUnits.length > 0) {
                const hasEnemy = destUnits.map(id => gameState.units.find(u => u.id === id)).some(u => u && u.player !== unit.player);
                if (hasEnemy) break; // cannot land on enemy-occupied cell
            }
            moves.push({ r: nr, c: nc });
            // Cavalier can move 1 or 2; other units only 1 (max)
            if (unit.type === 'Cavalier') continue;
            else break;
        }
    }

    return moves;
}

export function getPlacementCells(type, player) {
    const cells = [];
    for (let r = 0; r < gameState.board.length; r++) {
        for (let c = 0; c < gameState.board[r].length; c++) {
            // only allow placement in player's zone
            const cell = gameState.board[r][c];
            if (player === 1 && cell.zone !== 'zone-j1') continue;
            if (player === 2 && cell.zone !== 'zone-j2') continue;
            // must be empty
            if ((cell.units?.length || 0) > 0) continue;
            cells.push({ r, c });
        }
    }
    return cells;
}

export function moveUnit(unitId, destR, destC) {
    const unit = gameState.units.find(u => u.id === unitId && u.alive);
    if (!unit) return { ok: false, reason: 'no-unit' };
    if (gameState.currentPlayer !== unit.player) return { ok: false, reason: 'not-your-turn' };
    if (gameState.phase !== 'movement') return { ok: false, reason: 'not-movement' };

    const valid = getValidMoves(unit);
    const ok = valid.some(m => m.r === destR && m.c === destC);
    if (!ok) return { ok: false, reason: 'invalid-move' };

    // remove from old cell
    const oldCell = gameState.board[unit.row][unit.col];
    oldCell.units = oldCell.units.filter(id => id !== unitId);

    // add to new cell
    gameState.board[destR][destC].units.push(unitId);
    unit.row = destR;
    unit.col = destC;

    // clear selection/highlights but DO NOT end the player's turn automatically
    gameState.selected = null;
    gameState.highlighted = [];

    // Unlimited-movement mode: the player remains active until they explicitly end their turn.

    return { ok: true };
}
