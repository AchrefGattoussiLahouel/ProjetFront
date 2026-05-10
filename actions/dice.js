import { gameState } from "../core/gameState.js";

export async function rollStartGame(player) {
    if (gameState.gameStarted) return { ok: false, reason: 'already-started' };
    if (gameState.startRolls[player] !== null) return { ok: false, reason: 'already-rolled' };

    const roll = Math.floor(Math.random() * 6) + 1;
    gameState.startRolls[player] = roll;

    const rollEl = document.getElementById(`roll-${player}`);
    if (rollEl) rollEl.textContent = roll;

    const r1 = gameState.startRolls[1];
    const r2 = gameState.startRolls[2];

    if (r1 !== null && r2 !== null) {
        if (r1 === r2) {
            gameState.startRolls = { 1: null, 2: null };
            const el1 = document.getElementById('roll-1');
            const el2 = document.getElementById('roll-2');
            if (el1) el1.textContent = '';
            if (el2) el2.textContent = '';
            document.getElementById('log-text').textContent = `Égalité (${r1}) — relancez !`;
            (await import('../render.js')).render();
            return { ok: true, tie: true };
        }

        gameState.currentPlayer = r1 > r2 ? 1 : 2;
        gameState.gameStarted = true;
        gameState.placementStarter = gameState.currentPlayer;
        document.getElementById('log-text').textContent =
            `J1=${r1} J2=${r2} → Joueur ${gameState.currentPlayer} place en premier !`;

        const starterEl = document.getElementById('starter-message');
        if (starterEl) starterEl.textContent = `Commence : Joueur ${gameState.currentPlayer}`;

        (await import('../render.js')).render();
        return { ok: true, starter: gameState.currentPlayer };
    }

    document.getElementById('log-text').textContent =
        `Joueur ${player} a lancé : ${roll}. En attente de l'autre joueur...`;
    (await import('../render.js')).render();
    return { ok: true, roll };
}
