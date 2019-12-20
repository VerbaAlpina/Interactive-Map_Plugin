/**
 * @constructor
 *
 * @param {ClustererOptions} clustererOptions
 * 
 * Contains all markers currently visualized in a grid-based index. This class solely works with latitude / longitude differences on a plane as distances.
 * So all symbols are clustered that are close on a map, what does not necessarily mean the same as being close in reality, especially near the equator.
 * 
 * Contains also polygons and line strings in a simple list.
 * 
 * The clustering method does not take symbols into account that are close together, but in different grid cells. This could be added, but probably is not
 * worth the extra computing time.
 */

function SymbolClusterer(clustererOptions) {
	
	//Square threshold here to simplify distance calculations
	var thresholdSquared = Math.pow(clustererOptions["threshold"], 2);
	
	var /** Array<Array<Array<MapSymbol>>> */ markerIndex = new Array(clustererOptions["gridsizeLng"]);
	for (var /** number */ i = 0; i < clustererOptions["gridsizeLng"]; i++){
		markerIndex[i] = new Array(clustererOptions["gridsizeLat"]);
		for (var /** number */ j = 0; j < clustererOptions["gridsizeLat"]; j++){
			markerIndex[i][j] = new Array();
		}
	}
	var /** Array<MapSymbol> */ outside = new Array();
	var /** Array<MapShape> */ otherOverlays = new Array();
	
	var /** number */ yDist = clustererOptions["viewportHeight"] / clustererOptions["gridsizeLat"];
	var /** number */ xDist = clustererOptions["viewportWidth"] / clustererOptions["gridsizeLng"];

	/**
	 * @param {OverlayInfo} info
	 * @param {LegendElement} owner
	 * @param {boolean} movable
	 * 
	 * @return {MapSymbol|MapShape}
	 * 
	 */
	this.addOverlay = function(info, owner, movable) {
		if(info.geomData.getType() == IMGeoType.Point){
			var /** {lat: number, lng: number} */latlng = /** @type{IMPoint} */ (info.geomData).getGeometry();
			
			var /** Array<MapSymbol> */ arr = getArray(latlng["lat"], latlng["lng"]);
			var /** number */ len = arr.length;
			for (var /** number */ i = 0; i < len; i++){
				var /** {lat: number, lng: number}*/ markerPos = mapInterface.getMarkerPosition(arr[i].getMarker());
				var /** number */ distSquared = getDistanceOnMapSquared(markerPos["lat"], markerPos["lng"], latlng["lat"], latlng["lng"]);
				var /** number */ thSquared = thresholdSquared;
				
				if(optionManager.inEditMode()){
					//Combine only exactly matching markers in edit mode regardless of the threshold
					thSquared = 0;
				}

				if(distSquared <= thSquared){
					arr[i].appendSymbol(info, owner);
					return arr[i];
				}
			}

			var /** !MapSymbol */ mapSymbolNew = new MapSymbol(info.infoWindowContents, owner, info.markingColorIndex, info.elementIndex);
			var /** number */ numSymbols = info.infoWindowContents.length;
			var /** number */ size = (numSymbols == 1? symbolSize: symbolManager.getLogSizeForCount(numSymbols));
			
			var /** {index: Array<number>, markingSize: number}*/ cindex = this.computeColorIndex(owner, info.markingColorIndex);
			var /** number */ totalSize = size + 2 * cindex.markingSize;


			var /** Object */ newMarker = mapInterface.createMarker(latlng, symbolManager.createSymbolURL(cindex.index, size, cindex.markingSize, owner.isActive()), totalSize, movable, mapSymbolNew, mapSymbolNew.getZIndex());
			mapSymbolNew.setMarker(newMarker);
			
			arr.push(mapSymbolNew);
		    return mapSymbolNew;
		}
		else {
			var /** string */ id = /** @type{string}*/ (info.quantifyInfo);
			var /** MapShape */ mapShapeNew = new MapShape(info.infoWindowContents[0], owner, owner.currentElementIndex++);
			info.setMapShape(mapShapeNew);
				
			var /** Object */ mapInterfaceElement = mapInterface.createShape(info.geomData, mapShapeNew, id);
			mapShapeNew.setMapInterfaceElement(mapInterfaceElement);
			
			otherOverlays.push(mapShapeNew);
			mapInterface.addShape(mapInterfaceElement);
			return mapShapeNew;
		}
	};
	
	/**
	 * @param {LegendElement=} owner
	 * 
	 * @return {undefined}
	 */
	this.repaintPointSymbols = function (owner){
		if(owner)
			this.repaintOwnerSymbolsFromArray(owner, outside);
		else
			this.repaintSymbolsFromArray(outside);
		
		var len = markerIndex.length;
		var len2 = markerIndex[0].length;
		for(var /** number */ i = 0; i < len; i++){
			for (var /** number */ j = 0; j < len2; j++){
				if(owner)
					this.repaintOwnerSymbolsFromArray(owner, markerIndex[i][j]);
				else
					this.repaintSymbolsFromArray(markerIndex[i][j]);
			}
		}
	};
	
	/**
	 * @private
	 * 
	 * @param {Array<MapSymbol>} arr
	 * 
	 * @return {undefined}
	 */
	this.repaintSymbolsFromArray = function (arr){
		var /** number */ len = arr.length;
		for (let i = 0; i < len; i++){
			var /** MapSymbol */ ms = arr[i];
			ms.marker = mapInterface.updateMarker(ms.marker, ms.getSymbolURLs(), ms, ms.getZIndex());
		}
	};
	
	/**
	 * @private
	 * 
	 * @param {LegendElement} owner
	 * @param {Array<MapSymbol>} arr
	 * 
	 * @return {undefined}
	 */
	this.repaintOwnerSymbolsFromArray = function (owner, arr){
		var /** number */ len = arr.length;
		for (let i = 0; i < len; i++){
			var /** MapSymbol */ ms = arr[i];
			if(ms.hasOwner(owner))
				ms.marker = mapInterface.updateMarker(ms.marker, ms.getSymbolURLs(), ms, ms.getZIndex());
		}
	};
	
	
	/**
	 * @param {LegendElement} owner
	 * 
	 * @return {undefined} 
	 */
	this.removeOverlays = function (owner){
		//Point Symbols
		removeSymbolsFromArray(outside, owner);
		
		var len = markerIndex.length;
		var len2 = markerIndex[0].length;
		for(var /** number */ i = 0; i < len; i++){
			for (var /** number */ j = 0; j < len2; j++){
				removeSymbolsFromArray(markerIndex[i][j], owner);
			}
		}
		
		//Other overlays
		for (i = otherOverlays.length-1; i >= 0; i--){
			var /** MapShape */ currentShape = otherOverlays[i];
			if(currentShape.owner == owner){
				//Remove InfoWindow from DOM
				currentShape.destroyInfoWindow();
				//Remove marker from map
				mapInterface.destroyOverlay(currentShape.mapInterfaceElement);
				//Remove array reference
				otherOverlays.splice(i,1);
			}
		}
	};
	
	/**
	 * @param {LegendElement} owner
	 * @param {number} index
	 * @param {number=} lat
	 * @param {number=} lng
	 * 
	 * @return MapShape|MapSymbol
	 */
	this.findMapElement = function (owner, index, lat, lng){
		var /** MapShape|MapSymbol */ result;
		
		for (var k = 0; k < otherOverlays.length; k++){
			if(otherOverlays[k].owner == owner && otherOverlays[k].index == index){
				return otherOverlays[k];
			}
		}
		
		if(lat && lng){
			return this.findElementInArray(getArray(lat, lng), owner, index);
		}
		else {
			var len = markerIndex.length;
			var len2 = markerIndex[0].length;
			for(var /** number */ i = 0; i < len; i++){
				for (var /** number */ j = 0; j < len2; j++){
					result = this.findElementInArray(markerIndex[i][j], owner, index);
					
					if(result)
						return result;
				}
			}
		
			result = this.findElementInArray(outside, owner, index);
			
			if(result)
				return result;
		}
	};
	
	/**
	 * @private
	 * 
	 * @param {Array<MapSymbol>} arr
	 * @param {LegendElement} owner
	 * @param {number} index
	 * 
	 * @return MapShape|MapSymbol
	 */
	this.findElementInArray = function (arr, owner, index){
		for (var i = 0; i < arr.length; i++){
			for (var j = 0; j < arr[i].parts.length; j++){
				var /** MapSymbolPart */ part =  arr[i].parts[j];
				if(part.owner == owner){
					for (var k = 0; k < part.indexes.length; k++){
						if(part.indexes[k] == index){
							return arr[i];
						}
					}
				}
			}
		}
		return undefined;
	};
	
	/**
	 * @private
	 * 
	 * @param {LegendElement} owner
	 * @param {number} markingColorIndex
	 * 
	 * @return {{index: Array<number>, markingSize: number}}
	 */
	this.computeColorIndex = function (owner, markingColorIndex){
		var /** Array<number> */ ownerIndex = /** @type{Array<number>}*/ (owner.colorIndex);
		var /** Array<number> */ result = [];
		result[features_classes.main] = ownerIndex[features_classes.main];
		result[features_classes.sub] = ownerIndex[features_classes.sub];
		
		if(markingColorIndex === -1){
			result[features_classes.add] = ownerIndex[features_classes.add];
			return {index: result, markingSize : 0};
		}	
		else {
			result[features_classes.add] = markingColorIndex;
			return {index: result, markingSize: /** @type{number} */ (colorScheme.getFeatureCombination(ownerIndex, markingSize)["msize"])};
		}
	};
	
	/**
	 * @param {MapSymbol} mapSymbol
	 * 
	 * @return {boolean}
	 */
	this.removeSingleMapSymbol = function (mapSymbol){
		if(this.removeSingleSymbolFromArray(outside, mapSymbol)){
			return true;
		}
		else {
			var len = markerIndex.length;
			var len2 = markerIndex[0].length;
			for(var /** number */ i = 0; i < len; i++){
				for (var /** number */ j = 0; j < len2; j++){
					if(this.removeSingleSymbolFromArray(markerIndex[i][j], mapSymbol)){
						return true;
					}
				}
			}
		}
		return false;
	}
	
	/**
	 * @private
	 * @param {Array<MapSymbol>} arr
	 * @param {MapSymbol} mapSymbol
	 */
	this.removeSingleSymbolFromArray = function (arr, mapSymbol){
		for (var /** number */ i = arr.length - 1; i >= 0; i--){
			var /** MapSymbol */ currentElement = arr[i];
			var lenParts = currentElement.parts.length;
			if(currentElement == mapSymbol){
				if(lenParts == 1){
					if(currentElement.infoWindow != null){
						mapInterface.destroyInfoWindow(currentElement.infoWindow);
						mapState.removeInfoWindowOwnerFromList(currentElement);
					}
					mapInterface.destroyOverlay(currentElement.marker);
					arr.splice(i,1);
				}
				else {
					currentElement.reduceSymbol(i);
					lenParts--;
				}
				break;
			}
		}
	};
	
	/**
	 *
	 * @param {Array<MapSymbol>} arr
	 * @param {LegendElement} owner
	 * 
	 * @return {undefined}
	 *  
	 */
	function removeSymbolsFromArray (arr, owner){
		for (let /** number */ i = arr.length - 1; i >= 0; i--){
			var /** MapSymbol */ currentElement = arr[i];
			var lenParts = currentElement.parts.length;
			for (let /** number */ j = 0; j < lenParts; j++){
				var /** MapSymbolPart */ part = currentElement.parts[j];
				if(part.owner == owner){
					if(lenParts == 1){
						if(currentElement.infoWindow != null){
							mapInterface.destroyInfoWindow(currentElement.infoWindow);
							mapState.removeInfoWindowOwnerFromList(currentElement);
						}
						
						var /** Array<InfoWindowContent> */ infoWindowContents = part.infoWindows;
						var /** number */ numInfoWindowContents = infoWindowContents.length;
						for (let k = 0; k < numInfoWindowContents; k++){
							infoWindowContents[k].resetState();
						}
						
						mapInterface.destroyOverlay(currentElement.marker);
						arr.splice(i,1);
					}
					else {
						currentElement.reduceSymbol(j);
					}
					break;
				}
			}
		}
	}
	
	/**
	 * @param {number} lat
	 * @param {number} lng
	 * 
	 * @return {Array<MapSymbol>} 
	 */
	function getArray (lat, lng){
		var /** Array<MapSymbol> */ arr;
		if(lng < clustererOptions["viewportLng"] || lat < clustererOptions["viewportLat"] 
			|| lng > clustererOptions["viewportLng"] + clustererOptions["viewportWidth"] 
			|| lat > clustererOptions["viewportLat"] + clustererOptions["viewportHeight"]){
			arr = outside;
		}
		else {
			var /** number */ i = Math.floor((lng - clustererOptions["viewportLng"]) / xDist);
			var /** number */ j = Math.floor((lat - clustererOptions["viewportLat"]) / yDist);
			arr = markerIndex[i][j];
		}
		return arr;
	}

	/**
	 * @private
	 * @type{Object<string, OverlayInfo>}
	 */
	this.polygrp;
	
	/** 
	 * @private
	 * @type{Object <string, number>} 
	 */
	this.markerCounts;
	
	/**
	 * @private
	 * @type{number}
	 */
	this.max_markers_in_one_poly;
	
	/**
	 * @private
	 * @type{number}
	 */
	this.overall_markers;

	/**
	 * @param {LegendElement|MultiLegendElement} element
	 * @param {boolean} update
	 * @param {function()=} callback
	 */
	this.quantify = function(element, update, callback){
			
		for(var i = 0; i < legend.getLength(); i++){
			var element_l = legend.getElement(i);
			if(element_l.quantify && element !== element_l){
				element_l.setQuantify(false);
			}
		}

		if(!update){
			element.setQuantify(!element.quantify);
			jQuery(document).trigger("im_quantify_mode", element.quantify);
		}

		var linear_mapping = false; // true: colors will be calculated as percentage of total marker amount not max.
		//**get number of legend elements with polygons


		var /** LegendElement|MultiLegendElement */ owner = element;
		this.polygrp = {};
	
		if(owner instanceof MultiLegendElement){
			var /** number */ numSub = owner.getNumSubElements();
			for(var j = 0; j < numSub; j++){
				var subowner = owner.getSubElement(j);
				var numOverlays = subowner.overlayInfos.length;
				for(var k = 0; k < numOverlays; k++){
					let /** OverlayInfo */ info = subowner.overlayInfos[k];
					this.polygrp[info.quantifyInfo /** Is the polygon id */] = info;
				}	
			}
		}
		else {
			var numOverlays = owner.overlayInfos.length;
			for(var k = 0; k < numOverlays; k++){
				let /** OverlayInfo */ info = owner.overlayInfos[k];
				this.polygrp[info.quantifyInfo /** Is the polygon id */] = info;
			}
		}

		
		// //** Get all active markers
		var /** Array<OverlayInfo>*/ activeMapSymbols = [];
		var /** boolean */ fastquantify = true;
		var /** string */ ekey = element.key;

		for(var i = 0; i < legend.getLength(); i++){
			var element_l = legend.getElement(i);
			var markers = element_l.getOverlayInfos();
			for(var j = 0; j < markers.length; j++){

				if(markers[j].geomData.getType() == IMGeoType.Point){
					activeMapSymbols.push(markers[j]);
					if(markers[j].getQuantifyInfo(ekey) == null){
						fastquantify = false;
					}
				 }
			}
		}
		
		this.displayMarkers(false);
		this.overall_markers = activeMapSymbols.length;
		
		this.markerCounts = {};

		if(element.quantify || update){
			for (var id in this.polygrp){
				this.markerCounts[id] = 0;
			}

			this.max_markers_in_one_poly = 0;

			if (fastquantify){
				for (var /** number */ i = 0; i < activeMapSymbols.length; i++){
					var marker = activeMapSymbols[i];
					var idx = marker.getQuantifyInfo(ekey);
					if(idx != -1){
						try {
							this.markerCounts[idx] += marker.infoWindowContents.length;
							if (this.markerCounts[idx] > this.max_markers_in_one_poly){
								this.max_markers_in_one_poly = this.markerCounts[idx];
							}
						}
						catch (e){
							// console.log(idx);
						}
		 			
					}
				}
			}
			else {
				//** Determine how many markers are inside each polygon and polygon grp 
				for (var /** number */ i = 0; i < activeMapSymbols.length; i++){
					var /** IMPoint */ point = /** @type{IMPoint} */ (activeMapSymbols[i].geomData);
				
					for (var id in this.polygrp){
						var /** IMPolygon|IMMultiPolygon */ poly = this.polygrp[id].geomData;
						
						if(geoManager.pointInPolygon(point, poly)){
							this.markerCounts[id] += activeMapSymbols[i].infoWindowContents.length;
							if(this.markerCounts[id] > this.max_markers_in_one_poly){
								this.max_markers_in_one_poly = this.markerCounts[id];
							}
							break;
						}
					}	
				}
			}//else	 
			
			jQuery('#colorbarlegend_right').text(this.max_markers_in_one_poly);

			//change color of polygons according to their amount of markers in relation to all markers in their polygon grp:
   		    this.changePolygonColor(false);
   		    
   		    mapInterface.repaint(true);
   		    

    }//if
    else {
	  	this.displayMarkers(true);
  		mapInterface.revertChangedOverlays();
  		mapInterface.repaint(true);
    }

    if(typeof callback == "function")
    	callback(); 
    	
      
	};
	
	/**
	 * @param {string} id_reference
	 * @param {Object<string, number>} similarities
	 * 
	 * @return {undefined}
	 */
	this.showSimilarity = function (id_reference, similarities){
		
		this.polygrp = {};
		this.markerCounts = {};
		
		for(var i = 0; i < legend.getLength(); i++){
			var element_l = legend.getElement(i);
			var overlays = element_l.getOverlayInfos();
			for(var j = 0; j < overlays.length; j++){

				let type = overlays[j].geomData.getType();
				if(type == IMGeoType.Polygon || type == IMGeoType.MultiPolygon){
					let idx = /** @type{string}*/ (overlays[j].quantifyInfo /* Is the polygon id */);
					this.polygrp[idx] = overlays[j];
					this.markerCounts[idx] = similarities[idx]? similarities[idx]: false;
				}
			}
		}
		
		this.max_markers_in_one_poly = 1;
		
		jQuery('#colorbarlegend_right').text(this.max_markers_in_one_poly);
		this.changePolygonColor(false);

		mapInterface.changePolygonAppearance(this.polygrp[id_reference].getMapShape().mapInterfaceElement, "rgb(0,255,0)", "rgb(0,255,0)", 1, 1, 1);
		mapInterface.repaint(true);
		
		categoryManager.addAjaxData("similarity", id_reference);
		
		this.toggleQuantifyMode();
		
		return this.polygrp[id_reference].getMapShape();
	}


	/** 
	 * @param {boolean} show
	 */
	this.displayMarkers = function(show){
		for (var /** number */ i = 0; i < markerIndex.length; i++){
			for (var /** number */ j = 0; j < markerIndex[i].length; j++){

				if(markerIndex[i][j].length > 0) {
					for (var /** number */ k = 0; k < markerIndex[i][j].length; k++){
						var /** MapSymbol */ mapsymbol = markerIndex[i][j][k];
						mapInterface.setMarkerVisible(mapsymbol.marker, show);
					}

				}
			}
		}
		for (i = 0; i < outside.length; i++){
			var mapsymbol = outside[i];
			mapInterface.setMarkerVisible(mapsymbol.marker, show);
		}
	};
	
	/**
	 * @param  {boolean=} quant
	 * 
	 * @return {undefined}
	 */
	this.toggleQuantifyMode = function (quant){
		var /** jQuery */ l_container = jQuery('#listcontainer');

		if(quant || l_container.css('display') == "none"){
		   	var /** number */ left = (jQuery(mapDomElement).width() / 2.0) - 128;
		   	l_container.css('left',left).css('position','absolute');
		   	l_container.fadeIn('fast', function(){
		   		mapInterface.updateMapStyle(true);

		   	});
	   	}
   		else {
   			l_container.fadeOut('fast', function(){
   				mapInterface.updateMapStyle(false);
   			});
   		}
	};


	/**
	 * @param {boolean} linear_mapping
	 * 
	 * @return {undefined}
	 */
    this.changePolygonColor = function (linear_mapping){
	   for (var id in this.polygrp){
		   
		   if (this.markerCounts[id] === false){
			   mapInterface.changePolygonAppearance(this.polygrp[id].getMapShape().mapInterfaceElement, "rgb(0,0,0)", "rgb(0,0,0)", 0.01, 1, 1);
		   }
		   else {
		   
	        	var /** number */ percentage = 0;	
	
	        	if(this.markerCounts[id]){
	            	if(linear_mapping){
	            		percentage = this.markerCounts[id] / this.overall_markers;
	            	}	
	            	else {
	            		percentage = this.markerCounts[id] / this.max_markers_in_one_poly;
	            	}		   
	            }	
	       
	    		var /** number */ idx = Math.ceil(255 * percentage);
	    		if(idx > 255)
	    			idx = 255;
	
	    		var /** Element */ canvas  = document.querySelector("#activediv canvas");
	    		var /** CanvasRenderingContext2D */ ctx = canvas.getContext('2d');
	
		        var /** ImageData */ pix = ctx.getImageData(idx, 0, 1, 1);
		        var /**Uint8ClampedArray */ color_arr = pix.data;
		        	
		        var /** number*/ r = color_arr[0];
		        var /** number*/ g = color_arr[1];
		        var /** number*/ b = color_arr[2];
	
		        var /** number*/ a = color_arr[3];
	
		        var color = "rgb(" + r + "," + g + "," + b + ")";
	
	        	var state = optionManager.getOptionState('polymode'); //TODO move to VA
	
	        	var stroke_color;
		       	var opacity;
		       	var zindex = 2;
	
		       	if(idx == 0){
		       		color = /** @type{string} */ (jQuery('#gradient_startblock').css('background-color')); // get first color from block not from canvas
		       	}
	
		       	if(state == "phy"){
		       		opacity = 0.5;
		       		stroke_color = color;
		       	}
		       	else {
		       		opacity=1.0;
	
			        stroke_color = "ghostwhite";
		       	    var activecanvas  = jQuery('#activediv canvas').attr('id');
		       	    
		       	    if(activecanvas =="barcanvas_0"){
		       	    	stroke_color="black";	 
		       	    }
		       	    if(activecanvas =="barcanvas_5"){
		       	    	stroke_color="black";
		       	    }
	   	    	    if(activecanvas == "barcanvas_3")  {
	   	    	    	stroke_color = "rgb(180,180,180)";
		       	    }
	
	       	    	if(idx == 0){
	       	    		stroke_color="rgba(20,20,20,0.75)"; 
	       	    		zindex= 1;
	       	    	}
		       	}
	
		       	mapInterface.changePolygonAppearance(this.polygrp[id].getMapShape().mapInterfaceElement, color, stroke_color, opacity, opacity, zindex);
		   }
	   	}
	};


	//TODO move to legend
	/**
	 * 
	 * @return {boolean|LegendElement|MultiLegendElement}
	 */
	this.checkQuantify = function(){
		var /** boolean|LegendElement|MultiLegendElement */ elem = false;	
		for(var i = 0; i < legend.getLength(); i++){
			var element_l = legend.getElement(i);
			if(element_l.quantify)
				elem = element_l;
		}	

		return elem;
	};

	/**
	 * @return {undefined}
	 */
	this.reQuantify = function(){
		var /**LegendElement|MultiLegendElement*/ q_elem = /** @type{LegendElement|MultiLegendElement} */ (this.checkQuantify());
		q_elem.loading_quantify = true;
		legend.update();

		setTimeout(function() {
			symbolClusterer.quantify(q_elem, true, function(){
				q_elem.loading_quantify = false;
				legend.update();	
			});

		}, 200);	
	};

	/**
	 * @param {number} lat1
	 * @param {number} lng1 
	 * @param {number} lat2 
	 * @param {number} lng2 
	 * 
	 * @return {number}
	 */
	function getDistanceOnMapSquared (lat1, lng1, lat2, lng2){
		var /** number */ dlat = lat2 - lat1;
		var /** number */ dlng = lng2 - lng1;
		return dlat * dlat + dlng * dlng;
	}
	
	//http://stackoverflow.com/questions/1502590/calculate-distance-between-two-points-in-google-maps-v3
	//slightly adopted
	
	/**
	 * @param {number} x
	 * 
	 * @return {number} 
	 */
	var rad = function(x) {
	  return x * Math.PI / 180;
	};
	
	/**
	 * @param {number} lat1
	 * @param {number} lng1
	 * @param {number} lat2
	 * @param {number} lng2
	 * 
	 * @return {number}
	 */
	
	var getDistance = function(lat1, lng1, lat2, lng2) {
	  var R = 6378137; // Earth's mean radius in meter
	  var dLat = rad(lat2 - lat1);
	  var dLong = rad(lng2 - lng1);
	  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
	    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) *
	    Math.sin(dLong / 2) * Math.sin(dLong / 2);
	  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	  var d = R * c;
	  return d; // returns the distance in meters
	};
	
	/**
	 * @param {number} lat1
	 * @param {number} lng1
	 * @param {number} lat2
	 * @param {number} lng2
	 * 
	 * @return {number}
	 */
	var getDistanceAppr = function (lat1, lng1, lat2, lng2){
		lat1 = rad(lat1);
		lat2 = rad(lat2);
		var R = 6378137; // Earth's mean radius in meter
		var diffLat = lat2 - lat1;
		var diffLng = rad(lng2 - lng1);
		var diffLatSqrd = diffLat * diffLat;
		var cos = Math.cos((lat1 + lat2) / 2) * diffLng;
		var cosSqrd = cos * cos;
		return R * Math.sqrt(diffLatSqrd + cosSqrd);
	};
}

/** 
 * @constructor
 * @struct
 * 
 * @param {InfoWindowContent} infoWindowContent
 * @param {LegendElement} owner
 * @param {number} index
 */

function MapShape (infoWindowContent, owner, index){
	
	/** @type{?Object} */
	this.infoWindow = null;
	
	/** @type{InfoWindowContent} */
	this.infoWindowContent = infoWindowContent;
	
	/**
	 * @type{number}
	 */
	this.index = index;
	
	/** @type{LegendElement} */
	this.owner = owner;
	
	/**
	 * @type{Object}
	 */
	this.mapInterfaceElement;
	
	/**
	 * @param {Object} element
	 */
	this.setMapInterfaceElement = function (element){
		this.mapInterfaceElement = element;
	}
	
	/**
	 * 
	 * @param {number} lat
	 * @param {number} lng
	 *
	 * @return {undefined} 
	 */
	this.openInfoWindow = function (lat, lng){
 		var that = this;
 		
 		if(this.infoWindow)
 			mapInterface.destroyInfoWindow(this.infoWindow); //To avoid multiple info windows for one polygon
 		
		this.infoWindow = mapInterface.createInfoWindow(
			this.mapInterfaceElement,
			[{"url" : undefined, "size" : undefined}], 
			[this.infoWindowContent.getHtml(0)],
			this
		);
		
		mapState.addInfoWindowOwnerToList(this);
		mapInterface.openInfoWindow(this.mapInterfaceElement, this.infoWindow, undefined, lat, lng, this);
	};
	
	/**
	 *
	 * @return {undefined} 
	 */
	this.destroyInfoWindow = function (){
		if(this.infoWindow)
			mapInterface.destroyInfoWindow(this.infoWindow);
	};


	/**
	 *
	 * @return {undefined} 
	 */
	this.updateInfoWindow = function (){
		var /** Element */ newContent = mapInterface.updateInfoWindowContent(this.infoWindow, -1, this.infoWindowContent.getHtml(0));
		this.infoWindowContent.onOpen(newContent, 0, this.infoWindow, this.mapInterfaceElement);
	};

}


/** 
 * @constructor
 * @struct
 * 
 * 
 * @param {Array<InfoWindowContent>} infoWindowContents 
 * @param {LegendElement} owner
 * @param {number} markingColorIndex
 * @param {number} elementIndex
 */

function MapSymbol (infoWindowContents, owner, markingColorIndex, elementIndex){
	
	/** 
	* @private
	* @type {Object}
	*/
	this.marker;
	
	/**
	 * @type {number}
	 */
	this.currentTabIndex = 0;
	
	/**
	 *
	 * @return {undefined} 
	 */
	this.updateInfoWindow = function (){
		//TODO implement (not needed for VA currently)
	}
	
	/**
	 * @return {number}
	 */
	this.getNumParts = function (){
		if(this.parts == null)
			return -1;
		
		return this.parts.length;
	}
	
	/**
	 * @param {number} index
	 * 
	 * @return {LegendElement}
	 */
	this.getOwner = function (index){
		if(this.parts == null)
			return null;
		
		return this.parts[index].owner;
	}
	
	/**
	 * @return {number}
	 */
	this.getZIndex = function (){
		if(this.parts == null)
			return 0;
		
		var maxZIndex = 0;
		for (var i = 0; i < this.parts.length; i++){
			maxZIndex = Math.max(this.parts[i].owner.getZindex(), maxZIndex);
		}
		return maxZIndex;
	}
	
	/**
	* @return {Object}
	*/
	this.getMarker = function (){
		return this.marker;
	};
	
	/**
	 * @param {Object} marker
	 * 
	 * @return {undefined}
	 */
	this.setMarker = function (marker){
		this.marker = marker;
	}
	
	/** @type {?Object} */
	this.infoWindow = null;
	
	/**
	 * @private
	 * 
	 * @return {Array<{canvas : Element, size: number}>}
	 */
	this.getSymbolURLs = function (){
		var /** Array<{canvas : Element, size: number}> */ symbols = [];

		for(var /** number */ i = 0; i < this.parts.length; i++){
			var /** MapSymbolPart */ part = this.parts[i];
			var /** LegendElement */ owner = part.owner;
			
			var /** {index: Array<number>, markingSize: number}*/ cindex = symbolClusterer.computeColorIndex(owner, part.markingColor);
			var /** number */ size = symbolManager.getLogSizeForCount(this.getNumElementsForPart(part));
			var /** number */ totalSize = size + 2 * cindex.markingSize;
			
			symbols.push({canvas : (owner == null? null : symbolManager.createSymbolURL(cindex.index, size, cindex.markingSize, owner.isActive())), size: totalSize});
		}
		return symbols;
	};
	
	/**
	 * @private
	 * 
	 * @param {MapSymbolPart} part
	 * 
	 * @return {number}
	 */
	this.getNumElementsForPart = function (part){
		var result = 0;
		for (let i = 0; i < part.infoWindows.length; i++){
			result += part.infoWindows[i].getNumElements();
		}
		return result;
	};
	
	/**
	 * @private
	 * 
	 * @param {LegendElement} owner
	 * @param {number} markingColorIndex
	 * 
	 * @return {string}
	 */
	this.getOwnerKey = function (owner, markingColorIndex){
		if(owner == null)
			return "null";
		
		if(owner.parent == null){
			return owner.key + "&" + markingColorIndex;
		}
		else {
			return owner.parent.key + "|" + owner.key + "&" + markingColorIndex;
		}
	};
	
	/**
	 * @param {OverlayInfo} info
	 * @param {LegendElement} owner
	 * @param {number=} index
	 * 
	 * @return {undefined} 
	 */
	this.appendSymbol = function (info, owner, index){

		if(this.infoWindow != null){
			mapInterface.destroyInfoWindow(this.infoWindow);
			mapState.removeInfoWindowOwnerFromList(this);
			this.infoWindow = null;
		}
		
		var /** number */ lenParts = this.parts.length;
		var /** boolean */ existingPartFound = false;
		for (let i = 0; i < lenParts; i++){
			var /** MapSymbolPart */ part = this.parts[i];
			if(part.owner == owner && info.markingColorIndex == part.markingColor){
				part.infoWindows = this.appendInfoWindowContents(info.infoWindowContents, part.infoWindows);
				part.indexes.push(info.elementIndex);
				existingPartFound = true;
				break;
			}
		}
		
		if(!existingPartFound){
			var /** MapSymbolPart */ newPart = {
				owner: owner,
				markingColor: info.markingColorIndex,
				infoWindows: this.appendInfoWindowContents(info.infoWindowContents, []),
				indexes: [info.elementIndex]
			};
			
			if(index === undefined){
				this.parts.push(newPart);
			}
			else {
				this.parts.splice(index + 1, 0, newPart);
			}
		}
		
		this.marker = mapInterface.updateMarker(this.marker, this.getSymbolURLs(), this, this.getZIndex());
	};
	
	/**
	 * @private
	 * 
	 * @param {Array<InfoWindowContent>} newContents
	 * @param {Array<InfoWindowContent>} exisitingContents
	 * 
	 * @return {Array<InfoWindowContent>}
	 */
	this.appendInfoWindowContents = function (newContents, exisitingContents){
		for (let i = 0; i < newContents.length; i++){
			var /** boolean */ merged = false;
			for (let j = 0; j < exisitingContents.length; j++){
				if(newContents[i].tryMerge(exisitingContents[j])){
					merged = true;
					break;
				}
			}
			
			if(!merged){
				exisitingContents.push(newContents[i]);
			}
		}
		
		return exisitingContents;
	};
	

	/**
	 * @param {number} index
	 * 
	 * @return {undefined}
	 */
	this.reduceSymbol = function (index){
		if(this.infoWindow != null){
			mapInterface.destroyInfoWindow(this.infoWindow);
			mapState.removeInfoWindowOwnerFromList(this);
			this.infoWindow = null;
		}
		
		var /** Array<InfoWindowContent> */ infoWindowContents = this.parts[index].infoWindows;
		var /** number */ numInfoWindowContents = infoWindowContents.length;
		for (let i = 0; i < numInfoWindowContents; i++){
			infoWindowContents[i].resetState();
		}
		this.parts.splice(index, 1);

		this.marker = mapInterface.updateMarker(this.marker, this.getSymbolURLs(), this, this.getZIndex());
	};
	
	/**
	 * @param {number} iconIndex
	 * 
	 * @return {undefined}
	 */
	this.openInfoWindow = function (iconIndex){
		if(this.infoWindow == null){
			var /** Array<Element|string> */ contents = [];
			
			for(let /** number */ i = 0; i < this.parts.length; i++){
				var /** MapSymbolPart */ part = this.parts[i];
				
				for (let j = 0; j < part.infoWindows.length; j++){
					var /** Element|string*/ html = part.infoWindows[j].getHtml(j);
					
					var /** Element*/ newChild;
					if(typeof html === "string"){
						newChild = document.createElement("div");
						var /**Array<Element>*/ elements = jQuery.parseHTML(html);
						for (let k = 0; k < elements.length; k++){
							newChild.append(elements[k]);
						}
					}
					else {
						newChild = html;
					}
					
					if (contents[i] == undefined){
						var /**Element*/ newElement = document.createElement("div");
						newElement["id"] = "tab_content_" + i;
						newElement.appendChild(newChild);
						contents[i] = newElement;
					}
					else {
						var /**Array<Element>*/ sepList = jQuery.parseHTML(getInfoWindowContentSeparator());
						for (let k = 0; k < sepList.length; k++){
							contents[i].appendChild(sepList[k]);
						}
						contents[i].appendChild(newChild);
					}
				}
			}
			
			var /** Array<{canvas: Element, size: number}>*/ symbols;
			if(this.parts == null){
				symbols = [{canvas: null, size : symbolSize}];
			}
			else {
				symbols = this.getSymbolURLs();
			}
			this.infoWindow = mapInterface.createInfoWindow (this.marker, symbols, contents, this);
		}
		mapInterface.openInfoWindow(this.marker, this.infoWindow, iconIndex, undefined, undefined, this);
		mapState.addInfoWindowOwnerToList(this);
	};
	
	/** 
	 * @param {number} iconIndex Icon index on the map
	 * 
	 * @return {LegendElement}
	 */
	this.getLegendElement = function (iconIndex){
		var /** LegendElement */ legendEntry;
		if(this.parts.length == 1)
			legendEntry = this.parts[0].owner;
		else {	
			legendEntry = this.parts[iconIndex].owner;
		}	
			
		return legendEntry;
	};
	
	/**
	 * 
	 * @return {undefined}
	 */
	this.openSplitMultiSymbol = function (){
//		var /** MapSymbol */ thisObject = this;
//		var /** Array<ContextMenuItem> */ items = [];
//		for (var i = 0; i < this.parts.length; i++){
//			var /**MapSymbolPart*/ part = this.parts[i];
//			var /**string*/ htmlLabel = TRANSLATIONS["SEPARATE_SYMBOL"].replace("%d", "" + (i + 1)) + ": <img src='" + part.owner.symbolStandard +"' /> " + part.infoWindows[0].getName();
//			items.push({
//				label : htmlLabel,
//				eventName : "" + i,
//				className : "IM_GM_Context_Menu_Item"
//			});
//		}
//		
//		var /** ContextMenu */ menu = new ContextMenu(map, {
//			menuItems : items,
//			classNames : {
//				menu : "IM_GM_Context_Menu"
//			}
//		});
//		window.setTimeout(function (){
//			menu.show(thisObject.marker.getPosition());
//			
//			this.menuListener = google.maps.event.addListenerOnce(menu, "menu_item_selected", function (latlng, eventName){
//				var /** number */ numSymbol = eventName * 1;
//				
//				//Compute LatLng for new marker (== one symbol size right of the original symbol)
//				var /**google.maps.OverlayView*/ overlay = new google.maps.OverlayView();
//				overlay.draw = function() {};
//				overlay.setMap(map);
//				var /** google.maps.Point */ latLngInPixel = overlay.getProjection().fromLatLngToDivPixel(latlng);
//				latLngInPixel.x += 2 * symbolSize;
//				var /** google.maps.LatLng */ newLatLng = overlay.getProjection().fromDivPixelToLatLng(latLngInPixel);
//				overlay.setMap(null);
//				
//				var /** google.maps.Data.Point */ newPoint = new google.maps.Data.Point(newLatLng);
//				var /** OverlayInfo */ newInfo = new OverlayInfo(thisObject.parts[numSymbol].infoWindows, newPoint, null, -1, -1);
//				
//				var /** LegendElement */ owner = thisObject.parts[numSymbol].owner;
//				
//				var /** MapSymbol */ newSymbol = /** @type{MapSymbol} */ (symbolClusterer.addOverlay(newInfo, owner, true));
//				
//				optionManager.addChange(new SplitMarkerOperation(thisObject, numSymbol, newInfo, owner, newSymbol));
//				
//				thisObject.reduceSymbol(numSymbol);
//				
//				window.setTimeout(function (){
//					menu.setMap(null);
//				}, 10);
//			});
//		}, 10);
		
	};
	
	/**
	 * @param {LegendElement} owner
	 * 
	 * @return {boolean}
	 */
	this.hasOwner = function (owner){
		for (let i = 0; i < this.parts.length; i++){
			if (this.parts[i].owner == owner)
				return true;
		}
		return false;
	};

	
	/** 
	 * @type{Array<MapSymbolPart>}
	 * 
	 */
	this.parts = [{
		owner : owner,
		infoWindows : this.appendInfoWindowContents(infoWindowContents, []),
		markingColor: markingColorIndex,
		indexes : [elementIndex]
	}];
}

/**
 * @constructor
 * 
 * @param {Array<InfoWindowContent>} infoWindowContents
 * @param {IMGeometry} geomData
 * @param {Object<string, number>|string} quantifyInfo
 * @param {number} markingColorIndex
 * @param {number} elementIndex
 *  
 */
function OverlayInfo (infoWindowContents, geomData, quantifyInfo, markingColorIndex, elementIndex){

	/**
	 * @type{number}
	 */
	this.elementIndex = elementIndex;
	
	/** 
	 * @type {Array<InfoWindowContent>}
	 */
	this.infoWindowContents = infoWindowContents;
	
	/** 
	 * @type {IMGeometry}
	 */
	this.geomData = geomData;
	
	/**
	 * @private
	 * @type {Object<string, number>|string}
	 */
	this.quantifyInfo;
	
	if(quantifyInfo == null){
		if(geomData.getType() == IMGeoType.Point){
			this.quantifyInfo = [];
		}
		else {
			this.quantifyInfo = "NoID" + OverlayInfo.currentId++; //Create costum id if no id is returned by the server
		}
	}
	else {
		this.quantifyInfo = quantifyInfo;
	}
	
	/**
	 * @param{string} key
	 */
	this.getQuantifyInfo = function (key){
		//TODO find a better solution or move to VA somehow
		var /** number */ posPipe = key.indexOf("|");
		if(posPipe !== -1){
			return this.quantifyInfo[key.substring(0, posPipe)];
		}
		return this.quantifyInfo[key];
	};
	
	/**
	 * @type {number}
	 */
	this.markingColorIndex = markingColorIndex;
	
	/**
	 * @private
	 * @type {?MapShape}
	 * 
	 * Only used for quantification. Is set whenever the shape is added to the map, but not unset if the shape is removed!
	 */
	this.mapShape = null;
	
	this.setMapShape = function (mapShape){
		this.mapShape = mapShape;
	};
	
	/**
	 * return {MapShape}
	 */
	this.getMapShape = function (){
		return this.mapShape;
	}
}

/**
 * @private
 * @type{number}
 * Used for polygons which are not given an id by the server
 */
OverlayInfo.currentId = 0;

/**
 * @interface
 *
 * @param {number} categoryID
 * @param {string} elementID
 * @param {OverlayType} overlayType
 * @param {Object} data
 */
function InfoWindowContent (categoryID, elementID, overlayType, data){}
/**
 * @abstract
 * 
 * @param {number} index This gives the index inside one info window tab, if multiple contents are appended
 * 
 * @return {string|Element}
 */
InfoWindowContent.prototype.getHtml = function (index){};

/**
 *
 * Used for all cases for which two records can be merged into one. That means there is just one tab in the InfoBubble and also only one symbol one the map.
 * 
 * This function should (if possible) perform the merge (update the respective InfoWindowContent object) and return true. 
 * 
 * @abstract
 * 
 * @param {InfoWindowContent} oldContent
 *
 * @return {boolean} 
 */
InfoWindowContent.prototype.tryMerge = function (oldContent){};

/**
*
* Resets the state of the info window, which might consist of multiple merged info windos
* 
* @abstract
*
* @return {undefined} 
*/
InfoWindowContent.prototype.resetState = function (){};

/**
*
* Should return one, except if other info windows are merged in.
* 
* @abstract
*
* @return {number} 
*/
InfoWindowContent.prototype.getNumElements = function (){};

/**
 * 
 * @abstract
 * 
 * @param {Element} tabContent
 * @param {number} tabIndex
 * @param {Object} infoWindow
 * @param {Object} overlay
 *
 * @return {undefined} 
 */
InfoWindowContent.prototype.onOpen = function (tabContent, tabIndex, infoWindow, overlay) {};

/**
 * @abstract
 * 
 * @param {Element} tabContent
 * 
 * @return {undefined} 
 */
InfoWindowContent.prototype.onClose = function (tabContent) {};

/**
 * 
 * @abstract
 * 
 * @return {Array<Object<string, string>>} 
 */
InfoWindowContent.prototype.getData = function () {};

/**
 * 
 * @abstract
 * 
 * @return {string} 
 */
InfoWindowContent.prototype.getName = function () {};