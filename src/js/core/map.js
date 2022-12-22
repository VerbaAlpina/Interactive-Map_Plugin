//TODO change var-private to closure-private to allow inlining of setters etc.

/**
 * @type{MapInterfaceType}
 */
var mapInterfaceType;

switch (PATH["mapType"]){
	case "gm":
		mapInterfaceType = MapInterfaceType.GoogleMaps;
		break;
		
	case "pixi":
		mapInterfaceType = MapInterfaceType.PixiWebGL;
		break;
		
	default:
		throw "Invalid map type: " + PATH["mapType"];
}

/**
 * type{MapInterface}
 */
var mapInterface;

/**
 * @const
 * @type {Element}
 */
var mapDomElement;

/**
 * @type {!Legend}
 * @const
 */
var legend;

/**
 * @type {SymbolManager}
 * @const
 */
var symbolManager;

/**
 * @type {CommentManager}
 * @const
 */
var commentManager;

/**
 * @type {OptionManager}
 * @const
 */
var optionManager;


/**
 * @type {SymbolClusterer}
 * @const
 * 
 * 
 */
var symbolClusterer;

/**
 * @type {CategoryManager}
 * @const
 */
var categoryManager = new CategoryManager ();

/**
 * @type {GeoManager}
 * @const
 */
var geoManager;

/**
 * @type {MapState}
 * @const
 */
var mapState;

/**
 * @type {Object}
 */
var style_for_hex_quantify = {};

/**
 * @param {MapPosition} mapPosition
 * @param {ClustererOptions=} clustererOptions
 * @param {Object<string, ?>=} constructorOptions Additional map type specific options
 * 
 * @return {undefined} 
 */
function initMap (mapPosition, clustererOptions, constructorOptions){
	
	if (!clustererOptions){
		clustererOptions = {
			"viewportLat" :	mapPosition.lat + 4, 
			"viewportLng" : mapPosition.lng - 8, 
			"viewportHeight" : 8, 
			"viewportWidth" : 16, 
			"gridsizeLng" : 16, 
			"gridsizeLat" : 16, 
			"threshold" : 0.001
		};
	}
	
	if (!constructorOptions){
		constructorOptions = {};
	}
	
	switch (mapInterfaceType){
		case MapInterfaceType.GoogleMaps:
			mapInterface = new GoogleMapsInterface(mapPosition, constructorOptions);
			break;
			
		case MapInterfaceType.PixiWebGL:
			mapInterface = new PixiWebGLInterface(mapPosition, constructorOptions);
			break;
	}
	
	
	commentManager = new CommentManager();
	mapState = new MapState();	
	geoManager = new GeoManager();
	
	mapDomElement = document.getElementById("IM_map_div");
	
	if (PATH["layer"]){
		mapState.currentMapLayer = PATH["layer"] * 1;
	}
	
	mapInterface.init(mapDomElement, initCallback.bind(this, clustererOptions), polygonSettings, mapState.currentMapLayer);
}


function initCallback (clustererOptions){
	mapInterface.addMarkerListeners(
		/**
		 * @this {!MapSymbol}
		 * 
		 * @param {number} iconIndex
		 */
		function (iconIndex){ //Click
			this.openInfoWindow(iconIndex);
		},
		/**
		 * @this {!MapSymbol}
		 */
		function (){ //Right click
			if(this.getNumParts() > 1){
				this.openSplitMultiSymbol();
			}
		},
		/**
		 * @this {!MapSymbol|undefined}
		 * 
		 * @param {number} oldLat
		 * @param {number} oldLng
		 */
		function (oldLat, oldLng){ //Drag
			optionManager.addChange(new MarkerDragOperation(this, oldLat, oldLng));
		},
		/**
		 * @this {!MapSymbol}
		 * 
		 * @param {number} iconIndex
		 */
		function (iconIndex){ //Mouse over
			
		},
		/**
		 * @this {!MapSymbol}
		 * 
		 */
		function (){ //Mouse out
		
		}
	);
		
	mapInterface.addShapeListeners(
		/**
		 * @this {!MapShape}
		 * 
		 * @param {number} lat
		 * @param {number} lng
		 * 
		 * @return {undefined}
		 */
		function (lat, lng){ //Click
			this.openInfoWindow(lat, lng);
		}	
	);

	mapInterface.addInfoWindowListeners(
		/**
		 * @param {Element} tabElement
		 * @param {number} tabIndex
		 * @param {MapSymbol|MapShape} mapElement
		 * @param {Object} infoWindow
		 * @param {Object} overlay
		 */
		function (tabElement, tabIndex, mapElement, infoWindow, overlay){ //Tab opened
			//console.log("tab opened: " + tabIndex);
			if (mapElement instanceof MapSymbol){
				mapElement.currentTabIndex = tabIndex;
	
				var /** Array<InfoWindowContent> */ infoWindowContents = mapElement.parts[tabIndex].infoWindows;
				for (let i = 0; i < infoWindowContents.length; i++){
					infoWindowContents[i].onOpen(tabElement, tabIndex, infoWindow, overlay);
				}
				mapElement.parts[tabIndex].owner.highlight();
			}
			else { //MapShape
				mapElement.infoWindowContent.onOpen(tabElement, tabIndex, infoWindow, overlay);
			}
		},
		/**
		 * @param {Element} tabElement
		 * @param {number|undefined} tabIndex
		 * @param {MapSymbol|MapShape} mapElement
		 */
		function (tabElement, tabIndex, mapElement){ //Tab closed
			//console.log("tab closed: " + tabIndex);
			if (tabIndex !== undefined){
				if (mapElement instanceof MapSymbol){
					var /** Array<InfoWindowContent> */ infoWindowContents = mapElement.parts[tabIndex].infoWindows;
					for (let i = 0; i < infoWindowContents.length; i++){
						infoWindowContents[i].onClose(tabElement);
					}
					mapElement.parts[tabIndex].owner.unhighlight();
				}
			}
		},
		/**
		 * @param {Element} windowElement
		 * @param {MapSymbol|MapShape} mapElement
		 */
		function (windowElement, mapElement){ //Window closed
			mapState.removeInfoWindowOwnerFromList(mapElement);
		},
		function (id, content){ //Location info window opened
			jQuery(document).trigger("im_location_window_opened", [id, content]); //TODO document
		},
		function (id, content){ //Location info window closed
			mapState.removeLocationMarker(id);
			jQuery(document).trigger("im_location_window_closed", [id, content]); //TODO document
		}
	);
	
	mapInterface.addMapListeners (
		/**
		 * @param {number} newLayerIndex
		 */
		function (newLayerIndex){ // Map base layer changed
			mapState.currentMapLayer = newLayerIndex;
			
			if (!mapState.inPopState){
				var /** {layer: number}*/ state = {"layer" : newLayerIndex};
				history.pushState(state, "", addParamToUrl(window.location.href, "layer", newLayerIndex + ""));
				jQuery(document).trigger("im_url_changed", state);
			}
		}
	);
	
	legend = new Legend();
	symbolManager = new SymbolManager(colorScheme);

	symbolClusterer = new SymbolClusterer(clustererOptions);
	
	optionManager = new OptionManager();
	
	//Send url parameters to option manager
	for (var option in PATH["options"]){
		optionManager.setOption(option, PATH["options"][option]);
	}
	
	optionManager.createOptionsDiv();
	
	initGuiElements();
	
	 jQuery.contextMenu({
	 	"selector" : '.addComment',
	 	"build" : function(trigger, e) {
	 		var itemList = legend.getMenuItems(trigger.attr("data-index") * 1, trigger.attr("data-main-index") * 1);
	 		if (jQuery.isEmptyObject(itemList))
	 			return false;
	 		return {
	 			"items" : itemList,
	 			"callback" : legend.menuCallback
	 		};
	 	}
	 });
	
	jQuery("#commentTabs").tabs({
		"beforeActivate" : commentManager.beforeTabChange.bind(commentManager)
	});
	
	jQuery(document).trigger("im_map_initialized"); //TODO document this, also stuff like addXY in categoryManager

	if(PATH["tk"] != undefined){
		categoryManager.loadSynopticMap(PATH["tk"] * 1, "URL");
	}
	else if (PATH["single"] != undefined){
		var /** number */ catNum = categoryManager.getCategoryFromPrefix(PATH["single"][0]);
		if(catNum != -1){
			let prefix = PATH["single"][0];
			let ids = PATH["single"].substring(1).split(" ");
			for (let i = 0; i < ids.length; i++){
				categoryManager.loadData(catNum, prefix + ids[i], "custom");
			}
		}
	}
}