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
            logEl.textContent = `Unité sélectionnée: ${unit.type} (J${unit.player}). Déjà déplacée.`;
            (await import('./render.js')).render();
            return;
        }

        // if clicked on highlighted cell -> move
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
            // handle combat result if any
            if (res.combat) {
                const c = res.combat;
                const attacker = gameState.units.find(u => u.id === c.attackerId) || {};
                const defender = gameState.units.find(u => u.id === c.defenderId) || {};
                if (c.outcome === 'attacker-won') {
                    logEl.textContent = `Attaque: J${gameState.currentPlayer} — Dé ${c.attackerDie} + Force ${attacker.force || '?'} = ${c.attackerRoll}  | Défenseur — Dé ${c.defenderDie} + Force ${defender.force || '?'} = ${c.defenderRoll}. Résultat: Attaquant gagne — case capturée.`;
                } else {
                    logEl.textContent = `Attaque: J${gameState.currentPlayer} — Dé ${c.attackerDie} + Force ${attacker.force || '?'} = ${c.attackerRoll}  | Défenseur — Dé ${c.defenderDie} + Force ${defender.force || '?'} = ${c.defenderRoll}. Résultat: Défenseur tient — unité attaquante éliminée.`;
                }
            } else {
                if (res.capture) {
                    const from = res.capture.from;
                    const to = res.capture.to;
                    const p1 = gameState.players[0].cells.length;
                    const p2 = gameState.players[1].cells.length;
                    if (from == null) {
                        logEl.textContent = `Case (${r},${c}) capturée par Joueur ${to}. Nouveaux compteurs — J1: ${p1} | J2: ${p2}`;
                    } else {
                        logEl.textContent = `Case (${r},${c}) reprise par Joueur ${to} (ancien propriétaire: J${from}). Nouveaux compteurs — J1: ${p1} | J2: ${p2}`;
                    }
                } else {
                    logEl.textContent = `Unité déplacée vers (${r},${c}). Vous pouvez continuer à déplacer ou faire Fin de tour.`;
                }
            }

            document.getElementById('current-phase').textContent = gameState.phase.toUpperCase();
            document.getElementById('turn-counter').textContent = `Tour ${gameState.turn}`;
            (await import('./render.js')).render();

            if (res.winner) {
                const w = res.winner;
                logEl.textContent = `JOUEUR ${w} GAGNE !`;
                // set phase to end
                gameState.phase = 'end';
                (await import('./render.js')).render();
            }
            return;
        }

        // default info
        logEl.textContent = `Case (${r},${c}) — ${cellData.zone}${cellData.content ? ' — ' + cellData.content.type : ''}`;
        return;
    }

    // fallback
    document.getElementById('log-text').textContent = `Case (${r},${c}) — ${cellData.zone}${cellData.content ? ' — ' + cellData.content.type : ''}`;
}