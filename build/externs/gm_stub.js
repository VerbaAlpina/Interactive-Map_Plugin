/**
 * @struct
 * @constructor
 * 
 * @param {MapPosition} position
 * @param {Object<string,?>} options
 * 
 * @implements{MapInterface<google.maps.Marker, google.maps.Data.Feature, google.maps.Data.Feature, Object>}
 * 
 * @suppress {checkTypes}
 */
function GoogleMapsInterface (position, options){
	/**
	 * @param {string} id
	 * @param {Array<google.maps.MapTypeStyle>} style
	 * 
	 * @return {undefined}
	 */
	this.addMapStyle = function (id, style){};
};

