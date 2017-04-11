/**
 * @struct
 * @constructor
 * 
 * @implements{UndoableOperation}
 * 
 * @param {Object} overlay
 * @param {number} categoryID
 * @param {OverlayType} overlayType
 * @param {Object} infoWindow
 * 
 */
function OverlayAddedOperation (overlay, categoryID, overlayType, infoWindow){

	/**
	 * @type{string}
	 */
	this.overlayID = OverlayAddedOperation.getNextID();
	
	/**
	 * @type{Object}
	 */
	this.overlay = overlay;
	
	/**
	 * @type{number}
	 */
	this.categoryID = categoryID;
	
	/**
	 * @type{OverlayType}
	 */
	this.overlayType = overlayType;
	
	/**
	 * @type{Object}
	 */
	this.infoWindow = infoWindow;
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.undo = function (){
		mapInterface.centerOnOverlay(this.overlay);
		mapInterface.destroyOverlay(this.overlay)
		if(this.infoWindow != undefined)
			mapInterface.destroyInfoWindow(this.infoWindow);
	}
	
	/**
	 * @override
	 * 
	 * @return {Array<{operation : string, id : string, category : number}>}
	 */
	this.getCommitInformation = function (){
		var /**Array<FieldInformation>*/ editFields = categoryManager.getEditFields(this.categoryID, this.overlayType);
		var /** Object<string, ?>*/ data = {};
		
		for (var i = 0; i < editFields.length; i++){
			data[editFields[i].name] = editFields[i].type.getDefaultValue();
		}
		
		return [{
			operation : "overlayAdded",
			id : this.overlayID,
			category : this.categoryID,
			type : this.overlayType,
			geoData : mapInterface.getWKTStringForOverlay(this.overlay),
			valuesNew : data
		}];
	};
}

/**
 * @private
 * 
 * @type {number}
 */
OverlayAddedOperation.currentID = 0;

/**
 * @return {string}
 */
OverlayAddedOperation.getNextID = function (){
	return "NEW" + OverlayAddedOperation.currentID++;
}