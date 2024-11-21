const BOARD_WIDTH = 10;
        const BOARD_HEIGHT = 20;
        const BLOCK_SIZE = 30;
        const COLORS = [
            '#000000',
            '#FF0D72', // I
            '#0DC2FF', // J
            '#0DFF72', // L
            '#F538FF', // O
            '#FF8E0D', // S
            '#FFE138', // T
            '#3877FF', // Z
        ];

        const SHAPES = [
            null,
            [[1, 1, 1, 1]], // I
            [[2, 0, 0], [2, 2, 2]], // J
            [[0, 0, 3], [3, 3, 3]], // L
            [[4, 4], [4, 4]], // O
            [[0, 5, 5], [5, 5, 0]], // S
            [[0, 6, 0], [6, 6, 6]], // T
            [[7, 7, 0], [0, 7, 7]], // Z
        ];

        const canvas = document.getElementById('game-board');
        const nextPieceCanvas = document.getElementById('next-piece-canvas');
        const ctx = canvas.getContext('2d');
        const nextCtx = nextPieceCanvas.getContext('2d');

        canvas.width = BLOCK_SIZE * BOARD_WIDTH;
        canvas.height = BLOCK_SIZE * BOARD_HEIGHT;
        nextPieceCanvas.width = BLOCK_SIZE * 4;
        nextPieceCanvas.height = BLOCK_SIZE * 4;

        ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
        nextCtx.scale(BLOCK_SIZE, BLOCK_SIZE);

        let board = createBoard();
        let score = 0;
        let lines = 0;
        let level = 1;
        let gameLoop;
        let dropCounter = 0;
        let dropInterval = 1000;
        let lastTime = 0;
        let gameStarted = false;
        let player = {
            pos: {x: 0, y: 0},
            matrix: null,
            score: 0
        };
        let nextPiece = null;

        function createBoard() {
            return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
        }

        function drawBlock(context, x, y, colorIndex) {
            context.fillStyle = COLORS[colorIndex];
            context.fillRect(x, y, 1, 1);
            context.strokeStyle = '#fff';
            context.lineWidth = 0.05;
            context.strokeRect(x, y, 1, 1);
        }

        function draw() {
            // Clear the canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw the board
            drawMatrix(ctx, board, {x: 0, y: 0});

            // Draw the current piece
            if (player.matrix) {
                drawMatrix(ctx, player.matrix, player.pos);
            }
        }

        function drawMatrix(context, matrix, offset) {
            matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        drawBlock(context, x + offset.x, y + offset.y, value);
                    }
                });
            });
        }

        function drawNextPiece() {
            // Clear next piece canvas
            nextCtx.fillStyle = '#000';
            nextCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

            if (nextPiece) {
                const offset = {
                    x: (4 - nextPiece[0].length) / 2,
                    y: (4 - nextPiece.length) / 2
                };
                drawMatrix(nextCtx, nextPiece, offset);
            }
        }

        function createPiece() {
            const pieceIndex = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
            return SHAPES[pieceIndex].map(row => [...row]);
        }

        function collide(board, player) {
    const [matrix, pos] = [player.matrix, player.pos];

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0) {
                if (
                    y + pos.y < 0 || // Top boundary
                    y + pos.y >= board.length || // Bottom boundary
                    x + pos.x < 0 || // Left boundary
                    x + pos.x >= board[0].length || // Right boundary
                    board[y + pos.y][x + pos.x] !== 0 // Block overlap
                ) {
                    return true;
                }
            }
        }
    }

    return false;
}





        function merge(board, player) {
            player.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        board[y + player.pos.y][x + player.pos.x] = value;
                    }
                });
            });
        }

        function rotate(matrix, dir) {
            const size = matrix.length;
            const rotated = Array.from({ length: size }, () => Array(size).fill(0));

            for (let y = 0; y < size; ++y) {
                for (let x = 0; x < size; ++x) {
                    if (dir > 0) {
                        // Clockwise rotation
                        rotated[x][size - 1 - y] = matrix[y][x];
                    } else {
                        // Counter-clockwise rotation
                        rotated[size - 1 - x][y] = matrix[y][x];
                    }
                }
            }

            // Copy back the rotated matrix
            for (let y = 0; y < size; ++y) {
                for (let x = 0; x < size; ++x) {
                    matrix[y][x] = rotated[y][x];
                }
            }
        }       


        function playerDrop() {
            player.pos.y++;
            if (collide(board, player)) {
                player.pos.y--;
                merge(board, player);
                playerReset();
                sweep();
                updateScore();
            }
            dropCounter = 0;
        }

        function playerMove(dir) {
            player.pos.x += dir;
            if (collide(board, player)) {
                player.pos.x -= dir;
            }
        }

        function playerRotate(direction) {
    const originalMatrix = player.matrix;
    const paddedMatrix = padMatrix(originalMatrix); // Pad before rotation
    const rotatedMatrix = rotateMatrix(paddedMatrix, direction);

    const originalPosition = player.pos.x;
    let offset = 0;

    // Validate the rotated position
    while (collide(board, { ...player, matrix: rotatedMatrix })) {
        offset = offset > 0 ? -offset : 1 - offset; // Alternate offset direction

        player.pos.x += offset;

        // Cancel rotation if the piece doesn't fit
        if (Math.abs(offset) > rotatedMatrix[0].length) {
            player.pos.x = originalPosition; // Reset position
            return;
        }
    }

    // Commit the rotation
    player.matrix = rotatedMatrix;
}

function rotateMatrix(matrix, direction) {
    const size = matrix.length;
    const rotated = Array.from({ length: size }, () => Array(size).fill(0));

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (direction > 0) {
                rotated[x][size - y - 1] = matrix[y][x]; // Clockwise
            } else {
                rotated[size - x - 1][y] = matrix[y][x]; // Counter-clockwise
            }
        }
    }

    return rotated;
}
function padMatrix(matrix) {
    const size = 4;
    const padded = Array.from({ length: size }, () => Array(size).fill(0));

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            padded[y][x] = matrix[y][x];
        }
    }

    return padded;
}




        function playerReset() {
            player.matrix = nextPiece || createPiece();
            nextPiece = createPiece();
            
            // Position the piece at the top-middle of the board
            player.pos.y = 0;
            player.pos.x = Math.floor((BOARD_WIDTH - player.matrix[0].length) / 2);

            // Check for game over
            if (collide(board, player)) {
                gameOver();
                return;
            }

            drawNextPiece();
        }

        function sweep() {
            let rowCount = 1;
            let linesCleared = 0;
            
            outer: for (let y = board.length - 1; y > 0; --y) {
                for (let x = 0; x < board[y].length; ++x) {
                    if (board[y][x] === 0) {
                        continue outer;
                    }
                }

                const row = board.splice(y, 1)[0].fill(0);
                board.unshift(row);
                ++y;

                linesCleared += rowCount;
            }

            if (linesCleared > 0) {
                lines += linesCleared;
                score += linesCleared * 100 * level;
                level = Math.floor(lines / 10) + 1;
                dropInterval = Math.max(100, 1000 - (level - 1) * 100);
                updateScore();
            }
        }

        function updateScore() {
            document.getElementById('score').textContent = score;
            document.getElementById('lines').textContent = lines;
            document.getElementById('level').textContent = level;
        }

        function gameOver() {
            cancelAnimationFrame(gameLoop);
            gameStarted = false;
            document.getElementById('final-score').textContent = score;
            document.getElementById('game-over').style.display = 'block';
            document.getElementById('start-btn').textContent = 'Start New Game';
        }

        function resetGame() {
            // Reset all game variables
            board = createBoard();
            score = 0;
            lines = 0;
            level = 1;
            dropCounter = 0;
            dropInterval = 1000;
            lastTime = 0;
            nextPiece = null;
            
            // Hide game over screen
            document.getElementById('game-over').style.display = 'none';
            
            // Update display
            updateScore();
            
            // Start new game
            startGame();
        }

        function update(time = 0) {
            if (!gameStarted) return;

            const deltaTime = time - lastTime;
            lastTime = time;
            dropCounter += deltaTime;

            if (dropCounter > dropInterval) {
                playerDrop();
            }

            draw();
            gameLoop = requestAnimationFrame(update);
        }

        function startGame() {
            if (!gameStarted) {
                gameStarted = true;
                playerReset();
                update();
                document.getElementById('start-btn').textContent = 'Game In Progress';
            }
        }

        document.addEventListener('keydown', event => {
            if (!gameStarted) return;

            switch(event.keyCode) {
                case 37: // Left
                    playerMove(-1);
                    break;
                case 39: // Right
                    playerMove(1);
                    break;
                case 40: // Down
                    playerDrop();
                    break;
                case 38: // Up
                    playerRotate(1);
                    break;
                case 32: // Space
                    while (!collide(board, player)) {
                        player.pos.y++;
                    }
                    player.pos.y--;
                    playerDrop();
                    break;
            }
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            if (!gameStarted) {
                resetGame();
            }
        });
        // Event listeners for mobile controls
        document.getElementById('left-btn').addEventListener('click', () => playerMove(-1));
        document.getElementById('right-btn').addEventListener('click', () => playerMove(1));
        document.getElementById('down-btn').addEventListener('click', playerDrop);
        document.getElementById('rotate-btn').addEventListener('click', () => playerRotate(1));
        document.getElementById('hard-drop-btn').addEventListener('click', () => {
    while (!collide(board, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    playerDrop();
});


        draw();