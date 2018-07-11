/**
 * @typedef{google.maps.Marker|google.maps.Data.LineString|google.maps.Data.Polygon}
 */
var SomeOverlay;

/**
*
* @type {google.maps.Map}
* @const
*/
var map; //TODO turn to private field of GMI some time

/**
 * @struct
 * @constructor
 * 
 * @implements{MapInterface<google.maps.Marker, google.maps.Data.LineString, google.maps.Data.Polygon, InfoBubble>}
 */
function GoogleMapsInterface (){
	
	/**
	 * @private
	 * @type {Map<string, Image>}
	 */
	this.imgMap = new Map();
	
	/**
	 * @private
	 * @type {number}
	 */
	this.imagesLoading = 0;
	
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
	 * @type{function(Element, number, MapSymbol, InfoBubble, SomeOverlay)}
	 */
	this.tabOpenedFun;
	
	/**
	 * @type{function(Element, number, MapSymbol)} 
	 */
	 this.tabClosedFun;
	 
	 /**
	 * @type{function(Element, MapSymbol)} 
	 */
	 this.windowClosedFun;
	 
	 /**
	  * @type{function(string)}
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
	 * @type {google.maps.Data.Feature} 
	 */
	this.current_polygon;

	/**
	 * @type {boolean}
	 */
	this.dragging = false;
	
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
		map = new google.maps.Map(mapDiv, mapData);
		
		this.mapTopOffset = jQuery(mapDiv).offset().top;

		var /** Object */ highlighted = {"highlighted" : false};
		var /** google.maps.Data.Feature */ hi_feature = new google.maps.Data.Feature(highlighted);

		var /** Object */ clicked = {"clicked" : false};
		var /** google.maps.Data.Feature */ cl_feature = new google.maps.Data.Feature(clicked);


		var /** Object */ hovered = {"hovered" : false};
		var /** google.maps.Data.Feature */ ho_feature = new google.maps.Data.Feature(hovered);

		
		map.data.setStyle(function (feature){
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

		map.data.addListener ("click", function (event){
			event.feature.getProperty("mapShape").openInfoWindow(event.latLng);
	        event.feature.setProperty("clicked", true);		
		});
	    

		map.data.addListener('mouseover', function(event) {
			event.feature.setProperty('hovered', true);
			event.feature.setProperty('highlighted', true);
			this.current_polygon = event.feature;
		});

		map.data.addListener('mouseout', function(event) {
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

		map.data.addListener('mousedown', function(event) {
			this.dragging = true;
		});

		map.data.addListener('mouseup', function(event) {
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
	 * @type {Map<MapSymbol, number>}
	 */
	this.markerImagesLoading = new Map();
	
	/**
	 * @private
	 * @type {Map<MapSymbol, MultiSymbolLayout>}
	 */
	this.markerLayouts = new Map();
	
	/**
	 * @override
	 * 
	 * @param {google.maps.Marker} marker
	 * @param {Array<{url: string, size: number}>} icons
	 * @param {MapSymbol} mapSymbol
 	 * @param {number} zIndex
	 * 
	 * @return {google.maps.Marker}
	 */
	this.updateMarker = function (marker, icons, mapSymbol, zIndex){
		var /** GoogleMapsInterface */ thisObject = this;
		
		//Count number of update requests for one mapSymbol, only process the latest in the callback, since there is no guaranty which image is ready first.
		var /** number */ numberLoading;
		if(this.markerImagesLoading.has(mapSymbol)){
			numberLoading =  this.markerImagesLoading.get(mapSymbol) + 1;
		}
		else {
			numberLoading = 0;
		}
		this.markerImagesLoading.set(mapSymbol, numberLoading);
		
		this.createMultiSymbol(icons, function (url, width, height, layout){
			if(thisObject.markerImagesLoading.get(mapSymbol) === numberLoading){
				marker.setIcon(/** @type{google.maps.Icon}*/({
					"url" : url,
					"anchor" : new google.maps.Point(width / 2, height / 2),
					"scaledSize" : new google.maps.Size(width, height)
				}));
				marker.setShape(layout == null? null: layout.getMarkerShape());
				marker.setZIndex(Math.max(marker.getZIndex(), zIndex));

				thisObject.markerImagesLoading.delete(mapSymbol);
				if(layout == null)
					thisObject.markerLayouts.delete(mapSymbol);
				else
					thisObject.markerLayouts.set(mapSymbol, layout);
			}
		});
		
		return marker;
	};
	
	/**
	 * @private
	 * 
	 * @param {Array<{url: string, size: number}>} icons
	 * @param {function(string, number, number, MultiSymbolLayout)} callback
	 * 
	 * @return {undefined}
	 */
	this.createMultiSymbol = function (icons, callback){
		var /** number */ numIcons = icons.length;
		
		if(numIcons == 1){
			callback(icons[0].url, icons[0].size, icons[0].size, null);
			return;
		}
		
		//Create canvas
		var /**MultiSymbolLayout */ layout = new MultiSymbolLayout(icons);
		
		var /**HTMLCanvasElement*/ canvas = /** @type{HTMLCanvasElement}*/ (document.createElement("canvas"));
		canvas.width = layout.getWidth() * symbolRescaleFactor;
		canvas.height = layout.getHeight() * symbolRescaleFactor;
		var /** CanvasRenderingContext2D */ context = /** @type{CanvasRenderingContext2D}*/ (canvas.getContext("2d"));
		
		var /** number */ imagesLoading = 0;
		var /** Array<Image>*/ images = [];
		
		var /** function()*/ drawImages = function (){
			for (var i = 0; i < images.length; i++){
				context.drawImage(images[i], layout.getXPosition(i) * symbolRescaleFactor, layout.getYPosition(i) * symbolRescaleFactor);
			}
			callback(canvas.toDataURL("image/png"), layout.getWidth(), layout.getHeight(), layout);
		};
		
		//Load images
		for (var i = 0; i < numIcons; i++){
			var /** Image */ imgIn = this.imgMap.get(icons[i].url);
			if(imgIn === undefined){
				imgIn = new Image();
				imgIn.addEventListener ("load", function (){
					imagesLoading--;
					if(imagesLoading == 0)
						drawImages();
				});
				imagesLoading++;
				imgIn.src = icons[i].url;
				this.imgMap.set(icons[i].url, imgIn);
			}
			else if (!imgIn.complete){
				imagesLoading++;
				imgIn.addEventListener ("load", function (){
					imagesLoading--;
					if(imagesLoading == 0)
						drawImages();
				});
			}
			images[i] = imgIn;
		}

		if(imagesLoading == 0){
			drawImages();
		}
	};
	
	/**
	 * @override
	 * 
	 * @param {google.maps.Marker} marker
	 * 
	 * @return {undefined}
	 */
	this.showMarker = function (marker){
		marker.setMap(map);
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
	 * @param {number} lat
	 * @param {number} lng
	 * @param {string} icon
	 * @param {number} size
	 * @param {boolean} movable
	 * @param {!MapSymbol} mapSymbol
 	 * @param {number} zIndex
	 * 
	 * @return {google.maps.Marker}
	 */
	this.createMarker = function (lat, lng, icon, size, movable, mapSymbol, zIndex){
		var /**!google.maps.Marker*/ marker = this.createNewSingleMarker(new google.maps.LatLng(lat, lng), icon, size, movable, zIndex);
		
		this.addListenersToMarker(marker, mapSymbol, movable);
		
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
	 * @param {google.maps.LatLng} position
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
			"position" : position,
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
		overlay.setMap(null);
	};
	
	/**
	 * @override
	 * 
	 * @param {Array<{url: string, size: number}>} symbols
	 * @param {Array<Element>} elements
	 * @param {MapSymbol} mapSymbol
	 * 
	 * @return {InfoBubble}
	 */
	this.createInfoWindow = function (symbols, elements, mapSymbol){
		var /** InfoBubble*/ infoWindow = new InfoBubble({
			 "map" : map,
			 "minWidth" : 50,
			 "maxHeight" : 500,
			 "maxWidth" : 500
		});
			
		var /**GoogleMapsInterface*/ thisObject = this;
		google.maps.event.addListener(infoWindow, 'tab_opened', function (index, content){
			thisObject.tabOpenedFun(content, index, mapSymbol, infoWindow, /** @type{SomeOverlay} */ (infoWindow.getOverlay()));
		});
		
		google.maps.event.addListener(infoWindow, 'tab_closed', function (index, content){
			thisObject.tabClosedFun(content, index, mapSymbol);
		});
		
		google.maps.event.addListenerOnce(infoWindow, 'closeclick', function (){
			thisObject.windowClosedFun(infoWindow.content_, mapSymbol);
		});
		
		if(elements.length == 1 && !symbols[0].url){
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
				infoWindow.addTab('<div style="height: ' + maxSize + 'px;"><img src="' + symbols[i].url + '" style="width ' + symbols[i].size + 'px; height: ' + symbols[i].size + 'px;" /></div>', elements[i]);
			}
		}
		
		return infoWindow;
	};
	
	/**
	 * @override
	 * 
	 * @param {google.maps.Marker} marker
	 * @param {InfoWindowType} infoWindow
	 * @param {number} tabIndex
	 * 
	 * @return {undefined}
	 */
	this.openInfoWindow = function (marker, infoWindow, tabIndex){
		infoWindow.open(undefined, marker);
		window.setTimeout(function() {
			infoWindow.setTabActive(tabIndex + 1, false);
		}, 10);
	};
	
	/**
	 * @override
	 * 
	 * @param{function(Element, number, MapSymbol, InfoBubble, SomeOverlay)} tabOpenedFun
	 * @param{function(Element, number, MapSymbol)} tabClosedFun
	 * @param{function(Element, MapSymbol)} windowClosedFun
	 * @param{function(string)} locationWindowClosedFun
	 * 
	 * @return {undefined}
	 */
	this.addInfoWindowListeners = function (tabOpenedFun, tabClosedFun, windowClosedFun, locationWindowClosedFun){
		this.tabOpenedFun = tabOpenedFun;
		this.tabClosedFun = tabClosedFun;
		this.windowClosedFun = windowClosedFun;
		this.locationWindowClosedFun = locationWindowClosedFun;
	};
	
	/**
	 * @override
	 * 
	 * @param {InfoBubble} infoWindow
	 * @param {number} tabIndex
	 * 
	 * @return {Element}
	 */
	this.getInfoWindowContent = function (infoWindow, tabIndex){
		return infoWindow.tabs_[tabIndex].content;
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
		this.projectionOverlay.setMap(map);
		
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
					 index = layout.computeIndexFromMousePosition(
							projection.fromLatLngToContainerPixel(marker.getPosition()),
							mousePosition
						);
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
	 * @param {InfoWindowType} infoWindow
	 * 
	 * @return {undefined}
	 */
	this.destroyInfoWindow = function (infoWindow){
		infoWindow.close();
		google.maps.event.trigger(infoWindow, 'tab_closed', infoWindow.activeTab_.index, infoWindow.content_);
		google.maps.event.trigger(infoWindow, 'closeclick');
	};
	
	/**
	 * @param {Array<{id: number, name: string}>} list
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
						drawingModes: categoryManager.getOverlayTypes(thisObject.categoryForAdding),
						position: google.maps.ControlPosition.BOTTOM_CENTER
					}
				});
				thisObject.drawingManager.setMap(map);
			}
		});
		
		result.appendChild(selectObject);
		return result;
	};
	
	/**
	 * @override
	 * 
	 * @param {Array<{id: number, name: string}>} list 
	 * @param {function (number, OverlayType, SomeOverlay):(MapSymbol|MapShape)} overlayAddedCallback
	 * 
	 * @return {undefined}
	 */
	this.addNewOverlaysComponent = function (list, overlayAddedCallback){
		if(!this.drawingManager){
			this.initDrawingManager(overlayAddedCallback);
		}
		
		this.addingOverlay = this.createNewOverlaysElement(list);
		map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(this.addingOverlay);
	};
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeNewOverlaysComponent = function (){
		var /** google.maps.MVCArray */ centerControls = map.controls[google.maps.ControlPosition.BOTTOM_CENTER];
		
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
		
		map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(result);
		
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
		var /** google.maps.MVCArray */ centerControls = map.controls[google.maps.ControlPosition.BOTTOM_CENTER];
		
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
		var /** google.maps.MVCArray */ centerControls = map.controls[google.maps.ControlPosition.BOTTOM_CENTER];
		
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
			map.setCenter(overlay.getPosition());
		}
		//TODO other overlays
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
	 * @override
	 * 
	 * @return {undefined}
	 */

	this.resetStyle = function(){
		map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
		map.setOptions({styles: 
			[
				{
					"featureType": "road.highway",
					"stylers": [{"visibility": "off"}]
				}
			]
  		});
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
		map.setZoom(zoom)
		map.setCenter(new google.maps.LatLng((lat1 + lat2) / 2, (lng1 + lng2) / 2));
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
		
		var infowindow = new google.maps.InfoWindow({
			"content" : text
		});

		var point = new google.maps.LatLng(lat, lng);
		var marker = new google.maps.Marker({
			position: point,
		    map: map,
		    title: text,
	        animation: google.maps.Animation.DROP
		});

		setTimeout(function() {
			infowindow.open(map, marker);
		}, 750);

		google.maps.event.addListener(infowindow, "closeclick", function(){
			thisObject.locationWindowClosedFun(id);
			marker.setMap(null);
		});
		
		if(zoom){
			map.setCenter(point);
			map.setZoom(10);
		}
		
		return marker;
	};
}

/**
 * 
 * @constructor
 * @struct
 * 
 * @param {Array<{url: string, size: number}>} symbols
 * 
 */
function MultiSymbolLayout (symbols){
	
	/** 
	 * @private
	 * @type {Array<number>}
	 * 
	 * accumulated!!
	 */
	this.rowHeights = [];;
	
	/** 
	 * @private
	 * @type {Array<number>}
	 * 
	 * accumulated!!
	 */
	this.colWidths = [];
	
	/**
	 * @private
	 * @type {Array<number>}
	 */
	this.xvals = [];
	
	/**
	 * @private
	 * @type {Array<number>}
	 */
	this.yvals = [];
	
	var /** number */ size = symbols.length;
	
	var /**number*/ root = Math.ceil(Math.sqrt(size));
	var /** number */ numCols = root;
	var /** number */ numRows = (root * root) - size < root? root: root - 1;
	
	for (var i = 0; i < numRows; i++){
		this.rowHeights[i] = 0;
	}
	
	for (i = 0; i < numCols; i++){
		this.colWidths[i] = 0;
	}
	
	var /** number */ rowIndex = 0;
	var /** number */ colIndex = 0;
	
	//Compute size of rows and columns
	for (i = 0; i < size; i++){
		var /** number */ currSize = symbols[i].size;
		if(this.colWidths[colIndex] < currSize)
			this.colWidths[colIndex] = currSize;
		
		if(this.rowHeights[rowIndex] < currSize)
			this.rowHeights[rowIndex] = currSize;
		
		colIndex = (colIndex + 1) % numCols;
		if(colIndex == 0){
			rowIndex++;
		}
	}
	
	//Accumulate sizes
	var /** number */ acc = 0; 
	for (var i = 0; i < numRows; i++){
		acc += this.rowHeights[i];
		this.rowHeights[i] = acc;
	}
	
	acc = 0;
	for (i = 0; i < numCols; i++){
		acc += this.colWidths[i];
		this.colWidths[i] = acc;
	}
	
	rowIndex = 0;
	colIndex = 0;
	
	//Exception for double symbols (both symbols are centered in y direction)
	if(size == 2){
		this.xvals[0] = this.colWidths[0] - symbols[0].size;
		this.yvals[0] = Math.floor(this.rowHeights[0] - symbols[0].size) / 2;
		this.xvals[1] = this.colWidths[0];
		this.yvals[1] = Math.floor(this.rowHeights[0] - symbols[1].size) / 2;
	}
	else {
		//Compute symbol positions
		for (i = 0; i < size; i++){
			currSize = symbols[i].size;
			
			if(colIndex == 0){
				this.xvals[i] = this.colWidths[0] - currSize;
			}
			else if (colIndex == numCols - 1){
				this.xvals[i] = this.colWidths[colIndex - 1];
			}
			else {
				this.xvals[i] = this.colWidths[colIndex] - currSize - Math.floor((this.colWidths[colIndex] -  this.colWidths[colIndex - 1] - currSize) / 2);
			}
			
			if(rowIndex == 0){
				this.yvals[i] = this.rowHeights[0] - currSize;
			}
			else if (rowIndex == numRows - 1){
				this.yvals[i] = this.rowHeights[rowIndex - 1];
			}
			else {
				this.yvals[i] = this.rowHeights[rowIndex] - currSize - Math.floor((this.rowHeights[rowIndex] -  this.rowHeights[rowIndex - 1] - currSize) / 2);
			}
			
			colIndex = (colIndex + 1) % numCols;
			if(colIndex == 0){
				rowIndex++;
			}
		}
	}
	
	/**
	 * @return {number}
	 */
	this.getWidth = function (){
		return this.colWidths[numCols-1];
	};
	
	/**
	 * @return {number}
	 */
	this.getHeight = function (){
		return this.rowHeights[numRows-1];
	};
	
	/**
	 * @param {number} index
	 * 
	 * @return {number}
	 */
	this.getXPosition = function (index){
		return this.xvals[index];
	};
	
	/**
	 * @param {number} index
	 * 
	 * @return {number}
	 */
	this.getYPosition = function (index){
		return this.yvals[index];
	};
	
	/**
	 * @return {google.maps.MarkerShape}
	 */
	this.getMarkerShape = function (){
		if(size % root == 0){
			return /** @type{google.maps.MarkerShape}*/ ({
				"type" : "rect",
				"coords" : [0,0, this.getWidth(), this.getHeight()]
			});
		}
		else {
			var /** number */ fullLengthX = this.getWidth();
			var /** number */ fullLengthY = this.getHeight();
			var /** number */ shortLengthY = this.rowHeights[numRows - 2];
			var /** number */ shortLengthX = this.colWidths[(size % root) - 1];
			return /** @type{google.maps.MarkerShape}*/ ({
				"type" : "poly",
				"coords" : [
					0, 0, 
					fullLengthX, 0, 
					fullLengthX, shortLengthY, 
					shortLengthX, shortLengthY,
					shortLengthX, fullLengthY,
					0, fullLengthY
					]
			});			
		}
	};
	
	/**
	 * 
	 * @param {google.maps.Point} markerCenter
	 * @param {google.maps.Point} mousePosition
	 * 
	 * @return {number}
	 */
	this.computeIndexFromMousePosition = function (markerCenter, mousePosition){
		var /** number */ width = this.getWidth();
		var /** number */ height = this.getHeight();
		
		var /** number */ xval = mousePosition.x - markerCenter.x + (width / 2);
		var /** number */ yval = mousePosition.y - markerCenter.y + (height / 2);
		
		//As a precaution indexes are initiated with the highest possible value 
		//since they might be bigger than the maximum value because of rounding mistakes:
		var /** number */ indexX = numCols - 1;
		var /** number */ indexY = numRows - 1;
		
		for (var i = 0; i < numCols; i++){
			if(xval < this.colWidths[i]){
				indexX = i;
				break;
			}
		}
		
		for (i = 0; i < numRows; i++){
			if(yval < this.rowHeights[i]){
				indexY = i;
				break;
			}
		}
		
		var /** number */ result = indexX + indexY * numCols;
		if(result > size - 1)
			result = size - 1; //Result might be larger for the last pixel of the last symbol
		
		return result;
	};
}