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
		
		if(currentTags == null || currentTags.length == 0)
			return null;
		
		var /** Element */ result = document.createElement("div");
		result["className"] = "filterComponent";
		result["id"] =  "tagComponent";
		
		for (var key in currentTags){
			var /** Array<string> */ values = currentTags[key];
			
			var /**string|undefined*/ translation = categoryManager.getElementName(-3, "#" + key);
			if(translation[0] == "#"){
				translation = translation.substring(1); //TODO Better solutation! Don't abuse getElementName!!!
			}
			
			var /** Element */ caption = document.createElement("h2");
			caption.appendChild(document.createTextNode(translation? translation: key));
			result.appendChild(caption);
			
			var /**Element*/ spanTag = document.createElement("span");
			spanTag["style"]["color"] = "LightSlateGray";
			spanTag["style"]["border-bottom"] = "1px solid";
			
			var /** Element */ cb = document.createElement("input");
			cb["type"] = "checkbox";
			cb["name"] = "ignore";
			cb["checked"] = "checked";
			cb["style"]["opacity"] = ".50";
			cb.addEventListener("change", function (){
				jQuery("#tagComponent input[name=" + key + "]").prop("checked", /** @type{boolean}*/ (jQuery(this).prop("checked")));
			});
			spanTag.appendChild(cb);
			
			spanTag.appendChild(document.createTextNode(TRANSLATIONS["SELECT_ALL"]));
			result.appendChild(spanTag);
				
			result.appendChild(document.createElement("br"));
			
			var /**Object<string,string>*/ translatedValues = {};
			
			for (var i = 0; i < values.length; i++){
				var /**string*/ translationValue =  categoryManager.getElementName(-3, "#" + values[i]);
				if(translationValue){
					translatedValues[values[i]] = translationValue;
				}
				else {
					translatedValues[values[i]] = values[i];
				}
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
	 * @return {undefined} 
	 */
	this.storeData = function (data){
		data["tags"] = {};
		jQuery("#tagComponent input").each(function (){
			var /** jQuery */ e = jQuery(this);
			var /**string*/ name = /** @type{string} */ (e.prop("name"));
			
			if(data["tags"][name] === undefined){
				data["tags"][name] = ["???"];
			}
			
			if(e.is(":checked")){
				data["tags"][name].push(e.prop("value"));
			}
		});
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