/**
 * @struct
 * @constructor
 * @implements {GuiOption}
 * 
 * @param {string} name
 * @param {function(Object<string,?>=)} clickListener
 */
function ClickOption (name, clickListener){
	
	/**
	 * @type {string}
	 */
	this.key;
	
	var /** Element */ button = document.createElement("input");
	button["type"] = "button";
	button["value"] = name;
	
	button.addEventListener("click", 
	function (){
		clickListener.call(optionManager);
	});
	
	/**
	 * @type {Array<Element>}
	 */
	this.elements = [];
	this.elements.push(button);
	this.elements.push(document.createElement("br"));
	
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
	 * @return {boolean}
	 */
	this.isSaved = function (){
		return false;
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
		return "";
	};
}