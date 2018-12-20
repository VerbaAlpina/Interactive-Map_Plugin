/**
 * @typedef{{viewportLng: number, viewportLat: number, viewportWidth: number, viewportHeight : number, gridsizeLng : number, gridsizeLat : number, threshold: number}}
 */
var ClustererOptions;

/**
 * @typedef {{owner: LegendElement, markingColor: number, infoWindows: Array<InfoWindowContent>, indexes: Array<number>}}
 */
var MapSymbolPart;

/**
* @enum {number}
*/
var IMGeoType = {
	Point : 0,
	Polygon : 1,
	MultiPolygon : 2,
	LineString: 3,
	MultiLineString: 4
};

/**
 * @typedef{({lat: number, lng: number} | Array<{lat: number, lng: number}> | Array<Array<{lat: number, lng: number}>> | Array<Array<Array<{lat: number, lng: number}>>>)}
 */
var IMGeoData;

/**
 * @typedef{Object<string, Array<number>|number>}
 */
var MultiColorIndex;

/**
 * @typedef{({fun: function(MultiColorIndex=), data: !Array, singular: boolean, sortedKeys: Array<string>}|null)}
 */
var WaitingData;

/**
 * @typedef{{lat: number, lng: number, zoom: number, minZoom: number}}
 */
var MapPosition;

/**
 * @enum {number}
 */
var OverlayType = {
	PointSymbol : 0,
	Polygon : 1,
	LineString : 2
};
/**
 * @const
 * @type {number}
 */
var num_overlay_types = 3;

/**
 * @enum {number}
 */
var features_classes = {
	main : 0,
	sub : 1,
	add : 2
};

/**
 * @enum{number}
 */
var MapInterfaceType = {
	GoogleMaps : 0,
	PixiWebGL : 1
};