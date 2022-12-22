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
function NoInfoWindowContent (categoryID, elementID, overlayType, data){
	
	/**@type{number} */
	this.numRecords = 1;
	
	/**
	 * @override
	 * 
	 * @param {number} index
	 * 
	 * @return {string|Element}
	 */
	this.getHtml = function (index){
		return this.numRecords + " " + (this.numRecords == 1? Ue["BELEG"]: Ue["BELEGE"]);
	};
	
	/**
	 * @override
	 * 
	 * @param {InfoWindowContent} oldContent
	 *
	 * @return {boolean} 
	 */
	this.tryMerge = function (oldContent){
		if (oldContent instanceof NoInfoWindowContent){
			oldContent.numRecords++;
			return true;
		}
		return false;
	};
	
	/**
	*
	* @override
	*
	* @return {undefined} 
	*/
	this.resetState = function (){
		this.numRecords = 1;
	};
	
	/**
	 * @override
	 * 
	 * @param {Element} tabContent
	 * @param {number} tabIndex
	 * @param {Object} infoWindow
	 * @param {Object} overlay
	 *
	 * @return {undefined} 
	 */
	this.onOpen = function (tabContent, tabIndex, infoWindow, overlay){
		
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
		return [];
	};
	
	/**
	 * @override
	 * 
	 * @return {string}
	 */
	this.getName = function (){
		return "";
	};
	
	/**
	 * @override
	 * 
	 * @return {number}
	 */
	this.getNumElements = function (){
		return this.numRecords;
	};
}