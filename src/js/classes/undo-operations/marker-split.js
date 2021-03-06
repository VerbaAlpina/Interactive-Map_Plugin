/**
 * @struct
 * @constructor
 * 
 * @implements{UndoableOperation}
 * 
 * @param {MapSymbol} originalSymbol
 * @param {number} index
 * @param {OverlayInfo} infoSplittedSymbol
 * @param {LegendElement} ownerSplittedSymbol
 * @param {MapSymbol} newSymbol
 */
function SplitMarkerOperation (originalSymbol, index, infoSplittedSymbol, ownerSplittedSymbol, newSymbol){
	
	/**
	 * @type {MapSymbol}
	 */
	this.originalSymbol = originalSymbol;
	
	/**
	 * @type {string}
	 */
	this.oldPosition = mapInterface.getWKTStringForOverlay(originalSymbol.getMarker());
		
	/**
	 * @type {number}
	 */
	this.index = index;
	
	/**
	 * @type {OverlayInfo}
	 */
	this.infoSplittedSymbol = infoSplittedSymbol;
	
	/**
	 * @type {LegendElement}
	 */
	this.ownerSplittedSymbol = ownerSplittedSymbol;
	
	/**
	 * @type {MapSymbol}
	 */
	this.newSymbol = newSymbol;
	
	/**
	 * @override
	 * 
	 * @param {boolean} undoAll
	 * 
	 * @return {undefined}
	 */
	this.undo = function (undoAll){
		mapInterface.centerOnOverlay(originalSymbol.getMarker());
		this.originalSymbol.appendSymbol(this.infoSplittedSymbol, this.ownerSplittedSymbol, this.index);
		symbolClusterer.removeSingleMapSymbol(newSymbol);
	}
	
	/**
	 * @override
	 * 
	 * @return {Array<{operation : string, id : string, category : number}>}
	 */
	this.getCommitInformation = function (){
		return [{
			"operation" : "markerMoved",
			"id" : /** @type{EditableInfoWindowContent} */ (this.newSymbol.parts[0].infoWindows[0]).markerID, //TODO check
			"category" : this.ownerSplittedSymbol.category,
			"newPosition" : mapInterface.getWKTStringForOverlay(this.newSymbol.getMarker()),
			"oldPosition" : this.oldPosition
		}];
	};
}