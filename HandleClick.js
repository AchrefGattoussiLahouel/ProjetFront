import { gameState } from "./gameState.js";
import { placeInitialUnit, getValidMoves, moveUnit } from "./units.js";

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
            showActionMenu(unit, r, c);
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


function showActionMenu(unit, r, c) {
    document.getElementById('action-menu')?.remove();

    const menu = document.createElement('div');
    menu.id = 'action-menu';
    menu.style.cssText = `
        position: fixed;
        background: var(--bg-panel);
        border: 1px solid var(--border-glow);
        padding: 10px;
        z-index: 200;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-family: var(--font-mono);
        font-size: 0.8rem;
        min-width: 140px;
    `;

    // position next to the cell
    const cellEl = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (cellEl) {
        const rect = cellEl.getBoundingClientRect();
        menu.style.left = (rect.right + 6) + 'px';
        menu.style.top  = rect.top + 'px';
    }

    const btnStyle = `
        background: transparent;
        border: 1px solid var(--border-dim);
        color: var(--text-primary);
        font-family: var(--font-mono);
        font-size: 0.75rem;
        padding: 6px 10px;
        cursor: pointer;
        text-align: left;
    `;

    

    // DEFEND button — only if unit hasn't moved
    const btnDefend = document.createElement('button');
    btnDefend.textContent = '🛡 DÉFENDRE';
    btnDefend.style.cssText = btnStyle;
    btnDefend.disabled = unit.hasMoved || unit.isDefending;
    if (btnDefend.disabled) btnDefend.style.opacity = '0.4';
    btnDefend.onclick = () => {
        import('./units.js').then(m => {
            m.setDefenseMode(unit.id);
            gameState.selected    = null;
            gameState.highlighted = [];
            menu.remove();
            import('./render.js').then(r => r.render());
        });
    };

    // CANCEL button
    const btnCancel = document.createElement('button');
    btnCancel.textContent = '✕ ANNULER';
    btnCancel.style.cssText = btnStyle;
    btnCancel.onclick = () => {
        gameState.selected    = null;
        gameState.highlighted = [];
        menu.remove();
        import('./render.js').then(m => m.render());
    };
    // Info on the unit clicked on
   const info = document.createElement('div');
    info.style.cssText = `
    border-bottom: 1px solid var(--border-dim);
    padding-bottom: 8px;
    margin-bottom: 4px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text-dim);
`;

    // health bar percentage
    const healthPct = Math.round((unit.health / unit.maxHealth) * 100);
    const healthColor = healthPct > 50 ? '#2ecc8a'
                    : healthPct > 25 ? '#f0c040'
                    : '#e05c6a';

    // cell bonus detection — check what cell the unit is currently on
    const unitCell = gameState.board[unit.row][unit.col];
    const onAtkCell = unitCell.content?.type === 'bonus' && unitCell.content.subtype === 'atk';
    const onDefCell = unitCell.content?.type === 'bonus' && unitCell.content.subtype === 'def';
    // turn dice bonus
    const diceBonus = gameState.turnBonus[unit.player] || 0;
    const totalAtk = unit.force + diceBonus + (onAtkCell ? 1 : 0);
    // total defense this turn = armor + dice bonus (if defending) + cell def bonus
    const cellDefBonus = onDefCell ? 1 : 0;

    info.innerHTML = `
    <span style="color:var(--text-primary);font-size:0.85rem;
                 font-weight:700;letter-spacing:0.1em">
        ${unit.type}
    </span>

    <span>❤ <span style="color:${healthColor}">
        ${unit.health} / ${unit.maxHealth}
    </span></span>

    <span>⚔ Force base : ${unit.force}</span>
    <span>🎲 Bonus dé ce tour : +${diceBonus}</span>
    ${onAtkCell
        ? '<span style="color:var(--bonus-atk-text)"> Case ATK : +1 attaque</span>'
        : ''}
    <span style="color:#f0c040">⚔ Puissance totale ATK : ${totalAtk}</span>

    <span>🛡 Armure de base : ${unit.baseArmor}</span>
    ${onDefCell
        ? '<span style="color:var(--bonus-def-text)"> Case DEF : +1 défense</span>'
        : ''}
    ${unit.isDefending
        ? `<span style="color:#2e86c9">🛡 En défense — armure active : ${unit.armor}</span>`
        : '<span style="color:var(--text-dim)">🛡 Pas en défense</span>'}

    <span> Portée : ${unit.move} case${unit.move > 1 ? 's' : ''}</span>

    ${unit.hasMoved
        ? '<span style="color:var(--text-dim)">✓ A déjà bougé ce tour</span>'
        : '<span style="color:#2ecc8a">○ Peut encore bouger</span>'}
    `;


    menu.appendChild(info);
    menu.appendChild(btnDefend);
    menu.appendChild(btnCancel);
    document.body.appendChild(menu);

    // click outside → close menu
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
}