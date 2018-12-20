/**
 * @struct
 * @constructor
 * 
 * @param {MapPosition} position
 * @param {Object<string,?>} options
 * 
 * @implements{MapInterface<Object, Object,Object, Object>}
 * 
 */
function PixiWebGLInterface (position, options){


this.map;
var that  = this;
	/**
	 * @override
	 * 
	 * 
	 * @param {function ()} callback
	 * @param {Element} mapDiv
	 * @param {{strokeWeight: number, strokeColor: string, fillOpacity: number}|function(string, boolean):{strokeWeight: number, strokeColor: string, fillOpacity: number}} polygonOptions
	 * 
	 * @return {undefined}
	 */
	this.init = function (mapDiv, callback, polygonOptions){


     var options = {
		doubleClickZoom : false,
		minZoom : position.minZoom
		}

    this.map = L.map('IM_map_div', options).setView([position.lat, position.lng], position.zoom);


	var osm_tile_layer  = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	});

	var cartoLight = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
	})

	var CartoDB_DarkMatter = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
	})

	var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
	});

	var Stamen_TerrainBackground = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
	}).addTo(this.map);

	var OpenMapSurfer_AdminBounds = L.tileLayer('https://korona.geog.uni-heidelberg.de/tiles/adminb/x={x}&y={y}&z={z}', {
		maxZoom: 19,
		attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	});

	var Stamen_Labels = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-labels/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png',
	opacity: 0.9
});

	var overlays = {
	  "Stamen" : Stamen_Labels,
	  "AdminBounds": OpenMapSurfer_AdminBounds
	};

	var base_maps = {
	"Stamen : Terrain" : Stamen_TerrainBackground,
	"OSM    : Open Street Map":       osm_tile_layer,
	"CartoDB  : Carto Light":         cartoLight,
	"CartoDB  : Carto Dark":          CartoDB_DarkMatter,
	"OpenTopo : OpenTopoMap":         OpenTopoMap
	};



L.control.layers(base_maps,overlays,{position: 'topright'}).addTo(this.map);


this.map.attributionControl.setPosition('bottomleft');
this.map.zoomControl.setPosition('bottomright');


this.pixioverlay =  new LeafletPixiOverlay(this.map,true,true);
this.pixioverlay.LpixiOverlay.addTo(this.map);

};
	
	/**
	 * @override
	 * 
	 * @param {{lat: number, lng: number}} latlng
	 * @param {string} icon
	 * @param {number} size
	 * @param {boolean} movable
	 * @param {!MapSymbol} mapSymbol Reference to the symbol representation in the IM logic. Needed for event listener.
	 * @param {number} zIndex
	 * 
	 * @return {MarkerType}
	 */
	this.createMarker = function (latlng, icon, size, movable, mapSymbol, zIndex){


		var texture =  PIXI.Texture.fromImage(icon);

		

	    var marker = new this.pixioverlay.pixiMarker(
			    {
			    latlng: [latlng['lat'],latlng['lng']],
			    texture: texture,
			    popupcontent:"test",
			    interactive: true,
			    alpha: 1.0	
			    }
    	 );	

	    return marker;

	};
	
	/**
	 * @override
	 * 
	 * @param {MarkerType} marker
	 * @param {Array<{url: string, size: number}>} icons
	 * @param {!MapSymbol} mapSymbol
	 * @param {number} zIndex
	 * 
	 * @return {MarkerType}
	 */

	this.updateMarker = function (marker, icons, mapSymbol, zIndex){
		console.log("UPDATE MARKER");
	};
	
	/**
	 * @override
	 * 
	 * @param {MarkerType} marker
	 * 
	 * @return {undefined}
	 */
	this.showMarker = function (marker){

	};
	
	/**
	 * @override
	 * 
	 * @param {MarkerType} marker
	 * 
	 * @return {{lat: number, lng: number}}
	 */
	this.getMarkerPosition = function (marker){
		return {lat: 0, lng: 0};
	};
	
	/**
	 * @override
	 * 
	 * @param {InfoWindowType} infoWindow
	 * 
	 * @return {{lat: number, lng: number}}
	 */
	this.getInfoWindowPosition = function (infoWindow){};
	
	/**
	 * @override
	 * 
	 * @param {MarkerType|LinestringType|PolygonType} overlay
	 * 
	 * @return {undefined}
	 */
	this.destroyOverlay = function (overlay){


		if(overlay['type'] =="gl_Marker"){
			this.pixioverlay.removeMarker(overlay);
		}

		if(overlay['type']=="gl_Polygon"){
			this.pixioverlay.removePolygon(overlay);
		}
		
	};
	
	/**
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {MarkerType} marker
	 * @param {number} newLat
	 * @param {number} newLng
	 * 
	 * @return {undefined}
	 */
	this.moveMarker = function (marker, newLat, newLng){
			console.log("MOVE MARKER");
	};
	
	/**
	 * @override
	 * 
	 * @param {function(this:MapSymbol, number)} clickFun
	 * @param {function(this:MapSymbol)} rightClickFun
	 * @param {function(this:MapSymbol, number, number)} dragFun
	 * @param {function(this:MapSymbol, number)} mouseOverFun
	 * @param {function(this:MapSymbol)} mouseOutFun
	 * 
	 * This function has to assure that the different event listener functions are triggered. It is only called once
	 * before any marker is created, so if the listeners have to be added to every single marker, the interface implementation
	 * must take care of it, itself. This is true for markers created by calling createMarker as well as for markers created by
	 * the user in edit mode.
	 * 
	 * Notice that these functions need the context (this) to be the representation of the marker in the IM logic the
	 * so-called map symbol, so some kind of connection between the marker and the map object has to be established.
	 * The map symbol is given to the marker constructing function (and also the updating function if this is needed). 
	 * 
	 * The click, mouseout und mouseover functions have also to be called with the index of the icon which was selected
	 * The drag function has also to be called with the old latitude and longitude of the marker.
	 * 
	 * The right click and drag listeners are only allowed to be added if the marker is movable!
	 * 
	 */
	this.addMarkerListeners = function (clickFun, rightClickFun, dragFun, mouseOverFun, mouseOutFun){};
	
	/**
	 * @override
	 * 
	 * Has to return (not show) a internal representation of the polygon or line string
	 * 
	 * @param {IMGeometry} geoData
	 * @param {MapShape} mapShape
	 * @param {string} id
	 * 
	 * @return {LinestringType|PolygonType}
	 */
	this.createShape = function (geoData, mapShape, id){

		var geo = {};
		var type = getKeyByValue(IMGeoType,geoData.getType());
		geo['type'] = type;
		var coordinates = geoData['geoData'];
		geo['coordinates'] = coordinates;
		geo['idx'] = id;

	    var color = mapShape.owner.getColorHex();
	    var polygon_settings = polygonSettingsBoth(color);

			var poly = new this.pixioverlay.gLPolygon({
					geo:geo,
					center:[42,20],
					line_width:polygon_settings.line_width,
					fill_color:color,
					fill_alpha:polygon_settings.fill_alpha,
					stroke_color:polygon_settings.stroke_color,
					stroke_alpha:1.0,
					popupcontent:"XX",
					interactive:true,
					hover_line_width: polygon_settings.hover_line_width,
					hover_fill_color:color,
					hover_fill_alpha:polygon_settings.hover_fill_alpha,
					hover_stroke_color:color,
					hover_stroke_alpha: 1.0
				});

		return poly;	

	};
	
	/**
	 * @override
	 * 
	 * Adds the polygon or line string to the map
	 * 
	 * @param {LinestringType|PolygonType} shapeObject
	 */
	this.addShape = function (shapeObject){};
	
	/**
	 * @override
	 * 
	 * Removes the polygon or line string to the map
	 * 
	 * @param {LinestringType|PolygonType} shapeObject
	 */
	this.removeShape = function (shapeObject){};
	
	/**
	 * @override
	 * 
	 * For polygons and line strings
	 * 
	 * Notice that the functions need the context (this) to be the representation of the marker in the IM logic the
	 * so-called map shape, so some kind of connection between the shape and the map object has to be established.
	 * The map symbol is given to the shape constructing function (and also the updating function if this is needed). 
	 * 
	 * @param {function(this:MapShape, number, number)} clickFun
	 * 
	 * @return {undefined}
	 * 
	 */
	this.addShapeListeners = function (clickFun){};
	
	/**
	 * @override
	 * 
	 * Has to create (but no show) an info window instance and return it.
	 * 
	 * For multi-tab info windows a list of symbols and respective html content is given
	 * For single content info windows both arrays have length 1 and the url is undefined
	 * 
	 * 
	 * @param {MarkerType|LinestringType|PolygonType} anchorElement
	 * @param {Array<{url: string, size: number}>} symbols
	 * @param {Array<Element|string>} elements
	 * @param {MapSymbol|MapShape} mapElement
	 * 
	 * @return {InfoWindowType}
	 */
	this.createInfoWindow = function (anchorElement, symbols, elements, mapElement){};
	
	/**
	 * @override
	 * 
	 * @param {MarkerType|LinestringType|PolygonType} anchorElement
	 * @param {InfoWindowType} infoWindow
	 * @param {number=} tabIndex
	 * @param {number=} lat
	 * @param {number=} lng
	 * 
	 * @return {undefined}
	 */
	this.openInfoWindow = function (anchorElement, infoWindow, tabIndex, lat, lng){};
	
	/**
	 * @override
	 * 
	 * @param {InfoWindowType} infoWindow
	 * @param {number|undefined} tabIndex
	 * @param {string|Element} newContent
	 * 
	 * @return {undefined}
	 */
	this.updateInfoWindowContent = function (infoWindow, tabIndex, newContent){};
	
	
	/**
	 * @override
	 * 
	 * Has to trigger the listeners for tab closed and window closed
	 * 
	 * @param {InfoWindowType} infoWindow
	 * 
	 * @return {undefined}
	 */
	this.destroyInfoWindow = function (infoWindow){};
	
	/**
	 * @override
	 * 
	 * @param{function(Element, number, (MapSymbol|MapShape), InfoWindowType, (MarkerType|LinestringType|PolygonType))} tabOpenedFun
	 * @param{function(Element, number, (MapSymbol|MapShape))} tabClosedFun
	 * @param{function(Element, (MapSymbol|MapShape))} windowClosedFun
	 * @param{function(string)} locationWindowClosedFun
	 * 
	 * tabOpenedFun: Has to be called if a new tab is opened (Also when the info window is opened regardless if there are tabs or)
	 * tabClosedFun: Has to be called if a tab is closed (Also when the info window is closed regardless if there are tabs or)
	 * windowClosedFun: Has to be called when the info window is closed
	 * 
	 * The order of the calls has to be:
	 * Tab Change: tabClosedFun for old tab -> tabOpenedFun for new tab
	 * Window Closed: tabClosedFun -> windowClosedFun
	 * 
	 * locationWindowClosedFun: Has to be called if a location marker info window (created by the location search) is closed
	 * 
	 * @return {undefined}
	 */
	this.addInfoWindowListeners = function (tabOpenedFun, tabClosedFun, windowClosedFun, locationWindowClosedFun){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * Menu to chose a category to add new overlays
	 * 
	 * @param {Array<{id: number, name: string, allowedOverlays: Array<boolean>}>} list 
	 * @param {function (number, OverlayType, (MarkerType|LinestringType|PolygonType)):(MapSymbol|MapShape)} overlayAddedCallback
	 * 
	 * @return {undefined}
	 */
	this.addNewOverlaysComponent = function (list, overlayAddedCallback){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeNewOverlaysComponent = function (){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {{name : string, img : string, callback: function(), show : boolean}} revertInfo
	 * @param {{name : string, img : string, callback: function(), show : boolean}} undoInfo
	 * @param {{name : string, img : string, callback: function(), show : boolean}} commitInfo
	 * 
	 * @return {undefined}
	 */
	this.addUndoComponent = function (revertInfo, undoInfo, commitInfo){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {boolean|string} showRevert
	 * @param {boolean|string} showUndo
	 * @param {boolean|string} showCommit
	 * 
	 * @return {undefined}
	 */
	this.updateUndoComponent = function (showRevert, showUndo, showCommit){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeUndoComponent = function (){};
	
	/**
	 * @override
	 * 
	 * @return {Element}
	 */
	this.createOptionElement = function (){
		return document.createElement("div");
	};
	
	/**
	 * 
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeOptionElement = function (){};
	
	/**
	 * 
	 * @override
	 * 
	 * @param {Element} element
	 * 
	 * @return {undefined}
	 */
	this.addOptionElement = function (element){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {(MarkerType|LinestringType|PolygonType)} overlay
	 * 
	 * @return {undefined}
	 */
	this.centerOnOverlay = function (overlay){};
	
	/**
	 * @override
	 * 
	 * @param {number} lat
	 * @param {number} lng
	 * 
	 * @return {undefined}
	 */
	this.setCenter = function (lat, lng){};
	
	/**
	 * @override
	 * 
	 * @param {number} zoom Zoom level in GM units
	 * 
	 * @return {undefined}
	 */
	this.setZoom = function (zoom){};
	
	/**
	 * Has to return the current zoom level in GM units
	 * 
	 * @override
	 *
	 * @return {number}
	 */
	this.getZoom = function (){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {(MarkerType|LinestringType|PolygonType)} overlay
	 * 
	 * @return {string}
	*/
	this.getWKTStringForOverlay = function (overlay){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {number} lat1
	 * @param {number} lng1
	 * @param {number} lat2
	 * @param {number} lng2
	 * 
	 * @return {undefined}
	*/
	
	this.zoomToBounds = function (lat1, lng1, lat2, lng2){};
	
	/**
	 * @override
	 * 
	 * @param {number} lat
	 * @param {number} lng
	 * @param {string} text
	 * @param {string} id
	 * @param {boolean} zoom
	 * 
	 * @return {LocationMarkerType}
	 */
	this.addLocationMarker = function (lat, lng, text, id, zoom){};
	
	/**
	 * @override
	 * 
	 * @param {string} id
	 * @param {string} fillColor CSS color string
	 * @param {string} strokeColor CSS color string
	 * @param {number} fillOpacity
	 * @param {number} strokeOpacity
	 * @param {number} zIndex
	 * 
	 * @return {undefined}
	 */
	this.changePolygonAppearance = function (id, fillColor, strokeColor, fillOpacity, strokeOpacity, zIndex){};
	
	/**
	 * @override
	 * 
	 * Currently only needed to revert polygon colors changed for quantification
	 * 
	 * @return {undefined}
	 */
	this.revertChangedOverlays = function (){};
	
	/**
	 * @override
	 * 
	 * @param {boolean} quantifyMode
	 * 
	 * @return {undefined}
	 */
	this.updateMapStyle = function (quantifyMode){};
	
	/**
	 * @override
	 * 
	 * @param {boolean} print
	 * 
	 * @return {undefined}
	 */
	this.showPrintVersion = function (print){};
	
	/**
	 * @override
	 * 
	 * @param {function():undefined} clickFunction Has to be called if the element is clicked
	 * @param {function():undefined} callback Has to be called after the element is added
	 * 
	 * @return {undefined}
	 */
	this.addLocationDiv = function (clickFunction, callback){};
	
	/**
	 * @override
	 * 
	 * @param {Element} div
	 * 
	 * @return {undefined}
	 */
	this.addQuantifyColorDiv = function (div){};
	
	/**
	 * @override
	 * 
	 * @return {{lat: number, lng: number}}
	 */
	this.getCenter = function (){};
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.repaint = function (){
			that.pixioverlay.completeDraw();
	};
}