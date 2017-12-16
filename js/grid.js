
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
};

Grid.prototype.hasIED = function (x, y) {
    return this.getTile(x, y).getType() === TileType.IED;
};

Grid.prototype.isFlagged = function (x, y) {
    return this.getTile(x, y).isFlagged();
};

Grid.prototype.isVisible = function (x, y) {
    return this.getTile(x, y).isVisible();
};

Grid.prototype.blockIED = function (x, y) {
    var tile = this.getTile(x, y);
    if (tile.getType() === TileType.IED)
        tile.setType(TileType.BLOCKED);
};

// Returns a list of tiles adjacent to (x, y) that are of type IED
// and have 8 adjacent visible tiles.
Grid.prototype.checkAdjacentIEDs = function (x, y) {
    var list = [];

    this.surrounding(x, y, function (tile) {
        if (tile.getType() !== TileType.IED || tile.getState() === TileState.VISIBLE) return;

        var count = 0;
        this.surrounding(tile.x, tile.y, function (tile2) {
            if (tile2.getState() === TileState.VISIBLE) count++;
        });

        if (count === 8) {
            list.push(tile);
        }
    });

    return list;
};

// Returns true if the tile at (x, y) can be searched.
// The tile cannot be searched if it has an adjacent flagged
// tile which is adjacent to 7 visible tiles.
Grid.prototype.checkSearchRestrictions = function (x, y) {
    var result = true;

    this.surrounding(x, y, function (tile) {
        if (tile.getState() !== TileState.FLAG1) return;

        var count = 0;
        this.surrounding(tile.x, tile.y, function (tile2) {
            if (tile2.getState() === TileState.VISIBLE) count++;
        });

        if (count === 7) {
            result = false;
            tile.flash();
        }
    });

    return result;
};

// Mark or unmark the tile at (x, y) as IED.
// Returns the net increase in number of flags.
Grid.prototype.markIED = function (x, y) {
    var tile = this.getTile(x, y);
    if (tile.getState() === TileState.HIDDEN) {
        tile.setState(TileState.FLAG1);
        return 1;
    } else if (tile.getState() === TileState.FLAG1) {
        tile.setState(TileState.HIDDEN);
        return -1;
    } else if (tile.getState() === TileState.FLAG2) {
        tile.setState(TileState.FLAG1);
    }
    return 0;
};

// Mark or unmark the tile at (x, y) as safe.
// Returns the net increase in number of flags.
Grid.prototype.markSafe = function (x, y) {
    var tile = this.getTile(x, y);
    if (tile.getState() === TileState.HIDDEN) {
        tile.setState(TileState.FLAG2);
        return 1;
    } else if (tile.getState() === TileState.FLAG2) {
        tile.setState(TileState.HIDDEN);
        return -1;
    } else if (tile.getState() === TileState.FLAG1) {
        tile.setState(TileState.FLAG2);
    }
    return 0;
};

// Search the tile at (x, y). If this is a safe tile, its neighbors will
// automatically be searched. Returns the number of tiles set to visible.
Grid.prototype.searchTile = function (x, y) {
    if (!this.checkSearchRestrictions(x, y)) return 0;

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
};

// Set all tiles to visible. Returns an object containing statistics
// about the board: { markers, disarmed, active }.
Grid.prototype.showAllTiles = function () {
    var markers = 0;
    var disarmed = 0;
    var active = 0;

    for (var y = 0; y < this.cols; y++) {
        for (var x = 0; x < this.rows; x++) {
            var tile = this.getTile(x, y);

            if (tile.getState() === TileState.FLAG1) {
                markers++;

                // disarm IEDs on marked tiles
                if (tile.getType() === TileType.IED) {
                    tile.setType(TileType.DISARMED);
                    disarmed++;
                }
            } else if (tile.getType() === TileType.IED) {
                active++;
            }

            tile.setState(TileState.VISIBLE);
        }
    }

    return { markers: markers, disarmed: disarmed, active: active };
};

// Set all tiles in the given list to visible.
// Returns the number of tiles set to visible.
Grid.prototype.showTiles = function (tiles) {
    var count = 0;
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (!tile.isVisible()) {
            tile.setState(TileState.VISIBLE);
            count++;
        }
    }
    return count;
};

// Unflag all tiles in the given list.
// Returns the number of tiles unflagged.
Grid.prototype.unflagTiles = function (tiles) {
    var count = 0;
    for (var i = 0; i < tiles.length; i++) {
        var tile = tiles[i];
        if (tile.isFlagged()) {
            tile.setState(TileState.HIDDEN);
            count++;
        }
    }
    return count;
};

// Adds a random number of IEDs to the grid, avoiding the tile at (x, y).
// Difficulty affects the number of IEDs, and should be between 0 and 10.
Grid.prototype.randomize = function (x, y, difficulty) {
    var totalTiles = this.rows * this.cols;
    var bonus = Math.min(Math.max(0, difficulty / 10), 1) * 0.080;
    var min = (0.104 + bonus) * totalTiles;
    var max = (0.121 + bonus) * totalTiles;
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
};

// Reset the grid to its default configuration.
Grid.prototype.reset = function () {
    for (var y = 0; y < this.rows; y++) {
        for (var x = 0; x < this.cols; x++) {
            this.getTile(x, y).reset();
        }
    }
};

// Run the specified function on all the tiles surroundng (x, y).
Grid.prototype.surrounding = function (x, y, fn) {
    for (var ry = y - 1; ry <= y + 1; ry++) {
        for (var rx = x - 1; rx <= x + 1; rx++) {
            if (rx === x && ry === y) continue;
            if (rx < 0 || ry < 0) continue;
            if (rx >= this.cols || ry >= this.rows) continue;

            fn.call(this, this.getTile(rx, ry));
        }
    }
};

// Set an IED at (x, y), and increment danger of surrounding tiles.
Grid.prototype._setIED = function (x, y) {
    this.getTile(x, y).setType(TileType.IED);
    this.surrounding(x, y, function (tile) {
        tile.incrementDanger();
    });
};

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
};
