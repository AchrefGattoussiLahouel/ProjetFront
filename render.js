import { gameState, size,UNIT_STATS } from "./gameState.js";
import { createUnit, getPlacementCells } from "./units.js";


export function render() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

      document.documentElement.style.setProperty('--grid-size', size);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {

            const cellData = gameState.board[r][c];
         // Ajout des cellules
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add(cellData.zone);
            // highlight available moves
            if (gameState.highlighted.some(h => h.r === r && h.c === c)) {
                cell.classList.add('highlight');
            }
            if (cellData.content?.type === "bonus" && cellData.content.subtype === "atk") {
                cell.classList.add("bonus-atk");
            } else if (cellData.content?.type === "bonus" && cellData.content.subtype === "def") {
                cell.classList.add("bonus-def");
            } else if (cellData.content?.type === "trap") {
                cell.classList.add("piege");
            }

            // badges de chaque C
            if (cellData.content?.type === "bonus") {
                if (cellData.content.subtype === "atk") {
                    cell.innerHTML = "<span class='cell-badge'>ATK</span>";
                }
                if (cellData.content.subtype === "def") {
                    cell.innerHTML = "<span class='cell-badge'  >DEF</span>";
                }
            }

            if (cellData.content?.type === "trap") {
                cell.innerHTML = "<span class='cell-badge'>TRP</span>";
            }
        
            
        //Creation des UNites dasn le grid 

       cellData.units.forEach(uid => { 
            const unit= gameState.units.find(u => u.id === uid && u.alive);
            if (!unit) return;
            const token = document.createElement("div");
            token.classList.add("unit-token", "player-" + unit.player);
            token.dataset.uid = unit.id;
            token.textContent = unit.type[0].toUpperCase(); // T, S, C, A, B, H
            
            
            // bare de sante
            const healthPct = Math.round((unit.health/unit.maxHealth)*100);
            let barColor;
            if (healthPct > 50)      barColor = "#0a42ea"; 
            else if (healthPct > 25) barColor = "#f0c040"; 
            else                     barColor = "#e05c6a"; 
            
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
            cell.appendChild(token);
        
       });


        //Clicks Handling 

        cell.addEventListener('click', async () => {
            // delegate to game logic (dynamic import avoids circular import)
            const mod = await import('./HandleClick.js');
            mod.handleCellClick(r,c);
        });


            grid.appendChild(cell);
        }
    }

    // Update player side panels with available pieces
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
                // only allow selecting pieces of the current player during placement
                if (gameState.phase !== 'placement') return;
                if (gameState.currentPlayer !== player.id) return;
                if (count === 0) return;
                window.selectedUnitType = type;
                // compute placement cells and highlight
                gameState.highlighted = getPlacementCells(type, player.id);
                document.getElementById('log-text').textContent = `Placement: ${type} — cliquez une case dans votre zone.`;
                // re-render to show highlights
                render();
            });
            panel.appendChild(item);
        }
    });
    const ap = document.getElementById('active-player');
    if (ap) ap.textContent = gameState.currentPlayer;
    // highlight active player's aside and show last roll
    const asides = document.querySelectorAll('aside');
    asides.forEach((a, i) => {
        const pid = i + 1;
        if (pid === gameState.currentPlayer) a.classList.add('panel-active');
        else a.classList.remove('panel-active');
        const rv = document.getElementById(`roll-${pid}`);
        if (rv) rv.textContent = (gameState.tempRolls && gameState.tempRolls[pid]) ? gameState.tempRolls[pid] : '';
        const rollBtn = document.getElementById(`btn-roll-${pid}`);
        if (rollBtn) {
            // disable if player already rolled or starter already determined
            rollBtn.disabled = !!(gameState.tempRolls && gameState.tempRolls[pid] != null) || !!gameState.startedRoll;
            rollBtn.style.opacity = rollBtn.disabled ? '0.45' : '1';
            rollBtn.style.cursor = rollBtn.disabled ? 'not-allowed' : 'pointer';
        }
    });
    const starterEl = document.getElementById('starter-message');
    if (starterEl && gameState.startedRoll) starterEl.textContent = `Commence: Joueur ${gameState.currentPlayer}`;
}
