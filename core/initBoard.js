import { gameState } from "./gameState.js";

export function initBoard() {
    const sz = (gameState && gameState.size) ? gameState.size : 8;
    for (let r = 0; r < sz; r++) {
        gameState.board[r] = [];

        for (let c = 0; c < sz; c++) {
            let cell = {
                zone: "neutral",
                owner: null,
                content: null,
                used: false,
                units: []
            };

            if (r <= 1) {
                cell.zone = "zone-j1";
            } else if (r >= sz - 2) {
                cell.zone = "zone-j2";
            } else {
                const rand = Math.random();
                if (rand < 0.1) {
                    cell.content = { type: "bonus", subtype: "atk" };
                } else if (rand < 0.2) {
                    cell.content = { type: "bonus", subtype: "def" };
                } else if (rand < 0.3) {
                    cell.content = { type: "trap" };
                }
            }

            gameState.board[r][c] = cell;
        }
    }
}
