/**
 * @struct
 * @interface
 * 
 * @template MarkerType
 * @template LinestringType
 * @template PolygonType
 * @template InfoWindowType
 * 
 */
function MapInterface (){}

/**
 * @abstract
 * 
 * 
 * @param {function ()} callback
 * 
 * @return {undefined}
 */
MapInterface.prototype.init = function (callback){};

/**
 * @abstract
 * 
 * @param {number} lat
 * @param {number} lng
 * @param {string} icon
 * @param {boolean} movable
 * @param {!MapSymbol} mapSymbol Reference to the symbol representation in the IM logic. Needed for event listener.
 * 
 * @return {MarkerType}
 */
MapInterface.prototype.createMarker = function (lat, lng, icon, movable, mapSymbol){};

/**
 * @abstract
 * 
 * @param {MarkerType} marker
 * @param {Array<string>} icons
 * @param {!MapSymbol} mapSymbol
 * 
 * @return {MarkerType}
 */
MapInterface.prototype.updateMarker = function (marker, icons, mapSymbol){};

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
 * @param {MarkerType|LinestringType|PolygonType} overlay
 * 
 * @return {undefined}
 */
MapInterface.prototype.destroyOverlay = function (overlay){};

/**
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
 * Notice that these functions need the context (this) to be a the representation of the marker in the IM logic the
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
 * @param {Array<string>} symbols
 * @param {Array<Element>} elements
 * @param {Array<InfoWindowContent>} infoWindowContents
 * 
 * @return {InfoWindowType}
 */
MapInterface.prototype.createInfoWindow = function (symbols, elements, infoWindowContents){};

/**
 * @abstract
 * 
 * @param {MarkerType} marker
 * @param {InfoWindowType} infoWindow
 * @param {number} tabIndex
 * 
 * @return {undefined}
 */
MapInterface.prototype.openInfoWindow = function (marker, infoWindow, tabIndex){};

/**
 * @abstract
 * 
 * @param {InfoWindowType} infoWindow
 * @param {number} tabIndex
 * 
 * @return {Element}
 */
MapInterface.prototype.getInfoWindowContent = function (infoWindow, tabIndex){};


/**
 * @abstract
 * 
 * @param {InfoWindowType} infoWindow
 * 
 * @return {undefined}
 */
MapInterface.prototype.destroyInfoWindow = function (infoWindow){};

/**
 * @abstract
 * 
 * @param{function(Element, number, InfoWindowContent, InfoWindowType, (MarkerType|LinestringType|PolygonType))} tabOpenedFun
 * @param{function(Element, InfoWindowContent)} tabClosedFun
 * @param{function(Element, Array<InfoWindowContent>)} windowClosedFun
 * 
 * @return {undefined}
 */
MapInterface.prototype.addInfoWindowListeners = function (tabOpenedFun, tabClosedFun, windowClosedFun){};

/**
 * @abstract
 * 
 * Menu to chose a category to add new overlays
 * 
 * @param {Array<{id: number, name: string}>} list 
 * @param {function (number, OverlayType, (MarkerType|LinestringType|PolygonType)):(MapSymbol|MapShape)} overlayAddedCallback
 * 
 * @return {undefined}
 */
MapInterface.prototype.addNewOverlaysComponent = function (list, overlayAddedCallback){};

/**
 * @abstract
 * 
 * @return {undefined}
 */
MapInterface.prototype.removeNewOverlaysComponent = function (){};

/**
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
 * @abstract
 * 
 * @return {undefined}
 */
MapInterface.prototype.removeUndoComponent = function (){};

/**
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
 * @param {(MarkerType|LinestringType|PolygonType)} overlay
* 
* @return {string}
*/
MapInterface.prototype.getWKTStringForOverlay = function (overlay){};