/*global $:true, console:true, sweeper:true, localStorage:true, window:true */
/*
 * This is a minesweeper-like game implemented as part of a problem challenge.
 * This code was checked with jshint.
 *
 * Author: Paul Craciunoiu
 * LICENSE: MIT
 */
// Use closure and strict mode to help with code quality and globals
(function() {
"use strict";

var $board = $('#board'),
    $minesLeft = $('#mines-left > span');
$board.html('');
$('#meta').show();

var Sweeper = {
    // constants
    $TILE_TEMPLATE: $('<div class="tile">'),
    SIZE: {x: 8, y: 8}, // board size, changing this could easily be an in-game feature
    TILE_VALUES: {mine: -1},  // when a tile hides a mine, it has this value.

    // game state
    isGameOver: false,
    isGameStarted: false,
    gamesPlayed: -1,
    gamesWon: -1,

    // functions

    /**
     * Initialize the game. This should only be called once per pageload.
     */
    initialize: function() {
        $('#new-game').click(this.events.newGameClick);
        $('#cheat').click(this.events.cheatClick);
        $board.delegate('.tile', 'click', this.events.tileLeftClick);
        // Disable context menu on board.
        $board[0].oncontextmenu = function() { return false; };
        // Right click to flag.
        $board.delegate('.tile', 'mousedown', this.events.tileMousedown);
        this.events.newGameClick();
    },

    // rest of functions ordered alphabetically
    /**
     * Create an individual tile.
     * Expects height in pixels.
     */
    createTile: function(i, j, width, height, isMine) {
        // Clone the $TILE_TEMPLATE and store some data on it.
        var tileValue = this.getTileValue(i, j, isMine);

        var $tile = this.$TILE_TEMPLATE.clone().data({
            index: this.getTileIndex(i, j),
            isMine: isMine,
            posX: i,
            posY: j,
            value: tileValue
        });
        // Append it to the board after setting its CSS.
        $board.append($tile.css({
            fontSize: Math.round(parseInt(height, 10) / 2) + 'px',
            height: height,
            lineHeight: height,
            width: width
        }));
    },
    /**
     * Decrement the number of mines left.
     */
    decNumMinesLeft: function() {
        if (this.numMinesLeft <= 0) {
            console.log('No mines left ', this.numMinesLeft,
                        ', total ', this.numMinesTotal);
            return;
        }
        this.numMinesLeft--;
        $('#mines-left > span').html(this.numMinesLeft);
    },
    /**
     * Show that the game is over.
     */
    endGame: function() {
        this.isGameOver = true;
        $('#game-over').show();
        $('#games-played > span').html(this.getGamesPlayed());
        $('#games-won > span').html(this.getGamesWon());
    },
    /**
     * DOM events. Nice central place.
     */
    events: {
        /**
         * Flag all tiles which are hiding mines.
         */
        cheatClick: function(event) {
            event.preventDefault();
            sweeper.$tiles.removeClass('guess');
            sweeper.numMinesLeft = sweeper.numMinesTotal;

            var $tile;
            for (var i=sweeper.mineTiles.length-1; i>=0; i--) {
                // Trigger a right click to flag all tiles with mines.
                $tile = sweeper.$tiles.eq(sweeper.mineTiles[i]);
                // Already flagged? Good, do nothing.
                if ($tile.hasClass('guess')) {
                    continue;
                }
                $tile.trigger({
                    type: 'mousedown',
                    which: 3
                });
            }

            sweeper.numMinesLeft = 0;
            $('#mines-left > span').html(sweeper.numMinesLeft);
        },
        /**
         * Start a new game.
         * @see Sweeper.newGame for more info.
         */
        newGameClick: function(event) {
            sweeper.newGame(8, 8, 10);
        },
        /**
         * Called when a tile is left- or right-clicked.
         */
        tileClick: function(event, $target) {
            event.preventDefault();
            // Clicked tiles are disabled.
            if ($target.hasClass('off') || sweeper.isGameOver) {
                return false;
            }
            if (!sweeper.isGameStarted) {
                sweeper.incGamesPlayed();
                sweeper.startGame();
            }
            return true;
        },
        /**
         * Right click on tiles to flag or unflag..
         */
        tileMousedown: function(event) {
            if (event.which !== 3) {
                return;
            }
            var $target = $(event.target);
            if (!sweeper.events.tileClick(event, $target)) {
                return;
            }
            if (!$target.hasClass('tile')) {
                return;
            }
            if ($target.hasClass('guess')) {
                $target.removeClass('guess');
                sweeper.incNumMinesLeft();
                return;
            }
            $target.addClass('guess');
            sweeper.decNumMinesLeft();
        },
        /**
         * Left click on tiles to reveal what's behind them.
         */
        tileLeftClick: function(event) {
            var $target = $(event.target);
            if (!sweeper.events.tileClick(event, $target)) {
                return;
            }
            // No clicks allowed on flagged tile.
            if ($target.hasClass('guess')) {
                return false;
            }
            var tileMeta = $target.data();
            $target.addClass('off');
            // Is this a mine? If so, end the game.
            if (tileMeta.value === sweeper.TILE_VALUES.mine) {
                $target.addClass('mine');
                sweeper.endGame();
                var tileNum;
                for (var j=sweeper.mineTiles.length-1; j>=0; j--) {
                    tileNum = sweeper.mineTiles[j];
                    sweeper.$tiles.eq(tileNum).addClass('off')
                                            .addClass('mine');
                }
                return;
            }
            // Has neighboring mines? Reflect tile value in DOM.
            if (tileMeta.value) {
                $target.html(tileMeta.value);
            } else {
                var adjacent = sweeper.getAdjacentTiles(tileMeta.posX,
                                                                tileMeta.posY),
                    k, coords, $tile;
                for (k=adjacent.length-1; k>=0; k--) {
                    coords = adjacent[k];
                    $tile = sweeper.$tiles.eq(
                        sweeper.getTileIndex(coords[0], coords[1]));
                    if ($tile.hasClass('off')) {
                        continue;
                    }
                    // XXX: optimize this by calling a function directly
                    // to avoid extra DOM operations. Not a big deal...
                    $tile.click();
                }
            }
            // Remove this tile from safe tiles.
            var safeIndex = sweeper.safeTiles.indexOf(tileMeta.index);
            sweeper.safeTiles.splice(safeIndex, 1);

            // Is the game over?
            if (sweeper.safeTiles.length <= 0) {
                // Game over
                sweeper.incGamesWon();
                sweeper.endGame();
            }
        }
    },
    /**
     * Get adjacent tiles based on current tile's i, j. Return an array.
     */
    getAdjacentTiles: function(i, j) {
        var adjacent = [];
        if (i > 0) {
            adjacent.push([i - 1, j]);
            if (j > 0) {
                adjacent.push([i - 1, j - 1]);
            }
            if (j < this.SIZE.y - 1) {
                adjacent.push([i - 1, j + 1]);
            }
        }
        if (i < this.SIZE.x - 1) {
            adjacent.push([i + 1, j]);
            if (j > 0) {
                adjacent.push([i + 1, j - 1]);
            }
            if (j < this.SIZE.y - 1) {
                adjacent.push([i + 1, j + 1]);
            }
        }
        if (j > 0) {
            adjacent.push([i, j - 1]);
        }
        if (j < this.SIZE.y - 1) {
            adjacent.push([i, j + 1]);
        }
        return adjacent;
    },
    /**
     * Return the number of games played, from localStorage when available.
     */
    getGamesPlayed: function() {
        var num = 0;
        if (this.hasLocalStorage()) {
            num = parseInt(localStorage.getItem('sweeper-games-played'), 10) ||
                    0;
        }
        this.gamesPlayed = num;
        return num;
    },
    /**
     * Return the number of games won, from localStorage when available.
     */
    getGamesWon: function() {
        var num = 0;
        if (this.hasLocalStorage()) {
            num = parseInt(localStorage.getItem('sweeper-games-won'), 10) ||
                    0;
        }
        this.gamesWon = num;
        return num;
    },
    /**
     * Get tile's index based on coordinates. Simple i * size + j.
     */
    getTileIndex: function(i, j) {
        return this.SIZE.x * i + j;
    },
    /**
     * Get tile value. Be it a number, empty, or a mine.
     */
    getTileValue: function(i, j, isMine) {
        if (isMine) {
            return this.TILE_VALUES.mine;
        }
        var k, coords, adjacentMines = 0;
        var adjacent = this.getAdjacentTiles(i, j);
        for (k=adjacent.length-1; k>=0; k--) {
            coords = adjacent[k];
            if (this.mineTiles.indexOf(this.getTileIndex(coords[0],
                                                        coords[1])) !== -1) {
                adjacentMines++;
            }
        }
        return adjacentMines;
    },
    /**
     * Detect localStorage support. Inspired by Modernizr.
     * @see https://github.com/Modernizr/Modernizr/blob/master/modernizr.js#L703
     */
    hasLocalStorage: function() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch(e) {
            return false;
        }
    },
    /**
     * Increment the number of games played, to localStorage when available.
     */
    incGamesPlayed: function() {
        if (this.gamesPlayed === -1) {
            this.getGamesPlayed();
        }
        if (this.hasLocalStorage()) {
            localStorage.setItem('sweeper-games-played', this.gamesPlayed + 1);
        }
        this.gamesPlayed++;
    },
    /**
     * Increment the number of games won, to localStorage when available.
     */
    incGamesWon: function() {
        if (this.gamesWon === -1) {
            this.getGamesWon();
        }
        if (this.hasLocalStorage()) {
            localStorage.setItem('sweeper-games-won', this.gamesWon + 1);
        }
        this.gamesWon++;
    },
    /**
     * Increment the number of mines left.
     */
    incNumMinesLeft: function() {
        // This shouldn't happen, but if it does, log it.
        if (this.numMinesLeft >= this.numMinesTotal) {
            console.log('Unexpected increase. Mines left ', this.numMinesLeft,
                        ', total ', this.numMinesTotal);
            return;
        }
        this.numMinesLeft++;
        $('#mines-left > span').html(this.numMinesLeft);
    },
    /**
     * Create the board, bind events, generate mines, etc.
     */
    newGame: function(sizeX, sizeY, numMines) {
        $('#game-over').hide();
        this.isGameOver = false;
        this.isGameStarted = false;
        this.numMinesLeft = numMines;
        this.numMinesTotal = numMines;
        this.SIZE.x = sizeX;
        this.SIZE.y = sizeY;
        $('#games-played > span').html(this.getGamesPlayed());
        $('#games-won > span').html(this.getGamesWon());

        // Tile dimensions could be improved to work with percentages.
        // But it ain't so bad for a prototype...
        var width = Math.floor($board.width() / this.SIZE.x - 3) + 'px',
            height = Math.floor($board.width() / this.SIZE.y - 3) + 'px';

        // Counter variables
        var i, j;

        // Generate mine positions
        // Use # of tiles as range.
        this.safeTiles = []; // Store safe tiles here. Pop from here.
        this.mineTiles = [];  // Push mine tiles here.

        var numTiles = this.SIZE.x * this.SIZE.y,
            randomTileNum = null;  // Used to select from safe tiles.
        for (i=0; i<numTiles; i++) {
            this.safeTiles.push(i);
        }
        for (i=0; i<numMines; i++) {
            randomTileNum = Math.round(Math.random() * (numTiles - i));
            this.mineTiles.push(this.safeTiles.splice(randomTileNum, 1)[0]);
        }

        $board.html('');
        // Store whether tile is a mine for readability.
        var isMine = false;
        for (i=0; i<sizeX; i++) {
            for (j=0; j<sizeY; j++) {
                isMine = (this.mineTiles.indexOf(i * sizeX + j) !== -1);
                this.createTile(i, j, width, height, isMine);
            }
        }
        $board.append('<div style="clear:left">');
        $minesLeft.html(numMines);

        this.$tiles = $board.find('.tile');
    },
    /**
     * Begin the game, count it as a game played.
     * Do this when tiles are clicked to avoid counting unplayed games, e.g.
     * when user clicks "New Game" repeatedly.
     */
    startGame: function() {
        this.isGameStarted = true;
        $('#games-played > span').html(this.getGamesPlayed());
        // TODO: nice to add a timer here to time each game.
    }
};

// Make this global and create the board.
window.sweeper = Sweeper;
Sweeper.initialize();

})();
