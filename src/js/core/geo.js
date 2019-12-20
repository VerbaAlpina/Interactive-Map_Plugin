/**
 * @interface
 */
function IMGeometry (){};

/**
 * @return {IMGeoData}
 */
IMGeometry.prototype.getGeometry = function (){}

/**
 * @return {IMGeoType}
 */
IMGeometry.prototype.getType = function (){};

/**
 * @return {boolean}
 */
IMGeometry.prototype.isPolygon = function (){};

/**
 * 
 * @struct
 * @constructor
 * 
 * @implements {IMGeometry}
 * 
 * @param {{lat: number, lng: number}} geoData
 * 
 */
function IMPoint (geoData){
	/**
	 * @private
	 * @const
	 * @type {{lat: number, lng: number}}
	 */
	this.geoData = geoData;
	
	/**
	 * @private
	 * @const
	 * @type {IMGeoType}
	 */
	this.type = IMGeoType.Point;
	
	/**
	 * @return {{lat: number, lng: number}}
	 */
	this.getGeometry = function (){
		return this.geoData;
	}
	
	/**
	 * @return {IMGeoType}
	 */
	this.getType = function (){
		return this.type;
	}
	
	/**
	 * @return {boolean}
	 */
	this.isPolygon = function (){
		return false;
	}
}

/**
 * 
 * @struct
 * @constructor
 * 
 * @implements {IMGeometry}
 * 
 * @param {Array<Array<{lat: number, lng: number}>>} geoData
 * @param {Array<{lat: number, lng: number}>=} boundingBox
 * 
 */
function IMPolygon (geoData, boundingBox){
	/**
	 * @private
	 * @const
	 * @type {Array<Array<{lat: number, lng: number}>>}
	 */
	this.geoData = geoData;
	
	/**
	 * @private
	 * @const
	 * @type {Array<{lat: number, lng: number}>|undefined}
	 */
	this.boundingBox = boundingBox;
	
	/**
	 * @private
	 * @const
	 * @type {IMGeoType}
	 */
	this.type = IMGeoType.Polygon;
	
	/**
	 * @return {Array<Array<{lat: number, lng: number}>>}
	 */
	this.getGeometry = function (){
		return this.geoData;
	}
	
	/**
	 * @return {Array<{lat: number, lng: number}>|undefined}
	 */
	this.getBoundingBox = function (){
		return this.boundingBox;
	}
	
	/**
	 * @return {IMGeoType}
	 */
	this.getType = function (){
		return this.type;
	}
	
	/**
	 * @return {boolean}
	 */
	this.isPolygon = function (){
		return true;
	}
}

/**
 * 
 * @struct
 * @constructor
 * 
 * @implements {IMGeometry}
 * 
 * @param {Array<Array<Array<{lat: number, lng: number}>>>} geoData
 * @param {Array<{lat: number, lng: number}>=} boundingBox
 * 
 */
function IMMultiPolygon (geoData, boundingBox){
	/**
	 * @private
	 * @const
	 * @type {Array<Array<Array<{lat: number, lng: number}>>>}
	 */
	this.geoData = geoData;
	
	/**
	 * @private
	 * @const
	 * @type {Array<{lat: number, lng: number}>|undefined}
	 */
	this.boundingBox = boundingBox;
	
	/**
	 * @private
	 * @const
	 * @type {IMGeoType}
	 */
	this.type = IMGeoType.MultiPolygon;
	
	/**
	 * @return {Array<Array<Array<{lat: number, lng: number}>>>}
	 */
	this.getGeometry = function (){
		return this.geoData;
	}
	
	/**
	 * @return {Array<{lat: number, lng: number}>|undefined}
	 */
	this.getBoundingBox = function (){
		return this.boundingBox;
	}
	
	/**
	 * @return {IMGeoType}
	 */
	this.getType = function (){
		return this.type;
	}
	
	/**
	 * @return {boolean}
	 */
	this.isPolygon = function (){
		return true;
	}
}

/**
 * 
 * @struct
 * @constructor
 * 
 * @implements {IMGeometry}
 * 
 * @param {Array<Array<{lat: number, lng: number}>>} geoData
 * 
 */
function IMMultiLineString (geoData){
	/**
	 * @private
	 * @const
	 * @type {Array<Array<{lat: number, lng: number}>>}
	 */
	this.geoData = geoData;
	
	/**
	 * @private
	 * @const
	 * @type {IMGeoType}
	 */
	this.type = IMGeoType.MultiLineString;
	
	/**
	 * @return {Array<Array<{lat: number, lng: number}>>}
	 */
	this.getGeometry = function (){
		return this.geoData;
	}
	
	/**
	 * @return {IMGeoType}
	 */
	this.getType = function (){
		return this.type;
	}
	
	/**
	 * @return {boolean}
	 */
	this.isPolygon = function (){
		return false;
	}
}

/**
 * 
 * @struct
 * @constructor
 * 
 * @implements {IMGeometry}
 * 
 * @param {Array<{lat: number, lng: number}>} geoData
 * 
 */
function IMLineString (geoData){
	/**
	 * @private
	 * @const
	 * @type {Array<{lat: number, lng: number}>}
	 */
	this.geoData = geoData;
	
	/**
	 * @private
	 * @const
	 * @type {IMGeoType}
	 */
	this.type = IMGeoType.LineString;
	
	/**
	 * @return {Array<{lat: number, lng: number}>}
	 */
	this.getGeometry = function (){
		return this.geoData;
	}
	
	/**
	 * @return {IMGeoType}
	 */
	this.getType = function (){
		return this.type;
	}
	
	/**
	 * @return {boolean}
	 */
	this.isPolygon = function (){
		return false;
	}
}


/**
 * @constructor
 * @struct
 * 
 */
function GeoManager (){

	/**
	 * Removes unneccesary whitespaces
	 * 
	 * @private
	 * 
	 * @param {string} string 
	 * 
	 * @return {string}
	 */
	this.geoDataToStrictFormat = function (string) {
		string = string.trim();
		
		string = string.replace(/, /g, ",");
		string = string.replace(/\) /g, ")");
		string = string.replace(/\( /g, "(");
		string = string.replace(/([A-Z]*) \(/g, "$1(");
		
		return string;
	};
	
	/**
	 * Can only be used for strings that are exactly formated as those from the data base,
	 * that is to say without any unneccesary whitespaces
	 * 
	 * @param {string} string 
	 * @param {Array<{lat: number, lng: number}>=} boundingBox
	 * 
	 * @return {IMGeometry}
	 */
	this.parseGeoDataFormated = function (string, boundingBox) {
		if(string.indexOf("MULTIPOLYGON") != -1){
			return this.parseMultiPolygon(string, boundingBox);
		}
		else if(string.indexOf("POLYGON") != -1){
			return this.parsePolygon(string, boundingBox);
		}
		else if(string.indexOf("MULTILINESTRING") != -1){
			return this.parseMultiLineString(string);
		}
		else if(string.indexOf("LINESTRING") != -1){
			return this.parseLineString(string);
		}
		else if(string.indexOf("POINT") != -1){
			return this.parsePoint(string);
		}
		return null;
	};
	
	/**
	 * @param {string} string 
	 * 
	 * @return {IMGeometry}
	 */
	this.parseGeoDataUnformated = function (string) {
		return this.parseGeoDataFormated(this.geoDataToStrictFormat(string), undefined);
	}
	
	/**
	 * @private
	 * @param {string} string
	 *
	 * @return {IMPoint}
	 */
	this.parsePoint = function (string) {
		string = string.replace("POINT(", "");
		string = string.replace(")", "");
		var /** Array<string> */ result = string.split(' ');
		if(result.length != 2)
			return null;
		return new IMPoint ({"lat" : result[1] * 1, "lng" : result[0] * 1});
	};


	/**
	 * @private
	 * @param {string} string
	 * @param {Array<{lat: number, lng: number}>=} boundingBox
	 * 
	 * @return {IMPolygon}
	 */
	
	this.parsePolygon = function (string, boundingBox) {
		string = string.replace("POLYGON((","");
	 	string = string.replace("))","");
		
		return new IMPolygon(this.parsePolygonCoords(string), boundingBox);
	}


	/**
	 * @private
	 * 
	 * @param {string} string 
	 * 
	 * @return {IMMultiPolygon}
	 */
	this.parseMultiPolygon = function (string, boundingBox) {
		string = string.replace("MULTIPOLYGON(((","");
	 	string = string.replace(")))","");
		
		/**
		 * @type {Array<string>} 
		 */	
	 	var polygons = string.split(")),((");
	 	
	 	polygons[0].replace("((", "");
	 	polygons[polygons.length-1].replace("))", "");
	 	
	 	/**
	 	 * @type {Array<Array<Array<{lat: number, lng: number}>>>} 
	 	 */
	 	var resultList = new Array();
	 	
	 	for (var i = 0; i < polygons.length; i++) {
			resultList.push(this.parsePolygonCoords(polygons[i]));
	 	}
	 	return new IMMultiPolygon(resultList, boundingBox);
	}

	/**
	 * @private
	 * 
	 * @param {string} string
	 * 
	 * @return {Array<Array<{lat: number, lng: number}>>} 
	 */
	this.parsePolygonCoords = function (string){
		
		/**
		 * @type {Array<Array<{lat: number, lng: number}>>}
		 */
	 	var coords = new Array();
		/**
		 * @type {Array<string>} 
		 */
		var polygons = string.split("),(");
		
		for (var /** number */ i = 0; i < polygons.length; i++) {
	  		coords[i] = new Array();
	  		var values = polygons[i].split(",");
			for (var /** number */ j = 0; j < values.length; j++) {
		 		var /** Array<string> */ coord = values[j].split(" ");
		 		coords[i].push({"lat" : coord[1] * 1, "lng" : coord[0] * 1});
			}
	 	}
	 	return coords;
	}

	/**
	 * @private
	 * 
	 * @param {string} string
	 * 
	 * @return {Array<{lat: number, lng: number}>} 
	 */
	this.parseLineCoords = function (string){
		/**
		 * @type {Array<{lat: number, lng: number}>} 
		 */
		var coords = new Array();
	  	var values = string.split(",");
		for (var /** number */ j = 0; j < values.length; j++) {
		 	var /** Array<string> */ coord = values[j].split(" ");
		 	coords.push({"lat" : coord[1] * 1, "lng" : coord[0] * 1});
	 	}
	 	return coords;
	}

	/**
	 * @private
	 * 
	 * @param {string} string
	 * 
	 * @return {IMMultiLineString} 
	 */
	this.parseMultiLineString = function (string) {
		string = string.replace("MULTILINESTRING((","");
	 	string = string.replace("))","");
		
		
		/**
		 * @type {Array<string>} 
		 */	
	 	var polylines = string.split("),(");
	 	/**
		 * @type {Array<Array<{lat: number, lng: number}>>} 
		 */
		var resultList = new Array(polylines.length);
	 	
	 	polylines[0].replace("(", "");
	 	polylines[polylines.length-1].replace(")", "");
	 	
	 	for (var i = 0; i < polylines.length; i++) {
	 		resultList[i] = this.parseLineCoords(polylines[i]);
	 	}
	 	return new IMMultiLineString(resultList);
	}
	
	
	/**
	 * @private
	 * 
	 * @param {string} string
	 * 
	 * @return {IMLineString} 
	 */
	this.parseLineString = function (string) {
		string = string.replace("LINESTRING(","");
	 	string = string.replace(")","");
		
	 	return new IMLineString(this.parseLineCoords(string));
	}
	
	/**
	 * @param {IMPoint} point
	 * @param {IMPolygon|IMMultiPolygon} polygon
	 * 
	 * @return {boolean}
	 */
	this.pointInPolygon = function (point, polygon){
		console.log(point);
		console.log(polygon);
		var /** {lat: number, lng: number} */ geoDataPoint = point.getGeometry();
		
		switch(polygon.getType()){
			case IMGeoType.Polygon:
				var /** Array<Array<{lat: number, lng: number}>>*/ geoDataPolygon = polygon.getGeometry();
				return this.generalPolygonTest(geoDataPoint, geoDataPolygon);

			case IMGeoType.MultiPolygon:
				var /** Array<Array<Array<{lat: number, lng: number}>>>*/ geoDataMultiPolygon = polygon.getGeometry();
				var /** number */ len = geoDataMultiPolygon.length;
				for (var i = 0; i < len; i++){
					if(this.generalPolygonTest(geoDataPoint, geoDataMultiPolygon[i])){
						return true;
					}
				}
		}
		return false;
	}
	
	/**
	 * @private
	 * 
	 * @param {{lat: number, lng: number}} pointData
	 * @param {Array<Array<{lat: number, lng: number}>>} polygonData
	 * 
	 * @return {boolean}
	 * 
	 */
	this.generalPolygonTest = function (pointData, polygonData){
		//Outer ring:
		if(!this.simplePolygonTest(pointData, polygonData[0])){
			return false;
		}
		
		//Inner rings
		var /** number */ len = polygonData.length;
		for (var i = 1; i < len; i++){
			if (this.simplePolygonTest(pointData, polygonData[i])){
				return false;
			}
		}
		return true;
	}
	
	/**
	 * @private
	 * 
	 * @param {{lat: number, lng: number}} pointData
	 * @param {Array<{lat: number, lng: number}>} polygonData
	 * 
	 * Code from here https://github.com/substack/point-in-polygon
	 * 
	 * @return {boolean}
	 */
	this.simplePolygonTest = function (pointData, polygonData){
		var x = pointData["lat"], y = pointData["lng"];
	    
	    var inside = false;
	    for (var i = 0, j = polygonData.length - 1; i < polygonData.length; j = i++) {
	        var xi = polygonData[i]["lat"], yi = polygonData[i]["lng"];
	        var xj = polygonData[j]["lat"], yj = polygonData[j]["lng"];
	        
	        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
	        
	        if (intersect) 
	        	inside = !inside;
	    }
	    
	    return inside;
	};
}