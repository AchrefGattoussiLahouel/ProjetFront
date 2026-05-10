import { gameState, trap_damage } from "../core/gameState.js";
import { checkVictory } from "../core/victory.js";
import { removeUnit } from "./unitFactory.js";

function inBounds(r, c) {
    return r >= 0 && c >= 0 && r < gameState.board.length && c < gameState.board.length;
}

export function getValidMoves(unit) {
    const moves = [];
    if (!unit || !unit.alive) return moves;
    if (unit.hasMoved) return moves;

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dr, dc] of dirs) {
        for (let step = 1; step <= unit.move; step++) {
            const nr = unit.row + dr * step;
            const nc = unit.col + dc * step;
            if (!inBounds(nr, nc)) break;

            if (step > 1) {
                const midr = unit.row + dr * (step - 1);
                const midc = unit.col + dc * (step - 1);
                if ((gameState.board[midr][midc].units?.length || 0) > 0) break;
            }

            const destUnits = gameState.board[nr][nc].units || [];
            if (destUnits.length > 0) {
                const hasEnemy = destUnits
                    .map(id => gameState.units.find(u => u.id === id && u.alive))
                    .some(u => u && u.player !== unit.player);
                if (hasEnemy) {
                    moves.push({ r: nr, c: nc, attack: true });
                    break;
                }
            }
            moves.push({ r: nr, c: nc });
        }
    }

    return moves;
}

export function moveUnit(unitId, destR, destC) {
    const unit = gameState.units.find(u => u.id === unitId && u.alive);
    if (!unit) return { ok: false, reason: 'no-unit' };
    if (gameState.currentPlayer !== unit.player) return { ok: false, reason: 'not-your-turn' };
    if (gameState.phase !== 'movement') return { ok: false, reason: 'not-movement' };
    if (unit.hasMoved) return { ok: false, reason: 'already-moved' };

    const valid = getValidMoves(unit);
    const ok = valid.some(m => m.r === destR && m.c === destC);
    if (!ok) return { ok: false, reason: 'invalid-move' };

    const destCell = gameState.board[destR][destC];
    const destUnits = destCell.units || [];
    const enemyUnitId = destUnits.find(id => {
        const u = gameState.units.find(x => x.id === id && x.alive);
        return u && u.player !== unit.player;
    });
    const enemy = enemyUnitId ? gameState.units.find(u => u.id === enemyUnitId && u.alive) : null;

    if (enemy && enemy.player !== unit.player) {
        const roll = () => Math.floor(Math.random() * 6) + 1;
        const attackerDie = roll();
        const defenderDie = roll();

        const atkBonus = gameState.turnBonus[unit.player] || 0;
        const defBonus = gameState.turnBonus[enemy.player] || 0;

        const atkCell = gameState.board[unit.row][unit.col];
        const defCell = gameState.board[enemy.row][enemy.col];
        const cellAtk = (atkCell.content?.type === 'bonus' && atkCell.content.subtype === 'atk') ? 1 : 0;
        const cellDef = (defCell.content?.type === 'bonus' && defCell.content.subtype === 'def') ? 1 : 0;

        const atkTotal = attackerDie + unit.force + atkBonus + cellAtk;
        const defTotal = defenderDie + enemy.force + defBonus + cellDef;
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

            if (enemy.health > 0 && enemy.isDefending) {
                const counter = Math.floor(finalDamage / 2);
                unit.health -= counter;
                document.getElementById('log-text').textContent +=
                    ` | Contre: -${counter} HP à ${unit.type} (HP: ${Math.max(0, unit.health)})`;

                if (unit.health <= 0) {
                    removeUnit(unit.id);
                    gameState.selected = null;
                    gameState.highlighted = [];
                    return { ok: true, combat: true, winner: checkVictory() };
                }
            }
        }

        if (enemy.health <= 0) {
            removeUnit(enemy.id);
            gameState.board[unit.row][unit.col].units =
                gameState.board[unit.row][unit.col].units.filter(id => id !== unitId);
            destCell.units.push(unitId);
            unit.row = destR;
            unit.col = destC;
            unit.hasMoved = true;
            destCell.owner = unit.player;

            const ap = gameState.players[unit.player - 1];
            const dp = gameState.players[enemy.player - 1];
            if (!ap.cells.some(x => x.r === destR && x.c === destC)) ap.cells.push({ r: destR, c: destC });
            dp.cells = dp.cells.filter(x => !(x.r === destR && x.c === destC));
        } else {
            unit.hasMoved = true;
        }

        gameState.selected = null;
        gameState.highlighted = [];
        return { ok: true, combat: true, winner: checkVictory() };
    }

    const oldCell = gameState.board[unit.row][unit.col];
    oldCell.units = oldCell.units.filter(id => id !== unitId);
    const prevOwner = destCell.owner;

    destCell.units.push(unitId);
    unit.row = destR;
    unit.col = destC;
    unit.hasMoved = true;

    if (prevOwner !== unit.player) {
        if (prevOwner != null) {
            const prevPl = gameState.players[prevOwner - 1];
            prevPl.cells = prevPl.cells.filter(x => !(x.r === destR && x.c === destC));
        }
        destCell.owner = unit.player;
        const newPl = gameState.players[unit.player - 1];
        if (!newPl.cells.some(x => x.r === destR && x.c === destC)) newPl.cells.push({ r: destR, c: destC });
    }

    if (destCell.content?.type === 'trap' && !destCell.content.used) {
        unit.health -= trap_damage;
        destCell.content.used = true;
        document.getElementById('log-text').textContent = `${unit.type} marche sur un piège ! -${trap_damage} HP`;
        if (unit.health <= 0) removeUnit(unit.id);
    }

    gameState.selected = null;
    gameState.highlighted = [];
    const winner = checkVictory();
    return { ok: true, capture: { from: prevOwner, to: unit.player, r: destR, c: destC }, winner };
}
