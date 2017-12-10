'use strict';

/**
 * @constructor
 * @param {Object} opts options
 */
function Game(opts) {
    // - static variables -
    this.inputManager = new InputManager();
    this.rows = opts.rows;
    this.cols = opts.cols;
    this.grid = new Grid(document.getElementById('grid-container'), this.rows, this.cols);

    // - state variables -
    this.level = 0;
    this.ieds = 0;
    this.moves = 0;
    this.visible = 0;
    this.cleared = 0;
    this.total = this.rows * this.cols;
    this.flags = 0;

    this.setup();
}

Game.prototype.flagTile = function (x, y) {
    if (this.grid.isFlagged(x, y)) {
        this.grid.unflagTile(x, y);
        this.flags--;
        this.cleared--;
        this.moves++;
    } else if (this.grid.flagTile(x, y)) {
        this.flags++;
        this.cleared++;
        this.moves++;
    }
}

Game.prototype.searchTile = function (x, y) {
    if (this.grid.isFlagged(x, y) || this.grid.isVisible(x, y)) return;

    if (this.visible === 0) {
        // generate the board on the first move
        this.ieds = this.grid.randomize(x, y, this.level * 5);
    }

    var searched = this.grid.searchTile(x, y);
    this.visible += searched;
    this.cleared += searched;
    this.moves++;
}

Game.prototype.setup = function () {
    var self = this;

    this.inputManager.on('flag', function (data) {
        self.flagTile(data.x, data.y);
    });
    this.inputManager.on('search', function (data) {
        self.searchTile(data.x, data.y);
    });

    this.inputManager.attachGridListeners(this.grid.$e);
}

window.requestAnimationFrame(function () {
    new Game({ rows: 35, cols: 35 });
});
