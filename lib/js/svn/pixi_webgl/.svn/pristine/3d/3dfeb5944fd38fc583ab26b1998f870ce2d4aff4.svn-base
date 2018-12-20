
function loadData(path,callback){

var polygons = [];

$.getJSON(path, function( data ) {
		
	for(var j=0; j<data.features.length;j++){
			
		var feature = data.features[j];

			if(feature.geometry.type == "MultiPolygon"){

			var geo = feature.geometry.coordinates;

				for(var i=0; i<geo.length;i++){

					var poly = geo[i];
					var coords = poly[0];
					for(var k=0; k<coords.length;k++){
					   coords[k] = coords[k].reverse();	
					}

				}


			  polygons.push(feature);
			}

			else{

				var coords = feature.geometry.coordinates[0];
					for(var k=0; k<coords.length;k++){
					    coords[k] = coords[k].reverse();	
					}
					polygons.push(feature);
			}

		}

	callback(polygons);
	
});
	
}


