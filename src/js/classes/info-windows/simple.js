/**
 * @constructor
 * @struct
 * @implements {InfoWindowContent}
 * 
 * @param {Object<string, string>} data
 */
function SimpleInfoWindowContent (data){
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
	 * @return {string}
	 */
	this.getHtmlString = function (){
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
	 * @param {InfoBubble} infoWindow
	 *
	 * @return {undefined} 
	 */
	this.onOpen = function (infoWindow){
		
	}
	
	/**
	 * @override
	 * 
	 * @param {InfoBubble} infoWindow
	 *
	 * @return {undefined} 
	 */
	this.onClose = function (infoWindow){
		
	}
	
	/**
	 * @override
	 * 
	 * @return {Array<Object<string, string>>} 
	 */
	this.getData = function () {
		return [this.data];
	};
}