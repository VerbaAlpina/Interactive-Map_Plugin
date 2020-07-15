/**
 * @constructor
 * @struct
 * @implements FilterComponent
 * 
 * @param {Object<string, Array<string>>|function(number, string):Object<string, Array<string>>} tags
 * 
 * Shows checkboxes for all available tags.
 */
function TagComponent (tags){
	
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
		var /** Object<string, Array<string>> */ currentTags;
		if(typeof this.tags === "function"){
			currentTags = this.tags(categoryId, elementId);
		}
		else {
			currentTags = this.tags;
		}
		
		if(currentTags == null || Object.keys(currentTags).length === 0)
			return null;
		
		var /** Element */ result = document.createElement("div");
		result["className"] = "filterComponent";
		result["id"] =  "tagComponent";
		
		for (var key in currentTags){
			var /** Array<string> */ values = currentTags[key];
			
			var /**string*/ translation = categoryManager.getTagTranslation(key);

			
			var /** Element */ caption = document.createElement("h2");
			caption.appendChild(document.createTextNode(translation));
			result.appendChild(caption);
			
			var /**Element*/ spanTag = document.createElement("span");
			spanTag["style"]["color"] = "LightSlateGray";
		
			
			var /** Element */ cb = document.createElement("input");
			cb["type"] = "checkbox";
			cb["name"] = "ignore";
			cb["className"] = "ignore"
			cb["checked"] = "checked";
			cb["style"]["opacity"] = ".50";
			cb.addEventListener("change", function (key){
				return function (){ jQuery("#tagComponent input[name=" + key + "]").prop("checked", /** @type{boolean}*/ (jQuery(this).prop("checked")))};
			}(key));
			spanTag.appendChild(cb);
			
			spanTag.appendChild(document.createTextNode(TRANSLATIONS["SELECT_ALL"]));
			result.appendChild(spanTag);
				
			result.appendChild(document.createElement("br"));
			
			var /**Object<string,string>*/ translatedValues = {};
			
			for (var i = 0; i < values.length; i++){
				translatedValues[values[i]] =  categoryManager.getTagTranslation(values[i]);
			}
			
			values.sort(function (a,b){
				return translatedValues[a].localeCompare(translatedValues[b]);
			});
			
			for (var i = 0; i < values.length; i++){
				cb = document.createElement("input");
				cb["type"] = "checkbox";
				cb["name"] = key;
				cb["value"] = values[i];
				cb["checked"] = "checked";
				cb["style"]["margin-left"] = "10px";
				result.appendChild(cb);
				
				result.appendChild(document.createTextNode(translatedValues[values[i]]));
				
				result.appendChild(document.createElement("br"));
			}
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
		 var /** Object<string, Array<string>>*/ res = {};
		 var /**boolean*/ all = true;
		 
		jQuery("#tagComponent input:not(.ignore)").each(function (){
			var /** jQuery */ e = jQuery(this);
			var /**string*/ name = /** @type{string} */ (e.prop("name"));
			
			if(res[name] === undefined){
				res[name] = []; //Avoids that for all tag values empty all the data is returned instead of none
			}
			
			if(e.is(":checked")){
				res[name].push(/** @type{string}*/ (e.prop("value")));
			}
			else {
				all = false;
			}
		});
		
		for (var key in res){
			if(res[key].length == 0){
				return false;
			}
		}
		
		if(!all) //Ignore tag filter if all possible tags are selected (speeds up server response)
			data["tags"] = res;
		
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
		if (data["tags"]){
			jQuery("#tagComponent input:not(.ignore)").prop("checked", false);
			for (let tagName in data["tags"]){
				for (let i = 0; i < data["tags"][tagName].length; i++){
					jQuery("#tagComponent input:not(.ignore)[name=" + tagName + "][value=" + data["tags"][tagName][i] + "]").prop("checked", true);
				}
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