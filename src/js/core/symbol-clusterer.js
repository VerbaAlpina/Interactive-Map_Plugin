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
	 * 
	 * @return {undefined}
	 * 
	 */
	this.addOverlay = function(info, owner) {
		if(info.geomData instanceof google.maps.Data.Point){
			var /** number */ lat = info.geomData.get().lat();
			var /** number */ lng = info.geomData.get().lng();
			
			var /** Array<MapSymbol> */ arr = getArray(lat, lng);
			
			var /** number */ len = arr.length;
			for (var /** number */ i = 0; i < len; i++){
				var /** number */ distSquared = getDistanceOnGoogleMapSquared(arr[i].getMarker().getPosition().lat(), arr[i].getMarker().getPosition().lng(), lat, lng);
				if(distSquared < thresholdSquared){
					arr[i].appendSymbol(info, owner);
					break;
				}
			}
			if(i == len){
				var /** MapSymbol */ mapSymbolNew = new MapSymbol(createNewSingleMarker (info.geomData.get(), owner.symbolStandard), [info.infoWindowContent], [owner]);
				arr.push(mapSymbolNew);
			    mapSymbolNew.getMarker().setMap(map);	
			}
		}
		else {
			var /** Object */ options = {"geometry" : info.geomData};
			var /** google.maps.Data.Feature */ feature = new google.maps.Data.Feature (options);
			owner.googleFeatures.push(feature);

			var /** MapShape */ mapShapeNew = new MapShape(feature, info.infoWindowContent, owner);
			feature.setProperty("mapShape", mapShapeNew);
			
			otherOverlays.push(mapShapeNew);
			map.data.add(feature);
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
	 * @param {boolean} highlight
	 * 
	 * @return {undefined} 
	 */
	this.highlightSymbols = function (owner, highlight) {
		highlightSymbolsFromArray(outside, owner, highlight);
		
		var len = markerIndex.length;
		var len2 = markerIndex[0].length;
		for(var /** number */ i = 0; i < len; i++){
			for (var /** number */ j = 0; j < len2; j++){
				highlightSymbolsFromArray(markerIndex[i][j], owner, highlight);
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
			for (var /** number */ j = len_owners - 1; j >= 0; j--){
				if(owners[j] == owner){
					if(len_owners == 1){
						//Remove InfoWindow from DOM
						currentElement.destroyInfoWindow();
						//Remove marker from map
						currentElement.marker.setMap(null);
						//Remove array reference
						arr.splice(i,1);
					}
					else {
						currentElement.reduceSymbol(j);
						len_owners--;
					}
				}
			}
		}
	}
	
	/**
	 *
	 * @param {Array<MapSymbol>} arr
	 * @param {LegendElement} owner
	 * @param {boolean} highlight
	 * 
	 * @return {undefined}
	 *  
	 */
	function highlightSymbolsFromArray (arr, owner, highlight){
		for (var /** number */ i = arr.length - 1; i >= 0; i--){
			arr[i].highlight(owner, highlight);
		}
	}
	
//	//TODO change the following two function into one changePolygonAttribute function
//	/**
//	* @param {LegendElement} owner
//	* @param {number} opacity
//	*
//	* @return {undefined}
//	*/
//	this.changeOverlayOpacity = function (owner, opacity){
//		for (var /** number */ i = 0; i < owner.overlayInfos.length; i++){
//			var geo = owner.overlayInfos[i].geomData;
//			if(!(geo instanceof google.maps.LatLng))
//				if(geo instanceof Array)
//					for (var j = 0; j < geo.length; j++)
//						geo[j].setOptions({"fillOpacity" : opacity});
//				else
//					geo.setOptions({"fillOpacity" : opacity});
//		}
//	};
	
//	/**
//	* @param {LegendElement} owner
//	* @param {number} strokeWeight
//	*
//	* @return {undefined}
//	*/
//	this.changeOverlayStrokeWeight = function (owner, strokeWeight){
//		for (var /** number */ i = 0; i < owner.overlayInfos.length; i++){
//			var geo = owner.overlayInfos[i].geomData;
//			if(!(geo instanceof google.maps.LatLng))
//				if(geo instanceof Array)
//					for (var j = 0; j < geo.length; j++)
//						geo[j].setOptions({"strokeWeight" : strokeWeight});
//				else
//					geo.setOptions({"strokeWeight" : strokeWeight});
//		}
//	};
	
	
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
	 * @type{Array<google.maps.Data.Feature>}
	 */
	this.polygrp = new Array();	

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
		//**get number of legend elemnts with polygons


		var /** LegendElement|MultiLegendElement */ owner = element;
		this.polygrp = new Array();
	
		if(owner instanceof MultiLegendElement){
			var /** number */ numSub = owner.getNumSubElements();
			 for(var j = 0; j < numSub; j++){
				 var subowner = owner.getSubElement(j);
				 for(var k = 0; k < subowner.googleFeatures.length; k++){
					this.polygrp.push(subowner.googleFeatures[k]);
			 }	
		  }
		}
		else{
			for(var j = 0; j < owner.googleFeatures.length; j++){
				this.polygrp.push(owner.googleFeatures[j]);
			}
		}
	
		// //** Get all active markers
		var /** Array<OverlayInfo>*/ activeMapSymbols = [];
		var /** number */ overall_markers = 0; // not used
		var /** boolean */ fastquantify = true;
		var /** string */ ekey = element.key;

		for(var i = 0; i < legend.getLength(); i++){
			var element_l = legend.getElement(i);
			var markers = element_l.getOverlayInfos();
			for(var j = 0; j < markers.length; j++){

				if(markers[j].geomData instanceof google.maps.Data.Point){
				  activeMapSymbols.push(markers[j]);

					  if(markers[j].quantifyInfo[ekey] == null){
						  fastquantify = false;
					  }
				 }
			}
		}
	
		this.displayMarkers(false);
		this.polygrp.overall_markers = activeMapSymbols.length;

		if(element.quantify || update){
			for (var /** number */ j = 0; j < this.polygrp.length; j++){
				this.polygrp[j].markercount = 0;
			}

			this.polygrp.max_markers_in_one_poly=0;	

			if (fastquantify){
				for (var /** number */ i = 0; i < activeMapSymbols.length; i++){
					var marker = activeMapSymbols[i];
					var idx = marker.quantifyInfo[ekey];
					if(idx != -1){
						try {
							this.polygrp[idx].markercount++;
							if (this.polygrp[idx].markercount > this.polygrp.max_markers_in_one_poly){
								this.polygrp.max_markers_in_one_poly = this.polygrp[idx].markercount;
							}
						}
						catch (e){
							console.log(idx);
						}
		 			
					}
				}
			}
			else {
				var gPolygons = [];
				//** create google polygon objects before marker inside polygon test (small performance increase)

				for (var /** number */ i = 0; i < this.polygrp.length; i++){
					gPolygons.push(getPolygonFromDataPolygon(this.polygrp[i].getGeometry()));
				}

				//** Determine how many markers are inside each polygon and polygon grp 
				for (var /** number */ i = 0; i < activeMapSymbols.length; i++){
					var latlng = activeMapSymbols[i].geomData.get();
				
					for (var /** number */ j = 0; j < this.polygrp.length; j++){
						var poly = gPolygons[j];
						
						if(google.maps.geometry.poly.containsLocation(latlng, poly)){
							this.polygrp[j].markercount++;
							if(this.polygrp[j].markercount > this.polygrp.max_markers_in_one_poly){
								this.polygrp.max_markers_in_one_poly = this.polygrp[j].markercount;
							}
							break;
						}
					}	
				}
			}//else	    

			jQuery('#colorbarlegend_right').text(this.polygrp.max_markers_in_one_poly);

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
		
		if(l_container.css('display') == "none"){
		   	var /** number */ left = (jQuery('#IM_googleMap').width() / 2.0) - 128;
		   	l_container.css('left',left);
		   	l_container.fadeIn('fast', function(){
		   		map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
		   		map.setOptions({styles: style_for_quantify});
		   	});
	   	}
   		else {
   			l_container.fadeOut('fast', function(){
				map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
   		  		map.setOptions({styles: {}});
   			});
   		}
	};


	/**
	 * @param {boolean} linear_mapping
	 * 
	 * @return {undefined}
	 */
    this.changePolygonColor = function (linear_mapping){


	   for (var /** number */ i = 0; i < this.polygrp.length; i++){
		   
        	var /** number */ percentage = 0;	
        	var /** google.maps.Data.Feature */ feature = this.polygrp[i];

        	if(feature.markercount !==0 && feature.markercount){
            	if(linear_mapping){
            		percentage = feature.markercount / this.polygrp.overall_markers;
            	}	
            	else {
            		percentage = feature.markercount / this.polygrp.max_markers_in_one_poly;
            	}		   
            }	
       
    		var /** number */ idx = Math.floor(255 * percentage);
    		var /** Element */ canvas  = document.querySelector("#activediv canvas");
    		var /** CanvasRenderingContext2D */ ctx = canvas.getContext('2d');

	        var /** ImageData */ pix = ctx.getImageData(idx, 0, 1, 1);
	        var /**Uint8ClampedArray */ color_arr = pix.data;
	        	
	        var /** number*/ r = color_arr[0];
	        var /** number*/ g = color_arr[1];
	        var /** number*/ b = color_arr[2];

	        var /** number*/ a = color_arr[3];

	        var color = "rgb(" + r + "," + g + "," + b + ")";

	        if(a<255){ //color in gradient is opaque => change polygon alpha

	        	var /** number*/ alpha = Math.round((a/255)*10)/10;
	        	map.data.overrideStyle(feature,{
        		fillColor: color,
        		strokeColor: color,
        		fillOpacity: alpha,
        		strokeOpacity:alpha
	            });		
	        }

	        else{

        		map.data.overrideStyle(feature,{
        		fillColor: color,
        		strokeColor: color,
    			fillOpacity: 0.4,
        		strokeOpacity:0.4
	            });

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
 * @param {google.maps.LatLng} position
 * @param {string} symbol
 * 
 * @return {google.maps.Marker} 
 */
function createNewSingleMarker (position, symbol){
	 return new google.maps.Marker({
		position : position,
		icon : {
			url : symbol,
			origin: new google.maps.Point(0, 0),
			anchor: new google.maps.Point(symbolSize / 2, symbolSize/2) //TODO change her for custom symbol sizes
		}
	});


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
		if(this.infoWindow == null){
			this.infoWindow = new google.maps.InfoWindow({
				content : this.infoWindowContent.getHtmlString() //TODO translate
			});	
		}

		google.maps.event.addListener(this.infoWindow, 'closeclick', function(){
			event.feature.setProperty("clicked", false);
			
			if(!event.feature.getProperty("hovered")){
			    event.feature.setProperty("highlighted", false);
			}
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
 * @param {google.maps.Marker|RichMarker} marker
 * @param {Array<InfoWindowContent>} infoWindowContents 
 * @param {Array<LegendElement>} owners
 */

function MapSymbol (marker, infoWindowContents, owners){
	
	/** @type{Array<InfoWindowContent>} */
	this.infoWindowContents = infoWindowContents;
	
	/** 
	* @private
	* @type {google.maps.Marker|RichMarker}
	*/
	this.marker = marker;
	
	/** @type{Array<LegendElement>} */
	this.owners = owners;
	
	/**
	* @return {google.maps.Marker|RichMarker}
	*/
	this.getMarker = function (){
		return this.marker;
	};
	
	/** @type {?InfoBubble} */
	this.infoWindow = null;
	
	/**
	* @param {google.maps.Marker|RichMarker} newMarker
	* @param {boolean=} rebuild
	* 
	* @return {undefined}
	*/
	this.setMarker = function (newMarker, rebuild){
		google.maps.event.clearInstanceListeners(this.marker);
		this.marker.setMap(null);
		this.marker = newMarker;
		
		if(rebuild)
			this.rebuildMarker();
		
		google.maps.event.addListener(this.marker, 'click', this.openInfoWindow.bind(this));
		google.maps.event.addListener(this.marker, 'mouseover', this.focusOnEntryTo.bind(this));
		google.maps.event.addListener(this.marker, 'mouseout', this.removeFocusOnEntryTo.bind(this));
		this.marker.setMap(map);
	};
	
	/**
	 * @param {OverlayInfo} info
	 * @param {LegendElement} owner
	 * 
	 * @return {undefined} 
	 */
	this.appendSymbol = function (info, owner){
		
		this.infoWindow = null;
			
		if(info.infoWindowContent.tryMerge(this, owner)){
			return;
		}
		this.infoWindowContents.push(info.infoWindowContent);
		

		this.owners.push(owner);
		
		// Marker
		if(this.marker instanceof google.maps.Marker){
			var /** RichMarker */ combinedMarker = new RichMarker({
				position : info.geomData.get(),
				draggable: false,
				flat: true
			});
			combinedMarker.setShadow("none");
			this.setMarker(combinedMarker, true);
		}
		else {
			this.rebuildMarker ();
		}
	};
	
	/** 
	 *
	 * @param {LegendElement=} highlightOwner  
	 *
	 * @return {undefined} 
	 */
	this.rebuildMarker = function (highlightOwner){
		
		//Normal marker
		if(this.owners.length == 1){
			this.setMarker(createNewSingleMarker(this.marker.getPosition(), this.owners[0].symbolStandard), false);
		}
		//Rich marker
		else {
			var /** number */ len = this.owners.length;
			var /** number */ size = sizeTable[len];
			var /** number */ currentRow = 0;
			
			var /** Element */ res = document.createElement("div");
			var /** Element */ table = document.createElement("table");
			table["className"] = "IM_symbol_table";
			
			for (var /** number */ i = 0; i < size; i++){
				var /** Element */ row = document.createElement("tr");
				for (var /** number */ j = 0; j < size; j++){
					var currentIndex = currentRow + j;
					if(currentIndex >= len)
						break;
					else {
						var /** string */ icon = this.owners[currentIndex] == highlightOwner ? this.owners[currentIndex].symbolHighlighted : this.owners[currentIndex].symbolStandard;
						var /** Element */ col = document.createElement("td");
						var /** Element */ img = document.createElement("img");
						img["src"] = icon;
						img["style"]["cursor"] = "pointer";
						img.addEventListener("mouseover", function (index){
							indexInMultiSymbol = index;
						}.bind(this, currentIndex + 1));
						col.appendChild(img);
						row.appendChild(col);
					}
				}
				currentRow += size;
				table.appendChild(row);
			}
			res.appendChild(table);
			
			this.marker.setContent(res);
			
			this.marker.setAnchor (RichMarkerPosition.MIDDLE);
		}
	};
	
	/**
	 * @param {number} index
	 * 
	 * @return {undefined}
	 */
	this.reduceSymbol = function (index){
		this.owners.splice(index, 1);
		if(this.infoWindow != null){
			this.infoWindow.removeTab(index);
		}
		this.infoWindowContents.splice(index, 1);
		this.rebuildMarker();
	};
	
	/**
	 * @type {Array<number>} 
	 * 
	 * Avoids computing Math.ceil(Math.sqrt(symbolsUrls.length)) all the time
	 * 
	 * Works for combination up to 36 symbols
	 */
	var sizeTable = [0,1,2,2,2,3,3,3,3,3,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6];
	
	/**
	 * @private
	 *
	 * @return {undefined}
	 */
	this.openInfoWindow = function (){
		
		if(this.infoWindow == null){
			this.infoWindow = new InfoBubble({
			 "map" : map,
			 "position" : this.marker.getPosition(),
			 "minWidth" : 50
			});
			
		
			for(var /** number */ i = 0; i < this.infoWindowContents.length; i++){
				this.infoWindow.addTab('<img src="' + this.owners[i].symbolStandard + '" />', linkifyHtml(this.infoWindowContents[i].getHtmlString()));
				this.infoWindowContents[i].onOpen(this.infoWindow);
			}
		}

		var /** MapSymbol */ thisObject = this;
		google.maps.event.addListenerOnce(this.infoWindow, "closeclick", function (){
			for(var /** number */ i = 0; i < thisObject.infoWindowContents.length; i++){
				thisObject.infoWindowContents[i].onClose(thisObject.infoWindow);
			}
			google.maps.event.trigger(map.data, 'mouseout');
		});
		
		this.infoWindow.setTabActive(indexInMultiSymbol);
		this.infoWindow.open(map, this.marker);

	};
	
	/**
	 *
	 * @return {undefined} 
	 */
	this.destroyInfoWindow = function (){
		if(this.infoWindow != null){
			//Remove dom elements
			this.infoWindow.setMap(null);
		}
	};
	
	/**
	 *
	 * @return {undefined} 
	 */
	this.removeFocusOnEntryTo = function (){
		this.getLegendElement().unhighlight();
		
		if(current_polygon && !current_polygon.getProperty('hovered') &&!current_polygon.getProperty('clicked'))
			current_polygon.setProperty('highlighted', false);
	};
	
	/**
	 * 
	 * @return {undefined} 
	 */
	this.focusOnEntryTo = function (){
		//TODO if the mouse is above several symbols, all are highlighted in the legend, so indexMultiSymbol does not work correctly!!! Remove this var!!!
		this.getLegendElement().highlight();

		if(current_polygon && !current_polygon.getProperty('highlighted')){
		    var poly = getPolygonFromDataPolygon(/** @type{google.maps.Data.Polygon|google.maps.Data.MultiPolygon} */ (current_polygon.getGeometry()));
			var latlng = this.marker.getPosition();
			if(google.maps.geometry.poly.containsLocation(latlng, poly)){
				current_polygon.setProperty('highlighted',true);
			}
		}

	};
	
	/** 
	 * 
	 * @return {LegendElement|MultiLegendElement}
	 */
	this.getLegendElement = function (){
		var /** LegendElement|MultiLegendElement */ legendEntry;
		if(this.owners.length == 1)
			legendEntry = this.owners[0];
		else
			legendEntry = this.owners[indexInMultiSymbol - 1];
			
		return legendEntry;
	};
	
	google.maps.event.addListener(this.marker, 'click', this.openInfoWindow.bind(this));
	google.maps.event.addListener(this.marker, 'mouseover', this.focusOnEntryTo.bind(this));
	google.maps.event.addListener(this.marker, 'mouseout', this.removeFocusOnEntryTo.bind(this));
	
	/**
	 * @param {LegendElement} owner
	 * @param {boolean} b
	 * 
	 * @return {undefined}
	 */
	this.highlight = function (owner, b){
		if(this.owners.length == 1 && this.owners[0] == owner){
			this.marker.setIcon(/** @type{google.maps.Icon} */ ({
				url : (b? owner.symbolHighlighted : owner.symbolStandard),
				origin: new google.maps.Point(0, 0),
				anchor: new google.maps.Point(symbolSize / 2, symbolSize/2) //TODO change her for custom symbol sizes
			}));
		}
		else {
			if(b){
				this.rebuildMarker(owner);
			}	
			else
				this.rebuildMarker();
		}
	};


}

/**
 * @constructor
 * 
 * @param {InfoWindowContent} infoWindowContent
 * @param {google.maps.Data.Geometry} geomData
 * @param {Object<string, number>} quantifyInfo
 *  
 */
function OverlayInfo (infoWindowContent, geomData, quantifyInfo){

	/** 
	 * @type {InfoWindowContent}
	 */
	this.infoWindowContent = infoWindowContent;
	
	/** 
	 * @type {google.maps.Data.Geometry}
	 */
	this.geomData = geomData;
	
	/**
	 * @type {Object<string, number>}
	 */
	this.quantifyInfo = [];
	if(quantifyInfo != null)
		this.quantifyInfo = quantifyInfo;
}

/**
 * @interface
 *
 * @param {Object} data
 */
function InfoWindowContent (data){}
/**
 * @return {string}
 */
InfoWindowContent.prototype.getHtmlString = function (){};

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
 * @param {InfoBubble} infoWindow
 *
 * @return {undefined} 
 */
InfoWindowContent.prototype.onOpen = function (infoWindow) {};

/**
 * @param {InfoBubble} infoWindow
 * 
 * @return {undefined} 
 */
InfoWindowContent.prototype.onClose = function (infoWindow) {};

/**
 * 
 * @return {Array<Object<string, string>>} 
 */
InfoWindowContent.prototype.getData = function () {};