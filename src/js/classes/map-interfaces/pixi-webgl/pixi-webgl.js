/**
 * @fileoverview
 * @suppress{checkTypes|uselessCode}
 */

/**
 * @struct
 * @constructor
 * 
 * @param {MapPosition} position
 * @param {Object<string,?>} options
 * 
 * @implements{MapInterface<Object, Object,Object, L.Popup>}
 * 
 */
function PixiWebGLInterface (position, options){

	/** 
	 * @type{L.Map} 
	 */
	this.map;
	
	/**
	 * @type{LeafletPixiOverlay}
	 */
	this.pixioverlay;

	/**
	 * @type {function (this:MapSymbol, number)}
	 */
	this.markerClickFunction;
	
	/**
	 * @type {function(this:MapShape, number, number)}
	 */
	this.shapeClickFunction;

	/** 
	 * @type{function(Element, number, (MapSymbol|MapShape), Object, Object)}
	 */
	this.ifwTabOpened;
	
	 /**
	  * @type{function(string, Element)}
	  */
	this.locIfwClosed;
	
	/**
	 * @type{function(string, Element)}
	 */
	this.LocIfwOpenend;
	/**
	 * @type{function(Element, number, (MapSymbol|MapShape))} 
	 */
	this.ifwTabClosed;
	
	/**
	 * @type{function(Element, (MapSymbol|MapShape))} 
	 */
	this.ifwClosed;
	
	this.currentbasemap;
	this.savedmapstyle;
	this.base_map_1;
	this.base_map_2;
	this.base_map_3;
	this.base_map_4;
	this.base_map_5;
	this.base_map_6;

	this.ignoreCloseEvent = false;
	
	var that  = this;

	/**
	 * @override
	 * 
	 * 
	 * @param {function ()} callback
	 * @param {Element} mapDiv
	 * @param {{strokeWeight: number, strokeColor: string, fillOpacity: number}|function(string, boolean):{strokeWeight: number, strokeColor: string, fillOpacity: number}} polygonOptions
	 * 
	 * @return {undefined}
	 */
	this.init = function (mapDiv, callback, polygonOptions){


     var options = {
		doubleClickZoom : false,
		// minZoom : position.minZoom
		}

    this.map = L.map('IM_map_div', options).setView([position.lat, position.lng], position.zoom);


	this.base_map_1  = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
	});

	this.base_map_2 = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
	})

	this.base_map_3 = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
	})

	this.base_map_4 = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
	});

	this.base_map_5 = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
	}).addTo(this.map);

	this.currentbasemap = ("Stamen : Terrain");

	this.base_map_6 = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
		attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		subdomains: 'abcd',
		minZoom: 0,
		maxZoom: 20,
		ext: 'png'
	});


var Stamen_Labels = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-labels/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png',
	opacity: 0.9
});

	var overlays = {
	  "Stamen Labels" : Stamen_Labels
	};

	this.base_maps = {
	"Stamen : Terrain" :  			  this.base_map_5,
	"OSM    : Open Street Map":       this.base_map_1,
	"OpenTopo : OpenTopoMap":         this.base_map_4,
    "Stamen  : Toner Light":    	  this.base_map_6,
	"CartoDB  : Carto Light":         this.base_map_2,
	"CartoDB  : Carto Dark":          this.base_map_3,


	};



L.control.layers(that.base_maps,overlays,{position: 'topright'}).addTo(this.map);


this.map.attributionControl.setPosition('bottomleft');
this.map.zoomControl.setPosition('bottomright');

this.pixioverlay =  new LeafletPixiOverlay(this.map,true,true);//, function (){
	
	that.pixioverlay.LpixiOverlay.addTo(that.map);

	that.map.on('popupopen',function(e){
		var popup = e.popup;
		var content = popup._contentNode;
	
		if(popup.owner.type=="gl_Polygon"){
			that.ifwTabOpened(content,-1,popup.map_element, popup, popup.owner);
		}
		//else{
		//
		//	 that.ifwTabOpened(content,popup.tab_index,popup.map_element, popup, popup.owner);
		//
		//}

	});

	that.map.on('popupclose',function(e){
	
		var popup = e.popup;
		var content = popup._contentNode;
		that.ifwTabClosed(jQuery(content).find("div#tab_" + popup.tab_index)[0], popup.tab_index, popup.map_element);
		that.ifwClosed(content,popup.map_element);
	
	});


	var tiles_loaded = false;

	that.base_map_5.on("load",function() { if(!tiles_loaded){ callback(); tiles_loaded = true; } });


	setTimeout(function() {
	 if(!tiles_loaded){
	 	callback();
	 }	
	}, 5000);

		
	
	that.map.on('baselayerchange',function(e){
		that.currentbasemap = e.name;
	});
	
	//});
};




	/**
	 * @override
	 * 
	 * @param {boolean} quantifyMode
	 * 
	 * @return {undefined}
	 */
	this.updateMapStyle = function (quantifyMode){
		
		if(quantifyMode)that.savedmapstyle = that.base_maps[that.currentbasemap];

		if(quantifyMode && that.currentbasemap != "CartoDB  : Carto Dark"){
			that.map.removeLayer(that.savedmapstyle);
			that.map.addLayer(that.base_map_3);
			that.currentbasemap = "CartoDB  : Carto Dark";
		}

		else if(!quantifyMode && getKeyByValue(that.base_maps, that.savedmapstyle) != "CartoDB  : Carto Dark"){
			that.map.removeLayer(that.base_map_3);
			that.map.addLayer(that.savedmapstyle);
			
		}

	};
	
	/**
	 * @override
	 * 
	 * @param {{lat: number, lng: number}} latlng
	 * @param {HTMLCanvasElement} icon
	 * @param {number} size
	 * @param {boolean} movable
	 * @param {!MapSymbol} mapSymbol Reference to the symbol representation in the IM logic. Needed for event listener.
	 * @param {number} zIndex
	 * 
	 * @return {Object}
	 */
	this.createMarker = function (latlng, icon, size, movable, mapSymbol, zIndex){

		var texture =  PIXI.Texture.from(icon,{width:size,height:size});
		
	    var marker = new this.pixioverlay.pixiMarker(
			    {
			    latlng: [latlng['lat'],latlng['lng']],
			    texture: texture,
			    interactive: true,
			    alpha: 1.0,
			    zIndex: zIndex,
			    clickListener: function (){
			    	that.markerClickFunction.call(mapSymbol);
			    }
			}
    	 );	

	    return marker;

	};
	
	/**
	 * @override
	 * 
	 * @param {MarkerType} marker
	 * @param {Array<{canvas: HTMLCanvasElement, size: number}>} icons
	 * @param {!MapSymbol} mapSymbol
	 * @param {number} zIndex
	 * 
	 * @return {MarkerType}
	 */

	this.updateMarker = function (marker, icons, mapSymbol, zIndex){


		var latlng = marker.latlng;

		this.pixioverlay.removeMarker(marker);

		var layout = new MultiSymbolLayout(icons);
		var {canvas, width, height} = layout.createMultiSymbol();

		var texture = PIXI.Texture.from(canvas, {width: width ,height: height});


	    marker = new this.pixioverlay.pixiMarker(
		    {
		    latlng: latlng,
		    texture: texture,
		    interactive: true,
		    alpha: 1.0,
		    zIndex: zIndex,
		    clickListener: function (){
		    	that.markerClickFunction.call(mapSymbol, that.pixioverlay.current_symbol_index);
		    }
		    }
    	 );	


	    if(icons.length > 1)
	    	marker['multi_symbol_layout'] = layout;

		return marker;
	};
	
	/**
	 * @override
	 * 
	 * @param {MarkerType} marker
	 * @param {boolean} show
	 * 
	 * @return {undefined}
	 */
	this.setMarkerVisible = function (marker, show){
		marker.visible = show;
	};
	
	/**
	 * @override
	 * 
	 * @param {MarkerType} marker
	 * 
	 * @return {{lat: number, lng: number}}
	 */
	this.getMarkerPosition = function (marker){
		return {lat: marker.latlng[0], lng: marker.latlng[1]};
	};
	
	/**
	 * @override
	 * 
	 * @param {L.Popup} infoWindow
	 * 
	 * @return {{lat: number, lng: number}}
	 */
	this.getInfoWindowPosition = function (infoWindow){
			return infoWindow.getLatLng();
	};
	
	/**
	 * @override
	 * 
	 * @param {MarkerType|LinestringType|PolygonType} overlay
	 * 
	 * @return {undefined}
	 */
	this.destroyOverlay = function (overlay){


		if(overlay['type'] =="gl_Marker"){
			this.pixioverlay.removeMarker(overlay);
		}

		if(overlay['type']=="gl_Polygon"){
			this.pixioverlay.removePolygonOrLine(overlay);
		}

		if(overlay['type']=="gl_Line"){
			this.pixioverlay.removePolygonOrLine(overlay);
		}

	};
	
	/**
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {MarkerType} marker
	 * @param {number} newLat
	 * @param {number} newLng
	 * 
	 * @return {undefined}
	 */
	this.moveMarker = function (marker, newLat, newLng){
			console.log("MOVE MARKER");
	};
	
	/**
	 * @override
	 * 
	 * @param {function(this:MapSymbol, number)} clickFun
	 * @param {function(this:MapSymbol)} rightClickFun
	 * @param {function(this:MapSymbol, number, number)} dragFun
	 * @param {function(this:MapSymbol, number)} mouseOverFun
	 * @param {function(this:MapSymbol)} mouseOutFun
	 * 
	 * This function has to assure that the different event listener functions are triggered. It is only called once
	 * before any marker is created, so if the listeners have to be added to every single marker, the interface implementation
	 * must take care of it, itself. This is true for markers created by calling createMarker as well as for markers created by
	 * the user in edit mode.
	 * 
	 * Notice that these functions need the context (this) to be the representation of the marker in the IM logic the
	 * so-called map symbol, so some kind of connection between the marker and the map object has to be established.
	 * The map symbol is given to the marker constructing function (and also the updating function if this is needed). 
	 * 
	 * The click, mouseout und mouseover functions have also to be called with the index of the icon which was selected
	 * The drag function has also to be called with the old latitude and longitude of the marker.
	 * 
	 * The right click and drag listeners are only allowed to be added if the marker is movable!
	 * 
	 */
	this.addMarkerListeners = function (clickFun, rightClickFun, dragFun, mouseOverFun, mouseOutFun){
		that.markerClickFunction = clickFun;
	};
	
	/**
	 * @override
	 * 
	 * Has to return (not show) a internal representation of the polygon or line string
	 * 
	 * @param {IMGeometry} geoData
	 * @param {MapShape} mapShape
	 * @param {string} id
	 * @param {string} color
	 * @param {number} lineWidth
	 * 
	 * @return {LinestringType|PolygonType}
	 */
	this.createShape = function (geoData, mapShape, id, color, lineWidth){

		var geo = {};
		var type = getKeyByValue(IMGeoType,geoData.getType());
		geo['type'] = type;
		var coordinates = geoData['geoData'];
		geo['coordinates'] = coordinates;
		geo['idx'] = id;


	    var polygon_settings = polygonSettingsBoth(color);

	    var shape;
	 
	    	if(type == "MultiPolygon" || type == "Polygon"){

			geo['boundingBox'] = geoData.getBoundingBox();

			 shape = new this.pixioverlay.gLPolygon({
					geo:geo,
					center:[42,20],
					line_width: lineWidth,
					fill_color:color,
					fill_alpha:polygon_settings.fill_alpha,
					stroke_color:polygon_settings.stroke_color,
					stroke_alpha:1.0,
					interactive:true,
					hover_line_width: lineWidth * 2,
					hover_fill_color:color,
					hover_fill_alpha:polygon_settings.hover_fill_alpha,
					hover_stroke_color:color,
					hover_stroke_alpha: 1.0,
					clickListener: that.shapeClickFunction.bind(mapShape),
					map_shape: mapShape	
				});

			}

			if(type =="MultiLineString"){

				shape = new this.pixioverlay.pixiLine({
					geo:geo,
					line_width: lineWidth,
					stroke_color:polygon_settings.stroke_color,
					stroke_alpha:1.0,
					interactive:true,
					hover_line_width: lineWidth * 2,
					hover_fill_color:color,
					hover_fill_alpha:polygon_settings.hover_fill_alpha,
					hover_stroke_color:color,
					hover_stroke_alpha: 1.0,
					clickListener: that.shapeClickFunction.bind(mapShape),
					map_shape: mapShape	
				});


			}

		return shape;	

	};
	
	/**
	 * @override
	 * 
	 * Adds the polygon or line string to the map
	 * 
	 * @param {LinestringType|PolygonType} shapeObject
	 */
	this.addShape = function (shapeObject){};
	
	/**
	 * @override
	 * 
	 * Removes the polygon or line string to the map
	 * 
	 * @param {LinestringType|PolygonType} shapeObject
	 */
	this.removeShape = function (shapeObject){};
	
	/**
	 * @override
	 * 
	 * For polygons and line strings
	 * 
	 * Notice that the functions need the context (this) to be the representation of the marker in the IM logic the
	 * so-called map shape, so some kind of connection between the shape and the map object has to be established.
	 * The map symbol is given to the shape constructing function (and also the updating function if this is needed). 
	 * 
	 * @param {function(this:MapShape, number, number)} clickFun
	 * 
	 * @return {undefined}
	 * 
	 */
	this.addShapeListeners = function (clickFun){
		that.shapeClickFunction = clickFun;
	};
	
	/**
	 * @override
	 * 
	 * Has to create (but no show) an info window instance and return it.
	 * 
	 * For multi-tab info windows a list of symbols and respective html content is given
	 * For single content info windows both arrays have length 1 and the url is undefined
	 * 
	 * 
	 * @param {MarkerType|LinestringType|PolygonType} anchorElement
	 * @param {Array<{canvas: HTMLCanvasElement, size: number}>} symbols
	 * @param {Array<Element|string>} elements
	 * @param {MapSymbol|MapShape} mapElement
	 * 
	 * @return {L.Popup}
	 */
	this.createInfoWindow = function (anchorElement, symbols, elements, mapElement){


		if(anchorElement['type'] == "gl_Polygon"){


			var content = getPopupContentWithTabs(elements,symbols); 
					
			anchorElement.popup = L.popup({className: 'pixi-popup',autoClose:false,closeOnClick:false})
			.setContent(content[0]);

			anchorElement.popup.map_element = mapElement;

		
		}

		else{

		var _in = anchorElement['orig_options']
		var tex_height = _in.texture.orig.height*that.pixioverlay.external_scale;
		var popup  = new  L.popup({className: 'pixi-popup',autoClose:false,closeOnClick:false,offset:L.point(0, -Math.ceil(tex_height/4))});	

		var content = getPopupContentWithTabs(elements,symbols); 

		popup
		.setLatLng(_in.latlng)
		.setContent(content[0]);

	
		anchorElement.popup = popup;

	
		anchorElement.popup.map_element = mapElement;

		content.find('.ifw_nav_tabs a[data-toggle="tab"]').on('shown.bs.tab', function (e) {

				//for individual ifw tab ids, add the leaflet popup id, to the id from if content since if id is first available here

				var ifid = popup['_leaflet_id'];

					if(!content.hasClass('ids_set')){

						content.find('.nav-link').each(function(){
							jQuery(this).attr('href',jQuery(this).attr('href')+"_"+ifid) 
						})

						content.find('.tab-pane').each(function(){
							jQuery(this).attr('id',jQuery(this).attr('id')+"_"+ifid) 
						})


					}
					content.addClass('ids_set');

					

				var tabid = jQuery(this).data().id;
				that.ifwTabOpened(content.find("div#tab_" + tabid +"_"+ifid)[0],tabid,mapElement,anchorElement.popup,anchorElement.popup.owner);
				anchorElement.popup.tab_index = tabid;
				anchorElement.popup.update(); //adjust ifw to new content size
				
			});

			content.find('.ifw_nav_tabs a[data-toggle="tab"]').on('hidden.bs.tab', function (e) {
				var tabid = jQuery(this).data().id;
			    var ifid = popup['_leaflet_id'];
				if (that.ignoreCloseEvent){
					that.ignoreCloseEvent = false;
				}
				else {
					that.ifwTabClosed(jQuery(content).find("div#tab_" + tabid +"_"+ifid)[0],tabid,mapElement);
				}
			});


		}
		
		anchorElement.popup.owner = anchorElement;

		return anchorElement.popup;

	};


	function getPopupContentWithTabs(elements,symbols){

	

			if(symbols.length==1 && !symbols[0]['canvas']) return jQuery(elements[0]);

			else{

				var totalcontent = '<div class="ifw_total_content">';
				var header = '<ul class="nav nav-pills ifw_nav_tabs">';
				var content = '<div class="tab-content">';
				for(var i=0;i<elements.length;i++){

					var img = '<img class="ifw_tab_img" src="'+symbols[i].canvas.toDataURL()+'">';


					var linkclass = 'nav-link';
					//if(i==0)linkclass = 'nav-link active';

					header += '<li class="nav-item">';
					header += '<a class="'+linkclass+'" data-toggle="tab" data-id="'+i+'" href="#tab_'+i+'" role="tab" aria-expanded="true">'+img+'</a>';
					header += '</li>';

					var tabclass = 'tab-pane';
					if(i==0)tabclass = 'tab-pane active';

					content += '<div class="'+tabclass+'" id="tab_'+i+'" role="tabpanel" aria-expanded="true">'
					//content += elements[i];
					content += '</div>';

				}

			    header +="</ul>";
			    content += '</div>';
				
				totalcontent += header;
				totalcontent += content;
				totalcontent += "</div>";

				var res = jQuery(totalcontent);
				for(var i=0;i<elements.length;i++){
					res.find("#tab_" + i).append(elements[i]);
				}

				return res;

			}

	}
	
	/**
	 * @override
	 * 
	 * @param {MarkerType|LinestringType|PolygonType} anchorElement
	 * @param {L.Popup} infoWindow
	 * @param {number|undefined} tabIndex
	 * @param {number|undefined} lat
	 * @param {number|undefined} lng
 	 * @param {MapSymbol|MapShape} mapElement
	 * 
	 * @return {undefined}
	 */
	this.openInfoWindow = function (anchorElement, infoWindow, tabIndex, lat, lng, mapElement){

		var latlng;

		if(lat && lng){
			infoWindow.setLatLng(L.latLng(lat,lng));
			latlng = L.latLng(lat,lng);
		}

		else{
			latlng = anchorElement.latlng;
		}
		
		if (!tabIndex)
			tabIndex = 0;

		this.ignoreCloseEvent = infoWindow["_contentNode"] != undefined;
			

		infoWindow.openOn(that.map);
		if (infoWindow.tab_index == tabIndex){
			that.ifwTabOpened(jQuery(infoWindow["_contentNode"]).find("div#tab_" + tabIndex)[0], tabIndex, infoWindow.map_element, infoWindow, infoWindow.owner);
		}
		else {
			jQuery(infoWindow["_contentNode"]).find("a.nav-link[data-id=" + tabIndex + "]").tab("show");
		}
		
		infoWindow.tab_index = tabIndex;
		
		that.pixioverlay.resetHover();
		jQuery('.pixi-popup').on('mouseover',function(){
			that.pixioverlay.resetHover();
		});

		
	};
	
	/**
	 * @override
	 * 
	 * @param {L.Popup} infoWindow
	 * @param {number|undefined} tabIndex
	 * @param {string|Element} newContent
	 * 
	 * @return {Element}
	 */
	this.updateInfoWindowContent = function (infoWindow, tabIndex, newContent){
		if (tabIndex == -1){
			infoWindow.setContent(newContent);
			return infoWindow["_contentNode"];
		}
		else {
			var tabContent = jQuery(infoWindow["_contentNode"]);
			let lid = infoWindow['_leaflet_id']
			jQuery(tabContent).find("div#tab_" + tabIndex + "_" + lid).html(newContent);
			infoWindow.update();
			return infoWindow["_contentNode"];
		}

	};
	
	
	/**
	 * @override
	 * 
	 * Has to trigger the listeners for tab closed and window closed
	 * 
	 * @param {L.Popup} infoWindow
	 * 
	 * @return {undefined}
	 */
	this.destroyInfoWindow = function (infoWindow){};
	
	/**
	 * @override
	 * 
	 * @param{function(Element, number, (MapSymbol|MapShape), L.Popup, (MarkerType|LinestringType|PolygonType))} tabOpenedFun
	 * @param{function(Element, number, (MapSymbol|MapShape))} tabClosedFun
	 * @param{function(Element, (MapSymbol|MapShape))} windowClosedFun
	 * @param{function(string, Element)} locationWindowOpenedFun
	 * @param{function(string, Element)} locationWindowClosedFun
	 * 
	 * tabOpenedFun: Has to be called if a new tab is opened (Also when the info window is opened regardless if there are tabs or)
	 * tabClosedFun: Has to be called if a tab is closed (Also when the info window is closed regardless if there are tabs or)
	 * windowClosedFun: Has to be called when the info window is closed
	 * 
	 * The order of the calls has to be:
	 * Tab Change: tabClosedFun for old tab -> tabOpenedFun for new tab
	 * Window Closed: tabClosedFun -> windowClosedFun
	 * 
	 * locationWindowOpenedFun/locationWindowClosedFun: Have to be called if a location marker info window (created by the location search) is opened/closed
	 * 
	 * @return {undefined}
	 */
	this.addInfoWindowListeners = function (tabOpenedFun, tabClosedFun, windowClosedFun, locationWindowOpenedFun, locationWindowClosedFun){

		that.ifwTabOpened = tabOpenedFun;
		that.ifwTabClosed = tabClosedFun;
		that.ifwClosed = windowClosedFun;
		that.locIfwClosed= locationWindowClosedFun;
		that.LocIfwOpenend = locationWindowOpenedFun;

	};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * Menu to chose a category to add new overlays
	 * 
	 * @param {Array<{id: number, name: string, allowedOverlays: Array<boolean>}>} list 
	 * @param {function (number, OverlayType, (MarkerType|LinestringType|PolygonType)):(MapSymbol|MapShape)} overlayAddedCallback
	 * 
	 * @return {undefined}
	 */
	this.addNewOverlaysComponent = function (list, overlayAddedCallback){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeNewOverlaysComponent = function (){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {{name : string, img : string, callback: function(), show : boolean}} revertInfo
	 * @param {{name : string, img : string, callback: function(), show : boolean}} undoInfo
	 * @param {{name : string, img : string, callback: function(), show : boolean}} commitInfo
	 * 
	 * @return {undefined}
	 */
	this.addUndoComponent = function (revertInfo, undoInfo, commitInfo){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {boolean|string} showRevert
	 * @param {boolean|string} showUndo
	 * @param {boolean|string} showCommit
	 * 
	 * @return {undefined}
	 */
	this.updateUndoComponent = function (showRevert, showUndo, showCommit){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeUndoComponent = function (){};
	
	/**
	 * @override
	 * 
	 * @return {Element}
	 */
	this.createOptionElement = function (){
		var /** Element */ result = document.createElement('div');

		result.style.textAlign = 'center';
		result.className +=  'custom_control_base custom_control_shadow';
		
		var /** Element */ controlText = document.createElement('div');
		controlText.innerHTML = '<i class="fa fa-cog" aria-hidden="true"></i>';
		result.appendChild(controlText);
		
		return result;
	};
	
	/**
	 * 
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeOptionElement = function (){};
	
	/**
	 * 
	 * @override
	 * 
	 * @param {Element} element
	 * 
	 * @return {undefined}
	 */
	this.addOptionElement = function (element){
		jQuery(element).addClass('leafletcustom leaflet-control leaflet-bar')
		jQuery('.leaflet-bottom.leaflet-right').prepend(element);
	};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {(MarkerType|LinestringType|PolygonType)} overlay
	 * 
	 * @return {undefined}
	 */
	this.centerOnOverlay = function (overlay){};
	
	/**
	 * @override
	 * 
	 * @param {number} lat
	 * @param {number} lng
	 * 
	 * @return {undefined}
	 */
	this.setCenter = function (lat, lng){

		that.map.panTo(new L.latLng(lat,lng));

	};
	
	/**
	 * @override
	 * 
	 * @param {number} zoom Zoom level in GM units
	 * 
	 * @return {undefined}
	 */
	this.setZoom = function (zoom){
			that.map.setZoom(zoom);
		
	};



	/**
	 * @override
	 * 
	 * @param {number} lat
	 * @param {number} lng
 	 * @param {number} zoom Zoom level in GM units
	 * 
	 * @return {undefined}
	 */
	this.setCenterAndZoom = function (lat, lng, zoom){
		that.map.flyTo([lat,lng],zoom);
	};
	
	
	/**
	 * Has to return the current zoom level in GM units
	 * 
	 * @override
	 *
	 * @return {number}
	 */
	this.getZoom = function (){
		 return that.map.getZoom();
	};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {(MarkerType|LinestringType|PolygonType)} overlay
	 * 
	 * @return {string}
	*/
	this.getWKTStringForOverlay = function (overlay){};
	
	/**
	 * 
	 * ignore
	 * 
	 * @override
	 * 
	 * @param {number} lat1
	 * @param {number} lng1
	 * @param {number} lat2
	 * @param {number} lng2
	 * 
	 * @return {undefined}
	*/
	
	this.zoomToBounds = function (lat1, lng1, lat2, lng2){};
	
	/**
	 * @override
	 * 
	 * @param {number} lat
	 * @param {number} lng
	 * @param {string} text
	 * @param {string} id
	 * @param {boolean} zoom
	 * 
	 * @return {LocationMarkerType}
	 */
	this.addLocationMarker = function (lat, lng, text, id, zoom){

		var /** Element */ content = document.createElement("div");
		content.innerHTML = text;
		var infowindow = L.popup({className: 'pixi-popup',autoClose:false,closeOnClick:false}).setContent(content);

        var marker = L.marker(L.latLng(lat,lng));
        marker.bindPopup(infowindow);
        marker.addTo(that.map);

        infowindow.on('remove',function(){
        	marker.remove();
        	that.locIfwClosed(id, content);
        })


        //catch leaflet exception

		setTimeout(function() {
			try{marker.openPopup();}
			 catch (e){
			 }
		 	that.LocIfwOpenend(id, content);
		}, 750);


		if(zoom){
			that.map.setView(L.latLng(lat,lng),10,{animate:true});
		}
		
		return marker;
	};
	
	/**
	 * @override
	 * 
	 * @param {Object} polygon
	 * @param {string} fillColor CSS color string
	 * @param {string} strokeColor CSS color string
	 * @param {number} fillOpacity
	 * @param {number} strokeOpacity
	 * @param {number} zIndex
	 * 
	 * @return {undefined}
	 */
	this.changePolygonAppearance = function (polygon, fillColor, strokeColor, fillOpacity, strokeOpacity, zIndex){

	
			for(var i=0; i<polygon.length;i++){
				var cur_poly = polygon[i];

				cur_poly.fill_color = rgb2hex(fillColor);
				cur_poly.stroke_color = rgb2hex(strokeColor);
				cur_poly.fill_alpha = fillOpacity;
				cur_poly.stroke_alpha = strokeOpacity;

			}

	};


function rgb2hex(rgb){
 rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 var string = (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';

  return string.replace('#','0x');

}


	
	/**
	 * @override
	 * 
	 * Currently only needed to revert polygon colors changed for quantification
	 * 
	 * @return {undefined}
	 */
	this.revertChangedOverlays = function (){

			 var allpolygons = that.pixioverlay.pixipolygons;

			 for(var i=0; i<allpolygons.length;i++){

			 	 var cur_poly = allpolygons[i];
				 var color = cur_poly["map_shape"].owner.getColorHex();
				 var polygon_settings = polygonSettingsBoth(color);
			
				cur_poly.fill_color = color;
				cur_poly.stroke_color = polygon_settings.stroke_color; 
				cur_poly.fill_alpha = polygon_settings.fill_alpha;
				cur_poly.stroke_alpha = 1.0;
			}


	};
	

	
	/**
	 * @override
	 * 
	 * @param {boolean} print
	 * 
	 * @return {undefined}
	 */
	this.showPrintVersion = function (print){};
	
	/**
	 * @override
	 * 
	 * @param {function():undefined} clickFunction Has to be called if the element is clicked
	 * @param {function():undefined} callback Has to be called after the element is added
	 * 
	 * @return {undefined}
	 */
	this.addLocationDiv = function (clickFunction, callback){

			var div = jQuery('<div class="leafletcustom leaflet-control leaflet-bar im_loc_nav custom_control_base custom_control_shadow"><i class="fas fa-compass" aria-hidden="true"></i></div>');
			jQuery('.leaflet-bottom.leaflet-right').prepend(div);
		    div.on('click', clickFunction);
		    callback();

	};
	
	/**
	 * @override
	 * 
	 * @return {{lat: number, lng: number}}
	 */
	this.getCenter = function (){
		 return /** @type{{lat: number, lng: number}} */ (that.map.getCenter());
	};
	
	/**
	 * @override
	 * 
	 * @param {boolean} ready
	 * 
	 * @return {undefined}
	 */
	this.repaint = function (ready){
		if(ready)
			that.pixioverlay.completeDraw();
	};
}


