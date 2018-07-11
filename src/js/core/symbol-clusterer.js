//TODO mousover for polygons or line strings does not work

/**
 * @typedef {{owner: LegendElement, markingColor: number, infoWindows: Array<InfoWindowContent>, indexes: Array<number>}}
 */
var MapSymbolPart;

/**
 * @constructor
 *
 * @param {number} viewportLng
 * @param {number} viewportLat
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {number} gridsizeLng
 * @param {number} gridsizeLat
 * @param {number} threshold threshold in meters
 * 
 * Contains all markers currently visualized in a grid-based index. This class solely works with latitude / longitude differences on a plane as distances.
 * So all symbols are clustered that are close on a google map, what does not necessarily mean the same as being close in reality, especially near the equator.
 * 
 * Contains also polygons and line strings in a simple list.
 * 
 * The clustering method does not take symbols into account that are close together, but in different grid cells. This could be added, but probably is not
 * worth the extra computing time.
 */

function SymbolClusterer(viewportLat, viewportLng, viewportHeight, viewportWidth, gridsizeLng, gridsizeLat, threshold) {
	
	//Square threshold here to simplify distance calculations
	var thresholdSquared = Math.pow(threshold, 2);
	
	var /** Array<Array<Array<MapSymbol>>> */ markerIndex = new Array(gridsizeLng);
	for (var /** number */ i = 0; i < gridsizeLng; i++){
		markerIndex[i] = new Array(gridsizeLat);
		for (var /** number */ j = 0; j < gridsizeLat; j++){
			markerIndex[i][j] = new Array();
		}
	}
	var /** Array<MapSymbol> */ outside = new Array();
	var /** Array<MapShape> */ otherOverlays = new Array();
	
	var /** number */ yDist = viewportHeight / gridsizeLat;
	var /** number */ xDist = viewportWidth / gridsizeLng;

	/**
	 * @param {OverlayInfo} info
	 * @param {LegendElement} owner
	 * @param {boolean} movable
	 * 
	 * @return {MapSymbol|Array<google.maps.Data.Feature>}
	 * 
	 */
	this.addOverlay = function(info, owner, movable) {
		
		if(info.geomData instanceof google.maps.Data.Point){
			var /** number */ lat = info.geomData.get().lat();
			var /** number */ lng = info.geomData.get().lng();
			
			var /** Array<MapSymbol> */ arr = getArray(lat, lng);
	
			var /** number */ len = arr.length;
			for (var /** number */ i = 0; i < len; i++){
				var /** google.maps.LatLng*/ markerPos = arr[i].getMarker().getPosition();
				var /** number */ distSquared = getDistanceOnGoogleMapSquared(markerPos.lat(), markerPos.lng(), lat, lng);
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
			var /** google.maps.LatLng */ pos = info.geomData.get();
			var /** number */ numSymbols = info.infoWindowContents.length;
			var /** number */ size = (numSymbols == 1? symbolSize: symbolManager.getLogSizeForCount(numSymbols));
			
			var /** {index: Array<number>, markingSize: number}*/ cindex = this.computeColorIndex(owner, info.markingColorIndex);
			var /** number */ totalSize = size + 2 * cindex.markingSize;


			var /** Object */ newMarker = mapInterface.createMarker(pos.lat(), pos.lng(), symbolManager.createSymbolURL(cindex.index, size, cindex.markingSize, owner.isActive()), totalSize, movable, mapSymbolNew, mapSymbolNew.getZIndex());
			mapSymbolNew.setMarker(newMarker);
			
			arr.push(mapSymbolNew);
		    mapInterface.showMarker(newMarker);
		    return mapSymbolNew;
		}
		else {
			var /** string */ id = /** @type{string}*/ (info.quantifyInfo);
			var /** Object */ options = {"geometry" : info.geomData};
			var /** Array<google.maps.Data.Feature> */ result = [];
			
			
			for (var s = 0; s < info.infoWindowContents.length; s++){
				var /** google.maps.Data.Feature */ feature = new google.maps.Data.Feature (options);
				owner.googleFeatures[id] = feature;

				var /** MapShape */ mapShapeNew = new MapShape(feature, info.infoWindowContents[s], owner, owner.currentElementIndex++);
				feature.setProperty("mapShape", mapShapeNew);
				feature.setProperty("id", id);
				
				otherOverlays.push(mapShapeNew);
				result.push(map.data.add(feature));
			}
			
			return result;
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
			mapInterface.updateMarker(ms.marker, ms.getSymbolURLs(), ms, ms.getZIndex());
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
				mapInterface.updateMarker(ms.marker, ms.getSymbolURLs(), ms, ms.getZIndex());
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
				map.data.remove(currentShape.feature);
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
		if(lng < viewportLng || lat < viewportLat || lng > viewportLng + viewportWidth || lat > viewportLat + viewportHeight){
			arr = outside;
		}
		else {
			var /** number */ i = Math.floor((lng - viewportLng) / xDist);
			var /** number */ j = Math.floor((lat - viewportLat) / yDist);
			arr = markerIndex[i][j];
		}
		return arr;
	}
	
	/**
	 * @return {undefined} 
	 */
	this.visualize = function() {
		for (var /** number */ y = 0; y <= gridsizeLat; y++) {

			var /** number */ startY = viewportLat + y * yDist;
			var /** google.maps.Polyline */ pol = new google.maps.Polyline({
				path : [new google.maps.LatLng(startY, viewportLng), new google.maps.LatLng(startY, viewportLng + viewportWidth)],
				strokeColor : "red",
				strokeWeight : 2.0
			});
			pol.setMap(map);
		}

		for (var /** number */ x = 0; x <= gridsizeLng; x++) {

			var /** number */ startX = viewportLng + x * xDist;
			pol = new google.maps.Polyline({
				path : [new google.maps.LatLng(viewportLat, startX), new google.maps.LatLng(viewportLat + viewportHeight, startX)],
				strokeColor : "red",
				strokeWeight : 2.0
			});
			pol.setMap(map);
		}
	};

	/**
	 * @type{Object<string, google.maps.Data.Feature>}
	 */
	this.polygrp;
	
	/**
	 * @type{number}
	 */
	this.max_markers_in_one_poly;
	
	/**
	 * @type{number}
	 */
	this.overall_markers;

	/**
	 * @param {LegendElement|MultiLegendElement} element
	 * @param {boolean} update
	 * @param {function()=} callback
	 */
	this.quantify = function(element, update, callback){
		map.data.revertStyle();
		
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
				for(var id in subowner.googleFeatures){
					this.polygrp[id] = subowner.googleFeatures[id];
				}	
			}
		}
		else {
			for(var id in owner.googleFeatures){
				this.polygrp[id] = owner.googleFeatures[id];
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

				if(markers[j].geomData instanceof google.maps.Data.Point){
					activeMapSymbols.push(markers[j]);
					if(markers[j].getQuantifyInfo(ekey) == null){
						fastquantify = false;
					}
				 }
			}
		}
		
		this.displayMarkers(false);
		this.overall_markers = activeMapSymbols.length;

		if(element.quantify || update){
			for (var id in this.polygrp){
				this.polygrp[id].markercount = 0;
			}

			this.max_markers_in_one_poly = 0;

			if (fastquantify){
				for (var /** number */ i = 0; i < activeMapSymbols.length; i++){
					var marker = activeMapSymbols[i];
					var idx = marker.getQuantifyInfo(ekey);
					if(idx != -1){
						try {
							this.polygrp[idx].markercount += marker.infoWindowContents.length;
							if (this.polygrp[idx].markercount > this.max_markers_in_one_poly){
								this.max_markers_in_one_poly = this.polygrp[idx].markercount;
							}
						}
						catch (e){
							// console.log(idx);
						}
		 			
					}
				}
			}
			else {
				var /** Object<string, google.maps.Polygon> */ gPolygons = {};
				//** create google polygon objects before marker inside polygon test (small performance increase)

				for (var id in this.polygrp){
					gPolygons[id] = getPolygonFromDataPolygon(this.polygrp[id].getGeometry());
				}

				//** Determine how many markers are inside each polygon and polygon grp 
				for (var /** number */ i = 0; i < activeMapSymbols.length; i++){
					var latlng = activeMapSymbols[i].geomData.get();
				
					for (var id in this.polygrp){
						var poly = gPolygons[id];
						
						if(google.maps.geometry.poly.containsLocation(latlng, poly)){
							this.polygrp[id].markercount++;
							if(this.polygrp[id].markercount > this.max_markers_in_one_poly){
								this.max_markers_in_one_poly = this.polygrp[id].markercount;
							}
							break;
						}
					}	
				}
			}//else	 
			
			jQuery('#colorbarlegend_right').text(this.max_markers_in_one_poly);

			//change color of polygons according to their amount of markers in relation to all markers in their polygon grp:
   		    this.changePolygonColor(false);
   		    

    }//if
    else {
	  	this.displayMarkers(true);
    }


    if(typeof callback == "function")
    	callback(); 
    	
      
	};


	/** 
	 * @param {boolean} show
	 */
	this.displayMarkers = function(show){
		for (var /** number */ i = 0; i < markerIndex.length; i++){
			for (var /** number */ j = 0; j < markerIndex[i].length; j++){

				if(markerIndex[i][j].length > 0) {
					for (var /** number */ k = 0; k < markerIndex[i][j].length; k++){
						var /** MapSymbol */ mapsymbol = markerIndex[i][j][k];
						mapsymbol.marker.setVisible(show);
					}

				}
			}
		}
		for (i = 0; i < outside.length; i++){
			var mapsymbol = outside[i];
			mapsymbol.marker.setVisible(show);
		}
	};
	
	/**
	 * @return {undefined}
	 */
	this.toggleQuantifyMode = function (){
		var /** jQuery */ l_container = jQuery('#listcontainer');

		var state = optionManager.getOptionState('polymode');
		
		if(l_container.css('display') == "none"){
		   	var /** number */ left = (jQuery(mapDomElement).width() / 2.0) - 128;
		   	l_container.css('left',left);
		   	l_container.fadeIn('fast', function(){
		   		map.setMapTypeId(google.maps.MapTypeId.ROADMAP);

	   			if(state=="phy") map.setOptions({styles: style_for_quantify});
	   			else map.setOptions({styles: style_for_hex_quantify});

		   		
		   	});
	   	}
   		else {
   			l_container.fadeOut('fast', function(){
				map.setMapTypeId(google.maps.MapTypeId.TERRAIN);

				if(state=="phy") mapInterface.resetStyle();
				else map.setOptions({"styles": noLabelStyle});

   		  
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
		   
        	var /** number */ percentage = 0;	
        	var /** google.maps.Data.Feature */ feature = this.polygrp[id];

        	if(feature.markercount !== 0 && feature.markercount){
            	if(linear_mapping){
            		percentage = feature.markercount / this.overall_markers;
            	}	
            	else {
            		percentage = feature.markercount / this.max_markers_in_one_poly;
            	}		   
            }	
       
    		var /** number */ idx = Math.ceil(255 * percentage);
    		if(idx>255)idx = 255;

    		var /** Element */ canvas  = document.querySelector("#activediv canvas");
    		var /** CanvasRenderingContext2D */ ctx = canvas.getContext('2d');

	        var /** ImageData */ pix = ctx.getImageData(idx, 0, 1, 1);
	        var /**Uint8ClampedArray */ color_arr = pix.data;
	        	
	        var /** number*/ r = color_arr[0];
	        var /** number*/ g = color_arr[1];
	        var /** number*/ b = color_arr[2];

	        var /** number*/ a = color_arr[3];

	        var color = "rgb(" + r + "," + g + "," + b + ")";

        	var state = optionManager.getOptionState('polymode');

        	var stroke_color;
	       	var opacity;
	       	var zindex = 2;

	       	if(idx==0){
	       		color = jQuery('#gradient_startblock').css('background-color'); // get first color from block not from canvas
	       	}


	       	if(state=="phy"){
	       		opacity=0.5;
	       		stroke_color = color;
	       	}

	       	if(state != "phy"){
	       		opacity=1.0;

		        stroke_color = "ghostwhite";
	       	    var activecanvas  = jQuery('#activediv canvas').attr('id');
	       	    
	       	    if(activecanvas =="barcanvas_0")stroke_color="black";	    
	       	    if(activecanvas =="barcanvas_5")stroke_color="black";
   	    	    if(activecanvas == "barcanvas_3")  {stroke_color = "rgb(180,180,180)";
   	    		
   	    		   
	       	    }

       	    	if(idx==0){
       	    		stroke_color="rgba(20,20,20,0.75)"; 
       	    		zindex= 1;
       	    	}
	       	}


   	 
	
        		map.data.overrideStyle(feature,{
        		fillColor: color,
        		strokeColor: stroke_color,
    			fillOpacity:  opacity,
        		strokeOpacity: opacity,
    			zIndex:zindex
	            });

	       
	      			
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
	function getDistanceOnGoogleMapSquared (lat1, lng1, lat2, lng2){
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
	  return d; // returns the distance in meter
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
 * @param {google.maps.Data.Feature} feature
 * @param {InfoWindowContent} infoWindowContent
 * @param {LegendElement} owner
 * @param {number} index
 */

function MapShape (feature, infoWindowContent, owner, index){
	
	/** @type{?google.maps.InfoWindow} */
	this.infoWindow = null;
	
	/** @type{InfoWindowContent} */
	this.infoWindowContent = infoWindowContent;
	
	/**
	 * @type{number}
	 */
	this.index = index;
	
	/** 
	* @private
	* @type {google.maps.Data.Feature}
	*/
	this.feature = feature;
	
	/** @type{LegendElement} */
	this.owner = owner;
	
	/**
	 * 
	 * @param {google.maps.LatLng} latlng
	 *
	 * @return {undefined} 
	 */

	this.openInfoWindow = function (latlng){
 		var that = this;
		
		var /** string */ id = /** @type{string} */ (this.feature.getProperty("id"));

		if(!mapState.addInfoWindowOwnerToList(this)){
			this.infoWindow.close();
		}
		
		  this.infoWindow = new google.maps.InfoWindow({
			  content : "<div id='mapShape" + id + "'>" + this.infoWindowContent.getHtml(0) + "</div>" //TODO translate
		  });	
		  
		  var /** @type{InfoWindowContent} */ infoWinContent = this.infoWindowContent;
		  var /** google.maps.InfoWindow */ infoWin = this.infoWindow;
		  var /** google.maps.Data.Feature */ feature = this.feature;

		  google.maps.event.addListener(this.infoWindow, 'closeclick', function(){
			  feature.setProperty("clicked", false);
				
			  if(!feature.getProperty("hovered")){
				  feature.setProperty("highlighted", false);
			  }
				
			  infoWinContent.onClose(document.getElementById("mapShape" + id));
			  mapState.removeInfoWindowOwnerFromList(that);
		  });
			
		  google.maps.event.addListener(this.infoWindow, 'domready', function(e){
			  infoWinContent.onOpen(document.getElementById("mapShape" + id), 0, infoWin, feature);
		  });

		  this.infoWindow.setPosition(latlng);
		  this.infoWindow.open(map);
	};
	
	/**
	 *
	 * @return {undefined} 
	 */
	this.destroyInfoWindow = function (){
		if(this.infoWindow)
			this.infoWindow.close();
		mapState.removeInfoWindowOwnerFromList(this);
	};


	/**
	 *
	 * @return {undefined} 
	 */
	this.updateInfoWindow = function (){
		var /** string */ id = /** @type{string} */ (this.feature.getProperty("id"));
		this.infoWindow.setContent("<div id='mapShape" + id + "'>" + this.infoWindowContent.getHtml(0) + "</div>" );
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
	 * @return {Array<{url : string, size: number}>}
	 */
	this.getSymbolURLs = function (){
		var /** Array<{url : string, size: number}> */ symbols = [];

		for(var /** number */ i = 0; i < this.parts.length; i++){
			var /** MapSymbolPart */ part = this.parts[i];
			var /** LegendElement */ owner = part.owner;
			
			var /** {index: Array<number>, markingSize: number}*/ cindex = symbolClusterer.computeColorIndex(owner, part.markingColor);
			var /** number */ size = symbolManager.getLogSizeForCount(this.getNumElementsForPart(part));
			var /** number */ totalSize = size + 2 * cindex.markingSize;
			
			symbols.push({url : (owner == null? "" : symbolManager.createSymbolURL(cindex.index, size, cindex.markingSize, owner.isActive())), size: totalSize});
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
			var /** Array<Element> */ contents = [];
			
			for(let /** number */ i = 0; i < this.parts.length; i++){
				var /** MapSymbolPart */ part = this.parts[i];
				
				for (let j = 0; j < part.infoWindows.length; j++){
					var /** Element|string*/ html = part.infoWindows[j].getHtml(j);
					
					if(typeof html === "string"){
						if (contents[i] == undefined){
							contents[i] = linkifyHtml(html);
						}
						else {
							contents[i] += "<br/><hr style='width: 100%; height: 3px; margin: 0 auto;'><br />" + linkifyHtml(html);
						}
					}
					else
						if (contents[i] == undefined){
							var /**Element*/ newElement = document.createElement("div");
							newElement.appendChild(html);
							contents[i] = newElement;
						}	
						else { 
							contents[i].appendChild(document.createElement("br"));
							contents[i].appendChild(document.createElement("br"));
							contents[i].appendChild(html);
						}
				}
			}
			
			var /** Array<{url: string, size: number}>*/ symbols;
			if(this.parts == null){
				symbols = [{url: "", size : symbolSize}];
			}
			else {
				symbols = this.getSymbolURLs();
			}
			this.infoWindow = mapInterface.createInfoWindow (symbols, contents, this);
		}
		mapInterface.openInfoWindow(this.marker, this.infoWindow, iconIndex);
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
		var /** MapSymbol */ thisObject = this;
		var /** Array<ContextMenuItem> */ items = [];
		for (var i = 0; i < this.parts.length; i++){
			var /**MapSymbolPart*/ part = this.parts[i];
			var /**string*/ htmlLabel = TRANSLATIONS["SEPARATE_SYMBOL"].replace("%d", "" + (i + 1)) + ": <img src='" + part.owner.symbolStandard +"' /> " + part.infoWindows[0].getName();
			items.push({
				label : htmlLabel,
				eventName : "" + i,
				className : "IM_GM_Context_Menu_Item"
			});
		}
		
		var /** ContextMenu */ menu = new ContextMenu(map, {
			menuItems : items,
			classNames : {
				menu : "IM_GM_Context_Menu"
			}
		});
		window.setTimeout(function (){
			menu.show(thisObject.marker.getPosition());
			
			this.menuListener = google.maps.event.addListenerOnce(menu, "menu_item_selected", function (latlng, eventName){
				var /** number */ numSymbol = eventName * 1;
				
				//Compute LatLng for new marker (== one symbol size right of the original symbol)
				var /**google.maps.OverlayView*/ overlay = new google.maps.OverlayView();
				overlay.draw = function() {};
				overlay.setMap(map);
				var /** google.maps.Point */ latLngInPixel = overlay.getProjection().fromLatLngToDivPixel(latlng);
				latLngInPixel.x += 2 * symbolSize;
				var /** google.maps.LatLng */ newLatLng = overlay.getProjection().fromDivPixelToLatLng(latLngInPixel);
				overlay.setMap(null);
				
				var /** google.maps.Data.Point */ newPoint = new google.maps.Data.Point(newLatLng);
				var /** OverlayInfo */ newInfo = new OverlayInfo(thisObject.parts[numSymbol].infoWindows, newPoint, null, -1, -1);
				
				var /** LegendElement */ owner = thisObject.parts[numSymbol].owner;
				
				var /** MapSymbol */ newSymbol = /** @type{MapSymbol} */ (symbolClusterer.addOverlay(newInfo, owner, true));
				
				optionManager.addChange(new SplitMarkerOperation(thisObject, numSymbol, newInfo, owner, newSymbol));
				
				thisObject.reduceSymbol(numSymbol);
				
				window.setTimeout(function (){
					menu.setMap(null);
				}, 10);
			});
		}, 10);
		
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
 * @param {google.maps.Data.Geometry} geomData
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
	 * @type {google.maps.Data.Geometry}
	 */
	this.geomData = geomData;
	
	/**
	 * @private
	 * @type {Object<string, number>|string}
	 */
	this.quantifyInfo;
	
	if(quantifyInfo == null){
		if(geomData instanceof google.maps.Data.Point){
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