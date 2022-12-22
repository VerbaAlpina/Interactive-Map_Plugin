/**
 * @const
 */
var L = {};

/**
 * @param {string} str
 * @param {Object} options
 * 
 * @return {L.Map}
 */
L.map = function (str, options){};

/**
 * @param {L.LatLng} center
 * @param {number} zoom
 * 
 * @return {L.Map}
 */
L.setView = function (center, zoom){};

/**
 * @param {string} baseUrl
 * @param {TileLayerOptions} options
 */
L.tileLayer = function (baseUrl, options){};

/**
 * 
 * @param {number} lat
 * @param {number} lng
 * 
 * @return {L.LatLng}
 */
L.latLng = function (lat, lng){};

/**
 * 
 * @param {number} x
 * @param {number} y
 * 
 * @return {L.Point}
 */
L.point = function (x, y){};

/**
 * @param {L.LatLng} latlng
 * @param {Object=} options
 * 
 * @return {L.Marker}
 */
L.marker = function (latlng, options){};

/**
 * @constructor
 */
L.Map = function (){};

/**
 * @param {L.LatLng} center
 * @param {number} zoom
 * @param {ZoomPanOptions} options
 */
L.Map.prototype.setView = function (center, zoom, options){};

/**
 * @param {L.LatLng} point
 */
L.Map.prototype.panTo = function (point){};

/**
 * @return {L.LatLng}
 */
L.Map.prototype.getCenter = function (){};

/**
 * @return {number}
 */
L.Map.prototype.getZoom = function (){};

/**
 * @param {number} zoom
 * 
 * @return {undefined}
 */
L.Map.prototype.setZoom = function (zoom){};

/**
 * @constructor
 * 
 * @param {number} lat
 * @param {number} lng
 * 
 */
L.LatLng = function (lat, lng){};

/**
 * @constructor
 * 
 * @param {Object} options
 * 
 */
L.Popup = function (options){};

/**
 * @param {(string|Element)} htmlContent
 * 
 * @return {undefined}
 */
L.Popup.prototype.setContent = function (htmlContent){};

/**
 * @param {L.LatLng} latlng
 * 
 * @return {undefined}
 */
L.Popup.prototype.setLatLng = function (latlng){};

/**
 * @param {L.Map} map
 * 
 * @return {undefined}
 */
L.Popup.prototype.openOn = function (map){};

/**
 * @constructor
 */
L.Point = function (){};

/**
 * @constructor
 */
L.Marker = function (){};

/**
 * @return {undefined}
 */
L.Marker.prototype.openPopup = function (){};

/**
 * @return {undefined}
 */
L.Marker.prototype.remove = function (){};

/**
 * @param {L.Popup} popup
 * 
 * @return {undefined}
 */
L.Marker.prototype.bindPopup = function (popup){};

/**
 * @typedef {{minZoom: number, maxZoom: number, subdomains: (string|Array<string>|undefined), errorTileUrl: (string|undefined), zoomOffset: (number|undefined), tms: (boolean|undefined), 
 * 				zoomReverse: (boolean|undefined), detectRetina: (boolean|undefined), crossOrigin: (boolean|string|undefined)}}
 */
var TileLayerOptions;

/**
 * @typedef {{animate: boolean, duration: (number|undefined), easeLinearity: (number|undefined), noMoveStart: (boolean|undefined)}}
 */
var ZoomPanOptions;

/**
 * @constructor
 * 
 * @param {L.Map}  map
 * @param {boolean} markerhover
 * @param {boolean} polyhover
 * 
 */
function LeafletPixiOverlay(map, markerhover, polyhover){};

/**
 * @return {undefined}
 */
LeafletPixiOverlay.prototype.completeDraw = function (){};

/**
 * @return {undefined}
 */
LeafletPixiOverlay.prototype.resetHover = function (){};

/**
 * @constructor
 * 
 * @param {Object} data
 */
LeafletPixiOverlay.prototype.gLPolygon = function (data){};


/**
 * @constructor
 * 
 * @param {Object} data
 */
LeafletPixiOverlay.pixiMarker = function (data){};

/**
 * @return {Array<number>}
 */
LeafletPixiOverlay.pixiMarker.prototype.latlng = function (){};

/**
 * @constructor
 */
function pixiOverlayClass (){};

/**
 * @param {pixiOverlayClass} overlay
 * 
 * @return {undefined}
 */
LeafletPixiOverlay.prototype.removePolygon = function (overlay){};

/**
 * @param {pixiOverlayClass} overlay
 * 
 * @return {undefined}
 */
LeafletPixiOverlay.prototype.removeMarker = function (overlay){};

/**
 * @type {Array<PIXI.Graphics>}
 */
LeafletPixiOverlay.prototype.pixipolygons;

/** 
 * @const 
 */
LeafletPixiOverlay.prototype.LpixiOverlay;

/** 
 * @type{number}
 */
LeafletPixiOverlay.prototype.external_scale;

/** 
 * @type{number}
 */
LeafletPixiOverlay.prototype.current_symbol_index;


/**
 * @const
 */
var PIXI = {};

/**
 * @const
 */
PIXI.Texture = {};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Object} options
 * 
 * @return {Object}
 */
PIXI.Texture.from = function (canvas, options){};

/**
 * @constructor
 */
PIXI.Graphics = function (){};