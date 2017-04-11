/**
 * @struct
 * @constructor
 * 
 * @implements{UndoableOperation}
 * 
 * @param {string} overlayID
 * @param {number} categoryID
 * @param {OverlayType} overlayType
 * @param {Object} overlay
 * @param {Object} infoWindow
 * @param {number} tabIndex
 * @param {string} name
 * @param {FieldType} type
 * @param {Element} element
 * @param {*} oldValue
 * @param {*} newValue
 * 
 */
function OverlayDataChangedOperation (overlayID, categoryID, overlayType, overlay, infoWindow, tabIndex, name, type, element, oldValue, newValue){

	/**
	 * @type{string}
	 */
	this.overlayID = overlayID;
	
	/**
	 * @type {number}
	 */
	this.categoryID = categoryID;
	
	/**
	 * @type{OverlayType}
	 */
	this.overlayType = overlayType;
	
	/**
	 * @type{Object}
	 */
	this.overlay = overlay;
	
	/**
	 * @type{Object}
	 */
	this.infoWindow = infoWindow;
	
	/**
	 * @type {number}
	 */
	this.tabIndex;
	
	/**
	 * @type{string}
	 */
	this.name = name;
	
	/**
	 * @type{FieldType}
	 */
	this.type = type;
	
	/**
	 * @type{Element}
	 */
	this.element = element;
	
	/**
	 * @type{*}
	 */
	this.oldValue = oldValue;
	
	/**
	 * @type{*}
	 */
	this.newValue = newValue;
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.undo = function (){
		mapInterface.openInfoWindow(this.overlay, this.infoWindow, this.tabIndex);
		this.type.setValue(element, oldValue);
	};
	
	/**
	 * @override
	 * 
	 * @return {Array<{operation : string, id : string, category : number}>}
	 */
	this.getCommitInformation = function (){
		var /** !Object<string, *>*/ newVals = {};
		newVals[this.name] = this.newValue;
		
		var /** !Object<string, *>*/ oldVals = {};
		oldVals[this.name] = this.oldValue;
		
		return [{
			operation : "dataChanged",
			id : this.overlayID,
			category : this.categoryID,
			type : this.overlayType,
			valuesOld : oldVals,
			valuesNew : newVals
		}];
	};
}