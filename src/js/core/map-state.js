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
			
			var /** LegendElement */ legendElement = element.getLegendElement(element.currentTabIndex);
			if(element instanceof MapShape){
				var /** {lat: number, lng: number} */ latlng = mapInterface.getInfoWindowPosition(element.infoWindow);
				let /** {elementIndex: number, lat: number, lng: number} */ data = {"elementIndex" : element.index, "lat" : latlng["lat"], "lng" : latlng["lng"]};
				data["key"] = element.owner.key;
				data["category"] = element.owner.category;
				data["parent_key"] = legendElement.parent? legendElement.parent.key: null;
				data["parent_category"] = legendElement.parent? legendElement.parent.category: null;
				result.push(/** @type{{legendIndex: number, elementIndex: number, lat: number, lng: number}} */ (data));
			}
			else {
				let /** {lat: number, lng : number}*/ data = mapInterface.getMarkerPosition(element.getMarker());
				data["key"] = legendElement.key;
				data["category"] = legendElement.category;
				data["parent_key"] = legendElement.parent? legendElement.parent.key: null;
				data["parent_category"] = legendElement.parent? legendElement.parent.category: null;
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