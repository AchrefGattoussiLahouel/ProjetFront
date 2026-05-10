import { initBoard, gameState } from "./gameState.js";
import { render } from "./render.js";

// expose to HTML onclick
window.rollStart = (p) =>
    import('./gameActions.js').then(m => m.rollStartGame(p));

window.endTurnPlayer = (p) =>
    import('./gameActions.js').then(m => m.endTurnFor(p)).then(res => {
        if (!res.ok) {
            document.getElementById('log-text').textContent =
                `Impossible : ${res.reason}`;
        }
    });

window.selectedUnitType = null;

initBoard();
render();

document.getElementById('current-phase').textContent =
    gameState.phase.toUpperCase();