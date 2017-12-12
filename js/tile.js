'use strict';

/**
 * An enum representing the type of a tile.
 */
var TileType = Object.freeze({
    EMPTY: 'empty',
    IED: 'ied',
    DISARMED: 'disarmed',
    BLOCKED: 'blocked'
});

/**
 * An enum representing the state of a tile.
 */
var TileState = Object.freeze({
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
    FLAG1: 'flag1',
    FLAG2: 'flag2'
});

/**
 * A tile that is part of a grid.
 * @constructor
 * @param {HTMLElement} $container the element that this tile should be added to
 * @param {number} x x-coordinate of tile
 * @param {number} y y-coordinate of tile
 */
function Tile($container, x, y) {
    this.x = x;
    this.y = y;
    this.danger = 0;
    this.state = TileState.HIDDEN;
    this.type = TileType.EMPTY;

    this.$e = document.createElement('td');
    this.$e.dataset.x = x;
    this.$e.dataset.y = y;
    this._updateElement();
    $container.appendChild(this.$e);
}

Tile.prototype.flash = function () {
    var self = this;

    if (this._flashTimeout) {
        clearTimeout(this._flashTimeout);
        this.$e.classList.remove('grid-tile-flash');
    }

    setTimeout(function () {
        self.$e.classList.add('grid-tile-flash');
        self._flashTimeout = setTimeout(function () {
            self.$e.classList.remove('grid-tile-flash');
        }, 600);
    }, 5);
};

Tile.prototype.getState = function () {
    return this.state;
};

Tile.prototype.getType = function () {
    return this.type;
};

Tile.prototype.incrementDanger = function () {
    this.danger++;
};

Tile.prototype.isFlagged = function () {
    return this.state === TileState.FLAG1 || this.state === TileState.FLAG2;
};

// Returns true if this tile is empty and has a danger level of 0.
Tile.prototype.isSafe = function () {
    return this.type === TileType.EMPTY && this.danger === 0;
};

Tile.prototype.isVisible = function () {
    return this.state === TileState.VISIBLE;
};

Tile.prototype.setState = function (state) {
    this.state = state;
    this._updateElement();
};

Tile.prototype.setType = function (type) {
    this.type = type;
    this._updateElement();
};

// Reset this tile to its default configuration.
Tile.prototype.reset = function () {
    this.danger = 0;
    this.state = TileState.HIDDEN;
    this.type = TileType.EMPTY;
    this._updateElement();
};

Tile.prototype._updateElement = function () {
    var className = 'grid-tile';

    switch (this.state) {
        case TileState.HIDDEN:
            className += ' grid-tile-hidden';
            break;
        case TileState.VISIBLE:
            className += ' grid-tile-visible';
            if (this.type === TileType.IED)
                className += ' grid-tile-ied';
            else if (this.type === TileType.DISARMED)
                className += ' grid-tile-disarmed';
            else if (this.type === TileType.BLOCKED)
                className += ' grid-tile-blocked';
            else if (this.danger > 0)
                className += ' grid-tile-danger grid-tile-danger' + this.danger;
            break;
        case TileState.FLAG1:
            className += ' grid-tile-flag1';
            break;
        case TileState.FLAG2:
            className += ' grid-tile-flag2';
            break;
    }

    this.$e.className = className;
};
