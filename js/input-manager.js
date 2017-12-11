
var InputMode = Object.freeze({
    SEARCH: 'search',
    FLAG: 'flag'
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
        this.mode = InputMode.FLAG;
        this.$mode.innerText = 'Flag';
    } else if (this.mode === InputMode.FLAG) {
        this.mode = InputMode.SEARCH;
        this.$mode.innerText = 'Search';
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
                case InputMode.FLAG:
                    self.emit('flag', data);
                    break;
            }
        }
    };

    // left click: search or flag depending on current mode
    $grid.addEventListener('click', clickHandler);
    $grid.addEventListener('touchend', clickHandler);

    // right click: always flag
    $grid.addEventListener('contextmenu', function (evt) {
        var $e = evt.target;
        if ($e.classList.contains('grid-tile')) {
            evt.preventDefault();
            var data = { x: parseInt($e.dataset.x), y: parseInt($e.dataset.y) };
            self.emit('flag', data);
        }
    });
};

InputManager.prototype.attachListeners = function () {
    var self = this;

    this.$mode = document.getElementById('stats-mode');

    this.bindButtonPress('stats-mode', function (evt) {
        evt.preventDefault();
        self.switchInputMode();
    });
    this.bindButtonPress('stats-complete', function (evt) {
        evt.preventDefault();
        self.emit('complete');
    });
};
