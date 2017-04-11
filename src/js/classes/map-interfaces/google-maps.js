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
	 * @type {Array<number>} 
	 */
	this.sizeTableX = [0];
	
	/**
	 * @private
	 * @type {Array<number>}
	 */
	this.sizeTableY = [0];
		
	/**
	 * @private
	 * @type{Array<google.maps.MarkerShape>}
	 */
	this.markerShapes = [null];
	
	for (var i = 1; i < multiSymbolTableSize; i++){
		var /**number*/ root = Math.ceil(Math.sqrt(i));
		this.sizeTableX[i] = root;
		this.sizeTableY[i] = (root * root) - i < root? root: root - 1;
		
		if(root * root == i){
			this.markerShapes[i] = {
				"type" : "rect",
				"coords" : [0,0, symbolSize * root, symbolSize * root]
			};
		}
		else if (i % root == 0){
			this.markerShapes[i] = {
				"type" : "rect",
				"coords" : [0,0, symbolSize * root, (symbolSize - 1) * root]
			};
		}
		else {
			var /** number */ fullLength = root * symbolSize;
			var /** number */ shortLengthY = Math.floor(i / root) * symbolSize;
			var /** number */ shortLengthX = (i % root) * symbolSize;
			this.markerShapes[i] = {
					"type" : "poly",
					"coords" : [
						0, 0, 
						fullLength, 0, 
						fullLength, shortLengthY, 
						shortLengthX, shortLengthY,
						shortLengthX, fullLength,
						0, fullLength
						]
			};			
		}	
	}
	
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
	 * @type{function(Element, number, InfoWindowContent, InfoBubble, SomeOverlay)}
	 */
	this.tabOpenedFun;
	
	/**
	 * @type{function(Element, InfoWindowContent)} 
	 */
	 this.tabClosedFun;
	 
	 /**
	 * @type{function(Element, Array<InfoWindowContent>)} 
	 */
	 this.windowClosedFun;
	 
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
	 * @override
	 * 
	 * @param {function()} callback
	 * 
	 * @return {undefined}
	 */
	this.init = function (callback){
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
			if(dragging)
				dragging = false;
		})
		
		callback();
	};
	
	/**
	 * @override
	 * 
	 * @param {google.maps.Marker} marker
	 * @param {Array<string>} icons
	 * @param {MapSymbol} mapSymbol
	 * 
	 * @return {google.maps.Marker}
	 */
	this.updateMarker = function (marker, icons, mapSymbol){
		var /** GoogleMapsInterface */ thisObject = this;
		
		this.createMultiSymbol(icons, function (url, x, y){
			marker.setIcon(/** @type{google.maps.Icon}*/({
				url : url,
				anchor : new google.maps.Point(x, y)
			}));
			marker.setShape(thisObject.markerShapes[icons.length]);
		});
		
		return marker;
	};
	
	/**
	 * @private
	 * 
	 * @param {Array<string>} icons
	 * @param {function(string, number, number)} callback
	 * 
	 * @return {undefined}
	 */
	this.createMultiSymbol = function (icons, callback){
		var /** number */ numIcons = icons.length;
		
		if(numIcons == 1){
			callback(icons[0], symbolSize / 2, symbolSize / 2);
			return;
		}
		
		//Create canvas
		var /**HTMLCanvasElement*/ canvas = /** @type{HTMLCanvasElement}*/ (document.createElement("canvas"));
		var numCols = this.sizeTableX[numIcons];
		canvas.width = symbolSize * numCols;
		canvas.height = symbolSize * this.sizeTableY[numIcons];
		var /** CanvasRenderingContext2D */ context = /** @type{CanvasRenderingContext2D}*/ (canvas.getContext("2d"));
		
		var /** number */ imagesLoading = 0;
		var /** Array<Image>*/ images = [];
		
		var /** function()*/ drawImages = function (){
			for (var i = 0; i < images.length; i++){
				context.drawImage(images[i], (i % numCols) * symbolSize, Math.floor(i / numCols) * symbolSize);
			}
			callback(canvas.toDataURL("image/png"), canvas.width / 2, canvas.height / 2);
		};
		
		//Load images
		for (var i = 0; i < numIcons; i++){
			var /** Image */ imgIn = this.imgMap.get(icons[i]);
			if(imgIn === undefined){
				imgIn = new Image();
				imgIn.addEventListener ("load", function (){
					imagesLoading--;
					if(imagesLoading == 0)
						drawImages();
				});
				imagesLoading++;
				imgIn.src = icons[i];
				this.imgMap.set(icons[i], imgIn);
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
	 * @param {number} lat
	 * @param {number} lng
	 * @param {string} icon
	 * @param {boolean} movable
	 * @param {!MapSymbol} mapSymbol
	 * 
	 * @return {google.maps.Marker}
	 */
	this.createMarker = function (lat, lng, icon, movable, mapSymbol){
		var /**!google.maps.Marker*/ marker = this.createNewSingleMarker(new google.maps.LatLng(lat, lng), icon, movable);
		
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
	this.mapTopOffset = jQuery("#IM_googleMap").offset().top;
	
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
	 * @param {google.maps.Point} markerCenter
	 * @param {google.maps.Size} markerSize
	 * @param {google.maps.Point} mousePosition
	 * 
	 * @return {number}
	 */
	this.computeMultiSymbolIndex = function (markerCenter, markerSize, mousePosition){
		var /** number */ width = markerSize.width;
		var /** number */ height = markerSize.height;
		var /** number */ diffToLeftBorder = width / 2;
		var /** number */ diffToTopBorder = height / 2;
		var /** number */ numCols = width / symbolSize;
		var /** number */ numRows = height / symbolSize;
		
		var /** number */ indexX = Math.floor((mousePosition.x - markerCenter.x + diffToLeftBorder) / symbolSize);
		var /** number */ indexY = Math.floor((mousePosition.y - markerCenter.y + diffToTopBorder) / symbolSize);
		
		//Avoid rounding mistakes from the latlng to pixel computation
		if(indexX < 0)
			indexX = 0;
		else if (indexX > numCols - 1)
			indexX = numCols - 1;
		if(indexY < 0)
			indexY = 0;
		else if (indexY > numRows - 1)
			indexY = numRows - 1;
		
		return indexX + indexY * numCols;
	};
	
	/**
	 * @private
	 * 
	 * @param {google.maps.LatLng} position
	 * @param {string} symbol
	 * @param {boolean} movable
	 * 
	 * @return {!google.maps.Marker}
	 * 
	 */
	this.createNewSingleMarker = function (position, symbol, movable){
		return new google.maps.Marker({
			"position" : position,
			icon : {
				"url" : symbol,
				"origin" : new google.maps.Point(0, 0),
				"anchor" : new google.maps.Point(symbolSize / 2, symbolSize/2)
			},
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
	 * @param {Array<string>} symbols
	 * @param {Array<Element>} elements
	 * @param {Array<InfoWindowContent>} infoWindowContents
	 * 
	 * @return {InfoBubble}
	 */
	this.createInfoWindow = function (symbols, elements, infoWindowContents){
		var /** InfoBubble*/ infoWindow = new InfoBubble({
			 "map" : map,
			 "minWidth" : 50
		});
			
		var /**GoogleMapsInterface*/ thisObject = this;
		google.maps.event.addListener(infoWindow, 'tab_opened', function (index, content){
			thisObject.tabOpenedFun(content, index, infoWindowContents[index], infoWindow, /** @type{SomeOverlay} */ (infoWindow.getOverlay()));
		});
		
		google.maps.event.addListener(infoWindow, 'tab_closed', function (index, content){
			thisObject.tabClosedFun(content, infoWindowContents[index]);
		});
		
		google.maps.event.addListenerOnce(infoWindow, 'closeclick', function (){
			thisObject.windowClosedFun(infoWindow.content_, infoWindowContents);
		});
		
		if(elements.length == 1 && !symbols[0]){
			infoWindow.setContent(elements[0]);
		}
		else {
			for(var /** number */ i = 0; i < elements.length; i++){
				infoWindow.addTab('<img src="' + symbols[i] + '" />', elements[i]);
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
			infoWindow.setTabActive(tabIndex + 1);
		}, 10);
	};
	
	/**
	 * @override
	 * 
	 * @param{function(Element, number, InfoWindowContent, InfoBubble, SomeOverlay)} tabOpenedFun
	 * @param{function(Element, InfoWindowContent)} tabClosedFun
	 * @param{function(Element, Array<InfoWindowContent>)} windowClosedFun
	 * 
	 * @return {undefined}
	 */
	this.addInfoWindowListeners = function (tabOpenedFun, tabClosedFun, windowClosedFun){
		this.tabOpenedFun = tabOpenedFun;
		this.tabClosedFun = tabClosedFun;
		this.windowClosedFun = windowClosedFun;
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
		
		jQuery("#IM_googleMap").mousemove(
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
					var /**number*/ index = thisObject.computeMultiSymbolIndex(
						projection.fromLatLngToContainerPixel(marker.getPosition()), 
						marker.getIcon().size,
						mousePosition
					);
					
					if(mapSymbol.owners != null && index > mapSymbol.owners.length - 1)
						return;
					
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
						position: google.maps.ControlPosition.TOP_CENTER
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
		map.controls[google.maps.ControlPosition.TOP_CENTER].push(this.addingOverlay);
	};
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.removeNewOverlaysComponent = function (){
		var /** google.maps.MVCArray */ centerControls = map.controls[google.maps.ControlPosition.TOP_CENTER];
		
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
		
		map.controls[google.maps.ControlPosition.TOP_CENTER].push(result);
		
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
		var /** google.maps.MVCArray */ centerControls = map.controls[google.maps.ControlPosition.TOP_CENTER];
		
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
		var /** google.maps.MVCArray */ centerControls = map.controls[google.maps.ControlPosition.TOP_CENTER];
		
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
					anchor : new google.maps.Point(10,10)
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
}