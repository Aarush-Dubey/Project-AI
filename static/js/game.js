document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const gridTiles = document.querySelector('.grid-tiles');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const gameMessage = document.querySelector('.game-message');
    const messageText = gameMessage.querySelector('p');
    const retryButton = document.querySelector('.retry-button');

    // Control buttons
    const newGameButton = document.getElementById('new-game');
    const upButton = document.getElementById('up-button');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const downButton = document.getElementById('down-button');
    const randomMoveButton = document.getElementById('random-move');
    const greedyMoveButton = document.getElementById('greedy-move');
    const autoRandomButton = document.getElementById('auto-random');
    const autoGreedyButton = document.getElementById('auto-greedy');

    // Game state
    let board = [];
    let score = 0;
    let bestScore = localStorage.getItem('bestScore') || 0;
    let gameOver = false;
    let isAnimating = false;
    let moveQueue = [];
    let processingQueue = false;
    let autoPlayInProgress = false;
    let autoPlayPaused = false;
    let autoPlaySpeed = 'slow'; // slow, normal, fast - default to slow for human-like pace
    let autoPlayTimeouts = []; // To store all timeouts for cancellation

    // Set best score from localStorage
    bestScoreElement.textContent = bestScore;

    // Initialize game
    startNewGame();

    // Event listeners
    newGameButton.addEventListener('click', startNewGame);
    retryButton.addEventListener('click', startNewGame);

    // Movement controls
    upButton.addEventListener('click', () => queueMove('up'));
    leftButton.addEventListener('click', () => queueMove('left'));
    rightButton.addEventListener('click', () => queueMove('right'));
    downButton.addEventListener('click', () => queueMove('down'));

    // AI controls
    randomMoveButton.addEventListener('click', () => queueAIMove('random'));
    greedyMoveButton.addEventListener('click', () => queueAIMove('greedy'));
    autoRandomButton.addEventListener('click', () => startAutoPlay('random'));
    autoGreedyButton.addEventListener('click', () => startAutoPlay('greedy'));

    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);

    // Functions
    function startNewGame() {
        if (isAnimating && !autoPlayInProgress) return;
        
        // Cancel any auto play in progress
        if (autoPlayInProgress) {
            cancelAutoPlay();
        }
        
        disableControls();
        showLoading();
        
        fetch('/new_game', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            board = data.board;
            score = data.score;
            gameOver = data.game_over;
            
            updateUI();
            hideGameMessage();
            enableControls();
            hideLoading();
            
            // Clear any pending moves
            moveQueue = [];
            processingQueue = false;
        })
        .catch(error => {
            console.error('Error starting new game:', error);
            enableControls();
            hideLoading();
        });
    }

    function queueMove(direction) {
        if (gameOver || autoPlayInProgress) return;
        
        moveQueue.push({ type: 'manual', direction });
        
        if (!processingQueue) {
            processMoveQueue();
        }
    }

    function queueAIMove(agent) {
        if (gameOver || autoPlayInProgress) return;
        
        moveQueue.push({ type: 'ai', agent });
        
        if (!processingQueue) {
            processMoveQueue();
        }
    }

    function processMoveQueue() {
        if (moveQueue.length === 0 || isAnimating || gameOver) {
            processingQueue = false;
            return;
        }
        
        processingQueue = true;
        isAnimating = true;
        
        const moveAction = moveQueue.shift();
        
        if (moveAction.type === 'manual') {
            makeMove(moveAction.direction);
        } else if (moveAction.type === 'ai') {
            makeAIMove(moveAction.agent);
        }
    }

    function makeMove(direction) {
        disableControls();
        addMoveEffect(direction);
        
        fetch('/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ direction })
        })
        .then(response => response.json())
        .then(data => {
            board = data.board;
            score = data.score;
            gameOver = data.game_over;
            
            updateUI();
            
            if (gameOver) {
                showGameOverMessage();
            }
            
            setTimeout(() => {
                enableControls();
                isAnimating = false;
                processMoveQueue(); // Process next move in queue
            }, 250);
        })
        .catch(error => {
            console.error('Error making move:', error);
            enableControls();
            isAnimating = false;
            processMoveQueue();
        });
    }

    function makeAIMove(agent) {
        disableControls();
        showAIThinking();
        
        fetch('/ai_move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agent })
        })
        .then(response => response.json())
        .then(data => {
            board = data.board;
            score = data.score;
            gameOver = data.game_over;
            
            if (data.move) {
                addMoveEffect(data.move);
            }
            
            updateUI();
            
            if (gameOver) {
                showGameOverMessage();
            }
            
            setTimeout(() => {
                enableControls();
                hideAIThinking();
                isAnimating = false;
                processMoveQueue(); // Process next move in queue
            }, 250);
        })
        .catch(error => {
            console.error('Error making AI move:', error);
            enableControls();
            hideAIThinking();
            isAnimating = false;
            processMoveQueue();
        });
    }

    function startAutoPlay(agent) {
        if (isAnimating || autoPlayInProgress) return;
        
        autoPlayInProgress = true;
        autoPlayPaused = false;
        disableControls();
        showLoading();
        
        // Clear any previous timeouts
        autoPlayTimeouts.forEach(timeout => clearTimeout(timeout));
        autoPlayTimeouts = [];
        
        fetch('/auto_play', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ agent })
        })
        .then(response => response.json())
        .then(data => {
            // Instead of just showing the final state, we'll animate through all moves
            hideLoading();
            showAutoPlayingMessage(agent, data.move_history.length - 1);
            
            // Start playing the sequence of moves
            playMoveSequence(data.move_history, 0, agent);
        })
        .catch(error => {
            console.error('Error auto playing:', error);
            enableControls();
            hideLoading();
            autoPlayInProgress = false;
            moveQueue = [];
            processingQueue = false;
        });
    }
    
    function playMoveSequence(moveHistory, index, agent) {
        if (index >= moveHistory.length || autoPlayPaused) {
            // All moves played or paused
            if (index >= moveHistory.length) {
                // End of move history, but don't set game as over unless it actually is
                if (board.flat().includes(0) || canMoveInAnyDirection()) {
                    // Game isn't actually over, just the autoplay sequence finished
                    autoPlayInProgress = false;
                    hideGameMessage();
                    enableControls();
                } else {
                    // Game is truly over
                    gameOver = true;
                    showGameOverMessage();
                    enableControls();
                    autoPlayInProgress = false;
                }
            } else if (autoPlayPaused) {
                // Just paused, don't end the game
                autoPlayInProgress = false;
            }
            return;
        }

        const moveState = moveHistory[index];
        
        // Update the game state
        board = moveState.board;
        score = moveState.score;
        
        // Show direction animation if not the first state
        if (index > 0 && moveState.move) {
            addMoveEffect(moveState.move);
        }
        
        // Update the UI with this move's state
        updateUI(index > 0 ? moveState.move : null);
        
        // Human-like speed settings (milliseconds)
        let delay;
        switch(autoPlaySpeed) {
            case 'fast': delay = agent === 'random' ? 300 : 200; break;
            case 'normal': delay = agent === 'random' ? 800 : 600; break;
            default: delay = agent === 'random' ? 1200 : 1000; // slow (human-like)
        }
        
        // Update the move counter
        const progressElement = document.querySelector('.auto-progress');
        if (progressElement) {
            progressElement.textContent = `Move ${index} / ${moveHistory.length - 1}`;
        }
        
        // Schedule the next move
        const timeout = setTimeout(() => {
            playMoveSequence(moveHistory, index + 1, agent);
        }, delay);
        
        // Store the timeout ID for potential cancellation
        autoPlayTimeouts.push(timeout);
    }
    
    function cancelAutoPlay() {
        autoPlayPaused = true;
        autoPlayInProgress = false;
        
        // Clear all pending timeouts
        autoPlayTimeouts.forEach(timeout => clearTimeout(timeout));
        autoPlayTimeouts = [];
        
        hideGameMessage();
        enableControls();
        
        // Don't end the game, just let user continue playing manually
        // The game state is already updated with the last move
    }
    
    function setAutoPlaySpeed(speed) {
        autoPlaySpeed = speed;
        
        // Update speed buttons UI
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`.speed-btn[data-speed="${speed}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    function updateUI(lastMove) {
        // Update score
        scoreElement.textContent = score;
        
        // Update best score if needed
        if (score > bestScore) {
            bestScore = score;
            bestScoreElement.textContent = bestScore;
            localStorage.setItem('bestScore', bestScore);
        }
        
        // Keep track of existing values for animation
        const existingTiles = new Map();
        document.querySelectorAll('.tile').forEach(tile => {
            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);
            existingTiles.set(`${row},${col}`, parseInt(tile.textContent));
        });
        
        // Clear existing tiles
        gridTiles.innerHTML = '';
        
        // Add new tiles
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const value = board[row][col];
                if (value !== 0) {
                    const isNew = !existingTiles.has(`${row},${col}`) || 
                                 existingTiles.get(`${row},${col}`) !== value;
                    createTile(row, col, value, isNew);
                }
            }
        }
    }

    function createTile(row, col, value, isNew) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        if (isNew) {
            tile.classList.add('new');
        }
        tile.textContent = value;
        // Use percentage positioning to work with responsive layout
        tile.style.top = `${row * 25}%`;
        tile.style.left = `${col * 25}%`;
        // Store row and col as data attributes for easier access later
        tile.dataset.row = row;
        tile.dataset.col = col;
        gridTiles.appendChild(tile);
    }

    function showGameOverMessage() {
        messageText.textContent = 'Game Over!';
        gameMessage.classList.add('game-over');
    }
    
    function showAutoPlayingMessage(agent, totalMoves) {
        // Clean up game message first
        gameMessage.innerHTML = '';
        
        // Add the indicator in the corner
        const indicatorElement = document.createElement('div');
        indicatorElement.className = 'auto-play-indicator';
        indicatorElement.textContent = `AI ${agent.charAt(0).toUpperCase() + agent.slice(1)} Mode`;
        gameMessage.appendChild(indicatorElement);
        
        // Create a control panel outside the board
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'auto-play-controls';
        
        // Position the controls in a location that doesn't overlap with any tiles
        // Upper-right corner to avoid covering any tiles
        controlsDiv.style.right = '15px';
        controlsDiv.style.top = '15px';
        controlsDiv.style.bottom = 'auto';
        controlsDiv.style.transform = 'none';
        controlsDiv.style.zIndex = '999';  // Ensure it's above tiles
        
        // Add move counter
        const progressDiv = document.createElement('div');
        progressDiv.className = 'auto-progress';
        progressDiv.textContent = `Move ${0} / ${totalMoves}`;
        controlsDiv.appendChild(progressDiv);
        
        // Add speed controls
        const speedControlsDiv = document.createElement('div');
        speedControlsDiv.className = 'speed-controls';
        
        const speedLabels = ['Slow', 'Normal', 'Fast'];
        speedLabels.forEach(speed => {
            const btn = document.createElement('button');
            btn.className = `speed-btn ${speed.toLowerCase() === 'slow' ? 'active' : ''}`;
            btn.setAttribute('data-speed', speed.toLowerCase());
            btn.textContent = speed;
            btn.addEventListener('click', (e) => {
                setAutoPlaySpeed(e.target.dataset.speed);
                e.stopPropagation();
            });
            speedControlsDiv.appendChild(btn);
        });
        
        controlsDiv.appendChild(speedControlsDiv);
        
        // Add direction controls for when autoplay is active
        const directionControlsDiv = document.createElement('div');
        directionControlsDiv.className = 'direction-controls';
        
        // Up button
        const upButton = document.createElement('button');
        upButton.className = 'direction-btn up-btn';
        upButton.innerHTML = '&#8593;'; // Up arrow
        upButton.addEventListener('click', (e) => {
            if (!autoPlayPaused) {
                cancelAutoPlay();
            }
            queueMove('up');
            e.stopPropagation();
        });
        
        // Left and Right buttons (in a row)
        const horizontalDiv = document.createElement('div');
        horizontalDiv.className = 'horizontal-btns';
        
        const leftButton = document.createElement('button');
        leftButton.className = 'direction-btn left-btn';
        leftButton.innerHTML = '&#8592;'; // Left arrow
        leftButton.addEventListener('click', (e) => {
            if (!autoPlayPaused) {
                cancelAutoPlay();
            }
            queueMove('left');
            e.stopPropagation();
        });
        
        const rightButton = document.createElement('button');
        rightButton.className = 'direction-btn right-btn';
        rightButton.innerHTML = '&#8594;'; // Right arrow
        rightButton.addEventListener('click', (e) => {
            if (!autoPlayPaused) {
                cancelAutoPlay();
            }
            queueMove('right');
            e.stopPropagation();
        });
        
        horizontalDiv.appendChild(leftButton);
        horizontalDiv.appendChild(rightButton);
        
        // Down button
        const downButton = document.createElement('button');
        downButton.className = 'direction-btn down-btn';
        downButton.innerHTML = '&#8595;'; // Down arrow
        downButton.addEventListener('click', (e) => {
            if (!autoPlayPaused) {
                cancelAutoPlay();
            }
            queueMove('down');
            e.stopPropagation();
        });
        
        // Assemble the direction controls
        directionControlsDiv.appendChild(upButton);
        directionControlsDiv.appendChild(horizontalDiv);
        directionControlsDiv.appendChild(downButton);
        
        controlsDiv.appendChild(directionControlsDiv);
        
        // Add cancel button
        const cancelBtn = document.createElement('a');
        cancelBtn.className = 'cancel-button';
        cancelBtn.textContent = 'Stop';
        cancelBtn.addEventListener('click', (e) => {
            cancelAutoPlay();
            e.stopPropagation();
        });
        
        controlsDiv.appendChild(cancelBtn);
        gameMessage.appendChild(controlsDiv);
        
        // Add auto-playing class to show the message
        gameMessage.classList.add('auto-playing');
    }

    function hideGameMessage() {
        gameMessage.classList.remove('game-over', 'auto-playing');
        gameMessage.innerHTML = '<p></p><div class="lower"><a class="retry-button">Try again</a></div>';
        
        // Re-add event listener to retry button after recreating it
        const newRetryButton = gameMessage.querySelector('.retry-button');
        if (newRetryButton) {
            newRetryButton.addEventListener('click', startNewGame);
        }
    }

    function handleKeyPress(event) {
        if (gameOver || isAnimating || autoPlayInProgress) return;
        
        switch(event.key) {
            case 'ArrowUp':
                queueMove('up');
                event.preventDefault();
                break;
            case 'ArrowDown':
                queueMove('down');
                event.preventDefault();
                break;
            case 'ArrowLeft':
                queueMove('left');
                event.preventDefault();
                break;
            case 'ArrowRight':
                queueMove('right');
                event.preventDefault();
                break;
            case 'Escape':
                if (autoPlayInProgress) {
                    cancelAutoPlay();
                }
                break;
        }
    }

    function disableControls() {
        upButton.disabled = true;
        downButton.disabled = true;
        leftButton.disabled = true;
        rightButton.disabled = true;
        randomMoveButton.disabled = true;
        greedyMoveButton.disabled = true;
        autoRandomButton.disabled = true;
        autoGreedyButton.disabled = true;
    }

    function enableControls() {
        upButton.disabled = false;
        downButton.disabled = false;
        leftButton.disabled = false;
        rightButton.disabled = false;
        randomMoveButton.disabled = false;
        greedyMoveButton.disabled = false;
        autoRandomButton.disabled = false;
        autoGreedyButton.disabled = false;
    }

    // Visual effects
    function addMoveEffect(direction) {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.add('moving', `move-${direction}`);
        
        setTimeout(() => {
            gameContainer.classList.remove('moving', `move-${direction}`);
        }, 150);
    }
    
    function showLoading() {
        const loadingElement = document.createElement('div');
        loadingElement.classList.add('loading-overlay');
        loadingElement.innerHTML = '<div class="loading-spinner"></div>';
        document.querySelector('.game-container').appendChild(loadingElement);
    }
    
    function hideLoading() {
        const loadingElement = document.querySelector('.loading-overlay');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
    
    function showAIThinking() {
        const aiIndicator = document.createElement('div');
        aiIndicator.classList.add('ai-thinking');
        aiIndicator.textContent = 'AI Thinking...';
        document.querySelector('.game-container').appendChild(aiIndicator);
    }
    
    function hideAIThinking() {
        const aiIndicator = document.querySelector('.ai-thinking');
        if (aiIndicator) {
            aiIndicator.remove();
        }
    }
    
    // Helper function to check if any moves are possible
    function canMoveInAnyDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        for (const direction of directions) {
            // Create a deep copy of the board for simulation
            const tempBoard = JSON.parse(JSON.stringify(board));
            // Try to simulate the move
            const tempGame = {
                grid: tempBoard,
                score: score,
                size: 4,
                _process_row: function(row) {
                    const nonzeros = row.filter(x => x !== 0);
                    let result = [];
                    let skip = false;
                    let gain = 0;
                    
                    for (let i = 0; i < nonzeros.length; i++) {
                        if (skip) {
                            skip = false;
                            continue;
                        }
                        if (i + 1 < nonzeros.length && nonzeros[i] === nonzeros[i + 1]) {
                            const merged = nonzeros[i] * 2;
                            result.push(merged);
                            gain += merged;
                            skip = true;
                        } else {
                            result.push(nonzeros[i]);
                        }
                    }
                    
                    // Pad with zeros
                    while (result.length < row.length) {
                        result.push(0);
                    }
                    
                    return [result, gain];
                },
                move: function(direction) {
                    let rotations = {left: 0, up: 1, right: 2, down: 3}[direction];
                    // Rotate grid to simulate all moves as "left"
                    let grid = JSON.parse(JSON.stringify(this.grid));
                    for (let i = 0; i < rotations; i++) {
                        grid = rotateGrid90Degrees(grid);
                    }
                    
                    let moved = false;
                    for (let i = 0; i < grid.length; i++) {
                        const [processed, gain] = this._process_row(grid[i]);
                        if (!arraysEqual(processed, grid[i])) {
                            moved = true;
                        }
                        grid[i] = processed;
                    }
                    
                    // Rotate back
                    for (let i = 0; i < (4 - rotations) % 4; i++) {
                        grid = rotateGrid90Degrees(grid);
                    }
                    
                    return moved;
                }
            };
            
            if (tempGame.move(direction)) {
                return true;
            }
        }
        return false;
    }
    
    // Helper function to rotate a grid 90 degrees clockwise
    function rotateGrid90Degrees(grid) {
        const size = grid.length;
        const newGrid = [];
        
        for (let i = 0; i < size; i++) {
            newGrid.push([]);
            for (let j = 0; j < size; j++) {
                newGrid[i].push(grid[size - 1 - j][i]);
            }
        }
        
        return newGrid;
    }
    
    // Helper function to compare arrays
    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    // Add the CSS for the new visual elements
    const style = document.createElement('style');
    style.textContent = `
        .moving {
            transition: transform 0.15s ease;
        }
        .move-up { transform: translateY(-5px); }
        .move-down { transform: translateY(5px); }
        .move-left { transform: translateX(-5px); }
        .move-right { transform: translateX(5px); }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
            border-radius: 15px;
            backdrop-filter: blur(3px);
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        .ai-thinking {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-color);
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            font-weight: 600;
            animation: pulse 1.5s infinite;
            z-index: 99;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
    `;
    document.head.appendChild(style);
}); 