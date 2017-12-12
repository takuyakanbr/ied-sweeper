
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
        this.$statsMode.innerText = 'IED';
    } else if (this.mode === InputMode.FLAG1) {
        this.mode = InputMode.FLAG2;
        this.$statsMode.innerText = 'Safe';
    } else if (this.mode === InputMode.FLAG2) {
        this.mode = InputMode.SEARCH;
        this.$statsMode.innerText = 'Open';
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

    // detect and handle touch presses: action depends on current mode
    var touchStartX, touchStartY;
    var isPress = false;

    $grid.addEventListener('touchstart', function (evt) {
        if (evt.touches.length > 1 || evt.targetTouches.length > 1) {
            isPress = false;
            return;
        }

        touchStartX = evt.touches[0].clientX;
        touchStartY = evt.touches[0].clientY;
        isPress = true;
    });
    $grid.addEventListener('touchmove', function (evt) {
        isPress = false;
    });
    $grid.addEventListener('touchend', function (evt) {
        if (evt.touches.length > 0 || evt.targetTouches.length > 0) return;

        if (isPress) {
            clickHandler(evt);
        }
    });

    // left click: action depends on current mode
    $grid.addEventListener('click', clickHandler);

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

    // handle keyboard shortcuts for changing input modes
    document.addEventListener('keydown', function (e) {
        var modifiers = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;

        if (!modifiers) {
            if (e.which == 49 || e.which == 97) { // 1 / Numpad1
                e.preventDefault();
                self.mode = InputMode.SEARCH;
                self.$statsMode.innerText = 'Open';
            } else if (e.which == 50 || e.which == 98) { // 2 / Numpad2
                e.preventDefault();
                self.mode = InputMode.FLAG1;
                self.$statsMode.innerText = 'IED';
            } else if (e.which == 51 || e.which == 99) { // 3 / Numpad3
                e.preventDefault();
                self.mode = InputMode.FLAG2;
                self.$statsMode.innerText = 'Safe';
            }
        }
    });

    this.bindButtonPress('intro-continue', function (e) {
        e.preventDefault();
        document.getElementById('intro-overlay').classList.add('hidden');
        document.body.classList.remove('no-overflow');
    });
    this.bindButtonPress('stats-mode', function (e) {
        e.preventDefault();
        self.switchInputMode();
    });
    this.bindButtonPress('stats-complete', function (e) {
        e.preventDefault();
        self.emit('complete');
    });
    this.bindButtonPress('confirm-yes', function (e) {
        e.preventDefault();
        self.emit('confirm-yes');
    });
    this.bindButtonPress('confirm-no', function (e) {
        e.preventDefault();
        self.emit('confirm-no');
    });
    this.bindButtonPress('result-next', function (e) {
        e.preventDefault();
        self.emit('next');
    });
    this.bindButtonPress('lost-restart', function (e) {
        e.preventDefault();
        self.emit('restart');
    });
};
