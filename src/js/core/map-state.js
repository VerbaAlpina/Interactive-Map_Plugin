/**
 * @constructor
 */
function MapState (){
	
	/**
	 * @private
	 * @type {!Object<string, Object>}
	 */
	this.currentLocationMarkers = {};
	
	/** 
	 * @private
	 * @type{Array<MapShape|MapSymbol>}
	 *
	 */
	this.currentInfowindowOwners = new Array();
	
	/**
	 * @param {MapShape|MapSymbol} mapElement
	 * 
	 * @return {undefined}
	 */
	this.removeInfoWindowOwnerFromList = function (mapElement){
		var idx = this.currentInfowindowOwners.indexOf(mapElement);
		if(idx != -1){
			this.currentInfowindowOwners.splice(idx,1);
		}
	};
	
	/**
	 * @param {MapShape|MapSymbol} mapElement
	 * 
	 * @return {boolean}
	 */
	this.addInfoWindowOwnerToList = function (mapElement){
		var idx = this.currentInfowindowOwners.indexOf(mapElement);
		if (idx == -1){
			this.currentInfowindowOwners.push(mapElement);
			return true;
		}
		return false;
	};
	
	/**
	 * @return {number}
	 */
	this.getInfoWindowCount = function (){
		return this.currentInfowindowOwners.length;
	};
	
	/**
	 * @param {number} index
	 * 
	 * @return {(MapShape|MapSymbol)}
	 */
	this.getInfoWindowOwner = function (index){
		return this.currentInfowindowOwners[index];
	}
	
	/**
	 * @return {!Array<{legendIndex: number, elementIndex: number, lat: number, lng: number}>}
	 */
	this.getOpenInfoWindows = function (){
		var /** !Array<{legendIndex: number, elementIndex: number, lat: number, lng: number}> */ result = [];
		for (var i = 0; i < this.currentInfowindowOwners.length; i++){
			var /** MapShape|MapSymbol */ element = this.currentInfowindowOwners[i];
			if(element instanceof MapShape){
				var /** google.maps.LatLng */ latlng = element.infoWindow.getPosition();
				let /** {elementIndex: number, lat: number, lng: number} */ data = {"elementIndex" : element.index, "lat" : latlng.lat(), "lng" : latlng.lng()};
				if (element.owner.parent == null){
					data["legendIndex"] = element.owner.getIndex();
				}
				else {
					data["legendIndex"] = element.owner.parent.getIndex();
					data["legendSubIndex"] = element.owner.getSubElementIndex();
				}
				result.push(/** @type{{legendIndex: number, elementIndex: number, lat: number, lng: number}} */ (data));
			}
			else {
				let /** {lat: number, lng : number}*/ data = mapInterface.getMarkerPosition(element.getMarker());
				var /** LegendElement */ legendElement = element.getLegendElement(element.currentTabIndex);

				if(legendElement.parent == null){
					data["legendIndex"] = legendElement.getIndex();
				}
				else {
					data["legendIndex"] = legendElement.parent.getIndex();
					data["legendSubIndex"] = legendElement.getSubElementIndex();
				}
				data["elementIndex"] = element.parts[element.currentTabIndex].indexes[0];
				data["tabIndex"] = element.currentTabIndex;
				result.push(/** @type{{legendIndex: number, elementIndex: number, lat: number, lng: number}} */ (data));
			}
		}
		return result;
	};
	
	/**
	 * @param {string} id
	 * 
	 * @return {undefined}
	 */
	this.addLocationMarker = function (id, marker){
		this.currentLocationMarkers[id] = marker;
	};
	
	/**
	 * @param {string} id
	 * 
	 * @return {undefined}
	 */
	this.removeLocationMarker = function (id){
		delete this.currentLocationMarkers[id];
	};
	
	/**
	 * @return {Array<string>}
	 */
	this.getLocationMarkers = function (){
		return Object.keys(this.currentLocationMarkers);
	};
	
	/**
	 * @return undefined
	 */
	this.clean = function (){
		for (var id in this.currentLocationMarkers){
			this.currentLocationMarkers[id].setMap(null);
		}
	}
}