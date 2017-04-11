/**
 * 
 * @constructor
 * @struct
 * 
 * @implements{FieldType<string>}
 */
function StringInputType (){
	
	/**
	 * @override
	 * 
	 * @param {string} startValue
	 * 
	 * @return {string}
	 */
	this.createInputString = function (startValue){
		var /**string*/ val = startValue.replace(StringInputType.regex, "&#39;")
		return "<input type='text' class='IM_StringInput' data-last='" + val + "' value='" + val + "'></input>";
	};
	
	
	/**
	 * @override
	 * 
	 * @param {jQuery} content
	 * @param {function(Element, string, string)} listener
	 * 
	 * @return {undefined}
	 */
	this.bindChangeListener = function (content, listener){
		content.on("change", ".IM_StringInput", function (event){
			var /** jQuery */ input = jQuery(event.target);
			var /** string */ newVal = /** @type{string} */ (input.val());
			listener(event.target, /** @type{string} */ (input.data("last")), newVal);
			input.data("last", newVal);
		});
	};
	
	/**
	 * @override
	 * 
	 * @param {jQuery} content
	 * 
	 * @return {undefined}
	 */
	this.removeChangeListener = function (content){
		content.off("change", ".IM_StringInput");
	};
	
	/**
	 * @override
	 * 
	 * @param {Element} element
	 * @param {string} str
	 * 
	 * @return {undefined}
	 */
	this.setValue = function (element, str){
		element.value = str;
		jQuery(element).data("last", str);
	};
	
	/**
	 * @override
	 * 
	 * @return {string}
	 */
	this.getSQLType = function (){
		return "%s";
	}
	
	/**
	 * @override
	 * 
	 * @return {string}
	 */
	this.getDefaultValue = function (){
		return "";
	}
	
	/**
	 * @override
	 * 
	 * @param {string} val
	 * 
	 * @return {boolean}
	 * 
	 */
	this.isEmpty = function (val){
		return !val || val.trim().length === 0;
	};
}

StringInputType.regex = /'/g;
