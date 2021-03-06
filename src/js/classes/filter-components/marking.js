/**
 * @constructor
 * @struct
 * @implements FilterComponent
 * 
 * @param {Object<string, Array<string>>|function(number, string):Object<string, Array<string>>} tags
 * 
 * Marks certain subclasses of point symbols with a specific border color
 */
function MarkingComponent (tags){
	
	/** @type {Object<string, Array<string>>|function(number, string):Object<string, Array<string>>} */
	this.tags = tags;
	
	/**
	 * @override
	 * 
	 * @param {number} categoryId
	 * @param {string} elementId
	 * 
	 * @return {Element} 
	 */
	this.getFilterScreenElement = function (categoryId, elementId){
		var /** MarkingComponent */ thisObject = this;
		
		var /** Element */ result = document.createElement("div");
		result["className"] = "filterComponent";
		result["id"] = "markingComponent";
		
		var /** Element */ capMark = document.createElement("h2");
		capMark.appendChild(document.createTextNode(TRANSLATIONS["MARKING"]));
		result.appendChild(capMark);
		
		var /**Object<string, Array<string>>*/ currentTags;
		if (typeof this.tags === "function"){
			currentTags = this.tags(categoryId, elementId);
		}
		else {
			currentTags = this.tags;
		}
		
		var /** Element */ link = document.createElement("span");
		link["className"] = "IM_Pseudo_Link";
		link["style"]["marginLeft"] = "20px";
		
		var /** Element */ icon = document.createElement("i");
		icon["className"] = "fa fa-plus-circle";
		icon["ariaHidden"] = "true";
		
		link.appendChild(icon);
		link.appendChild(document.createTextNode(" " + TRANSLATIONS["ADD_MARKING"]));
		link.addEventListener("click", function (){
			if(jQuery("#IM_Marking_Table .IM_Marking_Color_Select").length < symbolManager.getNumMarkingColors()){
				var /** Array<Element>*/ colorSelects = jQuery(".IM_Marking_Color_Select").get();
		 		var /** Array<number>*/ restrictedColors = colorSelects.map(function (element){
					return element.value * 1;
				});
				jQuery("#IM_Marking_Table").append(thisObject.getNewTableRow(currentTags, restrictedColors, jQuery("#IM_Marking_Table .markingRow").length == 0));
			}
		});
		
		result.appendChild(link);
		
		var /** Element */ table = document.createElement("div");
		table["style"]["marginTop"] = "1em";
		table["id"] = "IM_Marking_Table";
		
		result.appendChild(table);
		
		return result;
	};
	
	/**
	 * @param {Object<string, Array<string>>} tags
	 * @param {Array<number>} blockedColors
	 * @param {boolean} firstRow
	 * @param {string=} tagNameSelected
	 * @param {string=} tagValue
	 * @param {Array<string>=} blockedTags
	 * @param {string=} color
	 * 
	 * @return {Element}
	 */
	this.getNewTableRow = function (tags, blockedColors, firstRow, tagNameSelected, tagValue, blockedTags, color){
		var /** MarkingComponent */ thisObject = this;
		
		var /** Element */ result = document.createElement("div");
		result["className"] = "markingRow";
		result["style"]["width"] = "100%";
		
		if(firstRow){
			var /** Element */ tagNameSelect = document.createElement("select");
			tagNameSelect["className"] = "tagNameSelect";
			tagNameSelect["style"]["width"] = "40%";
			
			var /** Element */ defaultOption = document.createElement("option");
			defaultOption["value"] = "-1";
			defaultOption.appendChild(document.createTextNode(" --- " + TRANSLATIONS["SELECT_TAG"] + " --- "));
			tagNameSelect.appendChild(defaultOption);
			
			for (var tagName in tags){
				var /** Element */ tagNameOption = document.createElement("option");
				tagNameOption["value"] = tagName;
				tagNameOption.appendChild(document.createTextNode(categoryManager.getTagTranslation(tagName)));
				tagNameSelect.appendChild(tagNameOption); //TODO tag translation
			}
	
			tagNameSelect.addEventListener("change", function (){
				thisObject.setTagValueOptions(jQuery("#IM_Marking_Table .tagValueSelect"), tags[this.value]);
			});
			
			if (tagNameSelected){
				tagNameSelect.value = tagNameSelected;
			}
			
			result.appendChild(tagNameSelect);
		}
		
		
		
		var /** Element */ tagValueSelect = document.createElement("select");
		tagValueSelect["className"] = "tagValueSelect";
		tagValueSelect["dataset"]["oldval"] = "-1";
		tagValueSelect["style"]["width"] = "40%";
		
		if(!firstRow){
			tagValueSelect["style"]["margin-left"] = "40%";
		}
		
		tagValueSelect.addEventListener("change", function (e){
			var that = this;
			var /** string */ oldValue = /** @type{string} */ (jQuery(this).data("oldval"));
			var /** jQuery */ otherValueLists = jQuery("#IM_Marking_Table .tagValueSelect").not(this);
			
			if(oldValue != "-1"){
				otherValueLists.find("option[value=" + oldValue + "]").prop("disabled", false);
			}
			if(this.value != "-1"){
				otherValueLists.find("option[value=" + this.value + "]").prop("disabled", true);
			}
			
			jQuery(this).data("oldval", this.value);
		});
		
		if  (tagNameSelected !== undefined)
			this.setTagValueOptions(jQuery(tagValueSelect), tags[tagNameSelected], blockedTags);
		else if(firstRow || jQuery("#IM_Marking_Table .tagNameSelect").val() == "-1")
			this.setTagValueOptions(jQuery(tagValueSelect));
		else
			this.setTagValueOptions(jQuery(tagValueSelect), tags[/** @type{string}*/ (jQuery("#IM_Marking_Table .tagNameSelect").val())]);
		
		if (tagValue){
			tagValueSelect.value = tagValue;
		}
		
		result.appendChild(tagValueSelect);
		
		var /** Element */ colorSelect = document.createElement("select");
		colorSelect.style.width = "150px";
		colorSelect.className = "#IM_Marking_Table IM_Marking_Color_Select";
		colorSelect["style"]["width"] = "15%";
		
		var /** boolean */ first = true;
		for (var i = 0; i < symbolManager.getNumMarkingColors(); i++){
			if(blockedColors.indexOf(i) === -1){
			
				colorSelect.appendChild(this.getColorOption(i));
				
				if((color === undefined && first) || (color !== undefined && color == i)){
					colorSelect.value = i;
					colorSelect.style.background = symbolManager.getMarkingColorString(i);
					colorSelect["dataset"]["lastColor"] = i;
					jQuery("#IM_Marking_Table .IM_Marking_Color_Select option[value='" + i + "']").remove();
					first = false;
				}
			}
		}
		
		colorSelect.addEventListener("change", function (){
			this.style.background = symbolManager.getMarkingColorString(this.value);
			jQuery("#IM_Marking_Table .IM_Marking_Color_Select").not(this).append(thisObject.getColorOption(this["dataset"]["lastColor"]));
			jQuery("#IM_Marking_Table .IM_Marking_Color_Select").not(this).find("option[value='" + this.value + "']").remove();
			this["dataset"]["lastColor"] = this.value;
		});
		
		result.appendChild(colorSelect);
		
		var /** Element */ deleteLink = document.createElement("i");
		deleteLink["className"] = "fa fa-minus-circle";
		deleteLink["ariaHidden"] = true;
		deleteLink["style"]["padding-left"] = "1em";
		deleteLink["style"]["width"] = "5%";
		deleteLink["style"]["cursor"] = "pointer";
		deleteLink["title"] = TRANSLATIONS["REMOVE"];
		
		deleteLink.addEventListener("click", function (){
			jQuery(".IM_Marking_Color_Select").append(thisObject.getColorOption(/** @type{number}*/ (jQuery(this).parent().find(".IM_Marking_Color_Select").val())));
			jQuery("#IM_Marking_Table .tagValueSelect").find("option[value=" + jQuery(this).parent().find(".tagValueSelect").val() + "]").prop("disabled", false);
			jQuery(this).parent().remove();
			
			if(jQuery("#IM_Marking_Table .fa-minus-circle").length == 1)
				jQuery("#IM_Marking_Table .fa-minus-circle").toggle(true);
		});
		
		result.appendChild(deleteLink);
		
		if(!firstRow)
			jQuery("#IM_Marking_Table .fa-minus-circle").first().toggle(false);
		
		return result;
	};
	
	/**
	 * @param {number} colorIndex
	 * 
	 * @return {Element}
	 */
	this.getColorOption = function (colorIndex){
		var /** Element */ colorOption = document.createElement("option");
		colorOption.value = colorIndex;
		colorOption.style.height = "1.5em";
		colorOption.style.background = symbolManager.getMarkingColorString(colorIndex);
		
		return colorOption;
	};
	
	/**
	 * @param {jQuery} elements
	 * @param {Array<string>=} tagValues
	 * @param {Array<string>=} restrictedValues 
	 * 
	 * @return {undefined}
	 */
	this.setTagValueOptions = function (elements, tagValues, restrictedValues){
		elements.empty();
		
		var /** Element */ defaultOption = document.createElement("option");
		defaultOption["value"] = "-1";
		defaultOption.appendChild(document.createTextNode(" --- " + TRANSLATIONS["SELECT_TAG_VAL"] + " --- "));
		elements.append(defaultOption);
		
		if(tagValues){
			if (!restrictedValues){
				restrictedValues = jQuery("#IM_Marking_Table .tagValueSelect").get().map(function (element) {
					return jQuery(element).val();
				});
			}
			
			for (var i = 0; i < tagValues.length; i++){
				var /** Element */ option = document.createElement("option");
				option["value"] = tagValues[i];
				if(restrictedValues.indexOf(tagValues[i]) !== -1){
					option["disabled"] = true;
				}
				option.appendChild(document.createTextNode(tagValues[i]));
				elements.append(option);
			}
		}
	};
	
	/**
	 * @override
	 * 
	 * @param {Object<string, ?>} data
	 * 
	 * @return {boolean} 
	 */
	this.storeData = function (data){

		var /** jQuery */ tagNameSelect = jQuery("#IM_Marking_Table .tagNameSelect");
		
		if(tagNameSelect.length > 0 && tagNameSelect.val() != "-1"){
			
			var tagVals = {};
			jQuery("#IM_Marking_Table .tagValueSelect").each(function (){
				if(this.value != "-1"){
					tagVals[this.value] = jQuery(this).next().val();
				}
			});
			
			if(Object.keys(tagVals).length > 0){
				data["markings"] = {
					"tagName" : tagNameSelect.val(),
					"tagValues" : tagVals
				}
			}
			
		}
		
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
		//default = no markings
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
		if (data["markings"]){
			
			var /**Object<string, Array<string>>*/ currentTags;
			if (typeof this.tags === "function"){
				currentTags = this.tags(categoryId, elementId);
			}
			else {
				currentTags = this.tags;
			}
			
			for (let tagValue in data["markings"]["tagValues"]){
				let color = data["markings"]["tagValues"][tagValue];
				
		 		var /** Array<number>*/ restrictedColors = Object.values(data["markings"]["tagValues"]).map(function (element){
		 			return element * 1;
		 		}).filter(function (element){
					return element != color;
				});
		 		
		 		var /** Array<string>*/ restrictedTags = Object.keys(data["markings"]["tagValues"]).filter(function (element){
					return element != tagValue;
				});
				
				jQuery("#IM_Marking_Table").append(this.getNewTableRow(currentTags, restrictedColors, jQuery("#IM_Marking_Table .markingRow").length == 0, data["markings"]["tagName"], tagValue, restrictedTags, color));
			}
		}
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
		
	};
}