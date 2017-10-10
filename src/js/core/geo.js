/**
 * @param {string} string
 *
 * @return {google.maps.Data.Point}
 */
function parsePoint(string) {
	string = string.replace("POINT(", "");
	string = string.replace(")", "");
	var /** Array<string> */ result = string.split(' ');
	if(result.length != 2)
		return null;
	return new google.maps.Data.Point(new google.maps.LatLng(result[1] * 1, result[0] * 1));
}

/**
 * Removes unneccesary whitespaces
 * 
 * @param {string} string 
 * 
 * @return {string}
 */

function geoDataToStrictFormat (string) {
	string = string.trim();
	
	string = string.replace(/, /g, ",");
	string = string.replace(/\) /g, ")");
	string = string.replace(/\( /g, "(");
	string = string.replace(/([A-Z]*) \(/g, "$1(");
	
	return string;
}

/**
 * Can only be used for strings that are exactly formated as those from the data base,
 * that is to say without any unneccesary whitespaces
 * 
 * @param {string} string 
 * 
 * @return {google.maps.Data.Geometry}
 */

function parseGeoData (string) {
	if(string.indexOf("MULTIPOLYGON") != -1){
		return parseMultiPolygon(string);
	}
	else if(string.indexOf("POLYGON") != -1){
		return parsePolygon(string);
	}
	else if(string.indexOf("MULTILINESTRING") != -1){
		return parseMultiLineString(string);
	}
	else if(string.indexOf("LINESTRING") != -1){
		return parseLineString(string);
	}
	else if(string.indexOf("POINT") != -1){
		return parsePoint(string);
	}
	return null;
}

/**
 * @param {string} string
 * 
 * @return {google.maps.Data.Polygon}
 */

function parsePolygon (string) {

	string = string.replace("POLYGON((","");
 	string = string.replace("))","");
	
	return new google.maps.Data.Polygon(parsePolygonCoords(string));
}

/**
 * @param {string} string 
 * 
 * @return {google.maps.Data.MultiPolygon}
 */

function parseMultiPolygon (string) {
	string = string.replace("MULTIPOLYGON(((","");
 	string = string.replace(")))","");
	
	/**
	 * @type {Array<string>} 
	 */	
 	var polygons = string.split(")),((");
 	
 	polygons[0].replace("((", "");
 	polygons[polygons.length-1].replace("))", "");
 	
 	/**
 	 * @type {Array<google.maps.Data.Polygon>} 
 	 */
 	var resultList = new Array();
 	
 	for (var i = 0; i < polygons.length; i++) {
		resultList.push(new google.maps.Data.Polygon(parsePolygonCoords(polygons[i])));
 	}
 	return new google.maps.Data.MultiPolygon(resultList);
}

/**
 * @param {string} string
 * 
 * @return {Array<Array<google.maps.LatLng>>} 
 */
function parsePolygonCoords (string){
	
	/**
	 * @type {Array<Array<google.maps.LatLng>>}
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
	 		coords[i].push(new google.maps.LatLng(coord[1] * 1, coord[0] * 1));
		}
 	}
 	return coords;
}

/**
 * @param {string} string
 * 
 * @return {Array<google.maps.LatLng>} 
 */
function parseLineCoords (string){
	/**
	 * @type {Array<google.maps.LatLng>} 
	 */
	var coords = new Array();
  	var values = string.split(",");
	for (var /** number */ j = 0; j < values.length; j++) {
	 	var /** Array<string> */ coord = values[j].split(" ");
	 	coords.push(new google.maps.LatLng(coord[1] * 1, coord[0] * 1));
 	}
 	return coords;
}

/**
 * @param {string} string
 * 
 * @return {google.maps.Data.MultiLineString} 
 */
function parseMultiLineString (string) {
	string = string.replace("MULTILINESTRING((","");
 	string = string.replace("))","");
	
	
	/**
	 * @type {Array<string>} 
	 */	
 	var polylines = string.split("),(");
 	/**
	 * @type {Array<Array<google.maps.LatLng>>} 
	 */
	var resultList = new Array(polylines.length);
 	
 	polylines[0].replace("(", "");
 	polylines[polylines.length-1].replace(")", "");
 	
 	for (var i = 0; i < polylines.length; i++) {
 		resultList[i] = parseLineCoords(polylines[i]);
 	}
 	return new google.maps.Data.MultiLineString(resultList);
}

/**
 * @param {string} string
 * 
 * @return {google.maps.Data.LineString} 
 */
function parseLineString (string) {
	string = string.replace("LINESTRING(","");
 	string = string.replace(")","");
	
 	return new google.maps.Data.LineString(parseLineCoords(string));
}

/**
 * 
 * @param {google.maps.Data.Polygon|google.maps.Data.MultiPolygon} dataPoly
 * @returns {google.maps.Polygon}
 */
function getPolygonFromDataPolygon (dataPoly){
	var /** Array<Array<google.maps.LatLng>>*/ paths = [];

	if(dataPoly instanceof google.maps.Data.Polygon){
		for (var k = 0; k < dataPoly.getLength(); k++){
			paths.push(dataPoly.getAt(k).getArray());
		}
	}
	else {
		for (var k = 0; k < dataPoly.getLength(); k++){
			var /**Array<google.maps.Data.LinearRing>*/ partArray = dataPoly.getAt(k).getArray();
			for (var l = 0; l < partArray.length; l++){
				paths.push(partArray[l].getArray());
			}
		}
	}

	return new google.maps.Polygon({
		"paths": paths
	});	
}