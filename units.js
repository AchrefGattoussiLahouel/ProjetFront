import { gameState, UNIT_STATS } from "./gameState.js";

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
