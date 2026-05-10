import { gameState } from "../core/gameState.js";

export function renderGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    const sz = (gameState && gameState.board && gameState.board.length) ? gameState.board.length : 8;
    document.documentElement.style.setProperty('--grid-size', sz);

    for (let r = 0; r < sz; r++) {
        for (let c = 0; c < sz; c++) {
            const cellData = gameState.board[r][c];
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.r = r;
            cell.dataset.c = c;

            if (cellData.owner === 1) cell.classList.add('owned-j1');
            else if (cellData.owner === 2) cell.classList.add('owned-j2');

            const hEntry = gameState.highlighted.find(h => h.r === r && h.c === c);
            if (hEntry) {
                if (hEntry.attack) cell.classList.add('attackable');
                else cell.classList.add('reachable');
            }
            if (cellData.content?.type === "bonus" && cellData.content.subtype === "atk") {
                cell.classList.add("bonus-atk");
            } else if (cellData.content?.type === "bonus" && cellData.content.subtype === "def") {
                cell.classList.add("bonus-def");
            } else if (cellData.content?.type === "trap") {
                cell.classList.add("piege");
            }

            if (cellData.content?.type === "bonus") {
                if (cellData.content.subtype === "atk") cell.innerHTML = "<span class='cell-badge'>ATK</span>";
                if (cellData.content.subtype === "def") cell.innerHTML = "<span class='cell-badge'  >DEF</span>";
            }
            if (cellData.content?.type === "trap") cell.innerHTML = "<span class='cell-badge'>TRP</span>";

            cellData.units.forEach(uid => {
                const unit = gameState.units.find(u => u.id === uid && u.alive);
                if (!unit) return;
                const token = document.createElement("div");
                token.classList.add("unit-token", "player-" + unit.player);
                token.dataset.uid = unit.id;
                token.textContent = unit.type[0].toUpperCase();

                const healthPct = Math.round((unit.health / unit.maxHealth) * 100);
                let barColor;
                if (healthPct > 50) barColor = "#0a42ea";
                else if (healthPct > 25) barColor = "#f0c040";
                else barColor = "#e05c6a";

                const bar = document.createElement("div");
                const fill = document.createElement("div");
                fill.style.cssText = `
            width: ${healthPct}%;
            height: 100%;
            background: ${barColor};
            border-radius: 2px;
            transition: width 0.3s;
    `;
                bar.classList.add("unit-health-bar");
                bar.appendChild(fill);
                token.appendChild(bar);
                if (unit.isDefending) token.classList.add('defending');
                if (unit.hasMoved) token.style.opacity = '0.5';
                if (gameState.selected === unit.id) token.classList.add('selected');
                cell.appendChild(token);
            });

            cell.addEventListener('click', async () => {
                const mod = await import('../handlers/handleClick.js');
                mod.handleCellClick(r, c);
            });

            grid.appendChild(cell);
        }
    }
}
