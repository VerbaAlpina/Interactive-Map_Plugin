//The following variables are meant to make the code more readable. The closure compiler should filter them out:
/**
 * @const{number} 
 */
var DATA = 0;

/**
 * @const{number} 
 */
var COMMENTS = 1;

/**
 * @const{number} 
 */
var KEY = 2;

/**
 * @const{number} 
 */
var EXTRA_DATA = 3;

/**
 * @const{number} 
 */
var DEBUG_DATA = 4;

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
	this.tagTranslations = {};
	
	/**
	 * @private
	 * @type {Object<string, Object<string, string>>}
	 */
	this.allDistinctNames = {};
	
	/**
	 * 
	 * @private
	 * @type {Object<string, function(new:InfoWindowContent, number, string, OverlayType, Object<string, ?>)>} 
	 */
	this.infoWindowContentConstructors = {"simple" : SimpleInfoWindowContent, "editable" : EditableInfoWindowContent, "polygon" : PolygonInfoWindowContent, "lazy" : LazyInfoWindowContent};
	
	/**
	 *  @private
	 *  @type {Object<number, !CategoryInformation>}
	 */
	this.categories = {};
	this.categories["-1"] = new CategoryInformation (-1,"?",TRANSLATIONS["ALL_DISTINCT"],""); //Pseudo category for using every element as a sub-category
	this.categories["-2"] = new CategoryInformation (-2,"!","",""); //Pseudo category for no sub-categories
	this.categories["-3"] = new CategoryInformation (-3,"#","",TRANSLATIONS["WITHOUT_TAG"]); //Pseudo category for tags as sub-categories
	//TODO name here
	this.categories["-4"] = new CategoryInformation (-4,"$","distinct",""); //Pseudo category for distinctly colored neigbours
	this.categories["-5"] = new CategoryInformation (-5,"§","Dialektometrie",""); //Pseudo category for communities useable for dialectometry
	
	/**
	 * @private
	 * @type {Object<string, number>}
	 */
	this.prefixToIdMapping = {};
	
	/**
	 * @param {CategoryInformation} info
	 * 
	 * @return {undefined}
	 */
	this.registerCategory = function (info){
		this.prefixToIdMapping[info.categoryPrefix] = info.categoryID; //Don't check for overlaps for efficiency reasons
		
		this.categories[info.categoryID] = info;

		if(info.element != null){
			info.element.change(this.handleGuiSelection.bind(this, info.element, info.categoryID, info.filterComponents));
		}
	};
	
	/**
	 * @param {string} elementID
	 * 
	 * @return {number}
	 */
	this.categoryFromId = function (elementID){
		for (var /** string*/ prefix in this.prefixToIdMapping){
			if (elementID.startsWith(prefix)){
				return this.prefixToIdMapping[prefix];
			}
		}
		return -1;
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
	 * 
	 * @return {?}
	 */
	this.removeAjaxData = function (key){
		var val = this.additionalAjaxData[key];
		delete this.additionalAjaxData[key];
		return val;
	};
	
	/**
	 * @param {Object} data
	 * 
	 * @return {Object}
	 */
	this.addAdditonalAjaxData = function (data){
		for (let key in this.additionalAjaxData){
			data[key] = this.additionalAjaxData[key];
		}
		
		return data;
	}
	
	/**
	 * @param {number} categoryID
	 * @param {string|null} elementID
	 * 
	 * @return {undefined}
	 */
	this.setElementID = function (categoryID, elementID){

		var /** CategoryInformation */ info = this.categories[categoryID];
		var /** jQuery|null */ oldElement = info.element;
		
		if(oldElement != null){
			oldElement.off("change");
		}
		
		if(elementID != null){
			info.element = jQuery("#" + elementID);
			info.element.change(this.handleGuiSelection.bind(this, info.element, info.categoryID, info.filterComponents));
		}
		else {
			info.element = null;
		}
	};
	
	/**
	 * @param {number} categoryID
	 * @param {string} key
	 * 
	 * @return {boolean}
	 */
	this.forbidRemoving = function (categoryID, key){
		var /** CategoryInformation */ info = this.categories[categoryID];
		if (info.forbidRemovingFunction){
			return info.forbidRemovingFunction(key);
		}
		return false;
	}
	
	/**
	 * @param {number} categoryID
	 * 
	 * @return {boolean}
	 */
	this.isSingleSelect = function (categoryID){
		return this.categories[categoryID].singleSelect;
	}
	
	/**
	 * @param {string} key
	 * @param {string} name
	 * 
	 * @return {undefined}
	 */
	this.addTagTranslation = function (key, name){
		this.tagTranslations[key] = name;
	};
	
	this.getTagTranslation = function (key){
		if(this.tagTranslations[key])
			return this.tagTranslations[key];
		return key;
	}
	
	/**
	 * @param {number} categoryID 
	 * 
	 * @return {string}
	 */
	this.getEmptyCategoryName = function (categoryID){
		return this.categories[categoryID].nameEmpty;
	};
	
	/**
	 * @param {number} categoryID 
	 * @param {boolean=} emptyPseudoCategories
	 * 
	 * @return {string}
	 */
	this.getCategoryName = function (categoryID, emptyPseudoCategories){
		if(emptyPseudoCategories === true && categoryID < 0)
			return "";
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
		var /** !CategoryInformation */ cat = this.categories[categoryID];
		
		if(cat.costumGetNameFunction == undefined){
			return this.getRegularElementName(cat, key);
		}
		else {
			return cat.costumGetNameFunction(key, this.getRegularElementName.bind(this, cat));
		}
	};
	
	/**
	 * @private
	 * 
	 * @param {!CategoryInformation} cat 
	 * @param {string} key
	 * 
	 * @return {string}
	 */
	this.getRegularElementName = function (cat, key){
		var /** jQuery */ element = cat.element;
		
		if(element == null){
			return key;	
		}
		
		return  /** @type{function(string):string} */ (element.data("getName"))(key);
	}
	
	/**
	 * @param {string} key
	 * @param {string} parentKey
	 * 
	 * @return {string}
	 */
	this.getAllDistinctElementName = function (key, parentKey){
		return this.allDistinctNames[parentKey][key];
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
	 * @return {Array<boolean>}
	 */
	this.getOverlayTypes = function (categoryID){
		var /** CategoryInformation */ category = this.categories[categoryID];
		if(category.editConfiguration){
			return category.editConfiguration.getTypesForNewOverlays();
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
	this.handleGuiSelection = function (element, categoryID, filterComponents){
		var /** string */ value = this.getCategoryPrefix(categoryID) + /** @type{function():string} */ (element.data("getSelectedValue"))();
		
		/** @type {function():undefined} */ (element.data("reset"))();
		this.showFilterScreen(categoryID, value);
	};
	
	
	/**
	 * 
	 * @param {number} categoryID
	 * @param {string} elementID
	 * 
	 * @return {undefined} 
	 */
	this.showFilterScreen = function (categoryID, elementID){
		if(elementID == 0 || optionManager.inEditMode() && legend.getMainElement(categoryID, elementID))
			return;

		var /** Array<FilterComponent>|undefined */ filterComponents = this.categories[categoryID].filterComponents;
		
		if(optionManager.inEditMode() && !this.categoryAllowsFieldDataEditingForElement(categoryID, elementID) && !this.categoryAllowsGeoDataEditingForElement(categoryID, elementID)){
			alert(TRANSLATIONS["NO_EDITING_CATEGORY"]);
			return;
		}
		
		var /** boolean */ noElements = true;
		
		if(filterComponents != undefined && filterComponents.length > 0){
			var thisObject = this;
			
			// jQuery("#IM_filter_popup_title").text(this.getElementName(categoryID, value));
			jQuery("#IM_filter_popup_content").empty();
			
			var /** Array<Element> */ newElements = new Array (filterComponents.length);
			for (var i = 0; i < filterComponents.length; i++){
				newElements[i] = filterComponents[i].getFilterScreenElement(categoryID, elementID);
				
				if(newElements[i] == null)
					continue;
				
				jQuery("#IM_filter_popup_content").append(newElements[i]);

				filterComponents[i].afterAppending(newElements[i], categoryID, elementID);
				noElements = false;
			}
			
			if(!noElements){
				jQuery("#IM_filter_popup_submit").unbind("click");
				jQuery("#IM_filter_popup_submit").click(function () {
					
					var /** Object<string,?> */ filterData = {"id" : elementID}; //TODO document that id can be changed with filter components
					for (var i = 0; i < filterComponents.length; i++){
						if(newElements[i] != null)
							if(!filterComponents[i].storeData(filterData, newElements[i], categoryID, elementID)){
								alert(TRANSLATIONS["FILTER_NOT_POSSIBLE"]);
								return;
							}
					}
					jQuery("#IM_filter_popup_div").modal('hide');		
					
					var /**string */ updatedId = filterData["id"];
					delete filterData["id"];
					thisObject.loadData (categoryID, updatedId, "menu", filterData, undefined, undefined, true);
				});

				 var that = this;

				jQuery('#IM_filter_popup_div').off('show.bs.modal').on('show.bs.modal', function (e) {
					var name = that.getCategoryName(categoryID);
					var m_title = jQuery('<span class="im_concept_hl">'+name+'</span><span class="im_name_hl">'+that.getElementName(categoryID, elementID)+'</span>');
					jQuery('#IM_filter_popup_div .modal-title').empty().append(m_title);
				}) 	


				jQuery('#IM_filter_popup_div').off('shown.bs.modal').on('shown.bs.modal',function(){
						adjustMapModalContent();
				});

				jQuery("#IM_filter_popup_div").modal('show').data("element-id", elementID);
			}
		}
		
		if(noElements){
			//Directly load data
			this.loadData (categoryID, elementID, "menu", undefined, undefined, undefined, true);
			
		}
	};
	
	/**
	 * @param {number} id
	 * @param {string} context USER OR URL
	 */
	this.loadSynopticMap = function (id, context){

		legend.removeAll();
		mapState.clean();
	
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
			
			mapInfos["continue"] = true;
			mapInfos["context"] = context;
			mapInfos["id"] = id;
			
			jQuery(document).trigger("im_syn_map_before_loading", mapInfos, data[1]);
			if(!mapInfos["continue"])
				return;
			
			for (var option in mapInfos["Options"]){
				//Url parameter overwrite parameters saved for synoptic maps
				if (!PATH["options"][option]){
					optionManager.setOption(option, mapInfos["Options"][option]);
				}
			}
			
			//TODO load color scheme somehow???
	
			//Zoom and position
			mapInterface.setCenterAndZoom(mapInfos["Center_Lat"], mapInfos["Center_Lng"], mapInfos["Zoom"] * 1);
			//mapInterface.setCenter(mapInfos["Center_Lat"], mapInfos["Center_Lng"]);
			//mapInterface.setZoom(mapInfos["Zoom"] * 1);
			
			var /** number */ numElements = data[1].length;
			var /** number */ notReady = numElements;
			var /** function () */ singleCallback = function (){
				notReady--;
				
				if(notReady == 0){
					if(mapInfos["Quant"]){
						jQuery("#qbutton_" + mapInfos["Quant"]).trigger("click");
					}
					
					mapInterface.repaint(true);
					
					for (let i = 0; i < mapInfos["Info_Windows"].length; i++){
						var /** infoWindoInfoOld|infoWindoInfoNew */ iWindow = /** @type {infoWindoInfoOld|infoWindoInfoNew}*/ (mapInfos["Info_Windows"][i]);
						
						var /**MapShape|MapSymbol */ mapElement;
						if (iWindow["legendIndex"]){
							//old maps
							mapElement = symbolClusterer.findMapElement(
								legend.getElementByIndexes(iWindow["legendSubIndex"], iWindow["legendIndex"]), 
								iWindow["elementIndex"],
								iWindow["lat"],
								iWindow["lng"]);
						}
						else {
							//new maps
							mapElement = symbolClusterer.findMapElement(
									/** @type {LegendElement} */ (legend.getElementByKey(iWindow["category"], iWindow["key"])), 
									iWindow["elementIndex"],
									iWindow["lat"],
									iWindow["lng"]);
						}
						
						if (mapElement){
							if(mapElement instanceof MapSymbol){
								mapElement.openInfoWindow(iWindow["tabIndex"] * 1);
							}
							else {
								mapElement.openInfoWindow(iWindow["lat"], iWindow["lng"]);
							}
						}
						else {
							console.error("Map element for info window not found: " + JSON.stringify(iWindow));
						}
					}
					
					for (let i = 0; i < mapInfos["Location_Markers"].length; i++){
						gotoLocation(mapInfos["Location_Markers"][i], false);
					}
				}
			};
			
			if(numElements == 0){
				notReady = 1;
				singleCallback();
			}
			else {
				for (var /** number */ i = 0; i < numElements; i++){
					var currElement = data[1][i];
					var /** boolean|Array<number> */ active = Array.isArray(currElement["active"])? currElement["active"].map(x => x * 1): currElement["active"] == "true";
					categoryManager.loadData(currElement["category"] * 1, currElement["key"], "synMap", currElement["filter"], currElement["fixedColors"], singleCallback, undefined, active);
				}
			}
			
			if (mapInfos["Opened"]){
				categoryManager.showFilterScreen(categoryManager.categoryFromId(mapInfos["Opened"]), mapInfos["Opened"]);
			}
			
			var /** {tk: number}*/ state = {"tk" : id};
			history.pushState(state, "", addParamToUrl(window.location.href, "tk", id + ""));
			jQuery(document).trigger("im_url_changed", state); //TODO document
		});
	};
	
	/**
	 *
	 * @param {number} category
	 * @param {string} key
	 * @param {string} trigger Possible values: "synMap", "menu", "stateChange", "reload", "repeated", "custom"
	 * @param {Object<string, ?>=} filterData
	 * @param {Object<string, Array<number>|number>=} fixedColors Defines the color indexes for certain legend elements (e.g. for a synoptic map)
	 * @param {function ((LegendElement|MultiLegendElement))=} callback
	 * @param {boolean=} popState
	 * @param {boolean|Array<number>=} active
	 * @param {Array<WaitingData>=} waitingList If a waiting list is given the legend element is not immediately created after the server response, but
	 * when all elements in the waiting list are loaded. Also the subelement colors are adjusted
	 * 
	 */
	this.loadData = function (category, key, trigger, filterData, fixedColors, callback, popState, active, waitingList) {
		if(optionManager.inEditMode() && !categoryManager.categoryAllowsFieldDataEditingForElement(category, key)
				&& !categoryManager.categoryAllowsGeoDataEditingForElement(category, key))
			return;

		if(key.indexOf("+") != -1){ //Multiple keys
			//TODO document, especially that B1+2 has to be used and not B1+B2
			var prefix = key[0];
			var /** Array<string> */ keys = key.substring(1).split("+");
			var /** Array<WaitingData>= */ newWaitingList = [];
			for (let i = 0; i < keys.length; i++){
				if (trigger == "menu" && i > 0){
					trigger = "repeated";
				}
				
				this.loadData(category, prefix + keys[i], trigger, (filterData === undefined? undefined: Object.assign({}, /** @type{!Object} */ (filterData))), fixedColors, callback, popState, active, newWaitingList);
			}
			return;
		}
		
		var /** boolean */ adjustSubSymbols = false;
		if(filterData && filterData["adjustSubElementSymbols"]){ //TODO document
			adjustSubSymbols = filterData["adjustSubElementSymbols"] === true;
			delete filterData["adjustSubElementSymbols"];
		}

		if(waitingList !== undefined){
			var /** number */ indexWaitingList = waitingList.length;
			waitingList.push(null); //Add placeholder
		}
		
		var/** MultiLegendElement|LegendElement */ element = legend.getMainElement(category, key);
		
		if(element != null){
			element.setActive(false);
			if(legend.numActive == 0){
				symbolClusterer.repaintPointSymbols(); //TODO maybe inefficient for synoptic maps??
			}
		}
		
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
		
		if(filterData == undefined && this.categories[category].filterComponents){
			filterData = {};
			for (var f = 0; f < this.categories[category].filterComponents.length; f++){
				this.categories[category].filterComponents[f].storeDefaultData(filterData, category, key);
			}
		}
		ajaxData["filter"] = filterData;
		
		if(fixedColors != null && element != null){
			//No need to reload the comments if only the symbols for the map are reloaded
			ajaxData['noComments'] = true;
		}
		
		if(optionManager.inEditMode()){
			ajaxData['editMode'] = true;
		}
		
		var eventData = { 
			"category" : category, 
			"key" : key, 
			"ajaxData" : ajaxData, 
			"trigger" : trigger
		};
			
		jQuery(document).trigger("im_before_load_data", eventData); //TODO document
		
		var /** boolean */ newLegendElementCreated = false;
		var /** boolean */ singular = filterData === undefined || filterData["subElementCategory"] === undefined || filterData["subElementCategory"] == -2; //TODO document subElementCategory as key
		
		if (element == null) {
			if(singular)
				element = new LegendElement(category, key);
			else
				element = new MultiLegendElement(category, key);
			
			if(categoryManager.isSingleSelect(category)){
				legend.removeElementsByCategory(category);
			}
			
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
				if (waitingList !== undefined){
					waitingList.splice(indexWaitingList, 1);
				}
				return;
			}
			else if (response.substring(0, 5) == "Error"){
				alert(response);
				element.setLoading(false); //Needed to reenable disabled options
				legend.removeElement(element, true);
				if (waitingList !== undefined){
					waitingList.splice(indexWaitingList, 1);
				}
				return;
			}
			
			var /** !Array */ result = /** @type{!Array} */ (JSON.parse(response));
			
			if(!singular){
				var /** Array<string> */ sortedKeys = thisObject.sortSubElementKeys(element.category, result[DATA], filterData);
			}
			
			var /** function(MultiColorIndex=) */  doRest = function (computedColors){
				if(result[EXTRA_DATA] && Object.keys(result[EXTRA_DATA]).length > 0){
					jQuery(document).trigger("im_server_extra_data", result[EXTRA_DATA]); //TODO document
				}
				
				if(result[DEBUG_DATA]){
					jQuery("#im_debug_area").html(result[DEBUG_DATA])
				}				
				
				element.filterData = filterData;
				element.key = result[KEY];

				if(singular){
					thisObject.createSingularLegendEntry(result, /** @type {LegendElement}*/ (element), computedColors, !newLegendElementCreated, /** @type{boolean} */ (active));
				}
				else {
					thisObject.createMultiLegendEntry(result, /** @type {MultiLegendElement}*/ (element), sortedKeys, /** @type{Object<string, ?>}*/ (filterData), computedColors, !newLegendElementCreated, /** @type{Array<number>}*/ (active));
				}
				
				mapInterface.repaint(trigger != "synMap" && trigger != "reload");
				jQuery(document).trigger("im_after_load_data"); //TODO document
				
				if(callback)
					callback(element);
				
				if(popState)
					history.pushState({"content" : legend.getCompleteExport(true)}, "");
			};
			
			if(waitingList === undefined){
				//No waiting list:
				doRest(fixedColors);
			}
			else {
				waitingList[indexWaitingList] = {fun : doRest, data: result, singular: singular, sortedKeys: sortedKeys};
				
				//Last element of waiting list => handle all elements
				if(waitingList.indexOf(null) == -1){
					var /** number */ elementCount = 0;				
					var /** Array<Array<string>> */ idList = [];
					for (let i = 0; i < num_overlay_types; i++){
						idList[i] = [];
					}
					
					if(adjustSubSymbols){
						//Find different sub elements and number of overlay types
						for (let i = 0; i < waitingList.length; i++){
							if(!waitingList[i].singular){
								
								var /** !Object */ resultData = waitingList[i].data[DATA];
								var /** Array<string> */ currentsubElementKeys = Object.keys(resultData);
								var /** Array<string> */ currentSortedKeys = waitingList[i].sortedKeys;
								
								for (let j = 0; j < currentSortedKeys.length; j++){
									var /** number */ overlayType = resultData[currentSortedKeys[j]][0];
									if(idList[overlayType].indexOf(currentSortedKeys[j]) == -1){
										idList[overlayType].push(currentSortedKeys[j]);
										elementCount++;
									}
								}
							}
						}
					}
					
					//If symbols have to  be adjusted
					var /**Array<MultiColorIndex> */ indexes = [];
					if(elementCount > 1){
						for (let i = 0; i < waitingList.length; i++){
							try {
								indexes.push(thisObject.createIndexesForMultiElement(idList).indexes);
							}
							catch (e){
								alert(TRANSLATIONS["NO_SYMBOLS_LEFT"] + " (" + elementCount + ")");
								return;
							}
						}
						
						//Immediatly unblock color indexes, since not all of them will be used in most cases
						for (let k = 0; k < waitingList.length; k++){
							for (let i = 0; i < idList.length; i++){
								for (let j = 0; j < idList[i].length; j++){
									var /** string */ key = idList[i][j];
									if (i == OverlayType.PointSymbol) {
										symbolManager.unblockFeatureCombination(/** @type {Array<number>}*/ (indexes[k][key])[0], /** @type {Array<number>}*/ (indexes[i][key])[1]);
									} else {
										symbolManager.unblockColor(element.overlayType, /** @type {number}*/ (indexes[k][key]));
									}
								}
							}
						}
					}
					
					for (let i = 0; i < waitingList.length; i++){
						waitingList[i].fun(indexes[i]);
					}
				}
			}
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
			
		var /** string */ name = /** @type{string}*/ (jQuery("#IM_Syn_Map_Name").val());
		if(name == ""){
			alert(TRANSLATIONS["ENTER_NAME"]);
			return;
		}
		
		var /**string */ description = /** @type{string}*/ (jQuery("#IM_Syn_Map_Description").val());
		var /**boolean */ release = /** @type{boolean}*/ (jQuery("#IM_Syn_Map_Release").prop("checked"));
	
		var /** {lat: number, lng: number} */ center = mapInterface.getCenter();
		var /** string|null */ id_open = jQuery("#IM_filter_popup_div").hasClass("in")? /** @type{string} */ (jQuery("#IM_filter_popup_div").data("element-id")) : null;
		var /** boolean|LegendElement|MultiLegendElement*/ cq = symbolClusterer.checkQuantify();
		
		jQuery.post(ajaxurl, {
				"action" : "im_a",
				"namespace" : "save_syn_map",
				"name" : name,
				"description" : description,
				"release" : release? "Applied" : "Private",
				"zoom" : mapInterface.getZoom(),
				"center_lat" : center["lat"],
				"center_lng" : center["lng"],
				"author" : PATH.userName,
				"colors" : colorScheme.exportScheme(),
				"opened" : id_open,
				"info_windows" : mapState.getOpenInfoWindows(),
				"location_markers" : mapState.getLocationMarkers(),
				"options" : optionManager.getAllOptionValues(),
				"quant" : cq? cq.key: null,
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
				
				jQuery("#IM_Save_Syn_Map").modal('hide');
				jQuery("#IM_Syn_Map_Selection").append('<option value="' + id + '">' + name + '<option>').trigger("chosen:updated");
		});
	}
	
	/**
	 * @param {function(number)} callback
	 * 
	 * @return {undefined}
	 */
	this.saveAnonymousMap = function (callback){
		var /**{lat: number, lng: number} */ center = mapInterface.getCenter();
		
		var /** boolean|LegendElement|MultiLegendElement*/ cq = symbolClusterer.checkQuantify();
		
		jQuery.post(ajaxurl, {
				"action" : "im_a",
				"namespace" : "save_syn_map",
				"name" : "Anonymous",
				"description" : "",
				"release" : "Private",
				"zoom" : mapInterface.getZoom(),
				"center_lat" : center["lat"],
				"center_lng" : center["lng"],
				"author" : PATH.userName,
				"colors" : colorScheme.exportScheme(),
				"data" : legend.getCompleteExport(true),
				"opened" : jQuery("#IM_filter_popup_div").hasClass("in")? /** @type{string} */ (jQuery("#IM_filter_popup_div").data("element-id")) : null,
				"info_windows" : mapState.getOpenInfoWindows(),
				"location_markers" : mapState.getLocationMarkers(),
				"options" : optionManager.getAllOptionValues(),
				"quant" : cq? cq.key: null,
				"_wpnonce" : jQuery("#_wpnonce_syn_map_save").val()
			}, function (id){
				if(isNaN(id)){
					callback(-1);
				}
				else {
					callback(id * 1);
				}
		});
	};
	
	
	//TODO document
	/**
	 * @param {function(string)} callback
	 * 
	 * @return {undefined}
	 */
	this.produceMapURL = function (callback){
		this.saveAnonymousMap(function (id){
			if(id == -1){
				callback("Error");
			}
			else {
				callback(PATH["tkUrl"].replace("§§§", id + ""));
			}
		});
	};
	
	
	/**
	 * @private
	 * 
	 * @param {!Array} result
	 * @param {LegendElement} element
	 * @param {Object<string, Array<number>|number>=} fixedColors Defines the color indexes for certain legend elements (e.g. for a synoptic map)
	 * @param {boolean=} reload
	 * @param {boolean=} active
	 * 
	 * @return {undefined}
	 */
	this.createSingularLegendEntry = function (result, element, fixedColors, reload, active){

		if(!result[DATA] || jQuery.isEmptyObject(result[DATA])){
			legend.removeElement(element, true);
			element.setLoading(false);
			alert(TRANSLATIONS["NO_DATA"] + " (" + categoryManager.getElementName(element.category, element.key) + ")!");
			return;
		}
		
		if(active){
			element.setActive(true);
		}
		
		//Get color index
		var /** number|Array<number> */ colorIndex;
		try {
			if(fixedColors != null){
				//Unwrap color index
				colorIndex  = fixedColors["-1"];
			}
			
			colorIndex = this.createSingularIndex(result[DATA]["-1"][0], element, colorIndex, reload); //There can only be one category
		}
		catch (e){
			alert(TRANSLATIONS["NO_SYMBOLS_LEFT"]);
			legend.removeElement(element, true);
			return;
		}	
		
		if(!reload){
			if(element.overlayType == OverlayType.PointSymbol){
				element.symbolStandard = symbolManager.createSymbolURL(/** @type{Array<number>}*/ (colorIndex));
				element.symbolInactive = symbolManager.createSymbolURL(/** @type{Array<number>}*/ (colorIndex), undefined, undefined, false);
			}
			else {
				element.symbolStandard = symbolManager.createColorURL(/** @type{number}*/ (colorIndex));	
			}
			
		}
		var /** boolean */ addToMap = !reload || element.visible();
		
		var /** Array */ dataArray = result[DATA]["-1"][1]; //There can only be one category
		
		var /** number */ length = dataArray.length;
		
		var /** boolean */ overlaysMovable = optionManager.inEditMode() && this.categoryAllowsGeoDataEditingForElement(element.category, element.key, element.overlayType);
		
		var /** number */ maxLat;
		var /** number */ maxLng;
		var /** number */ minLat;
		var /** number */ minLng;
		
		for (var/** number */ i = 0; i < length; i++) {
			
			//Geo data
			var /** Object */ currentShape = dataArray[i];
			if(currentShape[1] == null){
				console.error("Element " + JSON.stringify(currentShape[0]).substring(0,50) + " has no geo data!");
				i++;
				continue;
			}	
			
			//Quantify data
			var /** Array<string|Object<string, number>> */ quantifyInfo = currentShape[3];
			var /** string|Object<string, number> */ qinfo;
			if(quantifyInfo != null){
				if(quantifyInfo[0] == "POINT"){
					qinfo = /** @type{Object<string, number>} */ (quantifyInfo[1]); //Matching from categories to polygon ids
				}
				else {
					qinfo = /** @type{string}*/ (quantifyInfo[1]); //Id of the polygon
				}
			}
			
			var /** Array<InfoWindowContent>*/ infoWindowContents = [];
			for (let j = 0; j < currentShape[0].length; j++){
				infoWindowContents.push(this.createInfoWindowContent(currentShape[0][j], element.category, element.key, element.overlayType));
			}
			
			var/** OverlayInfo */ overlayInfo = new OverlayInfo(infoWindowContents, geoManager.parseGeoDataFormated(currentShape[1], currentShape[2]), qinfo, currentShape[4], i);
			element.overlayInfos.push(overlayInfo);
			
			if (addToMap && overlayInfo.geomData != null){
				symbolClusterer.addOverlay(overlayInfo, element, overlaysMovable);
			}
		}
		
		//mapInterface.zoomToBounds(minLat, minLng, maxLat, maxLng);
		
		for (var /** string */ ckey in result[COMMENTS]){
			commentManager.addComment(ckey, result[COMMENTS][ckey]);
		}
		
		if(symbolClusterer.checkQuantify())
			symbolClusterer.reQuantify();
		
		element.setLoading(false);
		legend.update();
	};
	
	/**
	 * 
	 * @param {Object<string, ?>} data
	 * @param {number} category
	 * @param {string} key
	 * @param {OverlayType} overlayType
	 * 
	 * @return {InfoWindowContent}
	 */
	this.createInfoWindowContent = function (data, category, key, overlayType){
		var /** string */ type = data["elementType"];
		var constr = this.infoWindowContentConstructors[type];
		delete data["elementType"];
		if(constr == undefined){
			throw "InfoWindow type not found: " + type;
		}
		return new constr(category, key, overlayType, data);
	}
	
	/**
	 * @private
	 * 
	 * @param {OverlayType} overlayType
	 * @param {LegendElement} element
	 * @param {Array<number>|number=} colorIndex
	 * @param {boolean=} reload
	 * 
	 * @return {Array<number>|number}
	 * 
	 */
	this.createSingularIndex = function (overlayType, element, colorIndex, reload){
		var /** number|Array<number> */ index;
		
		if(colorIndex == null){ //"Normal" data loading
			if(overlayType == OverlayType.PointSymbol){
				index = symbolManager.blockFeatureCombinations(1, true)[0];
				element.overlayType = OverlayType.PointSymbol;
			}
			else if (overlayType == OverlayType.Polygon){
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
				index = symbolManager.blockExplicitSingularIndex(colorIndex);
			}					
			else { //Synoptic map
				index = symbolManager.blockExplicitSingularIndex(colorIndex);
				element.overlayType = overlayType;
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
	 * @param {Array<string>} sortedKeys
	 * @param {Object<string, ?>} filterData
	 * @param {Object<string, Array<number>|number>=} fixedColors Defines the color indexes for certain legend elements (e.g. for a synoptic map)
	 * @param {boolean=} reload
	 * @param {Array<number>=} active Only for synoptic maps
	 * 
	 */
	this.createMultiLegendEntry = function (result, element, sortedKeys, filterData, fixedColors, reload, active){
		//Store sub-element visibilities
		var /** Object<string,boolean> */ visibilities = {};
		for (var si = 0; si < element.getNumSubElements(); si++){
			var /** LegendElement */ ce = element.getSubElement(si);
			visibilities[ce.key] = ce.visible();
		}
		
		//Sub-elements are always newly build, even if they exist, since the data might have changed
		element.removeSubElements();
		
		var /** number */ numSubElements = Object.keys(result[DATA]).length;
		if (numSubElements > 0) {
			//Create sub-legend-entries for each sub-category
			//If the element is contained in fixedColors the color index is assigned
			var /** number= */ mainIndex = undefined;
			var /** Array<Array<string>> */ restIdList = []; //Lists all sub-elements without a fixed color
			for (var oi = 0; oi < num_overlay_types; oi++){
				restIdList[oi] = [];
			}
			
			for (var ki = 0; ki < numSubElements; ki++){
				
				var /** string */ id = sortedKeys[ki];
				var /** OverlayType */ overlayType =  result[DATA][id][0];
				
				var /** LegendElement */ currentElement = new LegendElement(filterData["subElementCategory"], id, element); //TODO document subElementCategory as reserved key
				if(fixedColors != undefined){
					var /** Array<number>|number */ currentIndex = fixedColors[id];
					if(currentIndex !== undefined){
						currentElement.colorIndex = symbolManager.blockExplicitIndex(fixedColors[id]);
						if(overlayType == OverlayType.PointSymbol){
							mainIndex = currentIndex[features_classes.main];
						}
					}
					else {
						restIdList[overlayType].push(id);
					}
				}
				else {
					restIdList[overlayType].push(id);
				}
				
				currentElement.overlayType = overlayType;
				currentElement.visible(visibilities[id]);
				
				element.addSubElement(currentElement);
				element.subElementsVisible++;
				
				if(active && active.indexOf(ki) != -1){
					currentElement.setActive(true);
				}
			}

			//Block color indexes for all remaining sub-elements (not contained in fixedColors)
			try {
				var /** MultiColorIndex */ indexes;
				({indexes, mainIndex} = this.createIndexesForMultiElement(restIdList, mainIndex));
			}
			catch (e){
				alert(TRANSLATIONS["NO_SYMBOLS_LEFT"] + " (" + numSubElements + ")");
				legend.removeElement(element, true);
				return;
			}
			
			var /** boolean */ overlaysMovable = optionManager.inEditMode() && this.categoryAllowsGeoDataEditingForElement(element.category, element.key, overlayType);
			
			//Iterate over the sub-legend-entries again to add the map overlays and set the rest of the color indexes
			for (var li = 0; li < numSubElements; li++){

				id = sortedKeys[li];
				currentElement = element.getSubElement(li);
				overlayType =  result[DATA][id][0];
				
				//Assign color index if it does not exist, yet
				if(currentElement.colorIndex == undefined){
					currentElement.colorIndex = indexes[id];
				}
				
				//Create Symbols
				if(overlayType == OverlayType.PointSymbol){
					currentElement.symbolStandard = symbolManager.createSymbolURL(/** @type{Array<number>} */ (currentElement.colorIndex));
					currentElement.symbolInactive =  symbolManager.createSymbolURL(/** @type{Array<number>} */(currentElement.colorIndex), undefined, undefined, false);
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
					
					//Geo data
					var /** Array */ currentShape = dataArray[j];
					if(currentShape[1] == null){
						console.error("Element " + JSON.stringify(currentShape[0]).substring(0,50) + " has no geo data!");
						continue;
					}	

					var /** IMGeometry */ geoObject = geoManager.parseGeoDataFormated(currentShape[1], currentShape[2]);
					
					//Quantify data
					var /** Array<string|Object<string, number>> */ quantifyInfo = currentShape[3];
					var /** string|Object<string, number> */ qinfo;
					if(quantifyInfo != null){
						if(quantifyInfo[0] == "POINT"){
							qinfo = /** @type{Object<string, number>} */ (quantifyInfo[1]); //Matching from categories to polygon ids
						}
						else {
							qinfo = /** @type{string}*/ (quantifyInfo[1]); //Id of the polygon
						}
					}
					
					var /** Array<InfoWindowContent>*/ infoWindowContents = [];
					for (let k = 0; k < currentShape[0].length; k++){
						infoWindowContents.push(this.createInfoWindowContent(currentShape[0][k], currentElement.category, element.key, currentElement.overlayType));
					}
					
					var/** OverlayInfo */ overlayInfo = new OverlayInfo(infoWindowContents, geoObject, qinfo, currentShape[4], j);
					currentElement.overlayInfos.push(overlayInfo);
					
					if(filterData["subElementCategory"] == -1){ //Pseudo category
						if(this.allDistinctNames[element.key] === undefined){
							this.allDistinctNames[element.key] = {};
						}
						this.allDistinctNames[element.key][id] = currentShape[0][0]["name"]; //TODO name might not be set
					}
					
					if (addToMap && overlayInfo.geomData != null){
						symbolClusterer.addOverlay(overlayInfo, currentElement, overlaysMovable);
					}

				 	
				}
				currentElement.setLoading(false);
				
			}
			
			if(!reload && mainIndex != undefined){
				element.symbolStandard = symbolManager.createSymbolURLForMainIndex(mainIndex);
				element.mainColorIndex = mainIndex;
			}
			
			//Comments
			for (var /** string */ ckey in result[COMMENTS]){
				commentManager.addComment(ckey, result[COMMENTS][ckey]);
			}
			
		   if(symbolClusterer.checkQuantify())
			   symbolClusterer.reQuantify();	
		   
			element.setLoading(false);
			legend.update();
		}
		else {	
			element.setLoading(false);
			legend.removeElement(element, true);
			alert(TRANSLATIONS["NO_DATA"] + " (" + categoryManager.getElementName(element.category, element.key) + ")!");
		 }		
	};
	
	/**
	 * @private
	 * 
	 * @param {number} categoryID
	 * @param {!Object} data
	 * @param {Object=} filterData
	 * 
	 * @return {Array<string>}
	 */
	this.sortSubElementKeys = function (categoryID, data, filterData){
		
		//Sort the keys according to the given sorter
		var /**Sorter|undefined */ sorter = categoryManager.getSorter(categoryID);
		var /** Array<string> */ sortedKeys;
		if(sorter == undefined){
			if(filterData["subElementCategory"] == -3){ //Tags used but no sorter => sort by alphabet
				sortedKeys = new Sorter([new AlphabetSorter()]).getSortedKeys(data, 0, 0, -3);
			}
			else {
				sortedKeys = Object.keys(data);
			}
		}
		else {
			sortedKeys = sorter.getSortedKeys(data, filterData["sorter"]["sortType"], filterData["sorter"]["sortOrder"], filterData["subElementCategory"]);
		}
		
		return sortedKeys;
	}
	
	/**
	 * @private
	 * 
	 * @param {Array<Array<string>>} idList
	 * @param {number=} mainIndex
	 * 
	 * @return {{indexes: MultiColorIndex, mainIndex: (number|undefined)}}
	 */
	this.createIndexesForMultiElement = function (idList, mainIndex){
		var /** MultiColorIndex */ indexes = {};

		var /** Array<Array<number>> */ symbolIndexes = symbolManager.blockFeatureCombinations(idList[OverlayType.PointSymbol].length, false, mainIndex);
		if(mainIndex == undefined && symbolIndexes.length > 0){
			mainIndex = symbolIndexes[0][features_classes.main];
		}
		for (let i = 0; i < idList[OverlayType.PointSymbol].length; i++){
			indexes[idList[OverlayType.PointSymbol][i]] = symbolIndexes[i];
		}
		
		var /** Array<number> */ polygonColors = symbolManager.blockColors(OverlayType.Polygon, idList[OverlayType.Polygon].length);
		for (let i = 0; i < idList[OverlayType.Polygon].length; i++){
			indexes[idList[OverlayType.Polygon][i]] = polygonColors[i];
		}
		
		var /** Array<number> */ lineStringColors = symbolManager.blockColors(OverlayType.LineString, idList[OverlayType.LineString].length);
		for (let i = 0; i < idList[OverlayType.LineString].length; i++){
			indexes[idList[OverlayType.LineString][i]] = lineStringColors[i];
		}
	
		return {indexes: indexes, mainIndex: mainIndex};
	}
	
	/**
	 * @param {string} prefix
	 * 
	 * @return {number}
	 */
	this.getCategoryFromPrefix = function (prefix){
		for (var id in this.categories){
			if(this.categories[id * 1].categoryPrefix == prefix)
				return id * 1;
		}
		return -1;
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
	 * @param {function(new:InfoWindowContent, number, string, OverlayType, Object<string, ?>)} constr Constructor function of the InfoWindowConten class
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
 * @param {string=} nameEmpty This name is used if a data point should have this type, but nothing is assigned, yet, e.g. something like "not typified", "no Concept", etc.
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
 * @param {function(string, function(string):string):string=} costumGetNameFunction Function to overwrite the getName functions provided by the gui elements
 * @param {EditConfiguration=} editConfiguration If this paramter is set, users with the capability "im_edit_map_data" can edit the markers belonging to this category and add new markers to it
 * @param {boolean=} singleSelect If true only one element from this category can be visualized on the map at a time
 * @param {function(string):boolean=} forbidRemovingFunction If this function returns true for an element, it cannot be removed from the legend by the user
 */
function CategoryInformation (categoryID, categoryPrefix, name, nameEmpty, elementID, filterComponents, countNames, textForNewComment, textForListRetrieval, listBuilder, costumGetNameFunction, editConfiguration, singleSelect, forbidRemovingFunction){
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
	else {
		this.listBuilder = null;
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
	 * @type {string} 
	 */
	this.nameEmpty;
	
	if (nameEmpty === undefined){
		 this.nameEmpty = "";
	}
	else{
		 this.nameEmpty = nameEmpty;
	}

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
	 * @type{function(string, function(string):string):string|undefined} 
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
	//TODO enfore (or at least document) that textForListRetrieval and listBuilder have be used together!
	
	/**
	 * @type {EditConfiguration|undefined}
	 */
	this.editConfiguration = editConfiguration;
	
	/**
	 * @type {boolean}
	 */
	this.singleSelect = (singleSelect === true);
	
	/**
	 * @type {function(string):boolean|undefined}
	 */
	this.forbidRemovingFunction = forbidRemovingFunction;
}	

/**
 * Pseudo constructor to build information from paramter array using default values for parameters not given. For documentation look at
 * the real constructor
 * 
 * @param {{
 * 		categoryID : number,
 * 		categoryPrefix: string,
 * 		name: string,
 * 		nameEmpty: (string|undefined),
 * 		elementID: (string|undefined),
 * 		filterComponents : (Array<FilterComponent>|undefined),
 * 		countNames : (Array<string>|undefined),
 * 		textForNewComment: (string|undefined),
 * 		textForListRetrieval: (string|undefined),
 * 		listBuilder: (AbstractListBuilder|undefined),
 * 		costumGetNameFunction : (function(string, function(string):string):string|undefined),
 * 		editConfiguration: (EditConfiguration|undefined),
 * 		singleSelect: (boolean|undefined),
 * 		forbidRemovingFunction: (function(string):boolean|undefined)
 * 		
 * }} data
 * @return {CategoryInformation}
 */
function buildCategoryInformation (data){
	return new CategoryInformation(data["categoryID"], data["categoryPrefix"], data["name"] , data["nameEmpty"], data["elementID"], 
			data["filterComponents"] , data["countNames"], data["textForNewComment"], data["textForListRetrieval"], data["listBuilder"],
			data["costumGetNameFunction"], data["editConfiguration"], data["singleSelect"], data["forbidRemovingFunction"]);
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
 * @return {boolean}
 */
FilterComponent.prototype.storeData = function (data, element, categoryId, elementId){};

/**
*
*
* @param {Object<string, ?>} data
* @param {number} categoryId
* @param {string} elementId
* 
* @return {undefined}
*/
FilterComponent.prototype.storeDefaultData = function (data, categoryId, elementId){};

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
