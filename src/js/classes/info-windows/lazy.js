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
function LazyInfoWindowContent (categoryID, elementID, overlayType, data){
	/**
	 * @type{Array<string>}
	 */
	this.ids = [data["overlay_id"]];
	
	/**
	 * @type{number}
	 */
	this.category = data["category"] * 1;
	
	/**
	 * @type {string}
	 */
	this.elementID = data["element_id"];
	
	/**
	 * @type{OverlayType}
	 */
	this.overlayType = overlayType; 
	
	/**
	 * @type{Array<InfoWindowContent>}
	 */
	this.realContents = null;
	
	/**
	 * @override
	 * 
	 * @param {number} index
	 * 
	 * @return {string|Element}
	 */
	this.getHtml = function (index){
		if (this.realContents){
			var /** string */ res = "";
			for (let i = 0; i < this.realContents.length; i++){
				if (i > 0){
					res += getInfoWindowContentSeparator();
				}
				res += this.realContents[i].getHtml(i);
			}
			return res;
		}
		
		return "<img src='" + PATH["Loading"] + "' />";
	};
	
	/**
	 * @override
	 * 
	 * @param {InfoWindowContent} oldContent
	 *
	 * @return {boolean} 
	 */
	this.tryMerge = function (oldContent){

		if (!this.realContents && oldContent instanceof LazyInfoWindowContent){
			for (let i = 0; i < this.ids.length; i++){
				oldContent.ids.push(this.ids[i]);
			}
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
		if (this.realContents){
			for (let i = 0; i < this.realContents.length; i++){
				this.realContents[i].resetState();
			}
		}
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
		if (this.realContents){
			for (let i = 0; i < this.realContents.length; i++){
				this.realContents[i].onOpen(tabContent, tabIndex, infoWindow, overlay);
			}
		}
		else {
			var /**Object<string,string>*/ ajaxData = {
				"action" : "im_a",
				"namespace" : "load_lazy_infowindow",
				"category" : this.category,
				"element_id" : this.elementID,
				"overlay_ids" : this.ids.join(","),
				"lang" : PATH["language"],
				"_wpnonce" : jQuery("#_wpnonce").val()
			};
			
			ajaxData = categoryManager.addAdditonalAjaxData(ajaxData);
			
			var thisObject = this;
				
			jQuery.post(ajaxurl, ajaxData, function(response) {
				var data = /** @type{Array<Object<string, ?>>}*/(JSON.parse(response));
				
				thisObject.realContents = [];
				for (let i = 0; i < data.length; i++){
					thisObject.realContents.push(categoryManager.createInfoWindowContent(data[i], thisObject.category, thisObject.elementID, thisObject.overlayType));
				}
				var /**Element */ newContent = mapInterface.updateInfoWindowContent(infoWindow, tabIndex, thisObject.getHtml(tabIndex));
				thisObject.onOpen(newContent, tabIndex, infoWindow, overlay);
			});
		}
	}
	
	/**
	 * @override
	 * 
	 * @param {Element} content
	 *
	 * @return {undefined} 
	 */
	this.onClose = function (content){
		if (this.realContents){
			for (let i = 0; i < this.realContents.length; i++){
				this.realContents[i].onClose(content);
			}
		}
	}
	
	/**
	 * @override
	 * 
	 * @return {Array<Object<string, string>>} 
	 */
	this.getData = function () {
		//TODO
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
		return this.ids.length;
	};
}