import { gameState } from "../core/gameState.js";
import { placeInitialUnit } from "../units/unitPlacement.js";
import { getValidMoves, moveUnit } from "../units/unitMovement.js";
import { showActionMenu } from "../ui/actionMenu.js";

export async function handleCellClick(r, c) {
    const cellData = gameState.board[r][c];
    const logEl = document.getElementById('log-text');

    if (gameState.phase === 'placement') {
        if (!gameState.gameStarted) {
            document.getElementById('log-text').textContent =
                'Lancez le dé de départ avant de placer vos unités !';
            return;
        }
        const type = window.selectedUnitType;
        if (!type) {
            logEl.textContent = `Choisissez un type d'unité avant de placer.`;
            return;
        }

        const res = placeInitialUnit(type, gameState.currentPlayer, r, c);
        if (!res.ok) {
            if (res.reason === 'need-start-rolls') {
                logEl.textContent = `Début du jeu: les deux joueurs doivent lancer le dé pour déterminer qui commence le placement.`;
            } else {
                logEl.textContent = `Placement refusé: ${res.reason}`;
            }
            return;
        }

        logEl.textContent = `Unité ${type} placée J${gameState.currentPlayer === 1 ? 2 : 1} — Dernier placement accepté.`;
        document.getElementById('current-phase').textContent = gameState.phase.toUpperCase();
        document.getElementById('turn-counter').textContent = `Tour ${gameState.turn}`;
        (await import('../render.js')).render();
        return;
    }

    if (gameState.phase === 'movement') {
        const topUnitId = cellData.units.length ? cellData.units[cellData.units.length - 1] : null;
        const unit = topUnitId ? gameState.units.find(u => u.id === topUnitId && u.alive) : null;

        if (unit && unit.player === gameState.currentPlayer) {
            gameState.selected = unit.id;
            gameState.highlighted = getValidMoves(unit);
            showActionMenu(unit, r, c);
            logEl.textContent = `Unité sélectionnée: ${unit.type} (J${unit.player}). Déjà déplacée.`;
            (await import('../render.js')).render();
            return;
        }

        const hit = gameState.highlighted.find(h => h.r === r && h.c === c);
        if (hit && gameState.selected) {
            const res = moveUnit(gameState.selected, r, c);
            if (!res.ok) {
                const reason = res.reason;
                if (reason === 'need-turn-rolls') {
                    logEl.textContent = `Début du tour: les deux joueurs doivent lancer le dé pour déterminer qui commence.`;
                } else if (reason === 'not-your-turn') {
                    logEl.textContent = `Ce n'est pas votre tour.`;
                } else if (reason === 'invalid-move') {
                    logEl.textContent = `Déplacement invalide.`;
                } else if (reason === 'already-moved') {
                    logEl.textContent = `Cette unité a déjà bougé ce tour.`;
                } else {
                    logEl.textContent = `Déplacement échoué: ${res.reason}`;
                }
                return;
            }

            document.getElementById('current-phase').textContent = gameState.phase.toUpperCase();
            document.getElementById('turn-counter').textContent = `Tour ${gameState.turn}`;
            (await import('../render.js')).render();

            if (res.winner) {
                const w = res.winner;
                logEl.textContent = `JOUEUR ${w} GAGNE !`;
                gameState.phase = 'end';
                (await import('../render.js')).render();
            }
            return;
        }

        logEl.textContent = `Case (${r},${c}) — ${cellData.zone}${cellData.content ? ' — ' + cellData.content.type : ''}`;
        return;
    }

    document.getElementById('log-text').textContent = `Case (${r},${c}) — ${cellData.zone}${cellData.content ? ' — ' + cellData.content.type : ''}`;
}
