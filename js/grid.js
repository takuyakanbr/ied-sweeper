
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
