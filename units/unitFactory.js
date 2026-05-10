import { gameState, UNIT_STATS } from "../core/gameState.js";

export function createUnit(type, player, row, col) {
    const stats = UNIT_STATS[type];
    gameState.unitIdCounter++;

    const unit = {
        id: gameState.unitIdCounter,
        type,
        player,
        row,
        col,
        health: stats.health,
        maxHealth: stats.health,
        baseArmor: stats.armor,
        armor: stats.armor,
        force: stats.force,
        move: stats.move,
        range: stats.range,
        hasMoved: false,
        isDefending: false,
        alive: true,
    };

    gameState.units.push(unit);
    gameState.board[row][col].units.push(unit.id);
    gameState.players[player - 1].units.push(unit.id);

    return unit;
}

export function removeUnit(unitId) {
    const unit = gameState.units.find(u => u.id === unitId);
    if (!unit) return;

    unit.alive = false;
    unit.isDefending = false;

    const cell = gameState.board[unit.row][unit.col];
    cell.units = cell.units.filter(id => id !== unitId);

    const player = gameState.players[unit.player - 1];
    player.units = player.units.filter(id => id !== unitId);
}
