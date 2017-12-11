'use strict';

var GameState = Object.freeze({
    STARTED: 'started', // initial state
    CLEARED: 'cleared', // cleared board
    COMPLETED: 'completed', // completed all levels
    GAMEOVER: 'gameover' // game lost
});

/**
 * @constructor
 * @param {Object} opts options
 */
function Game(opts) {
    // - static variables -
    this.inputManager = new InputManager();
    this.rows = opts.rows;
    this.cols = opts.cols;
    this.total = this.rows * this.cols;
    this.grid = new Grid(document.getElementById('grid-container'), this.rows, this.cols);

    // - state variables -
    this.state = GameState.STARTED;
    this.level = 0;
    this.score = 0;
    this.armor = 3;
    this.ieds = 0;
    this.flags = 0;
    this.moves = 0;
    this.visible = 0;
    this.cleared = 0;

    this.setup();
}

Game.prototype.flagTile = function (x, y) {
    if (this.state !== GameState.STARTED) return;

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
    this.updateStats();
};

Game.prototype.searchTile = function (x, y) {
    if (this.grid.isFlagged(x, y) || this.grid.isVisible(x, y)) return;
    if (this.state !== GameState.STARTED) return;

    // generate the board on the first move
    if (this.visible === 0) {
        this.ieds = this.grid.randomize(x, y, this.level);
    }

    var searched = this.grid.searchTile(x, y);
    this.visible += searched;
    this.cleared += searched;
    this.moves++;
    this.updateStats();

    // block if we have armor, otherwise game over
    if (this.grid.hasIED(x, y)) {
        if (this.armor > 0) {
            this.decreaseArmor();
            this.grid.blockIED(x, y);
        } else {
            this.state = GameState.GAMEOVER;
            this.showAlert('You were killed by an IED.');
        }
    }
};

Game.prototype.newBoard = function () {
    this.grid.reset();
    this.armor = Math.min(3, this.armor + 1);
    this.ieds = 0;
    this.flags = 0;
    this.moves = 0;
    this.visible = 0;
    this.cleared = 0;

    this.$armor.innerText = '3 / 3';
    this.updateStats();
};

Game.prototype.decreaseArmor = function () {
    this.armor--;
    this.$armor.innerText = this.armor + ' / 3';
    this.showAlert('Your armor shielded you from the blast.');
};

Game.prototype.showAlert = function (text) {
    var self = this;
    this.$alertMessage.innerText = text;

    if (this._alert) {
        clearTimeout(this._alert);
        this.$alertBox.classList.add('hidden');
        this.$alertBox.classList.remove('blink-once');
    }

    setTimeout(function () {
        self.$alertBox.classList.add('blink-once');
        self.$alertBox.classList.remove('hidden');
        self._alert = setTimeout(function () {
            self.$alertBox.classList.add('hidden');
            self.$alertBox.classList.remove('blink-once');
        }, 2000);
    }, 5);
};

Game.prototype.updateStats = function () {
    var percentage = this.cleared / this.total * 100;

    this.$moves.innerText = this.moves;
    this.$cleared.innerText = percentage.toFixed(1) + '%';
    this.$flags.innerText = this.flags;
};

Game.prototype.setup = function () {
    var self = this;

    this.inputManager.on('flag', function (data) {
        self.flagTile(data.x, data.y);
    });
    this.inputManager.on('search', function (data) {
        self.searchTile(data.x, data.y);
    });

    this.inputManager.attachGridListeners(this.grid.$e);

    this.$alertBox = document.getElementById('game-alert-box');
    this.$alertMessage = document.getElementById('game-alert-message');

    this.$armor = document.getElementById('stats-armor');
    this.$moves = document.getElementById('stats-moves');
    this.$cleared = document.getElementById('stats-cleared');
    this.$flags = document.getElementById('stats-flags');
    this.$mode = document.getElementById('stats-mode');
};

window.requestAnimationFrame(function () {
    new Game({ rows: 30, cols: 30 });
});
