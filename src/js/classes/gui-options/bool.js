/**
 * @struct
 * @constructor
 * @implements {GuiOption}
 * 
 * @param {boolean} defaultValue
 * @param {string} name
 * @param {function(boolean, Object<string,?>=)} changeListener
 * @param {boolean} isSaved
 */
function BoolOption (defaultValue, name, changeListener, isSaved){
	
	/**
	 * @type {boolean}
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
	
	var /** Element */ checkbox = document.createElement("input");
	checkbox["type"] = "checkbox";
	
	var /** BoolOption */ thisObject = this;
	
	checkbox.addEventListener("change", 
	function (){
		var /** boolean */ checked = jQuery(this).is(":checked");
		optionManager.setOptionState(thisObject.key, checked);
		changeListener.bind(optionManager)(checked);
	});
	
	/**
	 * @type {Array<Element>}
	 */
	this.elements = [];
	this.elements.push(checkbox);
	this.elements.push(document.createTextNode(name));
	this.elements.push(document.createElement("br"));
	
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
		for (var i = 0; i < this.elements.length; i++){
			var a = parent.appendChild(this.elements[i]);
		}
	};
	
	/**
	 * @override
	 * 
	 * @param{boolean} val
	 * 
	 * @return {undefined}
	 */
	this.setEnabled = function (val){
		if(val)
			this.elements[0].removeAttribute("disabled");
		else
			this.elements[0]["disabled"] = "disabled";
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
		if(val == "1")
			val = true;
		if(val == "0")
			val = false;
		if(val == "true")
			val = true;
		if(val == "false")
			val = false;
		
		if(val)
			this.elements[0]["checked"] = true;
		else
			this.elements[0]["checked"] = false;
		
		changeListener.bind(optionManager)(val, details);
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
	 * @return {boolean}
	 */
	this.getDefaultValue = function (){
		return this.defaultValue;
	};
}