import { gameState } from "../core/gameState.js";

export function setDefenseMode(unitId) {
    const unit = gameState.units.find(u => u.id === unitId && u.alive);
    if (!unit) return { ok: false, reason: 'no-unit' };
    if (unit.player !== gameState.currentPlayer) return { ok: false, reason: 'not-your-unit' };
    if (unit.hasMoved) return { ok: false, reason: 'already-moved' };

    unit.isDefending = true;
    unit.hasMoved = true;
    const bonusArmor = gameState.turnBonus[unit.player] || 0;
    unit.armor = unit.baseArmor + (bonusArmor * 10);
    document.getElementById('log-text').textContent = `${unit.type} en défense — armure totale : ${unit.armor}`;

    return { ok: true, armor: unit.armor };
}
