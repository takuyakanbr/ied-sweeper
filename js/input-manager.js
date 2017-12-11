
/**
 * An enum representing the current input mode. The input mode
 * determines the action performed when a left click is detected.
 */
var InputMode = Object.freeze({
    SEARCH: 'search',
    FLAG1: 'flag1',
    FLAG2: 'flag2'
});

/**
 * Handles keyboard and mouse events
 * @constructor
 */
function InputManager() {
    this.events = {};
    this.mode = InputMode.SEARCH;

    this.attachListeners();
}

InputManager.prototype.on = function (evt, callback) {
    if (!this.events[evt]) {
        this.events[evt] = [];
    }
    this.events[evt].push(callback);
};

InputManager.prototype.emit = function (evt, data) {
    var callbacks = this.events[evt];
    if (callbacks) {
        callbacks.forEach(function (callback) {
            callback(data);
        });
    }
};

InputManager.prototype.switchInputMode = function () {
    if (this.mode === InputMode.SEARCH) {
        this.mode = InputMode.FLAG1;
        this.$statsMode.innerText = 'Mark IED';
    } else if (this.mode === InputMode.FLAG1) {
        this.mode = InputMode.FLAG2;
        this.$statsMode.innerText = 'Mark Safe';
    } else if (this.mode === InputMode.FLAG2) {
        this.mode = InputMode.SEARCH;
        this.$statsMode.innerText = 'Search';
    }
};

InputManager.prototype.bindButtonPress = function (elementId, fn) {
    var button = document.getElementById(elementId);
    button.addEventListener('click', fn);
    button.addEventListener('touchend', fn);
};

InputManager.prototype.attachGridListeners = function ($grid) {
    var self = this;

    var clickHandler = function (evt) {
        var $e = evt.target;
        if ($e.classList.contains('grid-tile')) {
            evt.preventDefault();
            var data = { x: parseInt($e.dataset.x), y: parseInt($e.dataset.y) };
            switch (self.mode) {
                case InputMode.SEARCH:
                    self.emit('search', data);
                    break;
                case InputMode.FLAG1:
                    self.emit('flag1', data);
                    break;
                case InputMode.FLAG2:
                    self.emit('flag2', data);
                    break;
            }
        }
    };

    // left click: action depends on current mode
    $grid.addEventListener('click', clickHandler);
    $grid.addEventListener('touchend', clickHandler);

    // right click: always mark IED
    $grid.addEventListener('contextmenu', function (evt) {
        var $e = evt.target;
        if ($e.classList.contains('grid-tile')) {
            evt.preventDefault();
            var data = { x: parseInt($e.dataset.x), y: parseInt($e.dataset.y) };
            self.emit('flag1', data);
        }
    });
};

InputManager.prototype.attachListeners = function () {
    var self = this;

    this.$statsMode = document.getElementById('stats-mode');

    this.bindButtonPress('stats-mode', function (evt) {
        evt.preventDefault();
        self.switchInputMode();
    });
    this.bindButtonPress('stats-complete', function (evt) {
        evt.preventDefault();
        self.emit('complete');
    });
    this.bindButtonPress('confirm-yes', function (evt) {
        evt.preventDefault();
        self.emit('confirm-yes');
    });
    this.bindButtonPress('confirm-no', function (evt) {
        evt.preventDefault();
        self.emit('confirm-no');
    });
    this.bindButtonPress('result-next', function (evt) {
        evt.preventDefault();
        self.emit('next');
    });
    this.bindButtonPress('lost-restart', function (evt) {
        evt.preventDefault();
        self.emit('restart');
    });
};
