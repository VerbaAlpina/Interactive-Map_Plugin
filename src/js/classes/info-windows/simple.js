/**
 * @constructor
 * @struct
 * @implements {InfoWindowContent}
 * 
 * @param {number} categoryID
 * @param {string} elementID
 * @param {OverlayType} overlayType
 * @param {Object<string, string>} data
 */
function SimpleInfoWindowContent (categoryID, elementID, overlayType, data){
	/**
	 * @type{Object<string,string>}
	 */
	this.data = data;
	
	/**
	 * @type {string} 
	 */
	this.contentString = '<div style="max-height: 300px; max-width: 600px;"><div style="max-height: 300px; max-width: 600px; overflow: auto; line-height: 1.35;"><h2>' + data["name"] + '</h2><br />' + data["description"] + '</div></div>';
	
	/**
	 * @override
	 * 
	 * @param {number} index
	 * 
	 * @return {string}
	 */
	this.getHtml = function (index){
		return this.contentString;
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
	 *
	 * @return {undefined} 
	 */
	this.onOpen = function (content){
		
	}
	
	/**
	 * @override
	 * 
	 * @param {Element} content
	 *
	 * @return {undefined} 
	 */
	this.onClose = function (content){
		
	}
	
	/**
	 * @override
	 * 
	 * @return {Array<Object<string, string>>} 
	 */
	this.getData = function () {
		return [this.data];
	};
	
	/**
	 * @override
	 * 
	 * @return {string}
	 */
	this.getName = function (){
		return this.data["name"];
	};
}