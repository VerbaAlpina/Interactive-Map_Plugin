/**
 * 
 * @constructor
 * @struct
 * @implements {FilterComponent} 
 * 
 * @param {Array<SortType>} sortTypes
 */
function Sorter (sortTypes){
	
	/**
	 * @type {Array<SortType>} 
	 */
	this.sortTypes = sortTypes;
	
	/**
	 * @param {!Object<string, ?>} data
	 * @param {number} sortTypeIndex
	 * @param {number} sortOrder
	 * @param {number} subElementCategory
	 * 
	 * @return {Array<string>}
	 */
	this.getSortedKeys = function (data, sortTypeIndex, sortOrder, subElementCategory){
		
		var /**Array<string> */ keyArray = Object.keys(data);
		var /** SortType */ sortType = sortTypes[sortTypeIndex];
		
		sortType.sortOrder = sortOrder;
		sortType.initFields(keyArray, data, subElementCategory);

		return keyArray.sort(sortType.compareFunction.bind(sortType));
	};
	
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
		result["id"] = "sortingComponent";
		
		var /** Element */ capSort = document.createElement("h2");
		capSort.appendChild(document.createTextNode(TRANSLATIONS["SORTING"]));
		result.appendChild(capSort);
		
		//Sort types
		var /** Element */ orderDiv = document.createElement("div");
		for (var i = 0; i < this.sortTypes.length; i++){
			var /** SortType */ sortType = this.sortTypes[i];
			
			var /** Element */ radio = document.createElement("input");
			
			radio["type"] = "radio";
			radio["name"] = "sortName";
			radio["value"] = i;
			
			if(i == 0){
				radio["checked"] = true;
			}
			
			radio.addEventListener("click", function (sel, e){
				jQuery(".sortOrderDiv").toggle(false);
				jQuery(sel).toggle(true);
			}.bind(this, "#sortOrder" + i));
			
		    var radio_span = document.createElement("span");
			radio_span.appendChild(radio);
			radio_span.appendChild(document.createTextNode(sortType.getName() + " "));
			result.appendChild(radio_span);

			
			//Sort orders
			var /** Element */ divSortOrder = document.createElement("div");
			divSortOrder["className"] = "sortOrderDiv";
			divSortOrder["id"] = "sortOrder" + i;
			divSortOrder["style"]["marginLeft"] = "20px";
			if(i > 0){
				divSortOrder["style"]["display"] = "none";
			}
			
			var /** number */ numOrders = sortType.getNumSortOrders();
			for (var j = 0; j < numOrders; j++){
				var /** string */ sortOrder = sortType.getSortOrderName(j);
				radio = document.createElement("input");
				radio["type"] = "radio";
				radio["name"] = "sortOrder" + i;
				radio["value"] = j;
				if(j == sortType.getDefaultSortOrder()){
					radio["checked"] = true;
				}
				var /** Element */ divSubOrder = document.createElement("div");
				divSubOrder.appendChild(radio);
				divSubOrder.appendChild(document.createTextNode(sortOrder + " "));
				divSortOrder.appendChild(divSubOrder);
			}
			orderDiv.appendChild(divSortOrder);
		}
		result.appendChild(orderDiv);
		
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
		var /** jQuery */ sortTypeInput = jQuery("#sortingComponent input[name=sortName]:checked");
		var /** Object<string, number> */ sortData = {
			"sortType" : sortTypeInput.val(),
			"sortOrder" : jQuery("#sortingComponent input[name=sortOrder" + sortTypeInput.val() + "]:checked").val()
		};
		data["sorter"] = sortData;
		return true;
	};
	
	/**
	 * @override 
	 */
	this.storeDefaultData = function (data){
		var /** Object<string, number> */ sortData = {
			"sortType" : 0,
			"sortOrder" : this.sortTypes[0].getDefaultSortOrder()
		};
		data["sorter"] = sortData;
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
		jQuery("#sortingComponent input[name=sortName][value=" + data["sorter"]["sortType"] + "]").prop("checked", true);
		jQuery(".sortOrderDiv").toggle(false);
		jQuery("#sortOrder" + data["sorter"]["sortType"]).toggle(true);
		jQuery("#sortingComponent input[name=sortOrder" + data["sorter"]["sortType"] + "][value=" + data["sorter"]["sortOrder"] + "]").prop("checked", true);
	};
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 * 
	 */
	this.afterAppending = function (){
		
	};
}

/**
 * A mapping from element key to element name (potentially translated in the current gui language)
 * 
 * @param {Array<string>} keyArray
 * @param {number} subElementCategory
 * 
 * @return {Object<string, string>} 
 */
Sorter.createNameMapping = function (keyArray, subElementCategory) {
	var /** Object<string, string> */ nameMapping = {};
	
	for (var i = 0; i < keyArray.length; i++){
		var /**string */ key = keyArray[i];
		if(subElementCategory == -3){ //Tags
			nameMapping[key] = key == -1? "": categoryManager.getTagTranslation(key.substring(1));
		}
		else {
			nameMapping[key] = key == -1? "": categoryManager.getElementName(subElementCategory, key);
		}
	}
	
	return nameMapping;
};

/**
 * A mapping from element key to number or records (map symbols) returned for this element.
 * 
 * @param {Array<string>} keyArray
 * @param {Object<string, ?>} data
 * 
 * @return {Object<string, number>} 
 */
Sorter.createCountMapping = function (keyArray, data) {
	var /** Object<string, number> */ countMapping = {};
	for (var i = 0; i < keyArray.length; i++){
		var /** string */ key = keyArray[i];
		countMapping[key] = data[key][1].length;
	}
	return countMapping;
};

/**
 * @interface 
 */
function SortType (){}

/**
 *
 * Sort order as selected by the user. Will be set automatically, but has to be explicitly stated by the implementing class.
 *
 * @type {number} 
 */
SortType.prototype.sortOrder;

/**
 * 
 * Interface for sorting the sub-elements of a selected element. The sort function has to deal with the special value -1 that stands for no category given!
 * 
 * @param {string} a First element key
 * @param {string} b Second element key
 * 
 * 
 * @return {number} The sorted key array
 */
SortType.prototype.compareFunction = function(a, b){};

/**
 * This method is meant to initialized any fields used during the sorting process.
 * 
 * Notice the pre-defined functions Sorter.createNameMapping and Sorter.createCountMapping, 
 * that create a mapping from element key to its (possibly translated) name respectively
 * to the number of records (symbols on the map) returned for the element.
 * 
 * @param {Array<string>} keyArray The sub-element keys
 * @param {Object<string,?>} data The original data array as returned from the server.
 * @param {number} subElementCategory
 * 
 * @return{undefined}
 */
SortType.prototype.initFields = function (keyArray, data, subElementCategory){};

/**
 * The (translated) name for this sorting possibility as it is shown to the user. 
 *
 * @return {string} 
 */
SortType.prototype.getName = function (){};


/**
 * By how many different orders the data can be sorted. The typical case is 2 (asc. and desc.)
 *
 * @return {number} 
 */
SortType.prototype.getNumSortOrders = function (){};

/**
 * The (translated) names for the different sorting orders. E.g. ascending and descending
 *
 * @param {number} index
 * 
 * @return {string} 
 */
SortType.prototype.getSortOrderName = function (index){};

/**
 * 
 * @return {number} 
 */
SortType.prototype.getDefaultSortOrder = function (){};
