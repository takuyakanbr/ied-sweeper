'use strict';

var GameState = Object.freeze({
    STARTED: 'started',
    COMPLETED: 'completed',
    GAMEOVER: 'gameover'
});

/**
 * @constructor
 * @param {Object} opts options
 */
function Game(opts) {
    // - static variables -
    this.inputManager = new InputManager();
    this.storageManager = new StorageManager();
    this.rows = opts.rows;
    this.cols = opts.cols;
    this.total = this.rows * this.cols;
    this.grid = new Grid(document.getElementById('grid-container'), this.rows, this.cols);

    // - state variables -
    this.state = GameState.STARTED;
    this.level = 0;
    this.highScore = this.storageManager.getHighScore();
    this.totalScore = 0;
    this.totalMoves = 0;
    this.totalDisarmed = 0;
    this.armor = 3;
    this.ieds = 0;
    this.flags = 0;
    this.moves = 0;
    this.visible = 0;
    this.cleared = 0;

    this.setup();
    this.newCampaign();
}

// Use an armor to shield from an IED.
// Returns true if an armor was used, or false if there was no armor.
Game.prototype.applyArmor = function () {
    if (this.armor <= 0) return false;

    this.armor--;
    this.$statsArmor.innerText = this.armor + ' / 3';
    this.showAlert('Your armor shielded you from the blast.');
    return true;
};

// Calculates and returns the score gained from completing this mission.
Game.prototype.calculateScore = function (markers, disarmed) {
    var excessMarkers = markers - disarmed;
    var markerPenalty = Math.max(0, excessMarkers - 2) * 20;
    var idealMoves = this.ieds + this.total * 0.333;
    var movesPenalty = Math.max(0, this.moves - idealMoves);
    var score = 500 + disarmed * 15 - markerPenalty - movesPenalty;
    return Math.max(20, Math.round(score));
};

// Attempt to complete the current mission.
Game.prototype.completeMission = function () {
    var result = this.grid.showAllTiles();
    this.totalDisarmed += result.disarmed;

    if (result.active > 0) {
        // failure due to unmarked IEDs
        this.state = GameState.GAMEOVER;
        this.showGameOver(this.randomFailureMessage(result.active));
    } else {
        // success
        this.state = GameState.COMPLETED;
        var score = this.calculateScore(result.markers, result.disarmed);
        this.totalScore += score;
        this.showMissionResult(result.markers, result.disarmed, score);
    }
};

// Mark or unmark the tile at (x, y) as IED.
Game.prototype.markIED = function (x, y) {
    var delta = this.grid.markIED(x, y);

    this.flags += delta;
    this.cleared += delta;
    this.moves++;
    this.totalMoves++;
    this.updateStats();
};

// Mark or unmark the tile at (x, y) as safe.
Game.prototype.markSafe = function (x, y) {
    var delta = this.grid.markSafe(x, y);

    this.flags += delta;
    this.cleared += delta;
    this.moves++;
    this.totalMoves++;
    this.updateStats();
};

// Start the next mission (reset the game board).
Game.prototype.nextMission = function () {
    this.grid.reset();
    this.level++;
    this.armor = Math.min(3, this.armor + 1);
    this.ieds = 0;
    this.flags = 0;
    this.moves = 0;
    this.visible = 0;
    this.cleared = 0;

    this.$statsArmor.innerText = this.armor + ' / 3';
    this.updateStats();
    this.updateHeader();
    this.state = GameState.STARTED;
};

// Start a new campaign (reset all state to initial values).
Game.prototype.newCampaign = function () {
    this.state = GameState.STARTED;
    this.level = -1;
    this.score = 0;
    this.totalMoves = 0;
    this.totalDisarmed = 0;
    this.armor = 3;

    this.nextMission();
};

// Attempt to search the tile at (x, y).
Game.prototype.searchTile = function (x, y) {
    if (this.grid.isFlagged(x, y) || this.grid.isVisible(x, y)) return;

    // generate the board on the first move
    if (this.visible === 0) {
        this.ieds = this.grid.randomize(x, y, this.level);
    }

    var searched = this.grid.searchTile(x, y);
    if (searched === 0) return;

    this.visible += searched;
    this.cleared += searched;
    this.moves++;
    this.totalMoves++;
    this.updateStats();

    // trigger IED at this tile
    if (this.grid.hasIED(x, y) && !this.triggerIED(x, y))
        return;

    // trigger adjacent IEDs with 8 adjacent visible tiles
    var list = this.grid.checkAdjacentIEDs(x, y);

    var unflagged = this.grid.unflagTiles(list);
    this.flags -= unflagged;
    this.cleared -= unflagged;
    var shown = this.grid.showTiles(list);
    this.cleared += shown;
    this.updateStats();

    for (var i = 0; i < list.length; i++) {
        var tile = list[i];

        if (!this.triggerIED(tile.x, tile.y))
            return;
    }
};

// Triggers the IED at (x, y). If we have armor, the blast
// will be blocked. Otherwise, end the game.
// Returns true if the IED is blocked.
Game.prototype.triggerIED = function (x, y) {
    if (this.applyArmor()) {
        this.grid.blockIED(x, y);
        return true;
    } else {
        this.state = GameState.GAMEOVER;
        this.showGameOver(this.randomDeathMessage());
        return false;
    }
};


(function () {
    var DEATH_MESSAGES = ['You were killed by an IED.',
        'An IED blew you to smithereens.',
        'You lost your life protecting the city.',
        'Your mistake cost you your life.',
        'You should have been more careful.',
        'You were blown to pieces by the IED.'];
    var MINOR_FAILURE_MESSAGES = ['I\'m sorry, but you are dismissed.',
        'You should have been more careful, soldier.',
        'Your mistake cost the lives of many civilians.'];
    var MAJOR_FAILURE_MESSAGES = ['The city was devastated by the IEDs.',
        'That was extremely disappointing. Get out.',
        'Which side are you on? Get out.'];
    var IMPRESSIVE_MESSAGES = ['Excellent work, soldier. I am impressed.',
        'That was an impressive display of your skills, soldier.',
        'We are very impressed with your work, soldier.'];
    var SUCCESS_MESSAGES = ['Good job, soldier. You saved the city.',
        'Your heroic actions saved the city.',
        'You have the gratitude of the city\'s residents.',
        'Keep up the good work, soldier.'];

    function getRandomItem(arr) {
        return arr[getRandomInt(0, arr.length)];
    }

    Game.prototype.randomDeathMessage = function () {
        return getRandomItem(DEATH_MESSAGES);
    };

    Game.prototype.randomFailureMessage = function (ieds) {
        if (getRandomInt(0, 4) === 0) {
            var deaths = ieds * getRandomInt(470, 526);
            return 'The IED' + (ieds === 1 ? '' : 's') + ' resulted in a death toll of ' + deaths + '.';
        }
        if (ieds <= 2) {
            return getRandomItem(MINOR_FAILURE_MESSAGES);
        } else {
            return getRandomItem(MAJOR_FAILURE_MESSAGES);
        }
    };

    Game.prototype.randomSuccessMessage = function (markers, disarmed) {
        if (markers <= disarmed + 1) {
            return getRandomItem(IMPRESSIVE_MESSAGES);
        } else {
            return getRandomItem(SUCCESS_MESSAGES);
        }
    };
})();


Game.prototype.hideBar = function ($bar) {
    $bar.classList.add('hidden');
    $bar.classList.remove('fade-in');
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

Game.prototype.showBar = function ($bar) {
    $bar.classList.remove('hidden');
    $bar.classList.add('fade-in');
};

Game.prototype.showGameOver = function (reason) {
    this.$lostText.innerText = reason;
    this.$lostMoves.innerText = this.totalMoves;
    this.$lostIeds.innerText = this.totalDisarmed;
    this.$lostSaved.innerText = this.level;
    this.$lostScore.innerText = this.totalScore;

    this.showAlert(reason);
    this.hideBar(this.$statsBar);
    this.hideBar(this.$confirmBar);
    this.showBar(this.$lostBar);
};

Game.prototype.showMissionResult = function (markers, disarmed, score) {
    var text = this.randomSuccessMessage(markers, disarmed);
    this.$resultText.innerText = text;
    this.$resultMoves.innerText = this.moves;
    this.$resultIeds.innerText = this.ieds;
    this.$resultFlags.innerText = markers;
    this.$resultScore.innerText = score;
    this.$resultCumulative.innerText = this.totalScore;

    this.showAlert(text);
    this.updateHeader();
    this.hideBar(this.$statsBar);
    this.hideBar(this.$confirmBar);
    this.showBar(this.$resultBar);
};

Game.prototype.updateHeader = function () {
    if (this.totalScore > this.highScore) {
        this.highScore = this.totalScore;
        this.storageManager.setHighScore(this.highScore);
    }
    this.$headerLevel.innerText = (this.level + 1);
    this.$headerScore.innerText = this.totalScore;
    this.$headerHighScore.innerText = this.highScore;
};

Game.prototype.updateStats = function () {
    var percentage = this.cleared / this.total * 100;

    this.$statsMoves.innerText = this.moves;
    this.$statsCleared.innerText = percentage.toFixed(1) + '%';
    this.$statsFlags.innerText = this.flags;
};


Game.prototype.setup = function () {
    var self = this;

    this.inputManager.on('flag1', function (data) {
        if (self.state !== GameState.STARTED) return;
        if (self.grid.isVisible(data.x, data.y)) return;

        self.markIED(data.x, data.y);
    });
    this.inputManager.on('flag2', function (data) {
        if (self.state !== GameState.STARTED) return;
        if (self.grid.isVisible(data.x, data.y)) return;

        self.markSafe(data.x, data.y);
    });
    this.inputManager.on('search', function (data) {
        if (self.state !== GameState.STARTED) return;

        self.searchTile(data.x, data.y);
    });
    this.inputManager.on('complete', function () {
        if (self.state !== GameState.STARTED) return;
        if (self.visible === 0) {
            self.showAlert('You have not even started!');
            return;
        }

        self.hideBar(self.$statsBar);
        self.showBar(self.$confirmBar);
    });
    this.inputManager.on('confirm-yes', function () {
        if (self.state !== GameState.STARTED || self.visible === 0) return;

        self.completeMission();
    });
    this.inputManager.on('confirm-no', function () {
        if (self.state === GameState.STARTED) {
            self.hideBar(self.$confirmBar);
            self.showBar(self.$statsBar);
        }
    });
    this.inputManager.on('next', function () {
        if (self.state !== GameState.COMPLETED) return;

        self.nextMission();
        self.hideBar(self.$resultBar);
        self.showBar(self.$statsBar);
    });
    this.inputManager.on('restart', function () {
        if (self.state !== GameState.GAMEOVER) return;

        self.newCampaign();
        self.hideBar(self.$lostBar);
        self.showBar(self.$statsBar);
    });

    this.inputManager.attachGridListeners(this.grid.$e);

    this.$alertBox = document.getElementById('game-alert-box');
    this.$alertMessage = document.getElementById('game-alert-message');
    this.$statsBar = document.getElementById('info-bar-stats');
    this.$confirmBar = document.getElementById('info-bar-confirm');
    this.$resultBar = document.getElementById('info-bar-result');
    this.$lostBar = document.getElementById('info-bar-lost');

    this.$headerLevel = document.getElementById('header-level');
    this.$headerScore = document.getElementById('header-score');
    this.$headerHighScore = document.getElementById('header-highscore');

    this.$statsArmor = document.getElementById('stats-armor');
    this.$statsMoves = document.getElementById('stats-moves');
    this.$statsCleared = document.getElementById('stats-cleared');
    this.$statsFlags = document.getElementById('stats-flags');

    this.$resultText = document.getElementById('result-text');
    this.$resultMoves = document.getElementById('result-moves');
    this.$resultIeds = document.getElementById('result-ieds');
    this.$resultFlags = document.getElementById('result-flags');
    this.$resultScore = document.getElementById('result-score');
    this.$resultCumulative = document.getElementById('result-cumulative');

    this.$lostText = document.getElementById('lost-text');
    this.$lostMoves = document.getElementById('lost-moves');
    this.$lostIeds = document.getElementById('lost-ieds');
    this.$lostSaved = document.getElementById('lost-saved');
    this.$lostScore = document.getElementById('lost-score');
};


window.onload = function () {
    new Game({ rows: 30, cols: 30 });
};
