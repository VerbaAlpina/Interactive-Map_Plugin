//The following variables are meant to make the code more readable. The closure compiler should filter them out:
/**
 * @const{number} 
 */
var NUM_PER_CATEGORY = 0;
/**
 * @const{number} 
 */
var DATA = 1;
/**
 * @const{number} 
 */
var COMMENTS = 2;
/**
 * @const{number} 
 */
var DEBUG_DATA = 3;

/**
 * 
 * @constructor
 * @struct
 *
 * Handles the data categories and the AJAX calls to pick them from the data base 
 */
function CategoryManager (){
	
	/**
	 * 
	 * @private
	 * @type {Object<string, ?>} 
	 * 
	 */
	this.additionalAjaxData = {};
	
	/**
	 * @private
	 * @type {Object<string, string>} 
	 */
	this.addionalElementNames = {};
	
	/**
	 * 
	 * @private
	 * @type {Object<string, function(new:InfoWindowContent, number, OverlayType, Object<string, ?>)>} 
	 */
	this.infoWindowContentConstructors = {"simple" : SimpleInfoWindowContent, "editable" : EditableInfoWindowContent};
	
	/**
	 *  @private
	 *  @type {Object<number, CategoryInformation>}
	 */
	this.categories = {};
	this.categories["-1"] = new CategoryInformation (-1,"?","",""); //Pseudo category for using every element as a sub-category
	this.categories["-2"] = new CategoryInformation (-2,"!","",""); //Pseudo category for no sub-categories
	this.categories["-3"] = new CategoryInformation (-3,"#","",""); //Pseudo category for tags as sub-categories
	//TODO name here
	this.categories["-4"] = new CategoryInformation (-4,"$","distinct",""); //Pseudo category for distinctly colored neigbours
	
	/**
	 * @param {CategoryInformation} info
	 * 
	 * @return {undefined}
	 */
	this.registerCategory = function (info){
		this.categories[info.categoryID] = info;
		
		if(info.element != null){
			info.element.change(this.showFilterScreen.bind(this, info.element, info.categoryID, info.filterComponents));
		}
	};
	
	/**
	 * @param {string} key
	 * @param {?} value 
	 * 
	 * @return {undefined}
	 */
	this.addAjaxData = function (key, value){
		this.additionalAjaxData[key] = value;
	};
	
	/**
	 * @param {string} key
	 * @param {string} name
	 */
	this.addElementName = function (key, name){
		this.addionalElementNames[key] = name;
	};
	
	/**
	 * @param {number} categoryID 
	 * 
	 * @return {string}
	 */
	this.getEmptyCategoryName = function (categoryID){
		var /** string|undefined */ emptyName = this.categories[categoryID].nameEmpty;
		if(emptyName === undefined)
			return "";
		return emptyName;
	};
	
	/**
	 * @param {number} categoryID 
	 * 
	 * @return {string}
	 */
	this.getCategoryName = function (categoryID){
		return this.categories[categoryID].name;
	};
	
	/**
	 * @param {number} categoryID 
	 * 
	 * @return {string}
	 */
	this.getCategoryPrefix = function (categoryID){
		return this.categories[categoryID].categoryPrefix;
	};
	
	/**
	 * @param {number} categoryID 
	 * @param {string} key
	 * 
	 * @return {string}
	 */
	this.getElementName = function (categoryID, key){
		var /** string|undefined */ name = this.addionalElementNames[key];
		if(name !== undefined){
			return name;
		}
		
		var /** CategoryInformation */ cat = this.categories[categoryID];
		
		if(cat.costumGetNameFunction == undefined){
			var /** jQuery */ element = cat.element;
			if(element == null){
				return key;	
			}
			
			return  /** @type{function(string):string} */ (element.data("getName"))(key);
		}
		else {
			return cat.costumGetNameFunction(key);
		}
	};
	
	/**
	 * @param {number} categoryID 
	 * @param {string} key
	 * @param {boolean} addName
	 * 
	 * @return {?string}
	 */
	this.getNewCommentText = function (categoryID, key, addName){
		var /** CategoryInformation */ category = this.categories[categoryID];
		if(category.textForNewComment){
			var /** string */ result = category.textForNewComment;
			if(addName){
				result += " (" + this.getElementName(category.categoryID, key) + ")";
			}
			return result;
		}
		return null;
	};

	/**
	 * @param {number} categoryID 
	 * @param {string} key
	 * @param {boolean} addName
	 * 
	 * @return {?string}
	 */
	this.getListRetrievalText = function (categoryID, key, addName){
		var /** CategoryInformation */ category = this.categories[categoryID];
		if(category.textForListRetrieval){
			var /** string */ result = category.textForListRetrieval;
			if(addName){
				result += " (" + this.getElementName(category.categoryID, key) + ")";
			}
			return result;
		}
		return null;
	};

	/**
	 * @param {number} categoryID
	 * @return {AbstractListBuilder}
	 */
	this.getListBuilder = function (categoryID){
		return this.categories[categoryID].listBuilder;
	}
	
	/**
	 * @param {number} categoryID
	 * @param {number} count 
	 * 
	 * @return {string}
	 */
	this.getCountString = function (categoryID, count){
		var /** CategoryInformation */ category = this.categories[categoryID];
		if(category.countNameSingular == null){
			return "";
		}
		
		if(count == 1){
			return " (1\u00A0" + category.countNameSingular + ")";
		}
		else {
			return " (" + count + "\u00A0" + category.countNamePlural + ")";
		}
	};
	
	/**
	 * @param {number} categoryID
	 * 
	 * @return {Array<string>}
	 */
	this.getOverlayTypes = function (categoryID){
		var /** CategoryInformation */ category = this.categories[categoryID];
		if(category.editConfiguration){
			return category.editConfiguration.getGoogleTypesForNewOverlays();
		}
		return [];
	};
	
	
	/**
	 * 
	 * @private
	 * @param {jQuery} element
	 * @param {number} categoryID
	 * @param {Array<FilterComponent>=} filterComponents
	 * 
	 * @return {undefined} 
	 */
	this.showFilterScreen = function (element, categoryID, filterComponents){
			
		var /** string */ value = this.getCategoryPrefix(categoryID) + /** @type{function():string} */ (element.data("getSelectedValue"))();

		/** @type {function():undefined} */ (element.data("reset"))();
		
		if(value == 0 || optionManager.inEditMode() && legend.getMainElement(categoryID, value))
			return;

		
		if(optionManager.inEditMode() && !this.categoryAllowsFieldDataEditingForElement(categoryID, value) && !this.categoryAllowsGeoDataEditingForElement(categoryID, value)){
			alert(TRANSLATIONS["NO_EDITING_CATEGORY"]);
			return;
		}
		
		var /** boolean */ noElements = true;
		
		if(filterComponents != undefined && filterComponents.length > 0){
			var thisObject = this;
			
			jQuery("#IM_filter_popup_title").text(this.getElementName(categoryID, value));
			jQuery("#IM_filter_popup_content").empty();
			
			var /** Array<Element> */ newElements = new Array (filterComponents.length);
			for (var i = 0; i < filterComponents.length; i++){
				newElements[i] = filterComponents[i].getFilterScreenElement(categoryID, value);
				
				if(newElements[i] == null)
					continue;
				
				jQuery("#IM_filter_popup_content").append(newElements[i]);
				jQuery("#IM_filter_popup_content").append("<br />");
				filterComponents[i].afterAppending(newElements[i], categoryID, value);
				noElements = false;
			}
			
			if(!noElements){
				jQuery("#IM_filter_popup_submit").unbind("click");
				jQuery("#IM_filter_popup_submit").click(function () {
					jQuery("#IM_filter_popup_div").dialog("close");
					var /** Object<string,?> */ filterData = {};
					for (var i = 0; i < filterComponents.length; i++){
						if(newElements[i] != null)
							filterComponents[i].storeData(filterData, newElements[i], categoryID, value);
					}
					thisObject.loadData (categoryID, value, filterData);
				});
	
				jQuery("#IM_filter_popup_div").dialog({
					"minWidth" : 700,
					"resizable" : false, 
					"modal": true,
					"title" : this.getCategoryName(categoryID)
				});
			}
		}
		
		if(noElements){
			//Directly load data
			this.loadData (categoryID, value);
		}
	};
	
	/**
	 * @param {number} id 
	 */
	this.loadSynopticMap = function (id){

		var /**Object<string,string>*/ ajaxData = {
			"action" : "im_a",
			"namespace" : "load_syn_map",
			"key" : id,
			"lang" : PATH["language"],
			"_wpnonce" : jQuery("#_wpnonce").val()
		};
		
		for (var /** @type {string} */ keyAjax in this.additionalAjaxData){
			ajaxData[keyAjax] = this.additionalAjaxData[keyAjax];
		}
		
		jQuery.post(ajaxurl, ajaxData, function(response) {
			if(response == 'NO_MAP'){
				console.error("Map does not exist!");
				return;
			}
			
			var data = JSON.parse(response);
			
			var mapInfos = data[0];
	
			//Zoom and position
			map.setCenter(new google.maps.LatLng(mapInfos["Center_Lat"], mapInfos["Center_Lng"]));
			map.setZoom(mapInfos["Zoom"] * 1);
			
			var /** number */ numElements = data[1].length;
			for (var /** number */ i = 0; i < numElements; i++){
				var currElement = data[1][i];
				categoryManager.loadData(currElement["category"] * 1, currElement["key"], currElement["filter"], currElement["fixedColors"]);
			}
		});
	};
	
	/**
	 *
	 * @param {number} category
	 * @param {string} key
	 * @param {Object<string, ?>=} filterData
	 * @param {Object<string, Array<number>|number>=} fixedColors Defines the color indexes for certain legend elements (e.g. for a synoptic map)
	 * @param {function ()=} callback
	 */
	this.loadData = function (category, key, filterData, fixedColors, callback) {
		if(optionManager.inEditMode() && !categoryManager.categoryAllowsFieldDataEditingForElement(category, key)
				&& !categoryManager.categoryAllowsGeoDataEditingForElement(category, key))
			return;
		
		var/** MultiLegendElement|LegendElement */ element = legend.getMainElement(category, key);
		
		//Already there?
		if(element != null && fixedColors == null){ //fixedColors is set if symbols are simply reloaded (or a synoptic map is loaded)
			var /** number*/ fixedLegendIndex = element.getIndex();
			legend.removeElement(element, true);
			element = null;
		}

		var /** Object<string, *> */ ajaxData = {
			'key' : key
		};
		
		for (var /** @type {string} */ keyAjax in this.additionalAjaxData){
			ajaxData[keyAjax] = this.additionalAjaxData[keyAjax];
		}
		
		if(filterData != undefined){
			ajaxData["filter"] = filterData;
		}
		
		if(fixedColors != null && element != null){
			//No need to reload the comments if only the symbols for the map are reloaded
			ajaxData['noComments'] = true;
		}
		
		if(optionManager.inEditMode()){
			ajaxData['editMode'] = true;
		}
		
		var /** boolean */ newLegendElementCreated = false;
		var /** boolean */ singular = filterData === undefined || filterData["subElementCategory"] === undefined || filterData["subElementCategory"] == -2;
		
		if (element == null) {
			if(singular)
				element = new LegendElement(category, key);
			else
				element = new MultiLegendElement(category, key);
			
			legend.collapseAll(false);
			legend.addElement(element, fixedLegendIndex);
			newLegendElementCreated = true;
		}
		
		legend.update();

		var /**CategoryManager */ thisObject = this;
		mapSQL(category, ajaxData, function (response){
			if(response == -1){
				alert("Loading error! No Sever response!");
				legend.removeElement(element, true);
				return;
			}
			else if (response.substring(0, 5) == "Error"){
				alert(response);
				legend.removeElement(element, true);
				return;
			}
			
			var /** !Array */ result = /** @type{!Array} */ (JSON.parse(response));
			
			if(result[DEBUG_DATA]){
				jQuery("#im_debug_area").html(result[DEBUG_DATA])
			}

			if(singular){
				thisObject.createSingularLegendEntry(result, /** @type {LegendElement}*/ (element), fixedColors, !newLegendElementCreated);
			}
			else {
				thisObject.createMultiLegendEntry(result, /** @type {MultiLegendElement}*/ (element), /** @type{Object<string, ?>}*/ (filterData), fixedColors, !newLegendElementCreated);
			}
			
			if(filterData != undefined){
				element.filterData = filterData;
				//TODO check if the filter has to be updated if data is already defined
			}
			
			if(callback)
				callback();
		});
	};
	
	/**
	 * @return {undefined} 
	 */
	this.saveSynopticMap = function (){
		var /** boolean */ allElements = /** @type{string}*/ (jQuery("input[name='IM_Syn_Map_All']:checked").val()) == "1";
		
		var /** boolean */ allUnChecked = true;
		if(!allElements){
			for (var /** number */ i = 0; i < legend.getLength(); i++){
				if(legend.getElement(i).visible()){
					allUnChecked = false;
					break;
				}
			}
			if(allUnChecked){
				alert(TRANSLATIONS["NO_SELECTION"]);
				return;
			}
		}
		
		//TODO adjust elements to potentially deselected sub-elements!!!
		//TODO save color scheme!!!
			
		var /** string */ name = /** @type{string}*/ (jQuery("#IM_Syn_Map_Name").val());
		if(name == ""){
			alert(TRANSLATIONS["ENTER_NAME"]);
			return;
		}
		
		var /**string */ description = /** @type{string}*/ (jQuery("#IM_Syn_Map_Description").val());
		var /**boolean */ release = /** @type{boolean}*/ (jQuery("#IM_Syn_Map_Release").prop("checked"));
	
		var /**google.maps.LatLng */ center = map.getCenter();
		
		jQuery.post(ajaxurl, {
				"action" : "im_u",
				"namespace" : "save_syn_map",
				"name" : name,
				"description" : description,
				"release" : release? "Applied" : "Private",
				"zoom" : map.getZoom(),
				"center_lat" : center.lat(),
				"center_lng" : center.lng(),
				"author" : PATH.userName,
				"data" : legend.getCompleteExport(allElements),
				"_wpnonce" : jQuery("#_wpnonce_syn_map_save").val()
			}, function (id){
				if(id == "NAME_EXISTS"){
					alert(TRANSLATIONS["MAP_ALREADY_EXISTS"]);
					return;
				}
				else if(!isNaN(id) && id * 1 != -1){
					alert(TRANSLATIONS["SAVE_MAP_SUCCESS"]);
				}
				else {
					alert(TRANSLATIONS["SAVE_MAP_ERROR"] + " (" + id + ")");
				}
				
				jQuery("#IM_Save_Syn_Map").dialog('close');
				jQuery("#IM_Syn_Map_Selection").append('<option value="' + id + '">' + name + '<option>').trigger("chosen:updated");
		});
	}
	
	
	/**
	 * @private
	 * 
	 * @param {!Array} result
	 * @param {LegendElement} element
	 * @param {Object<string, Array<number>|number>=} fixedColors Defines the color indexes for certain legend elements (e.g. for a synoptic map)
	 * @param {boolean=} reload
	 * 
	 * @return {undefined}
	 */
	this.createSingularLegendEntry = function (result, element, fixedColors, reload){

		//Get color index
		var /** number|Array<number> */ colorIndex;
		try {
			if(fixedColors != null){
				//Unwrap color index
				colorIndex  = fixedColors["-1"];
			}
			
			colorIndex = this.createSingularIndex(result[NUM_PER_CATEGORY], element, colorIndex, reload);
		}
		catch (e){
			alert(TRANSLATIONS["NO_SYMBOLS_LEFT"]);
			legend.removeElement(element, true);
			return;
		}	
		
		if(!reload){
			if(element.overlayType == OverlayType.PointSymbol){
				element.symbolStandard = symbolManager.createSymbolURL(/** @type{Array<number>}*/ (colorIndex));
				element.symbolHighlighted = symbolManager.createSymbolURL(symbolManager.createHighlightedIndex(/** @type{Array<number>}*/ (colorIndex)));
			}
			else {
				element.symbolStandard = symbolManager.createColorURL(/** @type{number}*/ (colorIndex));	
			}
			
		}
		var /** boolean */ addToMap = !reload || element.visible();
	
		if(Object.getPrototypeOf(Object(result[DATA])) === Object.getPrototypeOf([])){
			legend.removeElement(element, true);
			alert(TRANSLATIONS["NO_DATA"] + " (" + categoryManager.getElementName(element.category, element.key) + ")!");
			return;
		}
		
		var /** Array */ dataArray = result[DATA]["-1"][1]; //There can only be one category
		
		var /** number */ length = dataArray.length;
		
		var /** boolean */ overlaysMovable = optionManager.inEditMode() && this.categoryAllowsGeoDataEditingForElement(element.category, element.key, element.overlayType);
		
		for (var/** number */ i = 0; i < length; i++) {
			var /** Object */ currentShape = dataArray[i];
			
			if(currentShape[1] == null){
				console.error("Element " + JSON.stringify(currentShape[0]).substring(0,50) + " has no geo data!");
				i++;
				continue;
			}	
			
			var /** google.maps.Data.Geometry */ geoObject = parseGeoData(currentShape[1]);
			var constr = this.infoWindowContentConstructors[currentShape[0]["elementType"]];
			delete currentShape[0]["elementType"];
			if(constr == undefined){
				throw "InfoWindow type not found!";
			}
			
			var /** Array<string|Object<string, number>> */ quantifyInfo = currentShape[2];
			var /** string */ polygonQuantifyInfo = "";
			var /** Object<string, number>*/ pointQuantifyInfo = null;
			if(quantifyInfo != null){
				if(quantifyInfo[0] == "POINT"){
					pointQuantifyInfo = /** @type{Object<string, number>}*/ (quantifyInfo[1]);
				}
				else {
					polygonQuantifyInfo = /** @type{string}*/ (quantifyInfo[1]);
				}
			}
			
			var/** OverlayInfo */ overlayInfo = new OverlayInfo(
				new constr(element.category, element.overlayType, currentShape[0]), geoObject, pointQuantifyInfo);
			element.overlayInfos.push(overlayInfo);
			
			if (addToMap && overlayInfo.geomData != null){
				symbolClusterer.addOverlay(overlayInfo, element, polygonQuantifyInfo, overlaysMovable);
			}
		}
		
		for (var /** string */ ckey in result[COMMENTS]){
			commentManager.addComment(ckey, result[COMMENTS][ckey]);
		}
		
		if(symbolClusterer.checkQuantify())
			symbolClusterer.reQuantify();
		
		element.loading = false;
		legend.update();
	};
	
	/**
	 * @private
	 * 
	 * @param {Array<number>} categoryNumber
	 * @param {LegendElement} element
	 * @param {Array<number>|number=} colorIndex
	 * @param {boolean=} reload
	 * 
	 * @return {Array<number>|number}
	 * 
	 */
	this.createSingularIndex = function (categoryNumber, element, colorIndex, reload){
		var /** number|Array<number> */ index;
		
		if(colorIndex == null){ //"Normal" data loading
			if(categoryNumber[OverlayType.PointSymbol] > 0){
				index = symbolManager.blockFeatureCombinations(1, true)[0];
				element.overlayType = OverlayType.PointSymbol;
			}
			else if (categoryNumber[OverlayType.Polygon] > 0){
				index = symbolManager.blockColor(OverlayType.Polygon);
				element.overlayType = OverlayType.Polygon;
			}
			else {
				index = symbolManager.blockColor(OverlayType.LineString);
				element.overlayType = OverlayType.LineString;
			}
		}
		else {
			if(reload){ //Reloading Symbols
				index = /** @type {Array<Array<number>|number>} */ (colorIndex);
			}					
			else { //Synoptic map
				index = symbolManager.blockExplicitSingularIndex(colorIndex);
				if(categoryNumber[OverlayType.PointSymbol] > 0){
					element.overlayType = OverlayType.PointSymbol;
				}
				else if (categoryNumber[OverlayType.Polygon] > 0){
					element.overlayType = OverlayType.Polygon;
				}
				else {
					element.overlayType = OverlayType.LineString;
				}
			}
				
		}

		element.colorIndex = index;
		return index;
	};
	
	/**
	 * @private 
	 * 
	 * @param {!Array} result
	 * @param {MultiLegendElement} element
	 * @param {Object<string, ?>} filterData
	 * @param {Object<string, Array<number>|number>=} fixedColors Defines the color indexes for certain legend elements (e.g. for a synoptic map)
	 * @param {boolean=} reload
	 * 
	 */
	this.createMultiLegendEntry = function (result, element, filterData, fixedColors, reload){
		
		//Store sub-element visibilities
		var /** Object<string,boolean> */ visibilities = {};
		for (var si = 0; si < element.getNumSubElements(); si++){
			var /** LegendElement */ ce = element.getSubElement(si);
			visibilities[ce.key] = ce.visible();
		}
		
		//Sub-elements are always newly build, even if they exist, since the data might have changed
		element.removeSubElements();
		
		var /** number */ length = Object.keys(result[DATA]).length;
		if (length > 0) {
			
			//Sort the keys according to the given sorter
			var /**Sorter|undefined */ sorter = categoryManager.getSorter(element.category);
			var /** Array<string> */ sortedKeys;
			if(sorter == undefined){
				sortedKeys = Sorter.createKeyArray(result[DATA]);
			}
			else {
				sortedKeys = sorter.getSortedKeys(result[DATA], filterData);
			}
			
			var numSubElements = sortedKeys.length;
			
			//Create sub-legend-entries for each sub-category
			//If the element is contained in fixedColors the color index is assigned
			var /** number= */ mainIndex = undefined;
			var /** Array<number> */ numOverlayTypes = [];
			for (var oi = 0; oi < num_types; oi++){
				numOverlayTypes[oi] = result[NUM_PER_CATEGORY][oi];
			}
			for (var ki = 0; ki < numSubElements; ki++){
				
				var /** string */ id = sortedKeys[ki];
				var /** OverlayType */ overlayType =  result[DATA][id][0];
				
				var /** LegendElement */ currentElement = new LegendElement(filterData["subElementCategory"], id);

				if(fixedColors != undefined){
					var /** Array<number>|number */ currentIndex = fixedColors[id];

					if(currentIndex != undefined){
						currentElement.colorIndex = symbolManager.blockExplicitIndex(fixedColors[id]);
						if(overlayType == OverlayType.PointSymbol){
							mainIndex = currentIndex[features_classes.main];
						}
						numOverlayTypes[overlayType]--;
					}
				}
				
				currentElement.overlayType = overlayType;
				currentElement.visible(visibilities[id]);
				
				currentElement.parent = element;
				element.addSubElement(currentElement);
				element.subElementsVisible++;
			}
			
			//Block color indexes for all remaining sub-elements (not contained in fixedColors)
			var /**Array<Array<Array<number>>|Array<number>> */ indexes = [];
			
			try{
				indexes[OverlayType.PointSymbol] = symbolManager.blockFeatureCombinations(numOverlayTypes[OverlayType.PointSymbol], false, mainIndex);
				if(mainIndex == undefined && indexes[OverlayType.PointSymbol].length > 0){
					mainIndex = indexes[OverlayType.PointSymbol][0][features_classes.main];
				};
				indexes[OverlayType.Polygon] = symbolManager.blockColors(OverlayType.Polygon, numOverlayTypes[OverlayType.Polygon]);
				indexes[OverlayType.LineString] = symbolManager.blockColors(OverlayType.LineString, numOverlayTypes[OverlayType.LineString]);
			}
			catch (e){
				alert(TRANSLATIONS["NO_SYMBOLS_LEFT"] + " (" + length + ")");
				legend.removeElement(element, true);
				return;
			}
			
			var /** boolean */ overlaysMovable = optionManager.inEditMode() && this.categoryAllowsGeoDataEditingForElement(element.category, element.key, overlayType);
			
			//Iterate over the sub-legend-entries again to add the map overlays and set the rest of the color indexes
			numOverlayTypes.fill(0);
			for (var li = 0; li < numSubElements; li++){

				id = sortedKeys[li];
				currentElement = element.getSubElement(li);
				overlayType =  result[DATA][id][0];
				
				//Assign color index if it does not exist, yet
				if(currentElement.colorIndex == undefined){
					currentElement.colorIndex = indexes[overlayType][numOverlayTypes[overlayType]++];
				}
				
				//Create Symbols
				if(overlayType == OverlayType.PointSymbol){
					currentElement.symbolStandard = symbolManager.createSymbolURL(/** @type{Array<number>} */ (currentElement.colorIndex));
					currentElement.symbolHighlighted = symbolManager.createSymbolURL(symbolManager.createHighlightedIndex(/** @type{Array<number>} */ (currentElement.colorIndex)));
				}
				else {
					currentElement.symbolStandard = symbolManager.createColorURL(/** @type{number}*/ (currentElement.colorIndex));
				}
				
				//Add map overlays
				var /** number */ numRecords = result[DATA][id][1].length;
				var /** boolean */ addToMap = !reload || currentElement.visible();
				
				//Iterate over all records associated with the sub-element
				var /** Array */ dataArray = result[DATA][id][1];
				for (var/** number */ j = 0; j < numRecords; j++) {
					var /** Array */ currentShape = dataArray[j];
				
					if(currentShape[1] == null){
						console.error("Element " + JSON.stringify(currentShape[0]).substring(0,50) + " has no geo data!");
						continue;
					}	
					
					var /** google.maps.Data.Geometry */ geoObject = parseGeoData(currentShape[1]);
					var constr = this.infoWindowContentConstructors[currentShape[0]["elementType"]];
					delete currentShape[0]["elementType"];
					if(constr == undefined){
						throw "InfoWindow type not found!";
					}
					
					var /** Array<string|Object<string, number>> */ quantifyInfo = currentShape[2];
					var /** string */ polygonQuantifyInfo = "";
					var /** Object<string, number>*/ pointQuantifyInfo = null;
					if(quantifyInfo != null){
						if(quantifyInfo[0] == "POINT"){
							pointQuantifyInfo = /** @type{Object<string, number>} */ (quantifyInfo[1]);
						}
						else {
							polygonQuantifyInfo = /** @type{string}*/ (quantifyInfo[1]);
						}
					}
					
					var/** OverlayInfo */ overlayInfo = new OverlayInfo(new constr(currentElement.category, currentElement.overlayType, currentShape[0]), geoObject, pointQuantifyInfo);
					currentElement.overlayInfos.push(overlayInfo);
					
					if(filterData["subElementCategory"] == -1){ //Pseudo category
						this.addElementName (id, currentShape[0]["name"]); //TODO name might not be set
					}
					
					if (addToMap && overlayInfo.geomData != null){
						symbolClusterer.addOverlay(overlayInfo, currentElement, polygonQuantifyInfo, overlaysMovable);
					}

				 	
				}
				currentElement.loading = false;
				
			}
			
			if(!reload && mainIndex != undefined){
				element.symbolStandard = symbolManager.createSymbolURLForMainIndex(mainIndex);
			}
			
			//Comments
			for (var /** string */ ckey in result[COMMENTS]){
				commentManager.addComment(ckey, result[COMMENTS][ckey]);
			}
			
		   if(symbolClusterer.checkQuantify())
			   symbolClusterer.reQuantify();	
		   
			element.loading = false;
			legend.update();
		}
		else {	
			legend.removeElement(element, true);
			alert(TRANSLATIONS["NO_DATA"] + " (" + categoryManager.getElementName(element.category, element.key) + ")!");
		 }		
	};	
	
	
	/**
	 * @param {number} categoryID
	 * 
	 * @return {Sorter|undefined} 
	 */
	this.getSorter = function (categoryID){
		
		var /** Array<FilterComponent>|undefined*/ filterComponents = this.categories[categoryID].filterComponents;
		if(filterComponents == null || filterComponents.length == 0)
			return;
		
		//Look for a grouping filter
		for (var i = 0; i < filterComponents.length; i++){
			if(filterComponents[i] instanceof GroupingComponent){
				return /** @type {GroupingComponent} */ (filterComponents[i]).sorter;
			}
		}
	};
	
	/**
	 * @param {string} elementType Short name of the InfoWindowContent class as returned by the PHP code
	 * @param {function(new:InfoWindowContent, number, OverlayType, Object<string, ?>)} constr Constructor function of the InfoWindowConten class
	 * 
	 * @return {undefined}
	 */
	this.addInfoWindowContentConstructor = function (elementType, constr){
		this.infoWindowContentConstructors[elementType] = constr;
	};
	
	/**
	 * @return {Array<number>}
	 */
	this.getEditableCategories = function (){
		var /** Array<number> */ result = [];
		for (var cid in this.categories){
			if(this.categories[cid * 1].editConfiguration)
				result.push(cid * 1);
		}
		return result;
	};
	
	/**
	 * @param {number} categoryID
	 * @param {OverlayType=} overlayType
	 * 
	 * @return {Array<boolean>|boolean}
	 */
	this.categoryAllowsNewElements = function (categoryID, overlayType){
		var /** CategoryInformation */ category = this.categories[categoryID];
		return category.editConfiguration != undefined && category.editConfiguration.canAddNewOverlays(overlayType);
	};
	
	/**
	 * @param {number} categoryID
	 * @param {string} elementID
	 * @param {OverlayType=} overlayType
	 * 
	 * @return {boolean}
	 */
	this.categoryAllowsFieldDataEditingForElement = function (categoryID, elementID, overlayType){
		var /** CategoryInformation */ category = this.categories[categoryID];
		return category.editConfiguration != undefined && category.editConfiguration.canEditFieldData(elementID, overlayType);
	};
	
	/**
	 * @param {number} categoryID
	 * @param {string} elementID
	 * @param {OverlayType=} overlayType
	 * 
	 * @return {boolean}
	 */
	this.categoryAllowsGeoDataEditingForElement = function (categoryID, elementID, overlayType){
		var /** CategoryInformation */ category = this.categories[categoryID];
		return category.editConfiguration != undefined && category.editConfiguration.canEditGeoData(elementID, overlayType);
	};
	
	/**
	 * @param {number} categoryID
	 * @param {number} overlayType
	 * 
	 * @return {Array<FieldInformation>}
	 */
	this.getEditFields = function (categoryID, overlayType){
		var /** CategoryInformation */ category = this.categories[categoryID];
		if(category.editConfiguration){
			return category.editConfiguration.getEditFields(overlayType);
		}
		return [];
	};
}


/**
 * @constructor
 * @struct
 * 
 * @param {number} categoryID A unique id for the type. Only values >= 0 can be used, negative values are reserved for pseudo-categories!
 * @param {string} name Name for the type, as it is for example show in a legend entry
 * @param {string} categoryPrefix 
 * 					Prefix for the different ids of this category. This ensures that the ids (generally numerical) are unique. 
 * 					All category prefixes must consist of one letter to avoid clashes in presence of non-numerical ids!
 * 					(e.g. in VerbaAlpina C5 is a concept id and M5 is the id of a morphological type)
 * 
 * @param {string} nameEmpty This name is used if a data point should have this type, but nothing is assigned, yet, e.g. something like "not typified", "no Concept", etc.
 * @param {string=} elementID {
 * 	The id of an html element that triggers the visualisation of new data. This has to suffice the following conditions:
 * 		- It fires an "change" event
 * 		- It is of class "im_data_loader"
 * 		- It has a function "getSelectedValue" in its jQuery dataset that produces the current id
 * 		- It has a function "getName" in its jQuery dataset that produces the current name from an id
 * 		- It has a function "reset" in its jQuery dataset that resets the element to its default status (e.g. deselect the selected option)
 * @param {Array<FilterComponent>=} filterComponents Filter possibilities for this type
 * @param {Array<string>=} countNames Array with two values that contain the singular and plural name to be shown after the count of all data points in the legend, 
 * 										e.g. ["record", "records"]
 * 										If it is null no count will be shown
 * @param {string=} textForNewComment Text shown in the right-click menu to write a new comment about this type (default: undefined)
 * @param {string=} textForListRetrieval Text shown in the right-click menu to retrieve a list of the selected information (default: undefined)
 * @param {AbstractListBuilder=} listBuilder The list builder to be used for information of this category (default: undefined)
 * @param {function(string):string=} costumGetNameFunction Function to overwrite the getName functions provided by the gui elements
 * @param {EditConfiguration=} editConfiguration If this paramter is set, users with the capability "im_edit_map_data" can edit the markers belonging to this category and add new markers to it
 */
function CategoryInformation (categoryID, categoryPrefix, name, nameEmpty, elementID, filterComponents, countNames, textForNewComment, textForListRetrieval, listBuilder, costumGetNameFunction, editConfiguration){
	/**
	 * @type {number} 
	 */
	this.categoryID = categoryID;
	
	/**
	 *@type {AbstractListBuilder}
	 */
	this.listBuilder;
	if(typeof listBuilder == "object" && listBuilder != null){
		this.listBuilder = listBuilder;
	} 
	else 
	{
		this.listBuilder = new SimpleListBuilder(["name","description"]);
	}
	
	/**
	 * @type{string} 
	 */
	this.categoryPrefix = categoryPrefix.charAt(0);
	
	/**
	 * @type {string}
	 */
	this.name = name;
	
	/**
	 * @type {string|undefined} 
	 */
	this.nameEmpty = nameEmpty;
	
	/**
	 * @type {jQuery} 
	 */
	this.element = null;
	if(elementID != null){
		this.element = jQuery("#" + elementID);
	}
	
	/**
	 * @type {Array<FilterComponent>|undefined}
	 */
	this.filterComponents = filterComponents;
	
	/**
	 * @type {string|undefined} 
	 */
	this.countNameSingular = undefined;
	
	/**
	 * @type {string|undefined} 
	 */
	this.countNamePlural = undefined;
	
	if(countNames != null && countNames.length >= 2){
		this.countNameSingular = countNames[0];
		this.countNamePlural = countNames[1];
	}
	
	/**
	 * @type{function(string):string|undefined} 
	 */
	this.costumGetNameFunction = costumGetNameFunction;
	
	/**
	 * @type{string|undefined} 
	 */
	this.textForNewComment = textForNewComment;
	
	/**
	 * @type {boolean}
	 */
	this.singular = true;
	if(filterComponents != undefined){
		for (var i = 0; i < filterComponents.length; i++){
			//TODO this is a problem if grouping is used but no grouping component!!
			if(filterComponents[i] instanceof GroupingComponent){
				this.singular = false;
				break;
			}
		}
	}

	/**
	 * @type{string|undefined}
	 */
	this.textForListRetrieval = textForListRetrieval;
	
	/**
	 * @type {EditConfiguration|undefined}
	 */
	this.editConfiguration = editConfiguration;
}	

/**
 * @interface
 * @struct
 *
 */
function FilterComponent () {};

/**
 *
 *  DOM element that should be displayed in the filter popup window.
 *  If it returns null it is ignored
 * 
 * @param {number} categoryId
 * @param {string} elementId
 * 
 * @return {Element} 
 */
FilterComponent.prototype.getFilterScreenElement = function (categoryId, elementId) {};


/**
 *
 * Representation of the filter data as it should be processed by the server
 * Will be called when the filter screen is submitted.
 * 
 * Will be called directly after the dialog is closed, so it can also be used
 * to destroy extra data that might not be deleted by jQuery.empty().
 *
 * @param {Object<string, ?>} data
 * @param {Element} element The DOM element created by getFilterScreenElement.
 * @param {number} categoryId
 * @param {string} elementId
 * 
 * @return {undefined}
 */
FilterComponent.prototype.storeData = function (data, element, categoryId, elementId){};

/**
 *
 * Will be called after the element is added to the DOM. 
 *
 * @param {Element} element The added to DOMElement (as constructed by getFilterScreenElement)
 * @param {number} categoryId
 * @param {string} elementId
 * 
 * @return {undefined} 
 */
FilterComponent.prototype.afterAppending = function (element, categoryId, elementId){};
