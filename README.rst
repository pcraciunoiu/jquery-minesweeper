JavaScript Minesweeper
======================

From `<http://www.thumbtack.com/challenges>`_

TODO
----

* Resize board and change number of mines.

Rules of Minesweeper
--------------------

Minesweeper is a grid of tiles, each of which may or may not cover hidden mines. The goal is to click on ever tile except those that have mines. When a user clicks a tile, one of two things happens. If the tile was covering a mine, the mine is revealed and the game ends in failure. If the tile was not covering a mine, it instead reveals the number of adjacent (including diagonals) tiles that are covering mines. When the user is confident that all tiles not containing mines have been clicked, the user presses a Validate button (often portrayed as a smiley-face icon) that checks the clicked tiles: if the user is correct, the game ends in victory, if not, the game ends in failure.

Design constraints
------------------

* Use HTML, CSS, and Javascript (including jQuery, should you desire) to craft your solution.
* You may target your solution to a specific browser.
* The board should be an 8x8 grid and by default 10 hidden mines are randomly placed into the board.
* The interface should support these three functions:
    - New Game - start a new, randomly generated game.
    - Validate - check that a user has correctly marked all the tiles and end the game in either victory or failure.
    - Cheat - in any manner you deem appropriate, reveal the locations of the mines without ending the game.

Bonus points
------------

* Well-structured code and/or a particularly interesting design.
* Support flagging on tiles to allow the user to leave notes on tiles he or she thinks might contain mines.
* Ability to resize the board (to 16x16 or 32x32) and change the difficulty by increasing the number of mines.
* Saving/loading games.
