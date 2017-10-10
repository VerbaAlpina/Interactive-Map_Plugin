/**
 * @constructor
 * @struct
 * @implements {InfoWindowContent}
 * 
 * @param {number} categoryID
 * @param {string} elementID
 * @param {OverlayType} overlayType
 * @param {Object<string, ?>=} fieldValues
 */
function EditableInfoWindowContent (categoryID, elementID, overlayType, fieldValues){
	
	/**
	 * 
	 * @type {string}
	 */
	this.markerID;
	
	if(fieldValues != undefined)
		this.markerID = fieldValues["id"];
	
	/**
	 * @private
	 * @type{Array<FieldInformation>}
	 */
	this.fields = categoryManager.getEditFields(categoryID, overlayType);
	
	/**
	 * @type {number}
	 */
	this.categoryID = categoryID;
	
	this.values = [];
	for (var i = 0; i < this.fields.length; i++){
		if(fieldValues !== undefined && fieldValues[this.fields[i].name] != undefined)
			this.values[i] = fieldValues[this.fields[i].name];
		else
			this.values[i] = this.fields[i].type.getDefaultValue();
	}
	
	/**
	 * @type {OverlayType}
	 */
	this.overlayType = overlayType;
		
	
	/**
	 * @override
	 * 
	 * @param {number} index
	 * 
	 * @return {Element}
	 */
	this.getHtml = function (index){
		var /** string */ result = "<div><table>";
		
		for (var i = 0; i < this.fields.length; i++){
			var /** FieldInformation */ field = this.fields[i];
			result += "<tr><td style='padding-right : 10px'>" + field.name + "</td><td class='inputTD" + i + "'>" + field.type.createInputString(this.values[i]) + "</td></tr>";
		}
		
		return jQuery.parseHTML(result + "</table></div>")[0];
	};
	
	/**
	 * @override
	 * 
	 * @param {MapSymbol} mapSymbol
	 * @param {LegendElement} owner
	 *
	 * @return {boolean} 
	 */
	this.tryMerge = function (mapSymbol, owner){
		return false;
	};
	
	/**
	 * @override
	 * 
	 * @param {Element} content
	 * @param {number} tabIndex
	 * @param {Object} infoWindow
	 * @param {Object} overlay
	 *
	 * @return {undefined} 
	 */
	this.onOpen = function (content, tabIndex, infoWindow, overlay){
		for (var i = 0; i < this.fields.length; i++){
			this.fields[i].type.bindChangeListener(jQuery(content).find(".inputTD" + i),
				/**
				 * @param {string} name
				 * @param {FieldType} type
				 * @param {Element} element
				 * @param {*} oldValue
				 * @param {*} newValue
				 * 
				 * @return {undefined}
				 */
				(function (name, type, element, oldValue, newValue){
					optionManager.addChange(
						new OverlayDataChangedOperation(this.markerID, this.categoryID, this.overlayType, overlay, infoWindow, tabIndex, name, type, element, oldValue, newValue));
				}).bind(this, this.fields[i].name, this.fields[i].type)
			);
		}
	};
	
	/**
	 * @override
	 * 
	 * @param {Element} content
	 *
	 * @return {undefined} 
	 */
	this.onClose = function (content){
		for (var i = 0; i < this.fields.length; i++){
			this.fields[i].type.removeChangeListener(jQuery(content).find(".inputTD" + i));
		}
	};
	
	/**
	 * @override
	 * 
	 * @return {Array<Object<string, string>>} 
	 */
	this.getData = function () {
		return null; //TODO ????
	};
	
	/**
	 * @override
	 * 
	 * @return {string}
	 */
	this.getName = function (){
		return "";
	};
}