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
// expose menu control functions to HTML
window.showMainMenu = (fullReset = false) => {
    // if requested from end popup, reset game and show menu
    document.getElementById('modal-end')?.classList.remove('open');
    if (fullReset) {
        // reset minimal state so menu starts fresh
        gameState.board = [];
        gameState.units = [];
        gameState.unitIdCounter = 0;
        gameState.currentPlayer = 1;
        gameState.phase = 'placement';
        gameState.turn = 1;
        gameState.gameStarted = false;
        gameState.startRolls = {1:null,2:null};
        // render blank board (menu will create real board on start)
        initBoard();
        render();
    }
    document.getElementById('modal-mainmenu').classList.add('open');
};
window.closeMainMenu = () => {
    document.getElementById('modal-mainmenu').classList.remove('open');
};

window.startNewGame = () => {
    const size = parseInt(document.getElementById('menu-size').value, 10) || 8;
    const mode = document.getElementById('menu-mode').value;
    const timer = parseInt(document.getElementById('menu-timer').value, 10) || 60;
    const vsBot = mode === 'bot';

    // store last settings
    window.__lastSettings = { size, vsBot, timer };

    // apply settings
    gameState.size = size;
    gameState.turnDuration = timer;
    gameState.botEnabled = vsBot;

    // reset essential game state
    gameState.board = [];
    gameState.units = [];
    gameState.unitIdCounter = 0;
    gameState.currentPlayer = 1;
    gameState.phase = 'placement';
    gameState.turn = 1;
    gameState.selected = null;
    gameState.highlighted = [];
    gameState.startRolls = { 1: null, 2: null };
    gameState.gameStarted = false;
    gameState.placementStarter = null;
    gameState.turnBonus = { 1: 0, 2: 0 };
    gameState.turnRolls = { 1: null, 2: null };
    gameState.requireTurnRolls = false;
    gameState.tempRolls = { 1: null, 2: null };
    gameState.players = [
        { id:1, gold:50, cells:[], units:[], placed:0, availablePieces: { Soldat:3, Cavalier:1, Tank:1 } },
        { id:2, gold:50, cells:[], units:[], placed:0, availablePieces: { Soldat:3, Cavalier:1, Tank:1 } },
    ];

    // initialize board and render
    initBoard();
    render();

    // hide menu
    closeMainMenu();

    // if vs bot, auto-roll for bot to speed up start (bot 'thinks')
    if (vsBot) import('./bot.js').then(m => m.autoRollStart());
};

window.showEndPopup = (winner) => {
    const modal = document.getElementById('modal-end');
    const title = document.getElementById('end-title');
    const body = document.getElementById('end-body');
    title.textContent = `JOUEUR ${winner} GAGNE !`;
    body.textContent = `Bravo — Joueur ${winner} remporte la partie.`;
    modal.classList.add('open');
};

window.replayGame = () => {
    const s = window.__lastSettings || { size:8, vsBot:false, timer:60 };
    document.getElementById('menu-size').value = s.size;
    document.getElementById('menu-mode').value = s.vsBot ? 'bot' : 'pvp';
    document.getElementById('menu-timer').value = s.timer;
    document.getElementById('modal-end').classList.remove('open');
    startNewGame();
};

// Initialize with menu open by default — user must configure
document.getElementById('modal-mainmenu').classList.add('open');

// initial render (board will be created when starting game)
initBoard();
render();

document.getElementById('current-phase').textContent = gameState.phase.toUpperCase();

// monitor for bot turns and trigger its actions
setInterval(() => {
    if (gameState.botEnabled && gameState.gameStarted && gameState.currentPlayer === 2) {
        import('./bot.js').then(m => m.takeTurn());
    }
}, 700);

// When game enters 'end' phase, show end popup with winner
setInterval(() => {
    const modal = document.getElementById('modal-end');
    if (gameState.phase === 'end' && modal && !modal.classList.contains('open')) {
        import('./gameState.js').then(m => {
            const w = m.checkVictory();
            if (w) window.showEndPopup(w);
        });
    }
}, 600);