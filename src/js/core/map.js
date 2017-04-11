//TODO change var-private to closure-private to allow inlining of setters etc.

/**
 * @type {MapInterface}
 * @const
 */
var mapInterface = new GoogleMapsInterface ();

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
 * @type {google.maps.Data.Feature} 
 */
var current_polygon;

/**
 * @type {boolean}
 */
var dragging = false;

/**
 * @type {Object}
 */
var style_for_quantify = {};

/**
 * @return {undefined} 
 */
function init (){
	
	mapInterface.init(initEvents);
	
	legend = new Legend();
	symbolManager = new SymbolManager(colorScheme);
	
	initGuiElements();
	
	//TODO move threshold to settings.js
	/* The threshold used here is a "lat/lng distance" of 0.000898315284119521435127501256466 
 	 * That corresponds to 100m in north/south direction and ca. 70m in east/west direction (at the average latitude of the alpine convention)
 	 */
	symbolClusterer = new SymbolClusterer(43.43132018706552, 4.884734173789496, 4.93608093568811, 11.586466768725804, 16, 16, 0.000898315284119521435127501256466);
	
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
			if(this.owners.length > 1){
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
			this.focusOnEntryTo(iconIndex);
		},
		/**
		 * @this {!MapSymbol}
		 * 
		 */
		function (){ //Mouse out
			this.removeFocus();
		}
	);

	mapInterface.addInfoWindowListeners(
		/**
		 * @param {Element} tabElement
		 * @param {number} tabIndex
		 * @param {InfoWindowContent} infoWindowContent
		 * @param {Object} infoWindow
		 * @param {Object} overlay
		 */
		function (tabElement, tabIndex, infoWindowContent, infoWindow, overlay){
			infoWindowContent.onOpen(tabElement, tabIndex, infoWindow, overlay);
		},
		/**
		 * @param {Element} tabElement
		 * @param {InfoWindowContent} infoWindowContent
		 */
		function (tabElement, infoWindowContent){
			infoWindowContent.onClose(tabElement);
		},
		/**
		 * @param {Element} windowElement
		 * @param {Array<InfoWindowContent>} infoWindowContents
		 */
		function (windowElement, infoWindowContents){
			google.maps.event.trigger(map.data, 'mouseout');
		}
	);
}

jQuery(init);