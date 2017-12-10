
/**
 * A grid made up of rows * cols tiles
 * @constructor
 * @param {HTMLElement} $container the element that this grid will be displayed in
 * @param {number} rows number of rows
 * @param {number} cols number of columns
 */
function Grid($container, rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.tiles = [];

    this.$e = null;
    this._initialize($container);
}

Grid.prototype.getTile = function (x, y) {
    return this.tiles[y][x];
}

Grid.prototype.isFlagged = function (x, y) {
    return this.getTile(x, y).getState() === TileState.FLAGGED;
}

Grid.prototype.isVisible = function (x, y) {
    return this.getTile(x, y).getState() === TileState.VISIBLE;
}

// Flag the tile at (x, y).
// Returns true if the tile was successfully flagged.
Grid.prototype.flagTile = function (x, y) {
    var tile = this.getTile(x, y);
    if (tile.getState() === TileState.HIDDEN) {
        tile.setState(TileState.FLAGGED);
        return true;
    }
    return false;
}

// Unflag the tile at (x, y).
// Returns true if the tile was successfully unflagged.
Grid.prototype.unflagTile = function (x, y) {
    var tile = this.getTile(x, y);
    if (tile.getState() === TileState.FLAGGED) {
        tile.setState(TileState.HIDDEN);
        return true;
    }
    return false;
}

// Search the tile at (x, y). If this is a safe tile, its neighbors will
// automatically be searched. Returns the number of tiles set to visible.
Grid.prototype.searchTile = function (x, y) {
    var count = 1;
    var startTile = this.getTile(x, y);
    startTile.setState(TileState.VISIBLE);

    if (startTile.isSafe()) {
        var stack = [startTile];
        var search = function (tile) {
            if (tile.getState() === TileState.HIDDEN) {
                tile.setState(TileState.VISIBLE);
                count++;

                if (tile.isSafe()) {
                    stack.push(tile);
                }
            }
        }

        while (stack.length > 0) {
            var next = stack.pop();
            this.surrounding(next.x, next.y, search);
        }
    }

    return count;
}

// Adds a random number of IEDs to the grid, avoiding the tile at (x, y).
// Difficulty affects the number of IEDs, and should be between 0 and 100.
Grid.prototype.randomize = function (x, y, difficulty) {
    var totalTiles = this.rows * this.cols;
    var bonus = Math.min(difficulty, 100) * 0.090;
    var min = (0.110 + bonus) * totalTiles;
    var max = (0.140 + bonus) * totalTiles;
    var ieds = getRandomInt(min, max);

    var count = 0;
    while (count < ieds) {
        var rx = getRandomInt(0, this.cols);
        var ry = getRandomInt(0, this.rows);

        if (rx === x && ry === y) continue;
        if (this.getTile(rx, ry).getType() === TileType.IED) continue;

        this._setIED(rx, ry);
        count++;
    }

    return ieds;
}

// Reset the grid to its default configuration.
Grid.prototype.reset = function () {
    for (var y = 0; y < this.rows; y++) {
        for (var x = 0; x < this.cols; x++) {
            this.getTile(x, y).reset();
        }
    }
}

// Run the specified function on all the tiles surroundng (x, y).
Grid.prototype.surrounding = function (x, y, fn) {
    for (var ry = y - 1; ry <= y + 1; ry++) {
        for (var rx = x - 1; rx <= x + 1; rx++) {
            if (rx === x && ry === y) continue;
            if (rx < 0 || ry < 0) continue;
            if (rx >= this.cols || ry >= this.rows) continue;

            fn(this.getTile(rx, ry));
        }
    }
}

// Set an IED at (x, y), and increment danger of surrounding tiles.
Grid.prototype._setIED = function (x, y) {
    this.getTile(x, y).setType(TileType.IED);
    this.surrounding(x, y, function (tile) {
        tile.incrementDanger();
    });
}

// Initialize this grid and display it in the specified container.
Grid.prototype._initialize = function ($container) {
    this.$e = document.createElement('table');
    this.$e.className = 'grid';

    for (var y = 0; y < this.rows; y++) {
        var $row = document.createElement('tr');
        var row = [];

        for (var x = 0; x < this.cols; x++) {
            var tile = new Tile($row, x, y);
            row.push(tile);
        }

        this.$e.appendChild($row);
        this.tiles.push(row);
    }

    $container.appendChild(this.$e);
}
