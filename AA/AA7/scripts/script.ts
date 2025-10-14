// --- CONSTANTES E ESTADO DO JOGO ---
const EMPTY: number = 0;
const BLACK = 1;
const WHITE = 2;
const BOARD_SIZE = 8;
const AI_DEPTH = 4;

let board = [];
let currentPlayer = BLACK;
let selectedPiece = null; // { row, col }
let legalMoves = [];
let gameOver = false;
let isBotTurn = false;

const boardContainer = document.getElementById('board-container');
const statusEl = document.getElementById('status');
const resetButton = document.getElementById('reset-button');

// --- LÓGICA DE INICIALIZAÇÃO E RENDERIZAÇÃO ---
function initializeGame() {
    const board = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(EMPTY));
    
    // Posicionar peças pretas
    for (let i = 1; i < BOARD_SIZE - 1; i++) {
        board[0][i] = BLACK;
        board[BOARD_SIZE - 1][i] = BLACK;
    }
    // Posicionar peças brancas
    for (let i = 1; i < BOARD_SIZE - 1; i++) {
        board[i][0] = WHITE;
        board[i][BOARD_SIZE - 1] = WHITE;
    }

    currentPlayer = BLACK;
    selectedPiece = null;
    legalMoves = [];
    gameOver = false;
    isBotTurn = false;
    renderBoard();
    updateStatus();
}

function renderBoard() {
    boardContainer.innerHTML = '';
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const square = document.createElement('div');
            square.classList.add('square', (r + c) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = r;
            square.dataset.col = c;

            const pieceType = board[r][c];
            if (pieceType !== EMPTY) {
                const piece = document.createElement('div');
                piece.classList.add('piece', pieceType === BLACK ? 'black-piece' : 'white-piece');
                square.appendChild(piece);

                if (selectedPiece && selectedPiece.row === r && selectedPiece.col === c) {
                    piece.classList.add('selected');
                }
            } else {
                if (legalMoves.some(move => move.to.row === r && move.to.col === c)) {
                    const dot = document.createElement('div');
                    dot.classList.add('legal-move-dot');
                    square.appendChild(dot);
                }
            }
            boardContainer.appendChild(square);
        }
    }
}


// --- LÓGICA DAS REGRAS DO JOGO ---
function countPiecesInLine(row, col, dRow, dCol) {
    let count = 0;
    // Percorre para frente na linha/coluna/diagonal
    for (let i = -BOARD_SIZE; i < BOARD_SIZE; i++) {
        const r = row + i * dRow;
        const c = col + i * dCol;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] !== EMPTY) {
            count++;
        }
    }
    return count;
}


function getLegalMovesForPiece(row, col) {
    const moves = [];
    const piece = board[row][col];
    if (piece === EMPTY) return moves;

    const opponent = (piece === BLACK) ? WHITE : BLACK;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];

    for (const [dRow, dCol] of directions) {
        const moveDistance = countPiecesInLine(row, col, dRow, dCol);
        const targetRow = row + dRow * moveDistance;
        const targetCol = col + dCol * moveDistance;
        
        // 1. Verificar se o movimento está dentro do tabuleiro
        if (targetRow < 0 || targetRow >= BOARD_SIZE || targetCol < 0 || targetCol >= BOARD_SIZE) continue;

        // 2. Não pode mover para uma casa com peça da mesma cor
        if (board[targetRow][targetCol] === piece) continue;

        // 3. Verificar se há peças adversárias bloqueando o caminho
        let isPathBlocked = false;
        for (let i = 1; i < moveDistance; i++) {
            const pathRow = row + dRow * i;
            const pathCol = col + dCol * i;
            if (board[pathRow][pathCol] === opponent) {
                isPathBlocked = true;
                break;
            }
        }
        if (isPathBlocked) continue;
        
        moves.push({ from: { row, col }, to: { row: targetRow, col: targetCol } });
    }
    return moves;
}

function getAllLegalMoves(player, currentBoard) {
    let allMoves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (currentBoard[r][c] === player) {
                const originalBoard = board; // Salva o tabuleiro global
                board = currentBoard; // Usa o tabuleiro passado para o cálculo
                const pieceMoves = getLegalMovesForPiece(r, c);
                board = originalBoard; // Restaura o tabuleiro global
                allMoves.push(...pieceMoves);
            }
        }
    }
    return allMoves;
}

function checkWin(player, currentBoard) {
    const pieces = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (currentBoard[r][c] === player) {
                pieces.push({ r, c });
            }
        }
    }

    if (pieces.length <= 1) return pieces.length === 1; // Vitória se sobrar 1 peça

    const visited = new Set();
    const stack = [pieces[0]];
    visited.add(`${pieces[0].r},${pieces[0].c}`);

    while (stack.length > 0) {
        const current = stack.pop();
        for (const piece of pieces) {
            if (!visited.has(`${piece.r},${piece.c}`)) {
                const dr = Math.abs(current.r - piece.r);
                const dc = Math.abs(current.c - piece.c);
                if (dr <= 1 && dc <= 1) {
                    visited.add(`${piece.r},${piece.c}`);
                    stack.push(piece);
                }
            }
        }
    }
    return visited.size === pieces.length;
}

function makeMove(move) {
    const piece = board[move.from.row][move.from.col];
    board[move.to.row][move.to.col] = piece;
    board[move.from.row][move.from.col] = EMPTY;
    
    selectedPiece = null;
    legalMoves = [];
    currentPlayer = (currentPlayer === BLACK) ? WHITE : BLACK;
    
    renderBoard();
    
    if (checkWin(piece, board)) {
        gameOver = true;
        statusEl.textContent = `${piece === BLACK ? 'Pretas (Você)' : 'Brancas (IA)'} venceram!`;
        return;
    }

    updateStatus();
    
    if (!gameOver && currentPlayer === WHITE) {
        triggerAIMove();
    }
}

// --- INTERAÇÃO DO USUÁRIO ---
boardContainer.addEventListener('click', (e) => {
    if (gameOver || isBotTurn) return;

    const square = e.target.closest('.square');
    if (!square) return;

    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    // Se uma jogada legal foi clicada
    const legalMove = legalMoves.find(move => move.to.row === row && move.to.col === col);
    if (legalMove) {
        makeMove(legalMove);
        return;
    }
    
    // Se uma peça do jogador atual foi clicada
    if (board[row][col] === currentPlayer) {
        selectedPiece = { row, col };
        legalMoves = getLegalMovesForPiece(row, col);
        renderBoard();
    } else {
        // Clicou em qualquer outro lugar, deseleciona
        selectedPiece = null;
        legalMoves = [];
        renderBoard();
    }
});

resetButton.addEventListener('click', initializeGame);

function updateStatus() {
    if (gameOver) return;
    if (isBotTurn) {
        statusEl.textContent = 'IA (Brancas) está pensando...';
    } else {
        statusEl.textContent = `Vez das ${currentPlayer === BLACK ? 'Pretas (Você)' : 'Brancas (IA)'}`;
    }
}

function triggerAIMove() {
    isBotTurn = true;
    updateStatus();
    // Pequeno delay para a UI atualizar e dar a sensação de que a IA está "pensando"
    setTimeout(() => {
        const bestMove = findBestMove();
        if (bestMove) {
            makeMove(bestMove);
        } else {
            // Se a IA não tem movimentos, o outro jogador vence
            gameOver = true;
            statusEl.textContent = 'Pretas (Você) venceram! A IA não pode se mover.';
        }
        isBotTurn = false;
        updateStatus();
    }, 500);
}

// --- LÓGICA DA INTELIGÊNCIA ARTIFICIAL (MINIMAX) ---

function findBestMove() {
    // A IA é o jogador que maximiza (WHITE), o humano minimiza (BLACK)
    let bestScore = -Infinity;
    let bestMove = null;
    const moves = getAllLegalMoves(WHITE, board);

    for (const move of moves) {
        // Simula o movimento
        const tempBoard = board.map(row => [...row]);
        const piece = tempBoard[move.from.row][move.from.col];
        const capturedPiece = tempBoard[move.to.row][move.to.col];
        tempBoard[move.to.row][move.to.col] = piece;
        tempBoard[move.from.row][move.from.col] = EMPTY;
        
        const score = minimax(tempBoard, AI_DEPTH - 1, -Infinity, Infinity, false); // Próximo turno é do minimizador

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}

function minimax(currentBoard, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0 || checkWin(BLACK, currentBoard) || checkWin(WHITE, currentBoard)) {
        return evaluateBoard(currentBoard);
    }

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        const moves = getAllLegalMoves(WHITE, currentBoard);
        for (const move of moves) {
            const tempBoard = currentBoard.map(row => [...row]);
            const piece = tempBoard[move.from.row][move.from.col];
            tempBoard[move.to.row][move.to.col] = piece;
            tempBoard[move.from.row][move.from.col] = EMPTY;
            
            const evaluation = minimax(tempBoard, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) {
                break; // Poda alfa-beta
            }
        }
        return maxEval;
    } else { // isMinimizingPlayer
        let minEval = Infinity;
        const moves = getAllLegalMoves(BLACK, currentBoard);
        for (const move of moves) {
            const tempBoard = currentBoard.map(row => [...row]);
            const piece = tempBoard[move.from.row][move.from.col];
            tempBoard[move.to.row][move.to.col] = piece;
            tempBoard[move.from.row][move.from.col] = EMPTY;

            const evaluation = minimax(tempBoard, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) {
                break; // Poda alfa-beta
            }
        }
        return minEval;
    }
}

function evaluateBoard(currentBoard) {
    if (checkWin(WHITE, currentBoard)) return 10000;
    if (checkWin(BLACK, currentBoard)) return -10000;

    let score = 0;
    const whitePieces = [];
    const blackPieces = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (currentBoard[r][c] === WHITE) whitePieces.push({ r, c });
            if (currentBoard[r][c] === BLACK) blackPieces.push({ r, c });
        }
    }
    
    // Heurística 1: Contagem de peças
    score += (whitePieces.length - blackPieces.length) * 10;
    
    // Heurística 2: Conectividade (distância média ao centro de massa)
    // Uma menor distância ao centro de massa significa que as peças estão mais agrupadas.
    if (whitePieces.length > 0) {
        const whiteCenter = getCenterOfMass(whitePieces);
        const whiteCohesion = getCohesionScore(whitePieces, whiteCenter);
        score -= whiteCohesion; // Queremos minimizar a distância, então subtraímos
    }
    if (blackPieces.length > 0) {
        const blackCenter = getCenterOfMass(blackPieces);
        const blackCohesion = getCohesionScore(blackPieces, blackCenter);
        score += blackCohesion; // Queremos que o oponente seja menos coeso, então somamos
    }

    return score;
}

function getCenterOfMass(pieces) {
    let totalRow = 0, totalCol = 0;
    pieces.forEach(p => {
        totalRow += p.r;
        totalCol += p.c;
    });
    return { r: totalRow / pieces.length, c: totalCol / pieces.length };
}

function getCohesionScore(pieces, center) {
    let totalDistance = 0;
    pieces.forEach(p => {
        totalDistance += Math.sqrt(Math.pow(p.r - center.r, 2) + Math.pow(p.c - center.c, 2));
    });
    return totalDistance;
}

// --- INICIAR O JOGO ---
initializeGame();