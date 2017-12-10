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
    this.moves = 0;
    this.hidden = this.rows * this.cols;
    this.visible = 0;
    this.flags = 0;

    this._setup();
}

Game.prototype.flagTile = function (x, y) {

}

Game.prototype.pressTile = function (x, y) {

}

Game.prototype._setup = function () {
    var self = this;

    this.inputManager.on('flag', function (data) {
        self.flagTile(data.x, data.y);
    });
    this.inputManager.on('press', function (data) {
        self.pressTile(data.x, data.y);
    });

    this.inputManager.attachGridListeners(this.grid.$e);
}

window.requestAnimationFrame(function () {
    new Game({ rows: 35, cols: 35 });
});
