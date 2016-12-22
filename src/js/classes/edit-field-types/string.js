/**
 * 
 * @constructor
 * @struct
 * 
 * @implements{FieldType}
 */
function StringInputType (){
	/**
	 * @override
	 * 
	 * @return {Element}
	 */
	this.createInputElement = function (){
		var /** Element */ inputField = document.createElement("input");
		inputField.type = "text";
		return inputField;
	};

	/**
	 * @override
	 * 
	 * @return {number}
	 */
	this.valueType = function (){
		return FieldInformation.STRING;
	};
}