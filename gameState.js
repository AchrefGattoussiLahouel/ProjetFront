const size = 16;

const gameState = {
    board: []
};

for (let r = 0; r < size; r++) {
    gameState.board[r] = [];

    for (let c = 0; c < size; c++) {

        let cell = {
            zone: "neutral",
            content: null,
            used: false
        };

        if (r <= 1) {
            cell.zone = "zone-j1";
        }
        else if (r >= size - 2) {
            cell.zone = "zone-j2";
        }
        else {
            const rand = Math.random();

            if (rand < 0.1) {
                cell.content = { type: "bonus", subtype: "atk" };
            }
            else if (rand < 0.2) {
                cell.content = { type: "bonus", subtype: "def" };
            }
            else if (rand < 0.3) {
                cell.content = { type: "trap" };
            }
        }

        gameState.board[r][c] = cell;
    }
}
function render() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

      document.documentElement.style.setProperty('--grid-size', size);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {

            const cellData = gameState.board[r][c];

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

            // badges
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

        cell.addEventListener('click', () => {
            document.getElementById('log-text').textContent =
                `Case (${r},${c}) — ${cellData.zone}${cellData.content ? ' — ' + cellData.content.type : ''}`;
        });


            grid.appendChild(cell);
        }
    }
}


render()