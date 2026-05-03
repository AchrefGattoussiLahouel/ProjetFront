import { gameState, size,UNIT_STATS } from "./gameState.js";
import { handleCellClick } from "./HandleClick.js";
import { createUnit } from "./units.js";


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
            if (healthPct > 50)      barColor = "#2ecc8a"; // green
            else if (healthPct > 25) barColor = "#f0c040"; // yellow
            else                     barColor = "#e05c6a"; // red
            
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

        cell.addEventListener('click', () => {
            document.getElementById('log-text').textContent =
                `Case (${r},${c}) — ${cellData.zone}${cellData.content ? ' — ' + cellData.content.type : ''}`;
        });


            grid.appendChild(cell);
        }
    }
}
