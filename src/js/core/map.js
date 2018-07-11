//TODO change var-private to closure-private to allow inlining of setters etc.

/**
 * @type {MapInterface}
 * @const
 */
var mapInterface = new GoogleMapsInterface();

/**
 * @const
 * @type {Element}
 */
var mapDomElement;

/**
 * @type {Legend}
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
var commentManager = new CommentManager();

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
 * @type {MapState}
 * @const
 */
var mapState = new MapState();

/**
 * @type {Object}
 */
var style_for_quantify = {};

/**
 * @type {Object}
 */
var style_for_hex_quantify = {};

/**
 * @return {undefined} 
 */
function init (){
	mapDomElement = document.getElementById("IM_map_div");
	
	mapInterface.init(mapDomElement, initEvents, polygonSettings);
	
	legend = new Legend();
	symbolManager = new SymbolManager(colorScheme);

	initGuiElements();
	
	//TODO move threshold to settings.js
	/* The threshold used here is a "lat/lng distance" of 0.000898315284119521435127501256466 
 	 * That corresponds to 100m in north/south direction and ca. 70m in east/west direction (at the average latitude of the alpine convention)
 	 */
	symbolClusterer = new SymbolClusterer(43.43132018706552, 4.884734173789496, 4.93608093568811, 11.586466768725804, 16, 16, 0.000898315284119521435127501256466);
	//symbolClusterer.visualize();
	
	optionManager = new OptionManager();
	
	//Send url parameters to option manager
	for (var option in PATH["options"]){
		optionManager.setOption(option, PATH["options"][option]);
	}
	
	optionManager.createOptionsDiv();
	
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
		if(catNum != -1)
			categoryManager.loadData(catNum, PATH["single"], "custom");
	}
}


function initEvents (){
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

	mapInterface.addInfoWindowListeners(
		/**
		 * @param {Element} tabElement
		 * @param {number} tabIndex
		 * @param {MapSymbol} mapSymbol
		 * @param {Object} infoWindow
		 * @param {Object} overlay
		 */
		function (tabElement, tabIndex, mapSymbol, infoWindow, overlay){ //Tab opened
			mapSymbol.currentTabIndex = tabIndex;

			var /** Array<InfoWindowContent> */ infoWindowContents = mapSymbol.parts[tabIndex].infoWindows;
			for (let i = 0; i < infoWindowContents.length; i++){
				infoWindowContents[i].onOpen(tabElement, tabIndex, infoWindow, overlay);
			}
			mapSymbol.parts[tabIndex].owner.highlight();
		},
		/**
		 * @param {Element} tabElement
		 * @param {number} tabIndex
		 * @param {MapSymbol} mapSymbol
		 */
		function (tabElement, tabIndex, mapSymbol){ //Tab closed
			var /** Array<InfoWindowContent> */ infoWindowContents = mapSymbol.parts[tabIndex].infoWindows;
			for (let i = 0; i < infoWindowContents.length; i++){
				infoWindowContents[i].onClose(tabElement);
			}
			mapSymbol.parts[tabIndex].owner.unhighlight();
		},
		/**
		 * @param {Element} windowElement
		 * @param {MapSymbol} mapSymbol
		 */
		function (windowElement, mapSymbol){ //Window closed
			google.maps.event.trigger(map.data, 'mouseout');
			mapState.removeInfoWindowOwnerFromList(mapSymbol);
		},
		function (id){ //Location info window closed
			mapState.removeLocationMarker(id);
		}
	);
}

jQuery(init);