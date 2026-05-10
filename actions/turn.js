import { gameState } from "../core/gameState.js";

let timer = null;

function autoRollTurnBonus() {
    const player = gameState.currentPlayer;
    const roll = Math.floor(Math.random() * 6) + 1;
    gameState.turnBonus[player] = roll;

    document.getElementById('log-text').textContent =
        `Tour ${gameState.turn} — Joueur ${player} joue. Bonus dé : +${roll} force !`;

    const bonusEl = document.getElementById(`bonus-value-${player}`);
    if (bonusEl) bonusEl.textContent = `+${roll}`;
}

export async function endTurn() {
    const previous = gameState.currentPlayer;

    gameState.currentPlayer = previous === 1 ? 2 : 1;
    gameState.turn++;
    gameState.selected = null;
    gameState.highlighted = [];

    const incoming = gameState.currentPlayer;
    gameState.units
        .filter(u => u.player === incoming)
        .forEach(u => {
            u.hasMoved = false;
            u.isDefending = false;
            u.armor = u.baseArmor;
        });

    const prevEl = document.getElementById(`bonus-value-${previous}`);
    if (prevEl) prevEl.textContent = '—';

    autoRollTurnBonus();
    startTimer();
    document.getElementById('turn-counter').textContent = `Tour ${gameState.turn}`;
    document.getElementById('current-phase').textContent = gameState.phase.toUpperCase();

    (await import('../render.js')).render();
    return { ok: true };
}

export async function endTurnFor(player) {
    if (gameState.currentPlayer !== player) return { ok: false, reason: 'not-your-turn' };
    return endTurn();
}

export function startTimer() {
    clearInterval(timer);
    const duration = (gameState && typeof gameState.turnDuration === 'number') ? gameState.turnDuration : 60;
    let secondsLeft = duration;
    const timerEl = document.getElementById('turn-timer');
    if (timerEl) timerEl.textContent = secondsLeft;

    timer = setInterval(async () => {
        secondsLeft--;
        if (timerEl) timerEl.textContent = secondsLeft;

        if (timerEl) {
            if (secondsLeft <= 10) timerEl.style.color = '#e05c6a';
            else if (secondsLeft <= duration / 2) timerEl.style.color = '#f08340';
            else timerEl.style.color = 'var(--text-gold)';
        }

        if (secondsLeft <= 0) {
            clearInterval(timer);
            document.getElementById('log-text').textContent =
                `⏱ Temps écoulé ! Tour de Joueur ${gameState.currentPlayer} terminé.`;
            await endTurn();
        }
    }, 1000);
}

export function startFirstTurnTimer() {
    startTimer();
}

export function startFirstTurnAutoRoll() {
    autoRollTurnBonus();
}
