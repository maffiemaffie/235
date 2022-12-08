// Skew rotates an edge around the anchor point, shear moves it along an axis - x or y
/**
 * Shears sprite along the x axis
 * OVERWRITES Y SCALE
 * @param {Number} offset normalized shear value when height = 1
 */
PIXI.Sprite.prototype.shearX = function (offset) {
    const angle = Math.atan(offset);

    this.skew = { 'x': angle, 'y': 0 };
    this.scale.y = Math.sqrt(1 + offset*offset);
}
/**
 * Shears sprite along the x axis
 * OVERWRITES X SCALE
 * @param {Number} offset normalized shear value when height = 1
 */
PIXI.Sprite.prototype.shearY = function (offset) {
    const angle = Math.atan(offset);

    this.skew = { 'x': 0, 'y': angle };
    this.scale.x = Math.sqrt(1 + offset*offset);
}
/**
 * Shears sprite along both axes
 * OVERWRITES SCALE
 * @param {Number} x normalized shear value when height = 1
 * @param {Number} y normalized shear value when width = 1
 */
PIXI.Sprite.prototype.shear = function (x, y) {
    this.shearX(x);
    this.shearY(y);
}

/**
 * Clamps value to a set range
 * @param {Number} value value to be clamped
 * @param {Number} min lower bound
 * @param {Number} max upper bound
 * @returns clamped value
 */
function clamp(value, min, max) {
    return Math.min(Math.max(min, value), max);
}

/**
     * Scales x value by its distance from the camera
     * @param {Number} x x coordinate
     * @param {Number} z distance from the camera
     * @returns projected x
     */
function _projX(x, z) { return x / Math.pow(2, z)};
/**
 * Scales y value by its distance from the camera
 * @param {Number} y y coordinate
 * @param {Number} z distance from the camera
 * @returns projected y
 */
function _projY(y, z) { return y / Math.pow(2, z)};
/**
 * Scales x and y value by its distance from the camera
 * @param {Number} x x coordinate
 * @param {Number} y y coordinate
 * @param {Number} z distance from the camera
 * @returns projected coordinate
 */
function _proj(x, y, z) { return { 'x': x / Math.pow(2, z), 'y': y / Math.pow(2, z) } };