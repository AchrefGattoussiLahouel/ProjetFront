import { gameState } from "./gameState.js";

export function handleCellClick(r, c) {
    const cellData = gameState.board[r][c];

    document.getElementById('log-text').textContent =
        `Case (${r},${c}) — ${cellData.zone}${cellData.content ? ' — ' + cellData.content.type : ''}`;
}