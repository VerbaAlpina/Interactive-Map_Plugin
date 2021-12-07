/**
 * @typedef{google.maps.Marker|google.maps.Data.Feature}
 */
var SomeOverlay;

/**
 * @struct
 * @constructor
 * 
 * @param {MapPosition} position
 * @param {Object<string,?>} options
 * 
 * @implements{MapInterface<google.maps.Marker, google.maps.Data.Feature, google.maps.Data.Feature, InfoBubble>}
 */
function GoogleMapsInterface (position, options){
	
	/**
	 * @private
	 *
	 * @type {google.maps.Map}
	 * @const
	 */
	this.map;
	
	/**
	 * @private
	 * @type {Object<string, ?>}
	 */
	this.options = options;
	this.options["center"] = new google.maps.LatLng(position["lat"], position["lng"]);
	this.options["zoom"] = position["zoom"];
	this.options["minZoom"] = position["minZoom"];
	
	/**
	 * @private
	 * @type {Map<string, Image>}
	 */
	this.imgMap = new Map();
	
	/**
	 * @type {function (this:MapSymbol, number)}
	 */
	this.clickFunction;
	
	/**
	 * @type {function (this:MapSymbol, number, number)}
	 */
	this.dragFunction;
	
	/**
	 * @type {function (this:MapSymbol, number)}
	 */
	this.mouseOverFunction;
	
	/**
	 * @type {function (this:MapSymbol)}
	 */
	this.mouseOutFunction;
	
	/**
	 * @type {function (this:MapSymbol)}
	 */
	this.rightClickFunction;
	
	 /** 
	 * @type{function(Element, number, (MapSymbol|MapShape), InfoBubble, SomeOverlay)}
	 */
	this.tabOpenedFun;
	
	/**
	 * @type{function(Element, number, (MapSymbol|MapShape))} 
	 */
	 this.tabClosedFun;
	 
	 /**
	 * @type{function(Element, (MapSymbol|MapShape))} 
	 */
	 this.windowClosedFun;
	 
	 /**
	  * @type{function(string, Element)}
	  */
	 this.locationWindowOpenedFun;
	 
	 /**
	  * @type{function(string, Element)}
	  */
	 this.locationWindowClosedFun;
	 
	/**
	 * @private
	 * @const
	 * @type {google.maps.drawing.DrawingManager}
	 */
	this.drawingManager;
	
	/**
	 * @private
	 * @type {number}
	 */
	this.categoryForAdding;
	
	/**
	 * @private
	 * @type {Element}
	 */
	this.addingOverlay;
	
	/**
	 * @private
	 * @type {Element}
	 */
	this.undoComponent;
	
	/**
	 * @private
	 * @type {google.maps.Data.Feature} 
	 */
	this.current_polygon;

	/**
	 * @private
	 * @type {boolean}
	 */
	this.dragging = false;
	
	/**
	 * @private
	 * @type {Object<string, Array<google.maps.MapTypeStyle>>}
	 */
	this.mapStyles = {};
	
	/**
	 * @override
	 * 
	 * @param {boolean} ready
	 * 
	 * @return {undefined}
	 */
	this.repaint = function (ready){
		//Do nothing
	};
	
	/**
	 * @override
	 * 
	 * @param {function()} callback
	 * @param {Element} mapDiv
	 * @param {{strokeWeight: number, strokeColor: string, fillOpacity: number}|function(string, boolean):{strokeWeight: number, strokeColor: string, fillOpacity: number}} polygonOptions
	 * 
	 * @return {undefined}
	 */
	this.init = function (mapDiv, callback, polygonOptions){
		this.map = new google.maps.Map(mapDiv, this.options);
		
		this.mapStyles["normal"] = [
			{
				"featureType": "road.highway",
				"stylers": [{"visibility": "off"}]
			}
		];
		
		this.map.setOptions({"styles" : this.mapStyles["normal"]});	
		
		var thisObject = this;
		jQuery.ajax({
			dataType: "json",
			url: PATH["baseURL"] + "src/js/classes/map-interfaces/google-maps/quantify_style.json",
			success: function(data){
				thisObject.mapStyles["quantify"] = data;
			}
		});
		
		this.mapTopOffset = jQuery(mapDiv).offset().top;
		
		this.map.data.setStyle(function (feature){
			var /** MapShape */ shape = /**@type{MapShape}*/ (feature.getProperty("mapShape"));
			
			if(shape){
			  var /** LegendElement */ owner = shape.owner;
			  var /** boolean */ highlighted = /** @type{boolean}*/ (feature.getProperty('highlighted'));
			  
			  var /** string */ ownerColor = owner.getColorString();
			  var /** {strokeWeight: number, strokeColor: string, fillOpacity: number} */ popts;
			  if(typeof polygonOptions === "function"){
				  popts = polygonOptions(ownerColor, highlighted);
			  }
			  else {
				  popts = polygonOptions;
			  }
			  
			  popts["fillColor"] = ownerColor;
			  popts["zIndex"] = highlighted? 10000 : owner.getIndex();
	
			  return /** @type {google.maps.Data.StyleOptions} */(popts);
			}
			else if (optionManager.getOptionState("print")){ //TODO has to move to VA!!
				return /** @type {google.maps.Data.StyleOptions} */({
					"fillOpacity" : 0,
					"strokeColor" : "black",
					"strokeWeight" : 1
			    });
			}
			else {
				//Only for tests
				return /** @type {google.maps.Data.StyleOptions} */({
					"fillOpacity" : 0,
					"strokeColor" : "red",
					"strokeWeight" : 3,
					"zIndex" : 99999
			    });
			}
		});

		this.map.data.addListener('mouseover', function(event) {
			event.feature.setProperty('hovered', true);
			event.feature.setProperty('highlighted', true);
			this.current_polygon = event.feature;
		});

		this.map.data.addListener('mouseout', function(event) {
			if(event != null){	
				event.feature.setProperty('hovered', false);

				if(!event.feature.getProperty('clicked') && !this.dragging){
					event.feature.setProperty('highlighted',false);
				}
			}
			else {
				if(this.current_polygon){
					this.current_polygon.setProperty('highlighted',false);
				}
			}
		//case for manual trigger of mouseout in symbol_clusterer if closeclick on single symbol richmarker
		});

		this.map.data.addListener('mousedown', function(event) {
			this.dragging = true;
		});

		this.map.data.addListener('mouseup', function(event) {
			this.dragging = false;	
		});

		jQuery('body').on('mouseup',function(){
			if(this.dragging)
				this.dragging = false;
		})
		
		callback();
	};
	
	/**
	 * @private
	 * @type {Map<MapSymbol, MultiSymbolLayout>}
	 */
	this.markerLayouts = new Map();
	
	/**
	 * @override
	 * 
	 * @param {google.maps.Marker} marker
	 * @param {Array<{canvas: HTMLCanvasElement, size: number}>} icons
	 * @param {MapSymbol} mapSymbol
 	 * @param {number} zIndex
	 * 
	 * @return {google.maps.Marker}
	 */
	this.updateMarker = function (marker, icons, mapSymbol, zIndex){
		var /** GoogleMapsInterface */ thisObject = this;
		
		
		var /** MultiSymbolLayout */ layout = new MultiSymbolLayout(icons);
		var {canvas, width, height} = layout.createMultiSymbol();
		
		marker.setIcon(/** @type{google.maps.Icon}*/({
			"url" : canvas.toDataURL(),
			"anchor" : new google.maps.Point(width / 2, height / 2),
			"scaledSize" : new google.maps.Size(width, height)
		}));
		marker.setShape(layout == null? null: /** @type{google.maps.MarkerShape} */ (layout.getMarkerShape()));
		marker.setZIndex(Math.max(marker.getZIndex(), zIndex));

		if(layout == null)
			thisObject.markerLayouts.delete(mapSymbol);
		else
			thisObject.markerLayouts.set(mapSymbol, layout);
		
		return marker;
	};
	
	/**
	 * @override
	 * 
	 * @param {google.maps.Marker} marker
	 * @param {boolean} show
	 * 
	 * @return {undefined}
	 */
	this.setMarkerVisible = function (marker, show){
		marker.setVisible(show);
	};
	
	/**
	 * @override
	 * 
	 * @param {google.maps.Marker} marker
	 * 
	 * @return {{lat: number, lng: number}}
	 */
	this.getMarkerPosition = function (marker){
		var /** google.maps.LatLng */ pos = marker.getPosition();
		return {"lat": pos.lat(), "lng": pos.lng()};
	};
	
	/**
	 * @override
	 * 
	 * @param {InfoBubble} infoWindow
	 * 
	 * @return {{lat: number, lng: number}}
	 */
	this.getInfoWindowPosition = function (infoWindow){
		var /** google.maps.LatLng */ pos = infoWindow.getPosition();
		return {"lat": pos.lat(), "lng": pos.lng()};
	};
	
	/**
	 * @override
	 * 
	 * @param {{lat: number, lng: number}} latlng
	 * @param {HTMLCanvasElement} icon
	 * @param {number} size
	 * @param {boolean} movable
	 * @param {!MapSymbol} mapSymbol
 	 * @param {number} zIndex
	 * 
	 * @return {google.maps.Marker}
	 */
	this.createMarker = function (latlng, icon, size, movable, mapSymbol, zIndex){
		var /**!google.maps.Marker*/ marker = this.createNewSingleMarker(latlng, icon.toDataURL(), size, movable, zIndex);
		
		this.addListenersToMarker(marker, mapSymbol, movable);
		
		marker.setMap(this.map);
		
		return marker;
	};
	
	/**
	 * @private
	 * 
	 * @type {MapSymbol}
	 */
	this.currentMouseOverMapSymbol;
	
	/**
	 * @private
	 * 
	 * @type {google.maps.OverlayView}
	 */
	this.projectionOverlay;
	
	/**
	 * @private
	 * 
	 * @type {number}
	 */
	this.mapTopOffset;
	
	/**
	 * @type{number}
	 */
	this.lastIndex;
	
	/**
	 * @private
	 * 
	 * @param {google.maps.Marker} marker
	 * @param {!MapSymbol} mapSymbol
	 * @param {boolean} movable
	 * 
	 * @return {undefined}
	 */
	this.addListenersToMarker = function (marker, mapSymbol, movable){
		var /** GoogleMapsInterface */ thisObject = this;
		
		google.maps.event.addListener(marker, 'click', function (){
			thisObject.clickFunction.call(mapSymbol, thisObject.lastIndex);
		});
		
		google.maps.event.addListener(marker, 'mouseover', function (){
			thisObject.currentMouseOverMapSymbol = mapSymbol;
		});
		
		google.maps.event.addListener(marker, 'mouseout', function (){
			thisObject.currentMouseOverMapSymbol = null;
			thisObject.mouseOutFunction.call(mapSymbol);
		});
		
		if(movable){
			google.maps.event.addListener(marker, 'dragstart', 
				/**
				 * @this{google.maps.Marker}
				 */
				function (){
					var /** google.maps.LatLng */ pos = this.getPosition();
					thisObject.dragFunction.call(mapSymbol, pos.lat(), pos.lng());
				});
			google.maps.event.addListener(marker, 'rightclick', this.rightClickFunction.bind(mapSymbol));
		}
	}
	
	/**
	 * @private
	 * 
	 * @param {{lat: number, lng: number}} position
	 * @param {string} symbol
	 * @param {number} size
	 * @param {boolean} movable
 	 * @param {number} zIndex
	 * 
	 * @return {!google.maps.Marker}
	 * 
	 */
	this.createNewSingleMarker = function (position, symbol, size, movable,zIndex){
		return new google.maps.Marker({
			"position" : /** @type{google.maps.LatLngLiteral} */ (position),
			icon : {
				"url" : symbol,
				"origin" : new google.maps.Point(0, 0),
				"anchor" : new google.maps.Point(size / 2, size / 2),
				"scaledSize" : new google.maps.Size(size, size)
			},
			"zIndex": zIndex,
			"draggable" : movable
		});
	};
	
	/**
	 * @override
	 * 
	 * @param {google.maps.Marker} marker
	 * @param {number} newLat
	 * @param {number} newLng
	 * 
	 * @return {undefined}
	 */
	this.moveMarker = function (marker, newLat, newLng){
		marker.setPosition(new google.maps.LatLng(newLat, newLng));
	};
	
	/**
	 * @override
	 * 
	 * @param {SomeOverlay} overlay
	 * 
	 * @return {undefined}
	 */
	this.destroyOverlay = function (overlay){
		google.maps.event.clearInstanceListeners(overlay);
		if (overlay instanceof google.maps.Marker){
			overlay.setMap(null);
		}
		else {
			this.map.data.remove(overlay);
		}
	};
	
	/**
	 * @override
	 * 
	 * @param {SomeOverlay} anchorElement
	 * @param {Array<{canvas: HTMLCanvasElement, size: number}>} symbols
	 * @param {Array<Element>} elements
	 * @param {MapSymbol|MapShape} mapElement
	 * 
	 * @return {InfoBubble}
	 */
	this.createInfoWindow = function (anchorElement, symbols, elements, mapElement){
		
		var /** Object<string,?>*/ options = {
			 "map" : this.map,
			 "minWidth" : 50,
			 "maxHeight" : 500,
			 "maxWidth" : 500
		};

		if (mapElement instanceof MapShape){
			options["disableAutoPan"] = true;
		}
		
		var /** InfoBubble*/ infoWindow = new InfoBubble(options);
			
		var /**GoogleMapsInterface*/ thisObject = this;
		
		if(mapElement instanceof MapSymbol){
			google.maps.event.addListener(infoWindow, 'tab_opened', function (index, content){
				thisObject.tabOpenedFun(content, index, mapElement, infoWindow, /** @type{SomeOverlay} */ (infoWindow.getOverlay()));
			});
			
			google.maps.event.addListener(infoWindow, 'tab_closed', function (index, content){
				thisObject.tabClosedFun(content, index, mapElement);
			});
			
			google.maps.event.addListenerOnce(infoWindow, 'closeclick', function (){
				google.maps.event.trigger(this.map.data, 'mouseout');
				thisObject.windowClosedFun(infoWindow.content_, mapElement);
			});
		}
		else { //anchorElement is google.maps.Data.Feature
			google.maps.event.addListener(infoWindow, 'closeclick', function(){
				anchorElement.setProperty("clicked", false);
					
				if(!anchorElement.getProperty("hovered")){
					  anchorElement.setProperty("highlighted", false);
				}
				
				thisObject.tabClosedFun(infoWindow.content_, -1, mapElement);
				thisObject.windowClosedFun(infoWindow.content_, mapElement);
			});
				
			google.maps.event.addListener(infoWindow, 'tab_opened', function(e){
				thisObject.tabOpenedFun(infoWindow.content_, -1, mapElement, infoWindow, /** @type{SomeOverlay} */ (infoWindow.getOverlay()));
			});
		}
		
		if(elements.length == 1 && !symbols[0].canvas){
			infoWindow.setContent(elements[0]);
		}
		else {
			//Find maximum size
			var /** number */ maxSize = 0;
			for(var /** number */ i = 0; i < symbols.length; i++){
				if(symbols[i].size > maxSize)
					maxSize = symbols[i].size;
			}
			
			for(i = 0; i < elements.length; i++){
				infoWindow.addTab('<div style="height: ' + maxSize + 'px;"><img src="' + symbols[i].canvas.toDataURL() + '" style="width ' + symbols[i].size + 'px; height: ' + symbols[i].size + 'px;" /></div>', elements[i]);
			}
		}
		return infoWindow;
	};
	
	/**
	 * @override
	 * 
	 * @param {SomeOverlay} anchorElement
	 * @param {InfoWindowType} infoWindow
	 * @param {number=} tabIndex
	 * @param {number=} lat
	 * @param {number=} lng
	 * 
	 * @return {undefined}
	 */
	this.openInfoWindow = function (anchorElement, infoWindow, tabIndex, lat, lng){
		if (lat !== undefined && lng !== undefined){
			infoWindow.setPosition(new google.maps.LatLng(lat, lng));
			infoWindow.open();
		}
		else {
			infoWindow.open(undefined, anchorElement);
		}
		
		if (tabIndex !== undefined){
			window.setTimeout(function() {
				infoWindow.setTabActive(tabIndex + 1, false);
			}, 10);
		}
	};
	
	/**
	 * @override
	 * 
	 * @param{function(Element, number, (MapSymbol|MapShape), InfoBubble, SomeOverlay)} tabOpenedFun
	 * @param{function(Element, number, (MapSymbol|MapShape))} tabClosedFun
	 * @param{function(Element, (MapSymbol|MapShape))} windowClosedFun
	 * @param{function(string, Element)} locationWindowOpenedFun
	 * @param{function(string, Element)} locationWindowClosedFun
	 * 
	 * @return {undefined}
	 */
	this.addInfoWindowListeners = function (tabOpenedFun, tabClosedFun, windowClosedFun, locationWindowOpenedFun, locationWindowClosedFun){
		this.tabOpenedFun = tabOpenedFun;
		this.tabClosedFun = tabClosedFun;
		this.windowClosedFun = windowClosedFun;
		this.locationWindowClosedFun = locationWindowClosedFun;
		this.locationWindowOpenedFun = locationWindowOpenedFun;
	};
	
	/**
	 * @override
	 * 
	 * @param {InfoWindowType} infoWindow
	 * @param {number|undefined} tabIndex
	 * @param {string|Element} newContent
	 * 
	 * @return {Element}
	 */
	this.updateInfoWindowContent = function (infoWindow, tabIndex, newContent){
		if (infoWindow.getNumTabs() === 0){
			infoWindow.setContent(newContent);
			infoWindow.updateContent_();
			return infoWindow.content_;
		}
		else {
			return infoWindow.updateTab (tabIndex, undefined, newContent);
		}
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
	 */
	this.addMarkerListeners = function (clickFun, rightClickFun, dragFun, mouseOverFun, mouseOutFun){
		this.clickFunction = clickFun;
		this.rightClickFunction = rightClickFun;
		this.dragFunction = dragFun;
		this.mouseOverFunction = mouseOverFun;
		this.mouseOutFunction = mouseOutFun;
		
		this.projectionOverlay = new google.maps.OverlayView();
		this.projectionOverlay.draw = function() {};
		this.projectionOverlay.setMap(this.map);
		
		var /** GoogleMapsInterface */ thisObject = this;
		
		jQuery(mapDomElement).mousemove(
			/**
			 * @this{Element}
			 * 
			 * @param {MouseEvent} e
			 */
			function (e){
				var /** MapSymbol */ mapSymbol = thisObject.currentMouseOverMapSymbol;
				if(mapSymbol){
					var /** google.maps.Marker */ marker = /** @type{google.maps.Marker}*/ (mapSymbol.getMarker());
					var /** google.maps.Point */ mousePosition = new google.maps.Point(e.pageX - this.offsetLeft, e.pageY - thisObject.mapTopOffset);
					var /** google.maps.MapCanvasProjection*/ projection = thisObject.projectionOverlay.getProjection();
					
					var /** MultiSymbolLayout */ layout = thisObject.markerLayouts.get(mapSymbol);
					var /**number*/ index;
					if(layout == undefined){ //Single symbol
						index = 0;
					}
					else {
						let /** google.maps.Point */ markerCenter = projection.fromLatLngToContainerPixel(marker.getPosition());
						
						let /** number|boolean|string */ indexRes = layout.computeIndexFromMousePosition(markerCenter.x, markerCenter.y, mousePosition.x, mousePosition.y);
						
						if (indexRes == "out" || indexRes === false){
							index = 0;
						}
						else {
							index = /** @type{number} */ (indexRes);
						}
					}
					
					if(index !== thisObject.lastIndex){
						thisObject.lastIndex = index;
						thisObject.mouseOutFunction.call(mapSymbol);
					}
					
					thisObject.mouseOverFunction.call(mapSymbol, index);
				}
			}
		);
	};
	
	/**
	 * @override
	 * 
	 * @param {function(this:MapShape, number, number)} clickFun
	 * 
	 * @return {undefined}
	 * 
	 */
	this.addShapeListeners = function (clickFun){
		this.map.data.addListener ("click", function (event){
			var /**google.maps.LatLng */ latlng = event.latLng;
			clickFun.call(event.feature.getProperty("mapShape"), latlng.lat(), latlng.lng());
	        event.feature.setProperty("clicked", true);		
		});
	};
	
	/**
	 * @override
	 * 
	 * @param {InfoWindowType} infoWindow
	 * 
	 * @return {undefined}
	 */
	this.destroyInfoWindow = function (infoWindow){
		infoWindow.close();
		
		var /** number|undefined */ activeTab = undefined;
		if (infoWindow.activeTab_){
			activeTab = infoWindow.activeTab_.index;
		}
		
		google.maps.event.trigger(infoWindow, 'tab_closed', activeTab, infoWindow.content_);
		google.maps.event.trigger(infoWindow, 'closeclick');
	};
	
	/**
	 * @private
	 * 
	 * @param {Array<{id: number, name: string, allowedOverlays: Array<boolean>}>} list
	 * 
	 * @return {Element}
	 */
	this.createNewOverlaysElement = function (list){
		var /** GoogleMapsInterface */ thisObject = this;
		
		var /** Element */ result = document.createElement("div");
		result.index = 0;
		result.style.background = "#fff";
		result.style.border = '2px solid #fff';
		result.style.borderRadius = '3px';
		result.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
		result.style.margin = '5px';
		result.appendChild(document.createTextNode(TRANSLATIONS["ADD_NEW_DATA"] + ":"));
		var /** Element */ selectObject = document.createElement("select");
		selectObject.id = "IM_GM_EditModeCategorySelect"
		var /** Element */ defaultOption = document.createElement("option");
		defaultOption.value = "-1";
		defaultOption.innerHTML = TRANSLATIONS["CHOOSE_CATEGORY"];
		defaultOption.selected = "selected";
		selectObject.appendChild(defaultOption);
		
		for (var i = 0; i < list.length; i++){
			var /** Element */ option = document.createElement("option");
			option.innerHTML = list[i].name;
			option.value = list[i].id;
			selectObject.appendChild(option);
		}
		
		selectObject.addEventListener ("change", function (){
			thisObject.categoryForAdding = this.value;
			if(thisObject.categoryForAdding == -1){
				thisObject.drawingManager.setMap(null);
			}
			else {
				thisObject.drawingManager.setOptions ({
					drawingControlOptions : {
						drawingModes: this.getGoogleTypesForNewOverlays(list[thisObject.categoryForAdding]["allowedOverlays"]),
						position: google.maps.ControlPosition.BOTTOM_CENTER
					}
				});
				thisObject.drawingManager.setMap(this.map);
			}
		});
		
		result.appendChild(selectObject);
		return result;
	};
	
	/**
	 * @private
	 * 
	 * @param {Array<boolean>} boolArray
	 * 
	 * @return {Array<string>}
	 */
	this.getGoogleTypesForNewOverlays = function (boolArray){
		var /** Array<string> */ result = [];

		if(boolArray[OverlayType.PointSymbol]){
			result.push(google.maps.drawing.OverlayType.MARKER);
		}
		if(boolArray[OverlayType.Polygon]){
			result.push(google.maps.drawing.OverlayType.POLYGON);
		}
		if(boolArray[OverlayType.LineString]){
			result.push(google.maps.drawing.OverlayType.POLYLINE);
		}
			
		return result;
	};
	
	/**
	 * @override
	 * 
	 * @param {Array<{id: number, name: string, allowedOverlays: Array<boolean>}>} list 
	 * @param {function (number, OverlayType, SomeOverlay):(MapSymbol|MapShape)} overlayAddedCallback
	 * 
	 * @return {undefined}
	 */
	this.addNewOverlaysComponent = function (list, overlayAddedCallback){
		if(!this.drawingManager){
			this.initDrawingManager(overlayAddedCallback);
		}
		
		this.addingOverlay = this.createNewOverlaysElement(list);
		this.map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(this.addingOverlay);
	};
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeNewOverlaysComponent = function (){
		var /** google.maps.MVCArray */ centerControls = this.map.controls[google.maps.ControlPosition.BOTTOM_CENTER];
		
		for(var i = 0; i < centerControls.getLength(); i++){
			if(centerControls.getAt(i) == this.addingOverlay){
				centerControls.removeAt(i);
				break;
			}
		}
		this.addingOverlay = null;
		this.drawingManager.setMap(null);
	}
	
	/**
	 * @override
	 * 
	 * @param {{name : string, img: string, callback: function(), show : boolean}} undoInfo
	 * @param {{name : string, img: string, callback: function(), show : boolean}} revertInfo
	 * @param {{name : string, img: string, callback: function(), show : boolean}} commitInfo
	 * 
	 * @return {undefined}
	 */
	this.addUndoComponent = function (revertInfo, undoInfo, commitInfo){
		var /** Element */ result = document.createElement("div");
		
		result.index = 0;
		result.style.background = "#fff";
		result.style.border = '2px solid #fff';
		result.style.borderRadius = '3px';
		result.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
		result.style.margin = '5px';
		
		var /** Element */ undoButton = document.createElement("button");
		undoButton.id = "IM_GM_Revert";
		var /** Element */ img = document.createElement("img");
		img.src = revertInfo.img;
		img.style.verticalAlign = "middle";
		img.style.width = "12px";
		undoButton.appendChild(img);
		undoButton.appendChild(document.createTextNode(" " + revertInfo.name));
		undoButton.addEventListener ("click", revertInfo.callback);
		if(!revertInfo.show)
			undoButton.style.display = "none";
		result.appendChild(undoButton);
		
		var /** Element */ commitButton = document.createElement("button");
		commitButton.id = "IM_GM_Commit";
		img = document.createElement("img");
		img.src = commitInfo.img;
		img.style.verticalAlign = "middle";
		img.style.width = "15px";
		commitButton.appendChild(img);
		commitButton.appendChild(document.createTextNode(" " + commitInfo.name));
		commitButton.addEventListener ("click", commitInfo.callback);
		if(!commitInfo.show)
			commitButton.style.display = "none";
		result.appendChild(commitButton);
		
		var /** Element */ undoOneButton = document.createElement("button");
		undoOneButton.id = "IM_GM_Undo";
		img = document.createElement("img");
		img.src = undoInfo.img;
		img.style.verticalAlign = "middle";
		img.style.width = "15px";
		undoOneButton.appendChild(img);
		undoOneButton.appendChild(document.createTextNode(" " + undoInfo.name));
		undoOneButton.addEventListener ("click", undoInfo.callback);
		if(!undoInfo.show)
			undoOneButton.style.display = "none";
		result.appendChild(undoOneButton);
		
		this.map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(result);
		
		this.undoComponent = result;
	};
	
	/**
	 * @override
	 * 
	 * @param {boolean|string} showRevert
	 * @param {boolean|string} showUndo
	 * @param {boolean|string} showCommit
	 * 
	 * @return {undefined}
	 */
	this.updateUndoComponent = function (showRevert, showUndo, showCommit){
		var /** google.maps.MVCArray */ centerControls = this.map.controls[google.maps.ControlPosition.BOTTOM_CENTER];
		
		if(showRevert){
			if(showRevert !== true)
				this.updateButtonName("#IM_GM_Revert", /** @type{string} */ (showRevert));
			jQuery("#IM_GM_Revert").toggle(true);
		}
		else {
			jQuery("#IM_GM_Revert").toggle(false);
		}
		
		if(showUndo){
			if(showUndo !== true)
				this.updateButtonName("#IM_GM_Undo", /** @type{string} */ (showUndo));
			jQuery("#IM_GM_Undo").toggle(true);
		}
		else {
			jQuery("#IM_GM_Undo").toggle(false);
		}
		
		if(showCommit){
			if(showCommit !== true)
				this.updateButtonName("#IM_GM_Commit", /** @type{string} */ (showCommit));
			jQuery("#IM_GM_Commit").toggle(true);
		}
		else {
			jQuery("#IM_GM_Commit").toggle(false);
		}
		centerControls.clear();
		
		
		centerControls.push(this.undoComponent);
		centerControls.push(this.addingOverlay);
	};
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeOptionElement = function (){
		this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].pop();
	}
	
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
	}
	
	/**
	 * 
	 * @override
	 * 
	 * @param {Element} element
	 * 
	 * @return {undefined}
	 */
	this.addOptionElement = function (element){
		this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(element);
	};
	
	/**
	 * @private
	 * 
	 * @param {string} sel
	 * @param {string} text
	 * 
	 * @return {undefined}
	 */
	this.updateButtonName = function (sel, text){
		var /** jQuery */ img = jQuery(sel).children()[0];
		jQuery(sel).html("");
		jQuery(sel).append(img);
		jQuery(sel).append(" " + text);
	}

	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeUndoComponent = function (){
		var /** google.maps.MVCArray */ centerControls = this.map.controls[google.maps.ControlPosition.BOTTOM_CENTER];
		
		for(var i = 0; i < centerControls.getLength(); i++){
			if(centerControls.getAt(i) == this.undoComponent){
				centerControls.removeAt(i);
				break;
			}
		}
		this.undoComponent = null;
	};
	
	/**
	 * @private
	 * 
	 * @return {undefined}
	 */
	this.initDrawingManager = function (callback){
		this.drawingManager = new google.maps.drawing.DrawingManager({
			drawingControl : true,
			markerOptions: {
				icon : {
					url : PATH["symbolGenerator"] + "?size=20&shape=circle&color=255,255,255", //TODO remove constant size
					anchor : new google.maps.Point(10,10) //TODO scaling?
				},
				zIndex : 9999,
				draggable : true
			},
			polygonOptions : {
				fillColor: "#fff",
				fillOpacity: 1,
				borderColor: "000",
				strokeWeight: 1,
				zIndex : 9999
			},
			polylineOptions : {
				strokeWeight: 5,
				strokeOpacity: 1,
				strokeColor : "#fff",
				zIndex : 9999
			}
		});
		
		google.maps.event.addListener(this.drawingManager, "overlaycomplete", function (event){
			var /**MapShape|MapSymbol*/ backlink = callback(this.categoryForAdding, this.googleMapsDrawingTypeToOverlayType(event.type), event.overlay);
			
			if(backlink instanceof MapSymbol)
				this.addListenersToMarker(event.overlay, backlink, true);
			//TODO else
		}.bind(this));
	};
	
	/**
	 * 
	 * @private
	 * 
	 * @param {string} gmType
	 * 
	 * @return {OverlayType|undefined}
	 */
	this.googleMapsDrawingTypeToOverlayType = function (gmType){
		if(gmType == google.maps.drawing.OverlayType.MARKER){
			return OverlayType.PointSymbol;
		}
		if(gmType == google.maps.drawing.OverlayType.POLYGON){
			return OverlayType.Polygon;
		}
		if(gmType == google.maps.drawing.OverlayType.POLYLINE){
			return OverlayType.LineString;
		}
		return undefined;
	}
	
	/**
	 * @override
	 * 
	 * @param {SomeOverlay} overlay
	 * 
	 * @return {undefined}
	 */
	this.centerOnOverlay = function (overlay){
		if(overlay instanceof google.maps.Marker){
			this.map.setCenter(overlay.getPosition());
		}
		//TODO other overlays
	};
	
	/**
	 * @override
	 * 
	 * @param {number} lat
	 * @param {number} lng
	 * 
	 * @return {undefined}
	 */
	this.setCenter = function (lat, lng){
		this.map.setCenter(new google.maps.LatLng(lat, lng));
	};
	
	/**
	 * @override
	 * 
	 * @param {number} zoom
	 * 
	 * @return {undefined}
	 */
	this.setZoom = function (zoom){
		this.map.setZoom(zoom);
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
		this.setCenter(lat, lng);
		this.setZoom(zoom);
	}
	
	/**
	 * @override
	 *
	 * @return {number}
	 */
	this.getZoom = function (){
		return this.map.getZoom();
	};
	
	/**
	 * @override
	 * 
	 * @param {SomeOverlay} overlay
	 * 
	 * @return {string}
	 */
	this.getWKTStringForOverlay = function (overlay){
		if(overlay instanceof google.maps.Marker){
			var /** google.maps.LatLng */ latlng = overlay.getPosition();
			return "POINT(" + latlng.lng() + " " + latlng.lat() + ")";
		}
		return "";
		//TODO other overlays
	};
	
	/**
	 * Source: https://stackoverflow.com/questions/6048975/google-maps-v3-how-to-calculate-the-zoom-level-for-a-given-bounds
	 * 
	 * @param {google.maps.LatLngBounds} bounds
	 * @param {{height: number, width: number}} mapDim
	 * 
	 * @return number
	 * 
	 */
	this.getBoundsZoomLevel = function (bounds, mapDim) {
	    var WORLD_DIM = { "height": 256, "width" : 256 };
	    var ZOOM_MAX = 15; //General value = 21

	    /**
	     * @param {number} lat
	     * 
	     * @return {number}
	     */
	    function latRad(lat) {
	        var sin = Math.sin(lat * Math.PI / 180);
	        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
	        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
	    }

	    /**
	     * @param {number} mapPx
	     * @param {number} worldPx
	     * @param {number} fraction
	     * 
	     * @return {number}
	     */
	    function zoom(mapPx, worldPx, fraction) {
	        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
	    }

	    var ne = bounds.getNorthEast();
	    var sw = bounds.getSouthWest();

	    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

	    var lngDiff = ne.lng() - sw.lng();
	    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

	    var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
	    var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

	    return Math.min(latZoom, lngZoom, ZOOM_MAX);
	}
	
	/**
	* @override
	* 
	* @param {number} lat1
	* @param {number} lng1
	* @param {number} lat2
	* @param {number} lng2
	* 
	* @return {undefined}
	*/

	this.zoomToBounds = function (lat1, lng1, lat2, lng2){
		var /** number*/ zoom = this.getBoundsZoomLevel(
			new google.maps.LatLngBounds(new google.maps.LatLng(lat1, lng1), new google.maps.LatLng(lat2, lng2)),
			{"height" : /** @type{number}*/ (jQuery(mapDomElement).height()), "width": /** @type{number}*/ (jQuery(mapDomElement).width())});
			
		console.log(lat1 +  " , " + lng1 +  " , " + lat2 +  " , " + lng2);
		console.log((lat1 + lat2) / 2 + ", " + (lng1 + lng2) / 2);
		this.map.setZoom(zoom)
		this.map.setCenter(new google.maps.LatLng((lat1 + lat2) / 2, (lng1 + lng2) / 2));
	};
	
	/**
	 * @override
	 * 
	 * @param {number} lat
	 * @param {number} lng
	 * @param {string} text
	 * @param {string} id
	 * @param {boolean} zoom
	 * 
	 * @return {google.maps.Marker}
	 */
	this.addLocationMarker = function (lat, lng, text, id, zoom){
		var thisObject = this;
		
		var /** Element */ content = document.createElement("div");
		content.innerHTML = text;
		var infowindow = new google.maps.InfoWindow({
			"content" : content
		});

		var point = new google.maps.LatLng(lat, lng);
		var marker = new google.maps.Marker({
			position: point,
		    map: this.map,
		    title: text,
	        animation: google.maps.Animation.DROP
		});

		setTimeout(function() {
			infowindow.open(this.map, marker);
		}, 750);

		google.maps.event.addListener(infowindow, "closeclick", function(){
			thisObject.locationWindowClosedFun(id, this.getContent());
			marker.setMap(null);
		});
		
		google.maps.event.addListener(infowindow, "domready", function(){
			thisObject.locationWindowOpenedFun(id, this.getContent());
		});
		
		if(zoom){
			this.map.setCenter(point);
			this.map.setZoom(10);
		}
		
		return marker;
	};
	
	/**
	 * @override
	 * 
	 * @param {IMGeometry} geoData
	 * @param {MapShape} mapShape
	 * @param {string} id
	 * @param {string} color
	 * @param {number} lineWidth
	 * 
	 * @return {google.maps.Data.Feature}
	 */
	this.createShape = function (geoData, mapShape, id, color, lineWidth){
		var /** google.maps.Data.Feature */ feature = this.geoToFeature(geoData);

		feature.setProperty("mapShape", mapShape);
		feature.setProperty("id", id);

		return feature;
	};
	
	/**
	 * @private
	 * 
	 * @param {IMGeometry} geoData
	 * 
	 * @return {google.maps.Data.Feature}
	 */
	this.geoToFeature = function (geoData){
		var /** google.maps.Data.Geometry */ geoObject;
		switch (geoData.getType()){
			case IMGeoType.Point:
				geoObject = new google.maps.Data.Point(/** @type{google.maps.LatLngLiteral} */ (geoData.getGeometry()));
				break;
			
			case IMGeoType.Polygon:
				geoObject = new google.maps.Data.Polygon(/** @type{Array<Array<google.maps.LatLngLiteral>>} */ (geoData.getGeometry()));
				break;
			
			case IMGeoType.MultiPolygon:
				geoObject = new google.maps.Data.MultiPolygon(/** @type{Array<Array<Array<google.maps.LatLngLiteral>>>} */ (geoData.getGeometry()));
				break;
				
			case IMGeoType.LineString:
				geoObject = new google.maps.Data.LineString(/** @type{Array<google.maps.LatLngLiteral>} */ (geoData.getGeometry()));
				break;
				
			case IMGeoType.MultiLineString:
				geoObject = new google.maps.Data.MultiLineString(/** @type{Array<Array<google.maps.LatLngLiteral>>} */ (geoData.getGeometry()));
				break;
		}
		
		var /** Object */ options = {"geometry" : geoObject};
		return new google.maps.Data.Feature (options);
	}

	/**
	 * @override
	 * 
	 * @param {google.maps.Data.Feature} shapeObject
	 */
	this.addShape = function (shapeObject){
		this.map.data.add(shapeObject);
	};

	/**
	 * @override
	 * 
	 * @param {google.maps.Data.Feature} shapeObject
	 */
	this.removeShape = function (shapeObject){
		this.map.data.remove(shapeObject);
	};
	
	/**
	 * @override
	 * 
	 * @param {google.maps.Data.Feature} polygon
	 * @param {string} fillColor CSS color string
	 * @param {string} strokeColor CSS color string
	 * @param {number} fillOpacity
	 * @param {number} strokeOpacity
	 * @param {number} zIndex
	 * 
	 * @return {undefined}
	 */
	this.changePolygonAppearance = function (polygon, fillColor, strokeColor, fillOpacity, strokeOpacity, zIndex){
		this.map.data.overrideStyle(polygon, {
    		fillColor: fillColor,
    		strokeColor: strokeColor,
			fillOpacity:  fillOpacity,
    		strokeOpacity: strokeOpacity,
			zIndex: zIndex
     	});
	};
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.revertChangedOverlays = function (){
		this.map.data.revertStyle();
	};
	
	/**
	 * @param {string} id
	 * @param {Array<google.maps.MapTypeStyle>} style
	 * 
	 * @return {undefined}
	 */
	this.addMapStyle = function (id, style){
		this.mapStyles[id] = style;
	}
	
	/**
	 * @override
	 * 
	 * @param {boolean} quantifyMode
	 * 
	 * @return {undefined}
	 */
	this.updateMapStyle = function (quantifyMode){
		var /** string|boolean */ style;		
		
		if(quantifyMode){
			this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
			style = "quantify";
		}
		else {
			this.map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
			style = "normal";
		}
		var /** Object<string, ?>*/ data = {
			"style" : style
		};
		
		jQuery(document).trigger("im_google_maps_style", data); //TODO document
		
		style = data.style;
		this.map.setOptions({"styles" : this.mapStyles[style]});
	};
	
	/**
	 * @type{Array<google.maps.Data.Feature|google.maps.Marker|MapLabel>}
	 */
	this.printOverlays = [];
	
	/**
	 * @override
	 * 
	 * @param {boolean} print
	 * 
	 * @return {undefined}
	 */
	this.showPrintVersion = function (print){
		if (print){
			var cities = {	"Graz" : new google.maps.LatLng(47.08167647058823, 15.440786294117647),
					"Wien" : new google.maps.LatLng(48.21005884090909, 16.36924844886364),
					"Zürich" : new google.maps.LatLng(47.38053583333334, 8.533726065476195),
					"Genève" : new google.maps.LatLng(46.20491474626866, 6.146582208955225),
					"München" : new google.maps.LatLng(48.15599302956941, 11.536016254553722),
					"Lyon" : new google.maps.LatLng(45.76355704838709, 4.823816322580646),
					"Marseille" : new google.maps.LatLng(43.35255012031986, 5.402270187858101),
					"Torino" : new google.maps.LatLng(45.07748569955254, 7.6675839411545095),
					"Milano" : new google.maps.LatLng(45.47630795340505, 9.152742594982076),
					"Genova" : new google.maps.LatLng(44.45599925698791, 8.909093869689082),
					"Venezia" : new google.maps.LatLng(45.5161237585159, 12.29172227086939),
					"Bologna" : new google.maps.LatLng(44.49460777669903, 11.329389016181231),
					"Ljubljana" : new google.maps.LatLng(46.07171353316323, 14.519828036989805),
					"Zagreb" : new google.maps.LatLng(45.824386, 15.977033)};
					
			for (var prop in cities){
				var alignRight = prop == "Genève" || prop == "Venezia";
				
				var label = new MapLabel({
					"text" : alignRight? prop + "  " : "  " + prop,
					"position" : cities[prop],
					"fontSize" : 12,
					"strokeWeight" : 0,
					"align" : alignRight? "right" : "left",
					"map" : this.map
				});
				
				var marker = new google.maps.Marker ({
					"icon" : {
						"path": google.maps.SymbolPath.CIRCLE,
						"scale" : 3,
						"fillOpacity" : 1.0
					},
					"map" : this.map,
					"position" : cities[prop]
				});
				
				this.printOverlays.push(marker);
				this.printOverlays.push(label);
			}
			
			var thisObject = this;
			jQuery(document).trigger("im_show_print_borders", function (response){
				var arr = JSON.parse(response);
				for (var i = 0; i < arr.length; i++){
					var feature = thisObject.geoToFeature(geoManager.parseGeoDataFormated(arr[i]));
					thisObject.map.data.add(feature);
					thisObject.printOverlays.push(feature);
				}
				thisObject.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
				thisObject.map.setOptions({"styles": thisObject.mapStyles["empty"]});
			}); //TODO better solution
		}
		else {
			this.map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
			this.map.setOptions({"styles": this.mapStyles["normal"]});
	  		for (var i = 0; i < this.printOverlays.length; i++){
	  			var curr = this.printOverlays[i];
	  			if(curr instanceof google.maps.Data.Feature){
	  				this.map.data.remove(curr);
	  			}
	  			else {
	  				curr.setMap(null);
	  			}
	  		}
		}
	};
	
	/**
	 * @override
	 * 
	 * @param {function():undefined} clickFunction
	 * @param {function():undefined} callback
	 * 
	 * @return {undefined}
	 */
	this.addLocationDiv = function (clickFunction, callback){
		google.maps.event.addListenerOnce(this.map, 'idle', function(){
			var div = jQuery('<div class="im_loc_nav custom_control_base custom_control_shadow"><i class="fas fa-compass" aria-hidden="true"></i></div>');
			jQuery('.gm-style').append(div);
		    div.on('click', clickFunction);
		    callback();
		});
	}
	
	/**
	 * @override
	 * 
	 * @return {{lat: number, lng: number}}
	 */
	this.getCenter = function (){
		var /** google.maps.LatLng */ center = this.map.getCenter();
		return {"lat": center.lat(), "lng" : center.lng()};
	};
	
	/**
	 * @override
	 * 
	 * @param {number} index
	 * 
	 * @return {undefined}
	 */
	this.setLayer = function (index){
		//Do nothing
	}
	
	/**
	 * @override
	 * 
	 * @param {function(number)} baseLayerFun
	 * 
	 * @return {undefined}
	 */
	this.addMapListeners = function (baseLayerFun){
		//Do nothing
	}
}