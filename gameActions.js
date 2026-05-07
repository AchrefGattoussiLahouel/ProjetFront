import { gameState } from "./gameState.js";

export async function rollDiceForStart() {
    // legacy single-shot starter — keep but deprioritised
    if (gameState.startedRoll) return { ok: false, reason: 'already-rolled' };
    const a = Math.floor(Math.random() * 6) + 1;
    const b = Math.floor(Math.random() * 6) + 1;
    // if tie, let them reroll
    if (a === b) {
        const log = document.getElementById('log-text');
        log.textContent = `Égalité (${a}). Relancer les dés.`;
        (await import('./render.js')).render();
        return { ok: true, tie: true, rolls: { j1: a, j2: b } };
    }
    gameState.currentPlayer = a > b ? 1 : 2;
    gameState.startedRoll = true;
    // remember who will start placement
    gameState.placementStarter = gameState.currentPlayer;
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
    // per-turn rolls are not required by default — dice are rolled only at game start
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
    // clear per-turn rolls so next turn players must roll again
    gameState.turnRolls = { 1: null, 2: null };

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
        // remember who will start placement
        gameState.placementStarter = gameState.currentPlayer;
        log.textContent = `Résultat: J1=${a} - J2=${b}. Commence: Joueur ${gameState.currentPlayer}`;
        const starterEl = document.getElementById('starter-message');
        if (starterEl) starterEl.textContent = `Commence: Joueur ${gameState.currentPlayer}`;
        (await import('./render.js')).render();
        return { ok:true, starter: gameState.currentPlayer };
    }

    return { ok:true, roll: v };
}

export async function rollTurn(player) {
    // per-turn roll: each player rolls 1-6; higher starts the upcoming turn
    if (gameState.turnRolls == null) gameState.turnRolls = { 1: null, 2: null };
    if (gameState.turnRolls[player] != null) return { ok: false, reason: 'already-rolled' };
    const v = Math.floor(Math.random() * 6) + 1;
    gameState.turnRolls[player] = v;
    const log = document.getElementById('log-text');
    log.textContent = `Jet du tour: Joueur ${player} a lancé : ${v}`;
    (await import('./render.js')).render();

    const a = gameState.turnRolls[1];
    const b = gameState.turnRolls[2];
    if (a != null && b != null) {
        if (a === b) {
            gameState.turnRolls[1] = gameState.turnRolls[2] = null;
            log.textContent = `Égalité (${a}). Relancer les dés du tour.`;
            (await import('./render.js')).render();
            return { ok:true, tie:true };
        }
        gameState.currentPlayer = a > b ? 1 : 2;
        // resolved the turn order
        gameState.requireTurnRolls = false;
        log.textContent = `Résultat du tour: J1=${a} - J2=${b}. Commence ce tour: Joueur ${gameState.currentPlayer}`;
        (await import('./render.js')).render();
        return { ok:true, starter: gameState.currentPlayer };
    }

    return { ok:true, roll: v };
}

export async function endTurnFor(player) {
    if (gameState.currentPlayer !== player) return { ok:false, reason:'not-your-turn' };
    return endTurn();
}
