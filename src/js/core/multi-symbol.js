/**
 * 
 * @constructor
 * @struct
 * 
 * @param {Array<{canvas: HTMLCanvasElement, size: number}>} symbols
 * 
 */
function MultiSymbolLayout (symbols){
	
	/**
	 * @private
	 * @type {Array<{canvas: HTMLCanvasElement, size: number}>}
	 */
	this.symbols = symbols;
	
	/** 
	 * @private
	 * @type {Array<number>}
	 * 
	 * accumulated!!
	 */
	this.rowHeights = [];
	
	/** 
	 * @private
	 * @type {Array<number>}
	 * 
	 * accumulated!!
	 */
	this.colWidths = [];
	
	/**
	 * @private
	 * @type {Array<number>}
	 */
	this.xvals = [];
	
	/**
	 * @private
	 * @type {Array<number>}
	 */
	this.yvals = [];
	
	var /** number */ size = symbols.length;
	
	var /**number*/ root = Math.ceil(Math.sqrt(size));
	var /** number */ numCols = root;
	var /** number */ numRows = (root * root) - size < root? root: root - 1;
	
	for (var i = 0; i < numRows; i++){
		this.rowHeights[i] = 0;
	}
	
	for (i = 0; i < numCols; i++){
		this.colWidths[i] = 0;
	}
	
	var /** number */ rowIndex = 0;
	var /** number */ colIndex = 0;
	
	//Compute size of rows and columns
	for (i = 0; i < size; i++){
		var /** number */ currSize = symbols[i].size;
		if(this.colWidths[colIndex] < currSize)
			this.colWidths[colIndex] = currSize;
		
		if(this.rowHeights[rowIndex] < currSize)
			this.rowHeights[rowIndex] = currSize;
		
		colIndex = (colIndex + 1) % numCols;
		if(colIndex == 0){
			rowIndex++;
		}
	}
	
	//Accumulate sizes
	var /** number */ acc = 0; 
	for (var i = 0; i < numRows; i++){
		acc += this.rowHeights[i];
		this.rowHeights[i] = acc;
	}
	
	acc = 0;
	for (i = 0; i < numCols; i++){
		acc += this.colWidths[i];
		this.colWidths[i] = acc;
	}
	
	rowIndex = 0;
	colIndex = 0;
	
	//Exception for double symbols (both symbols are centered in y direction)
	if(size == 2){
		this.xvals[0] = this.colWidths[0] - symbols[0].size;
		this.yvals[0] = Math.floor(this.rowHeights[0] - symbols[0].size) / 2;
		this.xvals[1] = this.colWidths[0];
		this.yvals[1] = Math.floor(this.rowHeights[0] - symbols[1].size) / 2;
	}
	else {
		//Compute symbol positions
		for (i = 0; i < size; i++){
			currSize = symbols[i].size;
			
			if(colIndex == 0){
				this.xvals[i] = this.colWidths[0] - currSize;
			}
			else if (colIndex == numCols - 1){
				this.xvals[i] = this.colWidths[colIndex - 1];
			}
			else {
				this.xvals[i] = this.colWidths[colIndex] - currSize - Math.floor((this.colWidths[colIndex] -  this.colWidths[colIndex - 1] - currSize) / 2);
			}
			
			if(rowIndex == 0){
				this.yvals[i] = this.rowHeights[0] - currSize;
			}
			else if (rowIndex == numRows - 1){
				this.yvals[i] = this.rowHeights[rowIndex - 1];
			}
			else {
				this.yvals[i] = this.rowHeights[rowIndex] - currSize - Math.floor((this.rowHeights[rowIndex] -  this.rowHeights[rowIndex - 1] - currSize) / 2);
			}
			
			colIndex = (colIndex + 1) % numCols;
			if(colIndex == 0){
				rowIndex++;
			}
		}
	}
	
	/**
	 * @param {number} index
	 * 
	 * @return {HTMLCanvasElement}
	 */
	this.getIcon = function (index){
		return this.symbols[index]["canvas"];
	}
	
	/**
	 * 
     * @param {number=} scaleFactor
	 * 
	 * @return {number}
	 * 
	 */
	this.getWidth = function (scaleFactor){
		
		var /** number */ effScaleFactor;
		if (scaleFactor === undefined){
			effScaleFactor = 1;
		}
		else {
			effScaleFactor = 1 * symbolRescaleFactor /* 2 */  * scaleFactor /* 0.6 */;
		}
		
		return this.colWidths[numCols-1] * effScaleFactor;
	};
	
	/**
	 * 
	 * @param {number=} scaleFactor
	 * 
	 * @return {number}
	 */
	this.getHeight = function (scaleFactor){
		
		var /** number */ effScaleFactor;
		if (scaleFactor === undefined){
			effScaleFactor = 1;
		}
		else {
			effScaleFactor = 1 * symbolRescaleFactor /* 2 */  * scaleFactor /* 0.6 */;
		}
		
		return this.rowHeights[numRows-1] * effScaleFactor;
	};
	
	/**
	 * @param {number} index
	 * @param {number=} scaleFactor
	 * 
	 * @return {number}
	 */
	this.getXPosition = function (index, scaleFactor){
		
		var /** number */ effScaleFactor;
		if (scaleFactor === undefined){
			effScaleFactor = 1;
		}
		else {
			effScaleFactor = 1 * symbolRescaleFactor /* 2 */  * scaleFactor /* 0.6 */;
		}
		
		return this.xvals[index] * effScaleFactor;
	};
	
	/**
	 * @param {number} index
	 * @param {number=} scaleFactor
	 * 
	 * @return {number}
	 */
	this.getYPosition = function (index, scaleFactor){
		
		var /** number */ effScaleFactor;
		if (scaleFactor === undefined){
			effScaleFactor = 1;
		}
		else {
			effScaleFactor = 1 * symbolRescaleFactor /* 2 */  * scaleFactor /* 0.6 */;
		}
		
		return this.yvals[index] * effScaleFactor;
	};
	
	/**
	 * 
	 * @return {{canvas: HTMLCanvasElement, width: number, height: number}}
	 * 
	 */
	this.createMultiSymbol = function (){
		var /**HTMLCanvasElement*/ canvas = /** @type{HTMLCanvasElement}*/ (document.createElement("canvas"));
		canvas.width = this.getWidth() * symbolRescaleFactor;
		canvas.height = this.getHeight() * symbolRescaleFactor;
		var /** CanvasRenderingContext2D */ context = /** @type{CanvasRenderingContext2D}*/ (canvas.getContext("2d"));
		
		for (let i = 0; i < this.symbols.length; i++){
			context.drawImage(this.symbols[i]["canvas"], this.getXPosition(i) * symbolRescaleFactor, this.getYPosition(i) * symbolRescaleFactor);
		}
		
		return {"canvas": canvas, "width" : this.getWidth(), "height" : this.getHeight()};
	};
	
	/**
	 * @return {{type: string, coords: Array<number>}}
	 */
	this.getMarkerShape = function (){
		if(size % root == 0){
			return {
				"type" : "rect",
				"coords" : [0,0, this.getWidth(), this.getHeight()]
			};
		}
		else {
			var /** number */ fullLengthX = this.getWidth();
			var /** number */ fullLengthY = this.getHeight();
			var /** number */ shortLengthY = this.rowHeights[numRows - 2];
			var /** number */ shortLengthX = this.colWidths[(size % root) - 1];
			return {
				"type" : "poly",
				"coords" : [
					0, 0, 
					fullLengthX, 0, 
					fullLengthX, shortLengthY, 
					shortLengthX, shortLengthY,
					shortLengthX, fullLengthY,
					0, fullLengthY
					]
			};			
		}
	};
	
	/**
	 * 
	 * @param {number} markerCenterX
	 * @param {number} markerCenterY
	 * @param {number} mousePositionX
	 * @param {number} mousePositionY
	 * @param {number=} scaleFactor 
	 * 
	 * @return {number|boolean|string}
	 */
	this.computeIndexFromMousePosition = function (markerCenterX, markerCenterY, mousePositionX, mousePositionY, scaleFactor){
		
		var /** number */ effScaleFactor;
		if (scaleFactor === undefined){
			effScaleFactor = 1;
		}
		else {
			effScaleFactor = 1 * symbolRescaleFactor /* 2 */  * scaleFactor /* 0.6 */;
		}
		
		var /** number */ width = this.getWidth() * effScaleFactor;
		var /** number */ height = this.getHeight() * effScaleFactor;
		
		var /** number */ xval = mousePositionX - markerCenterX + (width / 2);
		var /** number */ yval = mousePositionY - markerCenterY + (height / 2);
		
		var /** number */ tolerance = 5;
		
		if (xval < 0 - tolerance
			|| yval < 0 - tolerance
			|| xval >= width + tolerance
			|| yval >= height + tolerance){
			return "out";
		}
		
		if (numRows > 1 && yval > this.rowHeights[numRows - 2] + tolerance && xval > this.colWidths[(this.symbols.length - 1) % numCols] + tolerance){
			//Within "hole"
			return false;
		}
		
		//As a precaution indexes are initiated with the highest possible value 
		//since they might be bigger than the maximum value because of rounding mistakes:
		var /** number */ indexX = numCols - 1;
		var /** number */ indexY = numRows - 1;
		
		for (var i = 0; i < numCols; i++){
			if(xval < this.colWidths[i] * effScaleFactor){
				indexX = i;
				break;
			}
		}
		
		for (i = 0; i < numRows; i++){
			if(yval < this.rowHeights[i] * effScaleFactor){
				indexY = i;
				break;
			}
		}
		
		var /** number */ result = indexX + indexY * numCols;
		if(result > size - 1)
			result = size - 1; //Result might be larger for the last pixel of the last symbol
		
		return result;
	};
}