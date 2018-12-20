/**
 * @struct
 * @interface
 * 
 * @param {MapPosition} position
 * @param {Object<string,?>} options
 * 
 * @template MarkerType
 * @template LinestringType
 * @template PolygonType
 * @template InfoWindowType
 * @template LocationMarkerType
 * 
 */
function MapInterface (position, options){}

/**
 * @abstract
 * 
 * 
 * @param {function ()} callback
 * @param {Element} mapDiv
 * @param {{strokeWeight: number, strokeColor: string, fillOpacity: number}|function(string, boolean):{strokeWeight: number, strokeColor: string, fillOpacity: number}} polygonOptions
 * 
 * @return {undefined}
 */
MapInterface.prototype.init = function (mapDiv, callback, polygonOptions){};

/**
 * @abstract
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
MapInterface.prototype.createMarker = function (latlng, icon, size, movable, mapSymbol, zIndex){};

/**
 * @abstract
 * 
 * @param {MarkerType} marker
 * @param {Array<{url: string, size: number}>} icons
 * @param {!MapSymbol} mapSymbol
 * @param {number} zIndex
 * 
 * @return {MarkerType}
 */
MapInterface.prototype.updateMarker = function (marker, icons, mapSymbol, zIndex){};

/**
 * @abstract
 * 
 * @param {MarkerType} marker
 * 
 * @return {undefined}
 */
MapInterface.prototype.showMarker = function (marker){};

/**
 * @abstract
 * 
 * @param {MarkerType} marker
 * 
 * @return {{lat: number, lng: number}}
 */
MapInterface.prototype.getMarkerPosition = function (marker){};

/**
 * @abstract
 * 
 * @param {InfoWindowType} infoWindow
 * 
 * @return {{lat: number, lng: number}}
 */
MapInterface.prototype.getInfoWindowPosition = function (infoWindow){};

/**
 * @abstract
 * 
 * @param {MarkerType|LinestringType|PolygonType} overlay
 * 
 * @return {undefined}
 */
MapInterface.prototype.destroyOverlay = function (overlay){};

/**
 * ignore
 * 
 * @abstract
 * 
 * @param {MarkerType} marker
 * @param {number} newLat
 * @param {number} newLng
 * 
 * @return {undefined}
 */
MapInterface.prototype.moveMarker = function (marker, newLat, newLng){};

/**
 * @abstract
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
MapInterface.prototype.addMarkerListeners = function (clickFun, rightClickFun, dragFun, mouseOverFun, mouseOutFun){};

/**
 * @abstract
 * 
 * Has to return (not show) a internal representation of the polygon or line string
 * 
 * @param {IMGeometry} geoData
 * @param {MapShape} mapShape
 * @param {string} id
 * 
 * @return {LinestringType|PolygonType}
 */
MapInterface.prototype.createShape = function (geoData, mapShape, id){};

/**
 * @abstract
 * 
 * Adds the polygon or line string to the map
 * 
 * @param {LinestringType|PolygonType} shapeObject
 */
MapInterface.prototype.addShape = function (shapeObject){};

/**
 * @abstract
 * 
 * Removes the polygon or line string to the map
 * 
 * @param {LinestringType|PolygonType} shapeObject
 */
MapInterface.prototype.removeShape = function (shapeObject){};

/**
 * @abstract
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
MapInterface.prototype.addShapeListeners = function (clickFun){};

/**
 * @abstract
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
MapInterface.prototype.createInfoWindow = function (anchorElement, symbols, elements, mapElement){};

/**
 * @abstract
 * 
 * @param {MarkerType|LinestringType|PolygonType} anchorElement
 * @param {InfoWindowType} infoWindow
 * @param {number=} tabIndex
 * @param {number=} lat
 * @param {number=} lng
 * 
 * @return {undefined}
 */
MapInterface.prototype.openInfoWindow = function (anchorElement, infoWindow, tabIndex, lat, lng){};

/**
 * @abstract
 * 
 * @param {InfoWindowType} infoWindow
 * @param {number|undefined} tabIndex
 * @param {string|Element} newContent
 * 
 * @return {undefined}
 */
MapInterface.prototype.updateInfoWindowContent = function (infoWindow, tabIndex, newContent){};


/**
 * @abstract
 * 
 * Has to trigger the listeners for tab closed and window closed
 * 
 * @param {InfoWindowType} infoWindow
 * 
 * @return {undefined}
 */
MapInterface.prototype.destroyInfoWindow = function (infoWindow){};

/**
 * @abstract
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
MapInterface.prototype.addInfoWindowListeners = function (tabOpenedFun, tabClosedFun, windowClosedFun, locationWindowClosedFun){};

/**
 * 
 * ignore
 * 
 * @abstract
 * 
 * Menu to chose a category to add new overlays
 * 
 * @param {Array<{id: number, name: string, allowedOverlays: Array<boolean>}>} list 
 * @param {function (number, OverlayType, (MarkerType|LinestringType|PolygonType)):(MapSymbol|MapShape)} overlayAddedCallback
 * 
 * @return {undefined}
 */
MapInterface.prototype.addNewOverlaysComponent = function (list, overlayAddedCallback){};

/**
 * 
 * ignore
 * 
 * @abstract
 * 
 * @return {undefined}
 */
MapInterface.prototype.removeNewOverlaysComponent = function (){};

/**
 * 
 * ignore
 * 
 * @abstract
 * 
 * @param {{name : string, img : string, callback: function(), show : boolean}} revertInfo
 * @param {{name : string, img : string, callback: function(), show : boolean}} undoInfo
 * @param {{name : string, img : string, callback: function(), show : boolean}} commitInfo
 * 
 * @return {undefined}
 */
MapInterface.prototype.addUndoComponent = function (revertInfo, undoInfo, commitInfo){};

/**
 * 
 * ignore
 * 
 * @abstract
 * 
 * @param {boolean|string} showRevert
 * @param {boolean|string} showUndo
 * @param {boolean|string} showCommit
 * 
 * @return {undefined}
 */
MapInterface.prototype.updateUndoComponent = function (showRevert, showUndo, showCommit){};

/**
 * 
 * ignore
 * 
 * @abstract
 * 
 * @return {undefined}
 */
MapInterface.prototype.removeUndoComponent = function (){};

/**
 * @abstract
 * 
 * @return {Element}
 */
MapInterface.prototype.createOptionElement = function (){};

/**
 * 
 * @abstract
 * 
 * @return {undefined}
 */
MapInterface.prototype.removeOptionElement = function (){};

/**
 * 
 * @abstract
 * 
 * @param {Element} element
 * 
 * @return {undefined}
 */
MapInterface.prototype.addOptionElement = function (element){};

/**
 * 
 * ignore
 * 
 * @abstract
 * 
 * @param {(MarkerType|LinestringType|PolygonType)} overlay
 * 
 * @return {undefined}
 */
MapInterface.prototype.centerOnOverlay = function (overlay){};

/**
 * @abstract
 * 
 * @param {number} lat
 * @param {number} lng
 * 
 * @return {undefined}
 */
MapInterface.prototype.setCenter = function (lat, lng){};

/**
 * @abstract
 * 
 * @param {number} zoom Zoom level in GM units
 * 
 * @return {undefined}
 */
MapInterface.prototype.setZoom = function (zoom){};

/**
 * Has to return the current zoom level in GM units
 * 
 * @abstract
 *
 * @return {number}
 */
MapInterface.prototype.getZoom = function (){};

/**
 * 
 * ignore
 * 
 * @abstract
 * 
 * @param {(MarkerType|LinestringType|PolygonType)} overlay
 * 
 * @return {string}
*/
MapInterface.prototype.getWKTStringForOverlay = function (overlay){};

/**
 * 
 * ignore
 * 
 * @abstract
 * 
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * 
 * @return {undefined}
*/

MapInterface.prototype.zoomToBounds = function (lat1, lng1, lat2, lng2){};

/**
 * @abstract
 * 
 * @param {number} lat
 * @param {number} lng
 * @param {string} text
 * @param {string} id
 * @param {boolean} zoom
 * 
 * @return {LocationMarkerType}
 */
MapInterface.prototype.addLocationMarker = function (lat, lng, text, id, zoom){};

/**
 * @abstract
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
MapInterface.prototype.changePolygonAppearance = function (id, fillColor, strokeColor, fillOpacity, strokeOpacity, zIndex){};

/**
 * @abstract
 * 
 * Currently only needed to revert polygon colors changed for quantification
 * 
 * @return {undefined}
 */
MapInterface.prototype.revertChangedOverlays = function (){};

/**
 * @abstract
 * 
 * @param {boolean} quantifyMode
 * 
 * @return {undefined}
 */
MapInterface.prototype.updateMapStyle = function (quantifyMode){};

/**
 * @abstract
 * 
 * @param {boolean} print
 * 
 * @return {undefined}
 */
MapInterface.prototype.showPrintVersion = function (print){};

/**
 * @abstract
 * 
 * @param {function():undefined} clickFunction Has to be called if the element is clicked
 * @param {function():undefined} callback Has to be called after the element is added
 * 
 * @return {undefined}
 */
MapInterface.prototype.addLocationDiv = function (clickFunction, callback){};

/**
 * @abstract
 * 
 * @param {Element} div
 * 
 * @return {undefined}
 */
MapInterface.prototype.addQuantifyColorDiv = function (div){};

/**
 * @abstract
 * 
 * @return {{lat: number, lng: number}}
 */
MapInterface.prototype.getCenter = function (){};

/**
 * @abstract
 * 
 * @return {undefined}
 */
MapInterface.prototype.repaint = function (){};