import { gameState, UNIT_STATS, checkVictory,STARTING_UNITS,trap_damage } from "./gameState.js";

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
        baseArmor:    stats.armor,
        armor:       stats.armor,
        force:       stats.force,
        move:        stats.move,
        range:       stats.range,
        hasMoved:    false,
        isDefending: false,
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
    unit.isDefending=false;

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
    if (!gameState.gameStarted) return { ok: false, reason: 'need-start-rolls' };
    if (gameState.currentPlayer !== player) return { ok: false, reason: 'not-your-turn' };
    if (!canPlaceUnit(player, r, c)) return { ok: false, reason: 'invalid-cell' };

    createUnit(type, player, r, c);
    // record who initiated placement (first placer)
    if (!gameState.placementStarter) gameState.placementStarter = player;
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
        // give movement turn to the player who started the placement
        gameState.currentPlayer = gameState.placementStarter || player;
        // After all placements, ownership is determined only by unit positions:
        // clear all owners first
        for (let rr = 0; rr < gameState.board.length; rr++) {
            for (let cc = 0; cc < gameState.board[rr].length; cc++) {
                gameState.board[rr][cc].owner = null;
            }
        }
        // reset players' cells lists
        gameState.players.forEach(p => p.cells = []);
        // assign ownership to cells that contain units
        gameState.units.filter(u => u.alive).forEach(u => {
            const cell = gameState.board[u.row][u.col];
            cell.owner = u.player;
            const pl = gameState.players[u.player - 1];
            if (!pl.cells.some(x => x.r === u.row && x.c === u.col)) pl.cells.push({ r: u.row, c: u.col });
        });
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
    // if unit already moved this turn, no valid moves
    if (unit.hasMoved) return moves;
    const max = unit.move || 1;
    // four directions
    const dirs = [ [1,0], [-1,0], [0,1], [0,-1] ];

    for (const [dr,dc] of dirs) {
        for (let step = 1; step <= unit.move; step++) {
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
                const hasEnemy = destUnits.map(id => gameState.units.find(u => u.id === id && u.alive)).some(u => u && u.player !== unit.player);
                if (hasEnemy) {
                    // allow attack as a valid move, but cannot continue past enemy
                    moves.push({ r: nr, c: nc, attack: true });
                    break;
                }
            }
            moves.push({ r: nr, c: nc });
            
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

export function setDefenseMode(unitId){
    const unit=gameState.units.find(u=> u.id === unitId && u.alive);
    if (!unit) return { ok: false, reason: 'no-unit' };
    if (unit.player !== gameState.currentPlayer)
        return { ok: false, reason: 'not-your-unit' };
    if (unit.hasMoved)
        return { ok: false, reason: 'already-moved' };
    unit.isDefending=true;
    unit.hasMoved=true;
    const bonusArmor = gameState.turnBonus[unit.player] || 0;
    unit.armor = unit.baseArmor + (bonusArmor * 10);
    document.getElementById('log-text').textContent =
        `${unit.type} en défense — armure totale : ${unit.armor}`;

    return { ok: true, armor: unit.armor };

}

export function moveUnit(unitId, destR, destC) {
    const unit = gameState.units.find(u => u.id === unitId && u.alive);
    if (!unit) return { ok: false, reason: 'no-unit' };
    if (gameState.currentPlayer !== unit.player) return { ok: false, reason: 'not-your-turn' };
    if (gameState.phase !== 'movement') return { ok: false, reason: 'not-movement' };

    // require per-turn rolls if flagged
    //if (gameState.requireTurnRolls) return { ok: false, reason: 'need-turn-rolls' };

    // prevent moving more than once per turn
    if (unit.hasMoved) return { ok: false, reason: 'already-moved' };

    const valid = getValidMoves(unit);
    const ok = valid.some(m => m.r === destR && m.c === destC);
    if (!ok) return { ok: false, reason: 'invalid-move' };
    const destCell = gameState.board[destR][destC];
    const destUnits = destCell.units || [];

    // If there is an enemy unit in the destination, resolve combat
    const enemyUnitId = destUnits.find(id => {
        const u = gameState.units.find(x => x.id === id && x.alive);
        return u && u.player !== unit.player;
    });
    const enemy = enemyUnitId ? gameState.units.find(u => u.id === enemyUnitId && u.alive) : null;
    
    // ── COMBAT ───────────────────────────────────────────────────
    if (enemy && enemy.player !== unit.player) {
        const roll= () => Math.floor(Math.random() * 6) + 1;
        const attackerDie = roll();
        const defenderDie = roll();

        const atkBonus  = gameState.turnBonus[unit.player]  || 0;
        const defBonus  = gameState.turnBonus[enemy.player] || 0;

        const atkCell   = gameState.board[unit.row][unit.col];
        const defCell   = gameState.board[enemy.row][enemy.col];
        const cellAtk   = (atkCell.content?.type === 'bonus' && atkCell.content.subtype === 'atk') ? 1 : 0;
        const cellDef   = (defCell.content?.type === 'bonus' && defCell.content.subtype === 'def') ? 1 : 0;

        const atkTotal  = attackerDie + unit.force  + atkBonus + cellAtk;
        const defTotal  = defenderDie + enemy.force + defBonus + cellDef;
        const rawDamage = atkTotal - defTotal;

        document.getElementById('log-text').textContent =
            `⚔ ATK(${attackerDie}+${unit.force}+${atkBonus}+${cellAtk}=${atkTotal})` +
            ` vs DEF(${defenderDie}+${enemy.force}+${defBonus}+${cellDef}=${defTotal})` +
            ` → brut: ${rawDamage}`;

        if (rawDamage > 0) {
            const finalDamage = enemy.isDefending
                ? Math.max(0, rawDamage * 10 - enemy.armor)
                : rawDamage * 10;

            enemy.health -= finalDamage;

            document.getElementById('log-text').textContent +=
                ` | dégâts: ${finalDamage}` +
                (enemy.isDefending ? ` (armure ${enemy.armor})` : '') +
                ` | HP ennemi: ${Math.max(0, enemy.health)}`;

            // counter-attack if defender survived while defending
            if (enemy.health > 0 && enemy.isDefending) {
                const counter = Math.floor(finalDamage / 2);
                unit.health  -= counter;
                document.getElementById('log-text').textContent +=
                    ` | Contre: -${counter} HP à ${unit.type} (HP: ${Math.max(0, unit.health)})`;

                if (unit.health <= 0) {
                    removeUnit(unit.id);
                    gameState.selected    = null;
                    gameState.highlighted = [];
                    return { ok: true, combat: true, winner: checkVictory() };
                }
            }
        }

        if (enemy.health <= 0) {
            // enemy dies — attacker moves into cell
            removeUnit(enemy.id);
            gameState.board[unit.row][unit.col].units =
                gameState.board[unit.row][unit.col].units.filter(id => id !== unitId);
            destCell.units.push(unitId);
            unit.row      = destR;
            unit.col      = destC;
            unit.hasMoved = true;
            destCell.owner = unit.player;

            const ap = gameState.players[unit.player  - 1];
            const dp = gameState.players[enemy.player - 1];
            if (!ap.cells.some(x => x.r === destR && x.c === destC))
                ap.cells.push({ r: destR, c: destC });
            dp.cells = dp.cells.filter(x => !(x.r === destR && x.c === destC));

        } else {
            // enemy survived — attacker stays
            unit.hasMoved = true;
        }

        gameState.selected    = null;
        gameState.highlighted = [];
        return { ok: true, combat: true, winner: checkVictory() };
    }

    // No combat: perform normal move
    const oldCell = gameState.board[unit.row][unit.col];
    oldCell.units = oldCell.units.filter(id => id !== unitId);

    // record previous owner for capture logic
    const prevOwner = destCell.owner;

    destCell.units.push(unitId);
    unit.row = destR;
    unit.col = destC;
    unit.hasMoved = true;

    // capture the destination cell if owner differs
    if (prevOwner !== unit.player) {
        // remove from previous owner list
        if (prevOwner != null) {
            const prevPl = gameState.players[prevOwner - 1];
            prevPl.cells = prevPl.cells.filter(x => !(x.r === destR && x.c === destC));
        }
        // assign to new owner
        destCell.owner = unit.player;
        const newPl = gameState.players[unit.player - 1];
        if (!newPl.cells.some(x => x.r === destR && x.c === destC)) newPl.cells.push({ r: destR, c: destC });
    }

   
    
    if (destCell.content?.type === 'trap'&& !destCell.content.used) {
    unit.health -= trap_damage;
    destCell.content.used = true;
    
    document.getElementById('log-text').textContent =
        `${unit.type} marche sur un piège ! -${trap_damage} HP`;
    if (unit.health <= 0) removeUnit(unit.id);
}
    gameState.selected = null;
    gameState.highlighted = [];
    const winner = checkVictory();
    return { ok: true, capture: { from: prevOwner, to: unit.player, r: destR, c: destC }, winner };
}


