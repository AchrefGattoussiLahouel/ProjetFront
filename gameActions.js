import { gameState } from "./gameState.js";

export async function rollDiceForStart() {
    // legacy single-shot starter — keep but deprioritised
    if (gameState.startedRoll) return { ok: false, reason: 'already-rolled' };
    let a, b;
    do {
        a = Math.floor(Math.random() * 6) + 1;
        b = Math.floor(Math.random() * 6) + 1;
    } while (a === b);
    gameState.currentPlayer = a > b ? 1 : 2;
    gameState.startedRoll = true;
    const log = document.getElementById('log-text');
    log.textContent = `Dé: Joueur1=${a} - Joueur2=${b}. Commence: Joueur ${gameState.currentPlayer}`;
    document.getElementById('current-phase').textContent = gameState.phase.toUpperCase();
    document.getElementById('turn-counter').textContent = `Tour ${gameState.turn}`;
    document.getElementById('active-player').textContent = gameState.currentPlayer;
    (await import('./render.js')).render();
    return { ok: true, rolls: { j1: a, j2: b }, starter: gameState.currentPlayer };
}

export async function endTurn() {
    // switch player and increment turn
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.turn++;
    gameState.selected = null;
    gameState.highlighted = [];

    // reset per-unit moved flag if used elsewhere
    gameState.units.forEach(u => { u.hasMoved = false; });

    const log = document.getElementById('log-text');
    log.textContent = `Fin de tour. Maintenant: Joueur ${gameState.currentPlayer}`;
    document.getElementById('current-phase').textContent = gameState.phase.toUpperCase();
    document.getElementById('turn-counter').textContent = `Tour ${gameState.turn}`;
    document.getElementById('active-player').textContent = gameState.currentPlayer;

    (await import('./render.js')).render();

    return { ok: true, currentPlayer: gameState.currentPlayer };
}

export async function rollDice(player) {
    // player rolls once; store tempRolls
    if (gameState.startedRoll) return { ok: false, reason: 'already-started' };
    if (gameState.tempRolls[player] != null) return { ok: false, reason: 'already-rolled' };
    const v = Math.floor(Math.random() * 6) + 1;
    gameState.tempRolls[player] = v;
    const log = document.getElementById('log-text');
    log.textContent = `Joueur ${player} a lancé : ${v}`;
    (await import('./render.js')).render();

    const a = gameState.tempRolls[1];
    const b = gameState.tempRolls[2];
    if (a != null && b != null) {
        if (a === b) {
            gameState.tempRolls[1] = gameState.tempRolls[2] = null;
            log.textContent = `Égalité (${a}). Relancer les dés.`;
            return { ok:true, tie:true };
        }
        gameState.currentPlayer = a > b ? 1 : 2;
        gameState.startedRoll = true;
        log.textContent = `Résultat: J1=${a} - J2=${b}. Commence: Joueur ${gameState.currentPlayer}`;
        const starterEl = document.getElementById('starter-message');
        if (starterEl) starterEl.textContent = `Commence: Joueur ${gameState.currentPlayer}`;
        (await import('./render.js')).render();
        return { ok:true, starter: gameState.currentPlayer };
    }

    return { ok:true, roll: v };
}

export async function endTurnFor(player) {
    if (gameState.currentPlayer !== player) return { ok:false, reason:'not-your-turn' };
    return endTurn();
}
