//TODO change var-private to closure-private to allow inlining of setters etc.

/**
 *
 * @type {google.maps.Map}
 * @const
 */
var map;

/**
 * @type Legend
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
 * @type {number}
 */
var indexInMultiSymbol = -1;

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
 * 
 * @return{undefined}
 */
function initGM (){
	map = new google.maps.Map(document.getElementById("IM_googleMap"), mapData);


	var /** Object */ highlighted = {"highlighted" : false};
	var /** google.maps.Data.Feature */ hi_feature = new google.maps.Data.Feature(highlighted);

	var /** Object */ clicked = {"clicked" : false};
	var /** google.maps.Data.Feature */ cl_feature = new google.maps.Data.Feature(clicked);


	var /** Object */ hovered = {"hovered" : false};
	var /** google.maps.Data.Feature */ ho_feature = new google.maps.Data.Feature(hovered);

	
	map.data.setStyle(function (feature){

	  var /** LegendElement */ owner = feature.getProperty("mapShape").owner;

	  var /** string */ color =  owner.getColorString();
      var /** number */ zindex =  owner.getIndex();
      var /** number */ stroke_w =  1;
      var /** number */ opacity =  0.4;


		if (feature.getProperty('highlighted')) {
     	 stroke_w = 2;
     	 zindex = 10000; 
     	 opacity =  0.6;
    	}

		return /** @type {google.maps.Data.StyleOptions} */({
	      "fillColor" : color,
	      "fillOpacity" : opacity,
	      "strokeColor" : color,
	      "strokeWeight" : stroke_w,
	      "zIndex" : zindex
	    });
		//TODO remove constants
	});

	map.data.addListener ("click", function (event){
		event.feature.getProperty("mapShape").openInfoWindow(event);
        event.feature.setProperty("clicked", true);		
	});
    

	map.data.addListener('mouseover', function(event) {
		event.feature.setProperty('hovered', true);
		event.feature.setProperty('highlighted', true);
		current_polygon = event.feature;
  });

	map.data.addListener('mouseout', function(event) {
		if(event != null){	
			event.feature.setProperty('hovered', false);

			if(!event.feature.getProperty('clicked') && !dragging){
				event.feature.setProperty('highlighted',false);
			}
		}
		else {
			if(current_polygon){
				current_polygon.setProperty('highlighted',false);
			}
		}
	//case for manual trigger of mouseout in symbol_clusterer if closeclick on single symbol richmarker
  });

	map.data.addListener('mousedown', function(event) {
		dragging = true;
	});

	map.data.addListener('mouseup', function(event) {
		dragging = false;	
	});

	jQuery('body').on('mouseup',function(){
		if(dragging)dragging=false;
	})
	
}

/**
 * @return {undefined} 
 */
function init (){
	
	initGM();
	
	legend = new Legend();
	symbolManager = new SymbolManager(colorScheme);
	optionManager = new OptionManager();
	
	//TODO move threshold to settings.js
	/* The threshold used here is a "lat/lng distance" of 0.000898315284119521435127501256466 
 	 * That corresponds to 100m in north/south direction and ca. 70m in east/west direction (at the average latitude of the alpine convention)
 	 */
	symbolClusterer = new SymbolClusterer(43.43132018706552, 4.884734173789496, 4.93608093568811, 11.586466768725804, 16, 16, 0.000898315284119521435127501256466);
	
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
	
	initGuiElements();
	
	//Send url parameters to option manager
	for (var option in PATH["options"]){
		optionManager.setOption(option, PATH["options"][option]);
	}
	
	jQuery(document).trigger("im_map_initialized"); //TODO document this, also stuff like addXY in categoryManager
	
}

jQuery(init);