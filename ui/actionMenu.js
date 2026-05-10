import { gameState } from "../core/gameState.js";

export function showActionMenu(unit, r, c) {
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

    const cellEl = document.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (cellEl) {
        const rect = cellEl.getBoundingClientRect();
        menu.style.left = (rect.right + 6) + 'px';
        menu.style.top = rect.top + 'px';
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

    const btnDefend = document.createElement('button');
    btnDefend.textContent = '🛡 DÉFENDRE';
    btnDefend.style.cssText = btnStyle;
    btnDefend.disabled = unit.hasMoved || unit.isDefending;
    if (btnDefend.disabled) btnDefend.style.opacity = '0.4';
    btnDefend.onclick = () => {
        import('../units/unitDefense.js').then(m => {
            m.setDefenseMode(unit.id);
            gameState.selected = null;
            gameState.highlighted = [];
            menu.remove();
            import('../render.js').then(rMod => rMod.render());
        });
    };

    const btnCancel = document.createElement('button');
    btnCancel.textContent = '✕ ANNULER';
    btnCancel.style.cssText = btnStyle;
    btnCancel.onclick = () => {
        gameState.selected = null;
        gameState.highlighted = [];
        menu.remove();
        import('../render.js').then(m => m.render());
    };

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

    const healthPct = Math.round((unit.health / unit.maxHealth) * 100);
    const healthColor = healthPct > 50 ? '#2ecc8a'
        : healthPct > 25 ? '#f0c040'
            : '#e05c6a';

    const unitCell = gameState.board[unit.row][unit.col];
    const onAtkCell = unitCell.content?.type === 'bonus' && unitCell.content.subtype === 'atk';
    const onDefCell = unitCell.content?.type === 'bonus' && unitCell.content.subtype === 'def';
    const diceBonus = gameState.turnBonus[unit.player] || 0;
    const totalAtk = unit.force + diceBonus + (onAtkCell ? 1 : 0);

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

    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 0);
}
