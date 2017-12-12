
/**
 * Provide storage capability for game data.
 * @constructor
 */
function StorageManager() {
    this.storage = this._isSupported('localStorage') ? window.localStorage : window.sessionStorage;
}

StorageManager.prototype.getHighScore = function () {
    return this.storage.getItem('iedHighScore') || 0;
};

StorageManager.prototype.setHighScore = function (score) {
    this.storage.setItem('iedHighScore', score);
};

StorageManager.prototype._isSupported = function (type) {
    try {
        var storage = window[type],
            x = '_storage_test_';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    } catch (e) {
        return false;
    }
};
