import { gameState } from "./gameState.js";
import { placeInitialUnit, getValidMoves, moveUnit } from "./units.js";

export async function handleCellClick(r, c) {
    const cellData = gameState.board[r][c];

    const logEl = document.getElementById('log-text');

    if (gameState.phase === 'placement') {
        const type = window.selectedUnitType;
        if (!type) {
            logEl.textContent = `Choisissez un type d'unité avant de placer.`;
            return;
        }

        const res = placeInitialUnit(type, gameState.currentPlayer, r, c);
        if (!res.ok) {
            logEl.textContent = `Placement refusé: ${res.reason}`;
            return;
        }

        logEl.textContent = `Unité ${type} placée J${gameState.currentPlayer === 1 ? 2 : 1} — Dernier placement accepté.`;
        document.getElementById('current-phase').textContent = gameState.phase.toUpperCase();
        document.getElementById('turn-counter').textContent = `Tour ${gameState.turn}`;
        (await import('./render.js')).render();
        return;
    }

    if (gameState.phase === 'movement') {
        // clicked on a unit belonging to current player -> select
        const topUnitId = cellData.units.length ? cellData.units[cellData.units.length - 1] : null;
        const unit = topUnitId ? gameState.units.find(u => u.id === topUnitId && u.alive) : null;

        if (unit && unit.player === gameState.currentPlayer) {
            gameState.selected = unit.id;
            gameState.highlighted = getValidMoves(unit);
            logEl.textContent = `Unité sélectionnée: ${unit.type} (J${unit.player}). Déplacements calculés.`;
            (await import('./render.js')).render();
            return;
        }

        // if clicked on highlighted cell -> move
        const hit = gameState.highlighted.find(h => h.r === r && h.c === c);
        if (hit && gameState.selected) {
            const res = moveUnit(gameState.selected, r, c);
            if (!res.ok) {
                logEl.textContent = `Déplacement échoué: ${res.reason}`;
                return;
            }
            logEl.textContent = `Unité déplacée vers (${r},${c}). Vous pouvez continuer à déplacer ou faire Fin de tour.`;
            document.getElementById('current-phase').textContent = gameState.phase.toUpperCase();
            document.getElementById('turn-counter').textContent = `Tour ${gameState.turn}`;
            (await import('./render.js')).render();
            return;
        }

        // default info
        logEl.textContent = `Case (${r},${c}) — ${cellData.zone}${cellData.content ? ' — ' + cellData.content.type : ''}`;
        return;
    }

    // fallback
    document.getElementById('log-text').textContent = `Case (${r},${c}) — ${cellData.zone}${cellData.content ? ' — ' + cellData.content.type : ''}`;
}