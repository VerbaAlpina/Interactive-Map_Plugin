/**
 * @constructor
 * @struct
 * @implements FilterComponent
 * 
 * @param {!Array<number>|function(number, string):Array<number>} categoryList
 * @param {number|string=} defaultValue (category id or tag)
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
function GroupingComponent (categoryList, defaultValue, sorter, sorterApplicable, tagList){
	
	/** @type {Array<number>|function(number, string):Array<number>} */
	this.categoryList = categoryList;
	
	/** @type{number|string|undefined} */
	this.defaultValue = defaultValue;
	
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
	 * @return {Element} 
	 */
	this.getFilterScreenElement = function (categoryId, elementId){
		
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
		if(this.defaultValue == undefined){
			radioNoGroups["checked"] = true;
		}
		result.appendChild(radioNoGroups);
		result.appendChild(document.createTextNode(TRANSLATIONS["NO_GROUPING"]));
		
		var /**Array<number>|Array<string> */ categoryList;
		if(typeof this.categoryList === "function"){
			categoryList = this.categoryList(categoryId, elementId);
		}
		else {
			categoryList = this.categoryList;
		}
		
		for (var i = 0; i < categoryList.length; i++){
			var /** number */ categoryID = categoryList[i];
			var /** Element */ radio = document.createElement("input");
			radio["type"] = "radio";
			radio["name"] = "subElementCategory";
			radio["value"] = categoryID;
			if(categoryList[i] == this.defaultValue){
				radio["checked"] = true;
			}
			result.appendChild(radio);
			
			result.appendChild(document.createTextNode(categoryManager.getCategoryName(categoryID) + " "));
		}
		
		var /**Array<number>|Array<string> */ tagList;
		if(typeof this.tagList === "function"){
			tagList = this.tagList(categoryId, elementId);
		}
		else {
			tagList = this.tagList;
		}
		
		if(categoryList.length == 0 && (tagList == undefined || tagList.length == 0))
			return null;
		
		for (i = 0; i < tagList.length; i++){
			var /** string */ tag = tagList[i].tag;
			radio = document.createElement("input");
			radio["type"] = "radio";
			radio["name"] = "subElementCategory";
			radio["value"] = tag;
			if(tag == this.defaultValue){
				radio["checked"] = true;
			}
			result.appendChild(radio);
			
			result.appendChild(document.createTextNode(tagList[i].name + " "));

		}
		
		result.appendChild(document.createElement("br"));
		
		if(this.sorter != null){
			result.appendChild(document.createElement("br"));
			result.appendChild(this.sorter.getFilterScreenElement(categoryId, elementId));
		}
		
		return result;
	};
	
	/**
	 * @override
	 * 
	 * @param {Object<string, ?>} data
	 * 
	 * @return {undefined} 
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