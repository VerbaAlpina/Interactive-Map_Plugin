/**
 * @struct
 * @constructor
 * 
 * @implements{UndoableOperation}
 * 
 * @param {MapSymbol} mapSymbol
 * @param {number} oldLat
 * @param {number} oldLng
 */
function MarkerDragOperation (mapSymbol, oldLat, oldLng){
	
	/**
	 * @type {MapSymbol}
	 */
	this.mapSymbol = mapSymbol;
	
	/**
	 * @type {number}
	 */
	this.oldLat = oldLat;
	
	/**
	 * @type {number}
	 */
	this.oldLng = oldLng;
	
	/**
	 * @override
	 * 
	 * @return {undefined}
	 */
	this.undo = function (){
		var /** Object */ marker = this.mapSymbol.getMarker();
		mapInterface.moveMarker(marker, this.oldLat, this.oldLng);
		mapInterface.centerOnOverlay(marker);
	}
	
	/**
	 * @override
	 * 
	 * @return {Array<{operation : string, id : string, category : number}>}
	 */
	this.getCommitInformation = function (){
		var /** Array<{operation : string, id : string, category : number}> */ result = [];
		for (var i = 0; i < this.mapSymbol.infoWindowContents.length; i++){
			result.push({
				operation : "markerMoved",
				id : /** @type{EditableInfoWindowContent} */ (this.mapSymbol.infoWindowContents[i]).markerID,
				//For new markers no category information is needed, since this operation will be joined with
				//the create operation anyway
				category : (this.mapSymbol.owners? this.mapSymbol.owners[i].category: -1),
				newPosition : mapInterface.getWKTStringForOverlay(this.mapSymbol.getMarker()),
				oldPosition : "POINT(" + this.oldLng + " " + this.oldLat + ")"
			});
		}
		
		return result;
	}
}