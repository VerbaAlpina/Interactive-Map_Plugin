/**
 * @constructor
 * @struct
 * @implements FilterComponent
 * 
 * @param {!Array<number>|function(number, string):Array<number>} categoryList
 * @param {number|string|function(number, string):(number|string|undefined)=} defaultValue (category id or tag)
 * @param {boolean=} addEmptyValue (if it is possible not to group the data at all)
 * @param {Sorter=} sorter
 * @param {function(number, string, number, number):boolean=} sorterApplicable
 * 		This function is called with the main-category id, the element id, the selected sub-category id and the sorter id 
 * 		and should return true if the sorter should be selectable.
 * 		Default always returns true.
 * @param {Array<{tag:string, name:string}>|function(number, string):Array<{tag:string, name:string}>=} tagList
 * 
 * Enables the grouping of the elements by a category.
 */

//TODO sorterApplicable for tags???
function GroupingComponent (categoryList, defaultValue, addEmptyValue, sorter, sorterApplicable, tagList){
	
	/** @type {Array<number>|function(number, string):Array<number>} */
	this.categoryList = categoryList;
	
	/** @type{number|string|undefined|function(number, string):(number|string|undefined)} */
	this.defaultValue = defaultValue;
	
	/** @type{boolean} */
	this.addEmptyValue = addEmptyValue !== undefined ? addEmptyValue: true;
	
	/** @type {Array<{tag:string, name:string}>|function(number, string):Array<{tag:string, name:string}>} */
	this.tagList = [];
	
	if(tagList !== undefined)
		this.tagList = tagList;
	
	/** @type{Sorter|undefined} */
	this.sorter = sorter;
	
	/**
	 * @type {function(number, string, number, number):boolean} 
	 */
	this.sorterApplicable;
	if(sorterApplicable == undefined){
		this.sorterApplicable = function (){return true;};
	}
	else {
		this.sorterApplicable = sorterApplicable;
	}
	
	/**
	 * @override
	 * 
	 * @param {number} categoryId
	 * @param {string} elementId
	 * 
	 * @return {Element|FilterComponentDirectResult} 
	 */
	this.getFilterScreenElement = function (categoryId, elementId){
		
		var /** string|number|undefined */ defaultValue;
		if(typeof this.defaultValue == "function"){
			defaultValue = this.defaultValue(categoryId, elementId);
		}
		else {
			defaultValue = this.defaultValue;
		}
		
		var /** Element */ result = document.createElement("div");
		result["className"] = "filterComponent";
		result["id"] =  "groupingComponent";
		
		var /** Element */ capGroup = document.createElement("h2");
		capGroup.appendChild(document.createTextNode(TRANSLATIONS["GROUPING"]));
		result.appendChild(capGroup);
		
		var /**Element */ radioNoGroups = document.createElement("input");
		radioNoGroups["type"] = "radio";
		radioNoGroups["name"] = "subElementCategory";
		radioNoGroups["value"] = "-2";

		if(defaultValue == undefined){
			radioNoGroups["checked"] = true;
		}
		
		if (this.addEmptyValue){
			var radio_span = document.createElement("span");
			radio_span.appendChild(radioNoGroups);
			radio_span.appendChild(document.createTextNode(TRANSLATIONS["NO_GROUPING"]));
			result.appendChild(radio_span);
		}
		
		var /**Array<number>|Array<string> */ categoryList;
		if(typeof this.categoryList === "function"){
			categoryList = this.categoryList(categoryId, elementId);
		}
		else {
			categoryList = this.categoryList;
		}
		
		var /** boolean */ defaultSet = false;
		
		for (var i = 0; i < categoryList.length; i++){
			var /** number */ categoryID = categoryList[i];
			var /** Element */ radio = document.createElement("input");
			radio["type"] = "radio";
			radio["name"] = "subElementCategory";
			radio["value"] = categoryID;
			if(categoryList[i] == defaultValue){
				radio["checked"] = true;
				defaultSet = true;
			}

			radio_span = document.createElement("span");
			radio_span.appendChild(radio);
			radio_span.appendChild(document.createTextNode(categoryManager.getCategoryName(categoryID) + " "))
			result.appendChild(radio_span);
		}
		
		var /**Array<number>|Array<string> */ tagList;
		if(typeof this.tagList === "function"){
			tagList = this.tagList(categoryId, elementId);
		}
		else {
			tagList = this.tagList;
		}		
		
		if((categoryList.length == 0 || categoryList.length == null) && (tagList == undefined || tagList.length == 0))
			return null;
			
		if (categoryList.length + tagList.length == 1){
			if (categoryList.length == 1){
				return new FilterComponentDirectResult({"subElementCategory": categoryList[0]});
			}
			else {
				return new FilterComponentDirectResult({"subElementCategory": "-3", "selectedTag": tagList[0]["tag"]});
			}
		}
		
		for (i = 0; i < tagList.length; i++){
			var /** string */ tag = tagList[i].tag;
			radio = document.createElement("input");
			radio["type"] = "radio";
			radio["name"] = "subElementCategory";
			radio["value"] = tag;
			if(tag == defaultValue){
				radio["checked"] = true;
				defaultSet = true;
			}
			result.appendChild(radio);
			
			result.appendChild(document.createTextNode(tagList[i].name + " "));

		}
		
		// result.appendChild(document.createElement("br"));
		
		if(this.sorter != null){
			// result.appendChild(document.createElement("br"));
			result.appendChild(this.sorter.getFilterScreenElement(categoryId, elementId));
		}
		
		if(!defaultSet){
			radioNoGroups["checked"] = true;
		}
		
		return result;
	};
	
	/**
	 * @override
	 * 
	 * @param {Object<string, ?>} data
	 * 
	 * @return {boolean} 
	 */
	this.storeData = function (data){
		var /** number|string */ selectedValue  = /** @type {number|string} */ (jQuery("#groupingComponent input[name=subElementCategory]:checked").val());
		
		if(isNaN(selectedValue)){
			data["subElementCategory"] = "-3";
			data["selectedTag"] = selectedValue;
		}
		else {
			data["subElementCategory"] = selectedValue;
		}
		
		if(this.sorter)
			this.sorter.storeData(data);
		
		return true;
	};
	
	/**
	 * @override
	 * 
	 * @param {Object<string, ?>} data
	 * @param {number} categoryId
	 * @param {string} elementId
	 * 
	 * @return {undefined} 
	 */
	this.storeDefaultData = function (data, categoryId, elementId){
		if(this.defaultValue !== undefined){
			var /** number|string|undefined */ val;
			if(typeof this.defaultValue == "function")
				val = this.defaultValue(categoryId, elementId);
			else
				val = this.defaultValue;
			
			if(val !== undefined){
				if(isNaN(val)){
					data["subElementCategory"] = "-3";
					data["selectedTag"] = val;
				}
				else {
					data["subElementCategory"] = val;
				}
			}
		}
		
		if(this.sorter)
			this.sorter.storeDefaultData(data);
	};
	
	/**
	*
	* Uses the filter data to re-create the state in which this filter was submitted.
	*
	* @param {Object<string, ?>} data The complete filter data object after storeData has been called for all applicable filters
	* @param {Element} element The DOM element created by getFilterScreenElement.
	* @param {number} categoryId
	* @param {string} elementId
	* 
	* @return {undefined}
	*/
	this.setValues = function (data, element, categoryId, elementId){
		if (data["subElementCategory"] == -3){
			jQuery("#groupingComponent input[name=subElementCategory][value=" + data["selectedTag"] + "]").prop("checked", true);
		}
		else {
			jQuery("#groupingComponent input[name=subElementCategory][value=" + data["subElementCategory"] + "]").prop("checked", true);
		}
		
		if (this.sorter)
			this.sorter.setValues(data, element, categoryId, elementId);
	};
	
	/**
	 * @override
	 * 
	 * @param {Element} element
	 * @param {number} mainCategoryId
	 * @param {string} elementId
	 * 
	 * @return {undefined}
	 * 
	 */
	this.afterAppending = function (element, mainCategoryId, elementId){
		if(this.sorter != null){
			var /** number */ numSorters = this.sorter.sortTypes.length;
			var /** function(number,string,number,number):boolean */ applFunc = this.sorterApplicable;
			
			var /** function(number):undefined */ filerSortComponents = function (subCategoryId){
				for(var i = 0; i < numSorters; i++){
					var /** boolean */ applicable = applFunc(mainCategoryId, elementId, subCategoryId, i);
					var /** jQuery */ radio = jQuery("#sortingComponent input[name=sortName][value=" + i + "]");
					radio.prop("disabled", !applicable);
					if(!applicable && radio.is(":checked") && numSorters > 1){
						var /** jQuery */ otherRadio;
						if(i == 0)
							otherRadio = jQuery("#sortingComponent input[name=sortName][value=1]");
						else
							otherRadio = jQuery("#sortingComponent input[name=sortName][value=0]");
						otherRadio.prop("checked", true);
						otherRadio.trigger("click");
					}
				}
			};
			filerSortComponents(/** @type{number} */ (jQuery(element).find("input[name=subElementCategory]:checked").val()));
			
			jQuery(element).find("input[name=subElementCategory]").on("change", function (){
				if(this.checked){
					filerSortComponents(/** @type{number} */ (this.value));
				}
			});
		}
	};
}