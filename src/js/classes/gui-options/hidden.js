/**
 * @struct
 * @constructor
 * @implements {GuiOption}
 * 
 * @param {string} defaultValue
 * @param {boolean} isSaved
 */
function HiddenOption (defaultValue, isSaved){
	
	/**
	 * @type {string}
	 */
	this.defaultValue = defaultValue;
	
	/**
	 * @private
	 * @type {boolean}
	 */
	this.save = isSaved;
	
	/**
	 * @type {string}
	 */
	this.key;
	
	/**
	 * @override
	 * 
	 * @return boolean
	 */
	this.isSaved = function (){
		return this.save;
	};
	
	/**
	 * @override
	 * 
	 * @param {Element} parent
	 */
	this.appendHtmlElements = function (parent){
		//Do nothing
	};
	
	/**
	 * @override
	 * 
	 * @param{boolean} val
	 * 
	 * @return {undefined}
	 */
	this.setEnabled = function (val){
		//Do nothing
	};
	
	/**
	 * @override
	 * 
	 * @param{boolean} val
	 * @param{Object<string,?>=} details
	 * 
	 * @return {undefined}
	 */
	this.applyState = function (val, details){
		//Do nothing
	};
	
	/**
	 * @override
	 * 
	 * @param {string} key
	 * 
	 * @return {undefined}
	 */
	this.setKey = function (key){
		this.key = key;
	};

	/**
	 * @override
	 * 
	 * @return {string}
	 */
	this.getDefaultValue = function (){
		return this.defaultValue;
	};
}