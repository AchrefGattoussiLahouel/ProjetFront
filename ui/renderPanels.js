import { gameState } from "../core/gameState.js";
import { getPlacementCells } from "../units/unitPlacement.js";

export function renderPanels() {
    const panels = document.querySelectorAll('.unit-list');
    panels.forEach((panel, idx) => {
        const player = gameState.players[idx];
        panel.innerHTML = '';
        for (const [type, count] of Object.entries(player.availablePieces || {})) {
            const item = document.createElement('div');
            item.classList.add('unit-item');
            item.dataset.player = player.id;
            item.dataset.type = type;
            item.innerHTML = `<span>${type}</span><span class="unit-count">x${count}</span>`;
            if (count === 0) item.style.opacity = '0.35';
            item.addEventListener('click', () => {
                if (gameState.phase !== 'placement') return;
                if (gameState.currentPlayer !== player.id) return;
                if (count === 0) return;
                window.selectedUnitType = type;
                gameState.highlighted = getPlacementCells(type, player.id);
                document.getElementById('log-text').textContent = `Placement: ${type} — cliquez une case dans votre zone.`;
                import('../render.js').then(m => m.render());
            });
            panel.appendChild(item);
        }
    });

    const ap = document.getElementById('active-player');
    if (ap) ap.textContent = gameState.currentPlayer;

    const asides = document.querySelectorAll('aside');
    asides.forEach((a, i) => {
        const pid = i + 1;
        if (pid === gameState.currentPlayer) a.classList.add('panel-active');
        else a.classList.remove('panel-active');
        const rollBtn = document.getElementById(`btn-roll-${pid}`);
        if (rollBtn) {
            rollBtn.disabled = gameState.gameStarted;
            rollBtn.style.opacity = gameState.gameStarted ? '0.4' : '1';
            rollBtn.style.cursor = gameState.gameStarted ? 'not-allowed' : 'pointer';
        }
    });

    const asideElems = document.querySelectorAll('aside');
    asideElems.forEach((a, i) => {
        const pl = gameState.players[i];
        const casesEl = document.getElementById(`cases-j${i + 1}`);
        if (casesEl) casesEl.textContent = (pl.cells || []).length;
    });

    const starterEl = document.getElementById('starter-message');
    if (gameState.phase === 'placement' && gameState.gameStarted) {
        starterEl.textContent = `Commence : Joueur ${gameState.currentPlayer}`;
    } else if (gameState.phase === 'movement' && gameState.gameStarted) {
        starterEl.textContent = `Tour du Joueur : ${gameState.currentPlayer}`;
    } else {
        starterEl.textContent = '';
    }
}
