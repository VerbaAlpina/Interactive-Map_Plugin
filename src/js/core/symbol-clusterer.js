//TODO mousover for polygons or line strings does not work

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
			var /** !MapSymbol */ mapSymbolNew = new MapSymbol(info.infoWindowContents, owner, info.markingColorIndex);
			var /** google.maps.LatLng */ pos = info.geomData.get();
			var /** number */ numSymbols = info.infoWindowContents.length;
			var /** number */ size = (numSymbols == 1? symbolSize: symbolManager.getLogSizeForCount(numSymbols));
			
			var /** {index: Array<number>, markingSize: number}*/ cindex = this.computeColorIndex(owner, info.markingColorIndex);
			var /** number */ totalSize = size + 2 * cindex.markingSize;
			var /** Object */ newMarker = mapInterface.createMarker(pos.lat(), pos.lng(), symbolManager.createSymbolURL(cindex.index, totalSize, cindex.markingSize), totalSize, movable, mapSymbolNew);
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

				var /** MapShape */ mapShapeNew = new MapShape(feature, info.infoWindowContents[s], owner);
				feature.setProperty("mapShape", mapShapeNew);
				feature.setProperty("id", id);
				
				otherOverlays.push(mapShapeNew);
				result.push(map.data.add(feature));
			}
			
			return result;
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
			return {index: result, markingSize: markingSize};
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
			var len_owners = currentElement.owners.length;
			if(currentElement == mapSymbol){
				if(len_owners == 1){
					if(currentElement.infoWindow != null)
						mapInterface.destroyInfoWindow(currentElement.infoWindow);
					mapInterface.destroyOverlay(currentElement.marker);
					arr.splice(i,1);
				}
				else {
					currentElement.reduceSymbol(i, 1);
					len_owners--;
				}
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
		for (var /** number */ i = arr.length - 1; i >= 0; i--){
			var /** MapSymbol */ currentElement = arr[i];
			var owners = currentElement.owners;
			var len_owners = owners.length;
			for (var /** number */ j = 0; j < len_owners; j++){
				if(owners[j] == owner){
					//All symbols with the same owner has to be in a row, so look for the index of the last element with the same owner
					for (var k = j + 1; k < len_owners; k++){
						if(owners[k] != owners[j])
							break;
					}
					var /** number */ numSymbols = k - j;
					
					if(len_owners == numSymbols){
						if(currentElement.infoWindow != null)
							mapInterface.destroyInfoWindow(currentElement.infoWindow);
						mapInterface.destroyOverlay(currentElement.marker);
						arr.splice(i,1);
					}
					else {
						currentElement.reduceSymbol(j, numSymbols);
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

     // HEXBUILDER //	

   var hexbuilder = false;

   if(hexbuilder){

	element.setQuantify(false);
	
	var target_length = Object.keys(this.polygrp).length;

	var hex_options = {

		target_number:target_length,
		map:map, 
		polygongrp: "testfile.wkt",  //either a set of polygons or hexagons(wkt) if hexagons => reload mode if polygons => buildmode
		hex_opacity: 0.6,						
		alternate_build: false, 				  // uses non-grid based algorithm to build hex overlay
		loaded_centers: "centers_NUTS_3.txt",  // if centers are needed otherwise than in reference mode
		reference_polygons:null,  				 // polygoncenters in .txt needs to be null for edit-overlay-mode
		legend_element:owner,					 // the legendelement, used to retrieve current colors
		manualcountrymode:false,				 //allows manual correction of country assignement
		reloadresultincountrymode:null			//a country assignement as json
	}


	//POLYGRPS:

	// polygongrp: owner  => BUILD MODE
	//"hexagone_NUTS3_manual.wkt"
	//"hexagone_Gemeinden_manuell.wkt"


	//REFERNCE_POLYGONS;



 	var hbuilder = new hexgonBuilder(hex_options);

  
		// HEXBUILDER //
		
     }

		else{

	
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
    	
      }
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
	   			if(state=="hex") map.setOptions({styles: style_for_hex_quantify});

		   		
		   	});
	   	}
   		else {
   			l_container.fadeOut('fast', function(){
				map.setMapTypeId(google.maps.MapTypeId.TERRAIN);

				if(state=="phy") mapInterface.resetStyle();
			    if(state=="hex") map.setOptions({"styles": noLabelStyle});

   		  
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

	       	if(state=="phy"){
	       		opacity=0.5;
	       		stroke_color = color;
	       	}
	       	if(state=="hex"){
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
 */

function MapShape (feature, infoWindowContent, owner){
	
	/** @type{?google.maps.InfoWindow} */
	this.infoWindow = null;
	
	/** @type{InfoWindowContent} */
	this.infoWindowContent = infoWindowContent;
	
	/** 
	* @private
	* @type {google.maps.Data.Feature}
	*/
	this.feature = feature;
	
	/** @type{LegendElement} */
	this.owner = owner;
	
	/**
	 * 
	 * @param {google.maps.MouseEvent} event
	 *
	 * @return {undefined} 
	 */
	this.openInfoWindow = function (event){
		
		var /** string */ id = /** @type{string} */ (this.feature.getProperty("id"));
		
			this.infoWindow = new google.maps.InfoWindow({
				content : "<div id='mapShape" + id + "'>" + this.infoWindowContent.getHtml(0) + "</div>" //TODO translate
			});	
		
		
		var /** @type{InfoWindowContent} */ infoWinContent = this.infoWindowContent;
		var /** google.maps.InfoWindow */ infoWin = this.infoWindow;
		var /** google.maps.Data.Feature */ feature = this.feature;

		google.maps.event.addListener(this.infoWindow, 'closeclick', function(){
			event.feature.setProperty("clicked", false);
			
			if(!event.feature.getProperty("hovered")){
			    event.feature.setProperty("highlighted", false);
			}
			
			infoWinContent.onClose(document.getElementById("mapShape" + id));
		});
		
		google.maps.event.addListener(this.infoWindow, 'domready', function(e){
			infoWinContent.onOpen(document.getElementById("mapShape" + id), 0, infoWin, feature);
		});

		this.infoWindow.setPosition(event.latLng);
		this.infoWindow.open(map);
	};
	
	/**
	 *
	 * @return {undefined} 
	 */
	this.destroyInfoWindow = function (){
		//Do nothing for InfoWindow
		//TODO also use InfoBubble and destroy here
		/*if(this.infoWindow != null){
			//Remove dom elements
			this.infoWindow.setMap(null);
		}*/
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
 */

function MapSymbol (infoWindowContents, owner, markingColorIndex){
	
	/** @type{Array<InfoWindowContent>} */
	this.infoWindowContents = [];
	
	/** 
	* @private
	* @type {Object}
	*/
	this.marker;
	
	/** 
	 * @private
	 * @type{Array<LegendElement>} 
	 * 
	 */
	this.owners = [];
	
	/**
	 * @private
	 * @type {Array<number>}
	 *
	 */
	this.markingColors = [];
	
	/**
	 * @private
	 * 
	 * @param {InfoWindowContent} infoWindow
	 * @param {LegendElement} owner
	 * @param {number} markingColorIndex
	 * @param {number=} index
	 * 
	 * @return {boolean}
	 */
	this.appendInfoWindow = function (infoWindow, owner, markingColorIndex, index){
		if(infoWindow.tryMerge(this, owner))
			return false;
		
		if(index === undefined){
			this.infoWindowContents.push(infoWindow);
			this.owners.push(owner);
			this.markingColors.push(markingColorIndex);
		}
		else {
			this.infoWindowContents.splice(index, 0, infoWindow);
			this.owners.splice(index, 0, owner);
			this.markingColors.splice(index, 0, markingColorIndex);
		}

		this.changeOwnerCount(owner, markingColorIndex, 1);

		return true;
	};
	
	/**
	 * @return {number}
	 */
	this.getNumOwners = function (){
		if(this.owners == null)
			return -1;
		
		return this.owners.length;
	}
	
	/**
	 * @param {number} index
	 * 
	 * @return {LegendElement}
	 */
	this.getOwner = function (index){
		if(this.owners == null)
			return null;
		
		return this.owners[index];
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
		var /** Map */ keyMap = new Map();

		for(var /** number */ i = 0; i < this.owners.length; i++){
			var /** LegendElement */ owner = this.owners[i];
			var /** string */ key = this.getOwnerKey(owner, this.markingColors[i]);
			var /** number */ count = this.ownerCount[key];
			
			var /** {index: Array<number>, markingSize: number}*/ cindex = symbolClusterer.computeColorIndex(owner, this.markingColors[i]);
			var /** number */ totalSize;
			if(count <= maxIdenticalIcons){
				totalSize = symbolSize + 2 * cindex.markingSize;
				symbols.push({url : (owner == null? "": symbolManager.createSymbolURL(cindex.index, totalSize, cindex.markingSize)), size : totalSize});
			}
			else {
				if(!keyMap.has(key)){
					var /** number */ size = symbolManager.getLogSizeForCount(count);
					totalSize = size + 2 * cindex.markingSize;
					symbols.push({url : (owner == null? "" : symbolManager.createSymbolURL(cindex.index, totalSize, cindex.markingSize)), size: totalSize});
					keyMap.set(key, true);
				}
			}
		}
		return symbols;
	};
	
	/**
	 * @type {Object<string, number>}
	 */
	this.ownerCount = {};
	
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
	 * @private
	 * 
	 * @param {LegendElement} owner
	 * @param {number} markingColorIndex
	 * @param {number} inc
	 * 
	 * @return {undefined}
	 */
	this.changeOwnerCount = function (owner, markingColorIndex, inc){
		var /** string */ key = this.getOwnerKey(owner, markingColorIndex);

		if(this.ownerCount[key] === undefined){
			this.ownerCount[key] = inc;
		}
		else {
			this.ownerCount[key] += inc;
			
			if(this.ownerCount[key] === 0){
				delete this.ownerCount[key];
			}
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
			this.infoWindow = null;
		}
		
		var /** boolean */ updateSymbol = false;
		for (var i = 0; i < info.infoWindowContents.length; i++){
			updateSymbol = this.appendInfoWindow(info.infoWindowContents[i], owner, info.markingColorIndex, (index === undefined? undefined: index++)) || updateSymbol;
		}
		
		if(updateSymbol)
			this.marker = mapInterface.updateMarker(this.marker, this.getSymbolURLs(), this);
	};
	

	/**
	 * @param {number} indexStart
	 * @param {number} numElements
	 * 
	 * @return {undefined}
	 */
	this.reduceSymbol = function (indexStart, numElements){
		for (var i = 0; i < numElements; i++){
			this.changeOwnerCount(this.owners[indexStart + i], this.markingColors[indexStart + i], -1);
		}
		
		this.owners.splice(indexStart, numElements);
		if(this.infoWindow != null){
			mapInterface.destroyInfoWindow(this.infoWindow);
			this.infoWindow = null;
		}
		this.infoWindowContents.splice(indexStart, numElements);
		this.markingColors.splice(indexStart, numElements);
		this.marker = mapInterface.updateMarker(this.marker, this.getSymbolURLs(), this);
	};
	
	/**
	 * @param {number} iconIndex
	 * 
	 * @return {undefined}
	 */
	this.openInfoWindow = function (iconIndex){
		if(this.infoWindow == null){
			var /** Array<Element> */ contents = [];
			var /** number */ contentIndex = -1;
			var /** number */ innerIndex = -1;
			var /** string */ lastOwnerKey = "";
			
			for(var /** number */ i = 0; i < this.infoWindowContents.length; i++){

				var /** string */ currentKey = this.getOwnerKey(this.owners[i], this.markingColors[i]);
				if(currentKey != lastOwnerKey || this.ownerCount[currentKey] <= maxIdenticalIcons){
					contentIndex++;
					innerIndex = 0;
				}
				else {
					innerIndex++;
				}

				var /** Element|string*/ html = this.infoWindowContents[i].getHtml(innerIndex);
				
				if(typeof html === "string")
					if (contents[contentIndex] == undefined)
						contents[contentIndex] = linkifyHtml(html);
					else
						contents[contentIndex] += "<br/><hr style='width: 100%; height: 3px; margin: 0 auto;'><br />" + linkifyHtml(html);
				else
					if (contents[contentIndex] == undefined){
						var /**Element*/ newElement = document.createElement("div");
						newElement.appendChild(html);
						contents[contentIndex] = newElement;
					}	
					else { 
						contents[contentIndex].appendChild(document.createElement("br"));
						contents[contentIndex].appendChild(document.createElement("br"));
						contents[contentIndex].appendChild(html);
					}
				
				lastOwnerKey = currentKey;
			}
			
			var /** Array<{url: string, size: number}>*/ symbols;
			if(this.owners == null){
				symbols = [{url: "", size : symbolSize}];
			}
			else {
				symbols = this.getSymbolURLs();
			}
			this.infoWindow = mapInterface.createInfoWindow (symbols, contents, this);
		}
		mapInterface.openInfoWindow(this.marker, this.infoWindow, iconIndex);
	};
	
	/**
	 *
	 * @return {undefined} 
	 */
	this.removeFocus = function (){
		legend.unhighlightAll();
		
		if(current_polygon && !current_polygon.getProperty('hovered') &&!current_polygon.getProperty('clicked'))
			current_polygon.setProperty('highlighted', false);
	};
	
	/**
	 * @param {number} iconIndex
	 * 
	 * @return {undefined} 
	 */
	this.focusOnEntryTo = function (iconIndex){
		if(this.owners != null)
			this.getLegendElement(iconIndex).highlight();

		if(current_polygon && !current_polygon.getProperty('highlighted')){
		    var poly = getPolygonFromDataPolygon(/** @type{google.maps.Data.Polygon|google.maps.Data.MultiPolygon} */ (current_polygon.getGeometry()));
			var latlng = this.marker.getPosition();
			if(google.maps.geometry.poly.containsLocation(latlng, poly)){
				current_polygon.setProperty('highlighted',true);
			}
		}
	};
	
	/** 
	 * @param {number} iconIndex Icon index on the map
	 * 
	 * @return {LegendElement|MultiLegendElement}
	 */
	this.getLegendElement = function (iconIndex){
		var /** LegendElement|MultiLegendElement */ legendEntry;
		if(this.owners.length == 1)
			legendEntry = this.owners[0];
		else {	
			legendEntry = this.owners[this.iconIndexToOwnerIndex(iconIndex)];
		}	
			
		return legendEntry;
	};
	
	/**
	 * 
	 * @param {number} iconIndex
	 * 
	 * @return {number}
	 */
	this.iconIndexToOwnerIndex = function (iconIndex){
		//Calculate owner index from symbol index (owners > maxIdenticalIcons are clustered in one symbol):
		var /** number */ ownerIndex = -1;
		while (ownerIndex < iconIndex){
			ownerIndex++;
			var /** string */ key = this.getOwnerKey(this.owners[ownerIndex], this.markingColors[ownerIndex]);
			var /** number */ ownerCount = this.ownerCount[key];
			
			if(ownerCount > maxIdenticalIcons){
				ownerIndex += (ownerCount - 1);
				iconIndex += (ownerCount - 1);
			}
		}
		return ownerIndex;
	}
	
	/**
	 * 
	 * @return {undefined}
	 */
	this.openSplitMultiSymbol = function (){
		var /** MapSymbol */ thisObject = this;
		var /** Array<ContextMenuItem> */ items = [];
		for (var i = 0; i < this.owners.length; i++){
			var /**string*/ htmlLabel = TRANSLATIONS["SEPARATE_SYMBOL"].replace("%d", "" + (i + 1)) + ": <img src='" + this.owners[i].symbolStandard +"' /> " + this.infoWindowContents[i].getName();
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
				var /** OverlayInfo */ newInfo = new OverlayInfo([thisObject.infoWindowContents[numSymbol]], newPoint, null, -1);
				
				var /** MapSymbol */ newSymbol = /** @type{MapSymbol} */ (symbolClusterer.addOverlay(newInfo, thisObject.owners[numSymbol], true));
				
				optionManager.addChange(new SplitMarkerOperation(thisObject, numSymbol, newInfo, thisObject.owners[numSymbol], newSymbol));
				
				thisObject.reduceSymbol(numSymbol, 1);
				
				window.setTimeout(function (){
					menu.setMap(null);
				}, 10);
			});
		}, 10);
		
	};

	for (var i = 0; i < infoWindowContents.length; i++){
		this.appendInfoWindow(infoWindowContents[i], owner, markingColorIndex);
	}

}

/**
 * @constructor
 * 
 * @param {Array<InfoWindowContent>} infoWindowContents
 * @param {google.maps.Data.Geometry} geomData
 * @param {Object<string, number>|string} quantifyInfo
 * @param {number} markingColorIndex
 *  
 */
function OverlayInfo (infoWindowContents, geomData, quantifyInfo, markingColorIndex){

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
 * @param {MapSymbol} mapSymbol
 * @param {LegendElement} owner
 *
 * @return {boolean} 
 */
InfoWindowContent.prototype.tryMerge = function (mapSymbol, owner){};

/**
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
 * @param {Element} tabContent
 * 
 * @return {undefined} 
 */
InfoWindowContent.prototype.onClose = function (tabContent) {};

/**
 * 
 * @return {Array<Object<string, string>>} 
 */
InfoWindowContent.prototype.getData = function () {};

/**
 * 
 * @return {string} 
 */
InfoWindowContent.prototype.getName = function () {};