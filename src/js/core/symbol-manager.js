/**
 * @constructor
 *
 * @param {ColorScheme} colorScheme
 */

function SymbolManager(colorScheme) {

	//Point Symbols

	var/** number */ numMain = colorScheme.getNumCombinations(features_classes.main);
	var/** number */ numSub = colorScheme.getNumCombinations(features_classes.sub);
	var/** number */ numAdd = colorScheme.getNumCombinations(features_classes.add);

	var/** number */ numCols = colorScheme.getNumPolygonColors();

	//Point Symbols
	var/** number */
	nextMainFeature;
	//Used for symbols without sub-categories
	var/** number */
	mainFeatureForSingularSymbols;
	
	
	var/** Array<number> */ numFreeSubFeatures = new Array(numMain);
	var/** Array<Array<boolean>> */ freeSubFeatures = new Array(numMain);
	var/** Array<number> */ firstFreeSubFeature = new Array(numMain);
	for (var/** number */ i = 0; i < numMain; i++) {
		freeSubFeatures[i] = new Array(numSub);
	}
	
	//Parameters a and b for the function 2 (a log(x) + b) + 1 that is used to compute the symbol size from the number of symbols
	var /** number */ x1 = 2;
	var /** number */ y1 = symbolSize * (1 + minimumSymbolEnlargement / 100) / 2;
	var /** number */ x2 = 100;
	var /** number */ y2 = symbolSize * (1 + decSymbolEnlargement / 100) / 2;
	
	var /** number */ a = (y1 - y2) / (Math.log(x1) - Math.log(x2));
	var /** number */ b = y1 - a * Math.log(x1);

	//Other overlays
	var/**Array<number> */ firstFreeColor = new Array(num_overlay_types);
	var/**Array<Array<boolean>> */ freeColors = new Array(num_overlay_types);
	for (i = 1; i < num_overlay_types; i++) {
		freeColors[i] = new Array(numCols);
	}
	
	/**
	 * @private
	 * 
	 * @type {Map<string, string>}
	 */
	this.symbolBuffer = new Map();

	this.resetFreeFeatures = function() {

		//Point symbols
		nextMainFeature = 0;
		mainFeatureForSingularSymbols = -1;
		for (var i = 0; i < numMain; i++) {
			numFreeSubFeatures[i] = numSub;
			for (var j = 0; j < numSub; j++) {
				freeSubFeatures[i][j] = true;
			}
			firstFreeSubFeature[i] = 0;
		}

		//Polygons and Line Strings
		for (var i = 1; i < num_overlay_types; i++) {
			firstFreeColor[i] = 0;
			for (var j = 0; j < numCols; j++) {
				freeColors[i][j] = true;
			}
		}
	};

	this.resetFreeFeatures();

	/**
	 * @param {number} type
	 * @param {number=} index
	 *
	 * @return {number}
	 */
	this.blockColor = function(type, index) {
		if (index == null) {
			if (firstFreeColor[type] >= freeColors[type].length)
				throw "No color for polygons left!"; //TODO polygon OR line string
			index = firstFreeColor[type];
			nextColor(type);
			return index + (numCols * (type - 1)); //Create unique color indexes
		}

		var /** number */ relativeIndex = index - (numCols * (type - 1));
		if(relativeIndex < 0 || relativeIndex >= numCols){
			throw "Index not valid for this overlay type!";
		}
		
		if (relativeIndex == firstFreeColor[type]) {
			nextColor(type);
		} else {
			freeColors[type][relativeIndex] = false;
		}
		return index;
	};
	
	/**
	 * @param {number} type
	 * @param {number} number
	 * 
	 * @return {Array<number>} 
	 */
	this.blockColors = function (type, number){
		if(number == 0){
			return [];
		}
		
		var /** Array<number>*/ indexes = new Array(number);
		for (var i = 0; i < number; i++){
			indexes[i] = this.blockColor(type);
		}
		return indexes;
	};

	/**
	 * @param {number} type
	 */
	function nextColor(type) {
		freeColors[type][firstFreeColor[type]] = false;
		firstFreeColor[type]++;
		while (firstFreeColor[type] < freeColors[type].length && !freeColors[type][firstFreeColor[type]])
		firstFreeColor[type]++;
	};

	/**
	 * @param {number} type
	 * @param {number} index
	 */
	this.unblockColor = function(type, index) {
		var /** number */ relativeIndex = index - (numCols * (type - 1));
		
		freeColors[type][relativeIndex] = true;
		if (relativeIndex < firstFreeColor[type])
			firstFreeColor[type] = relativeIndex;
	};
	
	/** @param {number} index
	 *
	 *  @return {string} 
	 */
	this.getPolygonColorString = function (index){
		var /** Array<number> */ colorArray = colorScheme.getPolygonColor(index % numCols);
		return '#' + decimalToHex(colorArray[0]) + decimalToHex(colorArray[1]) + decimalToHex(colorArray[2]);
	};
	
	/** @param {number} index
	 *
	 *  @return {Array<number>} 
	 */
	this.getMarkingColor = function (index){
		return /**@type{Array<number>}*/ (colorScheme.getSingleFeature(features_classes.add, index)["mcolor"]); //TODO make this more flexible!!!!!
	};
	
	/** @param {number} index
	 *
	 *  @return {string} 
	 */
	this.getMarkingColorString = function (index){
		var /** Array<number>*/ colorArray = this.getMarkingColor(index);
		return '#' + decimalToHex(colorArray[0]) + decimalToHex(colorArray[1]) + decimalToHex(colorArray[2]);
	};

	/**
	 * @param {number} numSubCategories
	 * @param {boolean} singular If this element has no sub-elements e.g. informant positions
	 * @param {number=} mainIndex
	 *
	 * @return {Array<Array<number>>} array of indexes for main, sub and add, e.g. [[1,5,0], [1,6,1]]
	 */

	this.blockFeatureCombinations = function(numSubCategories, singular, mainIndex) {
		if(numSubCategories == 0)
			return [];
		
		if (mainIndex == null) {
			return getNewSymbols(numSubCategories, singular);
		} else {
			numFreeSubFeatures[mainIndex] -= numSubCategories;
			return getNewIndexes(mainIndex, numSubCategories);

		}
	};
	
	/**
	 * @param {Array<number>|number} index
	 * 
	 * @return {Array<number>|number}
	 */
	this.blockExplicitIndex = function (index){
		if(jQuery.isArray(index)){ //Point symbol
			freeSubFeatures[index[0]][index[1]] = false;
			numFreeSubFeatures[index[0]]--;
			if(nextMainFeature == index[0])
				increaseNextMainFeature();
		}
		else { //Polygon or LineString
			this.blockExplicitSingularIndex(index); //Polygons and LineStrings can be treated as singular
		}
		return index;
	};
	
	/**
	 * @param {Array<number>|number} index
	 * 
	 * @return {Array<number>|number}
	 */
	this.blockExplicitSingularIndex = function (index){
		if(jQuery.isArray(index)){ //Point symbol
			freeSubFeatures[index[0]][index[1]] = false;
			numFreeSubFeatures[index[0]]--;
			if (mainFeatureForSingularSymbols == -1) {
				mainFeatureForSingularSymbols = index[0];
				if(nextMainFeature == mainFeatureForSingularSymbols)
					increaseNextMainFeature();
			}
		}
		else { //Polygon or LineString
			var /** number*/ type = Math.floor(index / numCols) + 1;
			var /** number */ relativeIndex = index - (numCols * (type - 1));
			if(firstFreeColor[type] == index){
				nextColor(type);
			}
			else {
				freeColors[type][relativeIndex] = false;
			}
		}
		return index;
	};

	/**
	 * @param {number} numSubToGet
	 * @param {boolean} singular If this element has no sub-elements e.g. informant positions
	 *
	 * @return {Array<Array<number>>}
	 */
	function getNewSymbols(numSubToGet, singular) {
		if (nextMainFeature == -1)
			throw "No symbols left!";

		if (singular == 1) {
			if (mainFeatureForSingularSymbols == -1) {
				mainFeatureForSingularSymbols = nextMainFeature;
				increaseNextMainFeature();
			}
			if (numFreeSubFeatures[mainFeatureForSingularSymbols] > 0) {
				numFreeSubFeatures[mainFeatureForSingularSymbols]--;
				return getNewIndexes(mainFeatureForSingularSymbols, 1);
			}
			//If all combinations for singular symbols are already in use, the symbol is treated like any other
		}

		if (numFreeSubFeatures[nextMainFeature] >= numSubToGet) {
			var/** Array<Array<number>> */ res = getNewIndexes(nextMainFeature, numSubToGet);
			numFreeSubFeatures[nextMainFeature] -= numSubToGet;
			increaseNextMainFeature();
			return res;
		} else {
			for (var i = nextMainFeature + 1; i != nextMainFeature; i = (i + 1) % numMain) {
				if (numFreeSubFeatures[i] >= numSubToGet) {
					numFreeSubFeatures[i] -= numSubToGet;
					break;
				}
			}
			if (i == nextMainFeature){
				throw "Not enough symbols left!";
			}

			return getNewIndexes(i, numSubToGet);
		}
	}

	function increaseNextMainFeature() {
		nextMainFeature = (nextMainFeature + 1) % numMain;
		var/** number */ numIterations = 0;
		
		//First look for a completely free main feature
		while (numFreeSubFeatures[nextMainFeature] != numSub) {
			nextMainFeature = (nextMainFeature + 1) % numMain;
			numIterations++;
			
			//Skip value for singular symbols
			if (nextMainFeature == mainFeatureForSingularSymbols)
				continue;
				
			if (numIterations >= numMain)
				break;
		}
		if(numIterations < numMain)
			return;
		
		//If not look for any main feature with free sub-features
		numIterations = 0;
		while (numFreeSubFeatures[nextMainFeature] == 0) {
			nextMainFeature = (nextMainFeature + 1) % numMain;
			numIterations++;
			
			//Skip value for singular symbols
			if (nextMainFeature == mainFeatureForSingularSymbols)
				continue;

			if (numIterations >= numMain) {
				//Use value for singular values if it is the only one left
				if (numFreeSubFeatures[mainFeatureForSingularSymbols] > 0) {
					nextMainFeature = mainFeatureForSingularSymbols;
				} else {
					nextMainFeature = -1;
				}
				break;
			}
		}
	}

	/**
	 * @param {number} mainIndex
	 * @param {number} numSubComb
	 *
	 * @return {Array<Array<number>>}
	 */
	function getNewIndexes(mainIndex, numSubComb) {
		var foundIndexes = 0;
		var res = new Array(numSubComb);
		var subArray = freeSubFeatures[mainIndex];
		for (var i = 0; i < numSub; i++) {
			if (subArray[i]) {
				subArray[i] = false;
				res[foundIndexes++] = [mainIndex, i, 0];
				if (foundIndexes == numSubComb)
					break;
			}
		}
		return res;
	}

	/**
	 * @param {number} mainIndex
	 * @param {number} subIndex
	 */
	this.unblockFeatureCombination = function(mainIndex, subIndex) {
		freeSubFeatures[mainIndex][subIndex] = true;
		numFreeSubFeatures[mainIndex]++;
		
		if(numFreeSubFeatures[mainIndex] == numSub){
			if(nextMainFeature > mainIndex)
				nextMainFeature = mainIndex;
			if(mainIndex == mainFeatureForSingularSymbols){
				mainFeatureForSingularSymbols = -1;
			}
		}

		if (nextMainFeature == -1 || nextMainFeature == mainFeatureForSingularSymbols) {
			nextMainFeature = mainIndex;
		}
	};


	/**
	 * @param {string} hex
	 * @param {number} lum
	 */

     this.ColorLuminance = function(hex, lum) {

			hex = String(hex).replace(/[^0-9a-f]/gi, '');
			if (hex.length < 6) {
			hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
			}
			lum = lum || 0;

			var rgb = "#", c, i;
			for (i = 0; i < 3; i++) {
			c = parseInt(hex.substr(i*2,2), 16);
			c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
			rgb += ("00"+c).substr(c.length);
			}

			return rgb;
      }


	/**
	 * @param {Array<number>|number} color_array
	 */

      this.checkContrast = function(color_array) {

		// http://www.w3.org/TR/AERT#color-contrast
		var o = Math.round(((parseInt(color_array[0],10) * 299) +
		              (parseInt(color_array[1],10) * 587) +
		              (parseInt(color_array[2],10) * 114)) / 1000);

		return o;

		}


	/**
	 * @param {string} hex_color
	 * @param {Array<number>|number} color_array
	 */

		this.getContrastColor = function(hex_color,color_array){
			      		
	              var w3_contrast = this.checkContrast(color_array);
				  var contrast_color;

			      	if(w3_contrast < 125) {
						contrast_color =  this.ColorLuminance(hex_color, 0.65 + w3_contrast/100);				         		           
					}
					else {
						contrast_color =  this.ColorLuminance(hex_color, -0.45); 
					}

					if(hex_color=="#000000")contrast_color = "#d1d1d1";
					if(hex_color=="#FFFFFF")contrast_color = "#777777";

		    return contrast_color;			
		}


	/**
	 * @param {Array<number>|null|undefined|number} color_array
	 */	

		this.rgbToHex = function(color_array) {
		    return "#" + ((1 << 24) + (color_array[0] << 16) + (color_array[1] << 8) + color_array[2]).toString(16).slice(1);
		};


     /**
	 * @param {number} size
	 * @param {string} label
 	 * @param {Array<number>} color
 	 * @param {string} form
 	 * @param {boolean} outline_only
	 * @param {number=} markingSize
	 * @param {Array<number>=} markingcolor
 	 * @param {boolean=} active
	 *
	 * @return {string}
	 */

		this.createMarkerImage = function(size,label,color,form,outline_only,markingSize,markingcolor,active){

				var fontsize = this.getImageFontSize(size,label,form);

				size*=symbolRescaleFactor;

				var hex_color = this.rgbToHex(color);


				var strokewidth = 3;
	

				var canvas = document.createElement('canvas');
				var context = canvas.getContext("2d");

				var add_for_marking = 0;

				if(markingSize==0){

				canvas.width = size;
				canvas.height = size;

				}

				else{
					add_for_marking = markingSize*4;
					canvas.width = size +add_for_marking;
					canvas.height = size +add_for_marking;
				}

				var centerX = canvas.width / 2;
				var centerY = canvas.height / 2;


	              var contrast_color;
	              if(!outline_only)contrast_color = this.getContrastColor(hex_color,color);
	              else contrast_color = hex_color;

    	         if(markingSize>0){
	      		      context.beginPath();
	      		      var new_center = this.drawForm(form,centerX,centerY,context,size+add_for_marking,strokewidth); // REPLLACE MARKINSIZE *4 with variable
  		              if(new_center!=null){centerX = new_center[0];centerY=new_center[1];}
	           		  context.lineWidth = strokewidth;
				      context.strokeStyle = this.rgbToHex(markingcolor);
				      context.closePath();
				      context.stroke();

			      }


		 	      context.beginPath();

		         if(markingSize>0){
		         	 if(form=="house")centerY-= 0.14 * centerY;
		         	 if(form=="house_i")centerY+= 0.23 * centerY;
	         	     if(form=="triangle")centerY-= 0.18 * centerY;
	         	     if(form=="triangle_i")centerY+= 0.3 * centerY;
		         }

			      var new_center = this.drawForm(form,centerX,centerY,context,size,strokewidth);
			      if(new_center!=null){centerX = new_center[0];centerY=new_center[1];}


			      if(!active){
			      	contrast_color ='rgba(97,97,97,0.40)';
			      	hex_color = "rgba(225,225,225,0.77)";
			      }
			
			      if(!outline_only){  	
				      context.fillStyle = hex_color;
				      context.fill();
		      	      context.font =  fontsize+"px Arial";
			   	 	  context.fillStyle = contrast_color;
		              context.textAlign="center"; 
		          	  context.textBaseline="middle"; 
		              context.fillText(label, centerX, centerY);
			      } 

			      context.lineWidth = strokewidth;
			      context.strokeStyle = contrast_color;
			      context.closePath();
			      context.stroke();

		
			      
		          var url = canvas.toDataURL();
			     
		          return url;
			};



     /**
	 * @param {string} form
 	 * @param {number} centerX
 	 * @param {number} centerY
 	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 *
	 * @return {Array<number>|null}
	 */		

	this.drawForm = function(form,centerX,centerY,context,size,strokewidth){

		var newcenter = null;

		      switch(form){
						case "circle":
							this.drawCircle(centerX,centerY,context,size,strokewidth);
						break;

						case "rect":
							this.drawRect(centerX,centerY,context,size,strokewidth);
						break;

						case "triangle":
							newcenter = this.drawTriangle(centerX,centerY,context,size,strokewidth);
						break;

						case "triangle_i":
							newcenter = this.drawTriangle_i(centerX,centerY,context,size,strokewidth);
						break;

						case "hex_flat":
							this.drawHex(centerX,centerY,context,size,strokewidth,true);
						break;

						case "hex_pointy":
							this.drawHex(centerX,centerY,context,size,strokewidth,false);
						break;

					    case "rhomb":
							this.drawRhomb(centerX,centerY,context,size,strokewidth);
						break;

					    case "house":
						  newcenter= this.drawHouse(centerX,centerY,context,size,strokewidth);
						break;


					    case "house_i":
						  newcenter= this.drawHouse_i(centerX,centerY,context,size,strokewidth);
						break;

						case "rectcutoffbr":
							this.drawCutOffRectBR(centerX,centerY,context,size,strokewidth);				  			
						break;

						case "rectcutofftr":
							this.drawCutOffRectTR(centerX,centerY,context,size,strokewidth);				  			
						break;

						case "rectcutofftl":
							this.drawCutOffRectTL(centerX,centerY,context,size,strokewidth);				  			
						break;

						case "rectcutoffbl":
							this.drawCutOffRectBL(centerX,centerY,context,size,strokewidth);				  			
						break;
			         }

         return newcenter;
	}		



 	 /**
	 * @param {number} size
 	 * @param {string} label
 	 * @param {string} form
	 *
	 * @return  {number}
	 */		

	this.getImageFontSize = function(size,label,form){

		var fsize;

		if(form == "circle" || form=="rect" || form == "rectcutoffbr"  || form == "rectcutofftr" || form == "rectcutofftl" || form == "rectcutoffbl") {
			if(size==symbolSize  && label.length==1) fsize = 12;	
			if(size==symbolSize  && label.length==2) fsize = 10;

			if(size> symbolSize  && label.length==1) fsize = 15;		
			if(size> symbolSize  && label.length==2) fsize = 13;
		}

		if(form == "triangle" || form=="triangle_i"){

			if(size==symbolSize  && label.length==1)  fsize = 8.5;
		    if(size==symbolSize  && label.length==2)  fsize = 7.5;	

			if(size >symbolSize  && label.length==1)  fsize = 13;	    
			if(size >symbolSize  && label.length==2)  fsize = 9;

		}

		if(form == "hex_flat" || form=="hex_pointy"){

			if(size==symbolSize  && label.length==1)  fsize = 11.5;
		    if(size==symbolSize  && label.length==2)  fsize = 9.5;	

			if(size >symbolSize  && label.length==1)  fsize = 14.5;	    
			if(size >symbolSize  && label.length==2)  fsize = 12.5;

		}

		if(form=="rhomb"){

			if(size==symbolSize  && label.length==1)  fsize = 9.5;
		    if(size==symbolSize  && label.length==2)  fsize = 7.5;	

			if(size >symbolSize  && label.length==1)  fsize = 12.5;	    
			if(size >symbolSize  && label.length==2)  fsize = 10.5;

		}



		if(form == "house" || form=="house_i"){

			if(size==symbolSize  && label.length==1)  fsize = 10.5;
		    if(size==symbolSize  && label.length==2)  fsize = 8.5;	

			if(size >symbolSize  && label.length==1)  fsize = 13;	    
			if(size >symbolSize  && label.length==2)  fsize = 12;

		}



	return fsize*symbolRescaleFactor;	
	
	}


 	 /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	

	this.drawCircle = function(centerX,centerY,context,size,strokewidth){

		 var radius = (size/2)- strokewidth/2;
    	 context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	}	

 	 /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	

	this.drawRect =	function(centerX,centerY,context,size,strokewidth){
   	    context.moveTo(centerX-size/2+strokewidth/2, centerY-size/2+strokewidth/2);
    	context.lineTo(centerX+size/2-strokewidth/2, centerY-size/2+strokewidth/2);
	    context.lineTo(centerX+size/2-strokewidth/2, centerY+size/2-strokewidth/2);
	    context.lineTo(centerX-size/2+strokewidth/2, centerY+size/2-strokewidth/2);
	    context.closePath();
	}

	 /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	

    this.drawRhomb = function(centerX,centerY,context,size,strokewidth){
	    context.moveTo(centerX-size/2+strokewidth/2, centerY);
    	context.lineTo(centerX, centerY-size/2+strokewidth/2);
	    context.lineTo(centerX+size/2-strokewidth/2, centerY);
	    context.lineTo(centerX, centerY+size/2-strokewidth/2);
	    context.closePath();
	}

     /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	

	this.drawTriangle =	function(centerX,centerY,context,size,strokewidth){

		context.moveTo(centerX, centerY-size/2+strokewidth/2);
		context.lineTo(centerX+size/2-strokewidth/2, centerY+size/2-strokewidth/2);
		context.lineTo(centerX-size/2+strokewidth/2, centerY+size/2-strokewidth/2);
		context.closePath();

		var newCenterX = (centerX + centerX+size/2-strokewidth/2 + centerX-size/2+strokewidth/2) / 3;
		var newCenterY = (centerY-size/2+strokewidth/2 + centerY+size/2-strokewidth/2 + centerY+size/2-strokewidth/2) / 3;

	     return [newCenterX,newCenterY];

	}

     /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	

	this.drawTriangle_i =	function(centerX,centerY,context,size,strokewidth){

		context.moveTo(centerX, centerY+size/2-strokewidth/2);
	    context.lineTo(centerX-size/2+strokewidth/2, centerY-size/2+strokewidth/2);
    	context.lineTo(centerX+size/2-strokewidth/2, centerY-size/2+strokewidth/2);
		context.closePath();

		var newCenterX = (centerX +centerX-size/2+strokewidth/2 + centerX+size/2-strokewidth/2) / 3;
		var newCenterY = (centerY+size/2-strokewidth/2 + centerY-size/2+strokewidth/2 + centerY-size/2+strokewidth/2) / 3;

	     return [newCenterX,newCenterY];

	}

     /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	

	this.drawHouse = function(centerX,centerY,context,size,strokewidth){
	    context.moveTo(centerX, centerY-size/2+strokewidth/2);
    	context.lineTo(centerX+size/2-strokewidth/2, centerY);
	    context.lineTo(centerX+size/2-strokewidth/2, centerY+size/2-strokewidth/2);
	    context.lineTo(centerX-size/2+strokewidth/2, centerY+size/2-strokewidth/2);
	    context.lineTo(centerX-size/2+strokewidth/2, centerY);
	    context.closePath();
	    var add = 0.15;
	    if(size>34)add = 0.22;

	    var newCenterY = centerY + add * centerY; //TODO: find eq for correct center;
	    return[centerX,newCenterY]

	}

     /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	

	this.drawHouse_i = function(centerX,centerY,context,size,strokewidth){

	    context.moveTo(centerX, centerY+size/2-strokewidth/2);
    	context.lineTo(centerX-size/2+strokewidth/2, centerY);
	    context.lineTo(centerX-size/2+strokewidth/2, centerY-size/2+strokewidth/2);
	    context.lineTo(centerX+size/2-strokewidth/2, centerY-size/2+strokewidth/2);
	    context.lineTo(centerX+size/2-strokewidth/2, centerY);
	    context.closePath();
	    var add = -0.15;
	    if(size>34)add = -0.22;

	    var newCenterY = centerY + add * centerY; //TODO: find eq for correct center;
	    return[centerX,newCenterY]
	}

     /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	
	this.drawCutOffRectBR = function(centerX,centerY,context,size,strokewidth){

   	    context.moveTo(centerX-size/2+strokewidth/2, centerY-size/2+strokewidth/2);
        context.lineTo(centerX+size/2-strokewidth/2, centerY-size/2+strokewidth/2);
	    context.lineTo(centerX+size/2-strokewidth/2, (centerY+size/2-strokewidth/2)-size/2*0.35);
	    context.lineTo((centerX+size/2-strokewidth/2)-size/2*0.35, centerY+size/2-strokewidth/2);
	    context.lineTo(centerX-size/2+strokewidth/2, centerY+size/2-strokewidth/2);
	    context.closePath();

	}

     /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	
	this.drawCutOffRectTR = function(centerX,centerY,context,size,strokewidth){

		context.moveTo(centerX-size/2+strokewidth/2, centerY-size/2+strokewidth/2);
    	context.lineTo((centerX+size/2-strokewidth/2)-size/2*0.35, centerY-size/2+strokewidth/2);
	    context.lineTo(centerX+size/2-strokewidth/2, (centerY-size/2+strokewidth/2)+size/2*0.35);
	    context.lineTo(centerX+size/2-strokewidth/2, centerY+size/2-strokewidth/2);
	    context.lineTo(centerX-size/2+strokewidth/2, centerY+size/2-strokewidth/2);
	    context.closePath();

	}

     /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	
	this.drawCutOffRectTL = function(centerX,centerY,context,size,strokewidth){

		context.moveTo((centerX-size/2+strokewidth/2)+size/2*0.35, centerY-size/2+strokewidth/2);
        context.lineTo(centerX+size/2-strokewidth/2, centerY-size/2+strokewidth/2);
	    context.lineTo(centerX+size/2-strokewidth/2, centerY+size/2-strokewidth/2);
        context.lineTo(centerX-size/2+strokewidth/2, centerY+size/2-strokewidth/2);
	    context.lineTo(centerX-size/2+strokewidth/2, (centerY-size/2+strokewidth/2)+size/2*0.35);
	    context.closePath();
	}

     /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
	 */	
	this.drawCutOffRectBL = function(centerX,centerY,context,size,strokewidth){

		context.moveTo(centerX-size/2+strokewidth/2, centerY-size/2+strokewidth/2);
	    context.lineTo(centerX+size/2-strokewidth/2, centerY-size/2+strokewidth/2);
	    context.lineTo(centerX+size/2-strokewidth/2, centerY+size/2-strokewidth/2);
	    context.lineTo((centerX-size/2+strokewidth/2)+size/2*0.35, centerY+size/2-strokewidth/2);
	    context.lineTo(centerX-size/2+strokewidth/2, (centerY+size/2-strokewidth/2)-size/2*0.35);
	    context.closePath();
	}
   
     /**
	 * @param {number} centerX
	 * @param {number} centerY
	 * @param {Object} context
	 * @param {number} size
	 * @param {number} strokewidth
 	 * @param {boolean} flat
	 */	
	this.drawHex = function(centerX,centerY,context,size,strokewidth,flat){
		var points = this.calculateHexPoints(centerX,centerY,size/2,flat);

		//switch + / - for full size but stretch

		if(flat){

			context.moveTo(points[0].x-strokewidth/2,points[0].y);
			context.lineTo(points[1].x,points[1].y-strokewidth/2);  
			context.lineTo(points[2].x,points[2].y-strokewidth/2);  
			context.lineTo(points[3].x+strokewidth/2,points[3].y);
			context.lineTo(points[4].x,points[4].y+strokewidth/2); 
		    context.lineTo(points[5].x,points[5].y+strokewidth/2);  

	    }

	    else{
			context.moveTo(points[0].x,points[0].y-strokewidth/2);
			context.lineTo(points[1].x-strokewidth/2,points[1].y);  
			context.lineTo(points[2].x-strokewidth/2,points[2].y);  
			context.lineTo(points[3].x,points[3].y+strokewidth/2);
			context.lineTo(points[4].x+strokewidth/2,points[4].y);  
		    context.lineTo(points[5].x+strokewidth/2,points[5].y);   
	    }

		context.closePath();
	}


   
	 /**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} r
	 * @param {boolean} flat
	 */	
	this.calculateHexPoints = function(x,y,r,flat){
	     
	  var result = [];  

	     for (var i = 0; i < 6; i++) {
	 
	      var point = {x:0,y:0};
	      if(flat){
		      point.x = x + r * Math.cos(2 * Math.PI * i / 6); 
		      point.y = y + r * Math.sin(2 * Math.PI * i / 6); 
	      }  

	      else{
	      	 point.x = x + r * Math.sin(2 * Math.PI * i / 6); 
		     point.y = y + r * Math.cos(2 * Math.PI * i / 6); 
	      }

	      result.push(point);
	    }

	    return result;

	  };



	/**
	 * @param {Array<number>} indexArray
	 * @param {number=} size
	 * @param {number=} markingSize
	 * @param {boolean=} active
	 *
	 * @return {string}
	 */
	this.createSymbolURL = function(indexArray, size, markingSize, active) {
		if (size == null)
			size = symbolSize;

		
		if (markingSize == null){
			markingSize = 0;
		}



		
		if (active === undefined)
			active = true;
		
		var /** string */ key = this.createSymbolKey  (indexArray, size, markingSize, active);
		var /** string|undefined */ bufferedVal = this.symbolBuffer.get(key);

		if(bufferedVal !== undefined){
			return bufferedVal;
		}

		var /** Object<string, *> */ symbolInfo = colorScheme.getFeatureCombination(indexArray, markingSize * symbolRescaleFactor);
			
	    var /** string */ url  = this.createMarkerImage(size, /** @type{string} */(symbolInfo['letter']),  /** @type{Array<number>} */(symbolInfo['color']), /** @type{string} */(symbolInfo['shape']), false, markingSize, /** @type{Array<number>} */(symbolInfo['mcolor']),active);
		this.symbolBuffer.set(key, url);
	    
	    return url;
	};
	
	/**
	 * @param {Array<number>} indexArray
	 * @param {number=} size
	 * @param {number=} markingSize
	 * @param {boolean=} active
	 *
	 * @return {string}
	 */
	this.createSymbolKey = function (indexArray, size, markingSize, active){
		return indexArray.join(".") + "." + size + "." + markingSize + "." + (active? "1": "0");
	};
	
	/**
	 * @param {number} count
	 * 
	 * @return {number}
	 */
	this.getLogSizeForCount = function (count){
		if(count == 1){
			return symbolSize;
		}
		
		return 2 * Math.round(a * Math.log(count) + b) + 1;
	};
	
	/**
	 * @param {number} mainIndex
	 * @param {number=} size
	 *
	 * @return {string}
	 */
	this.createSymbolURLForMainIndex = function(mainIndex, size) {
		if (size == null)
			size = symbolSize;
		var /** Object<string, *> */ symbolInfo = colorScheme.getSingleFeature(features_classes.main, mainIndex);
		var /** string */ url  = this.createMarkerImage(size,"",[119,119,119],/** @type{string} */(symbolInfo['shape']),true,0,null,true);
		return url;
	};

	/**
	 * @param {number} index
	 *
	 * @return {string}
	 */
	this.createColorURL = function(index) {
		var /** Array<number> */ color = colorScheme.getPolygonColor(index % numCols);
	    var /** string */ url  = this.createMarkerImage(symbolSize, "", color, "circle", false, 0, null, true);

		return url;
	};
	
	/**
	 * @param {number} mainIndex
	 * @param {number} colorIndex
	 *
	 * @return {string}
	 */
	this.createSymbolURLForMarking = function(mainIndex, colorIndex) {
		var /** Object<string, *> */ symbolInfo = colorScheme.getSingleFeature(features_classes.main, mainIndex);
	    var /** string */ url  = this.createMarkerImage(symbolSize,"",[119,119,119], /** @type{string} */(symbolInfo['shape']), true, markingSize, symbolManager.getMarkingColor(colorIndex),true);

		return url;
	};
	
	/**
	 * @param {Array<number>} index
	 *
	 * @return {string}
	 */
	this.getColorStringForSymbol = function(index) {
		//TODO this implies that there has always to be a index "color" defined, maybe find a better solution
		var colorArray = /** @type{Array<number>} */ (colorScheme.getFeatureCombination(index, 0)["color"]);
		return '#' + decimalToHex(colorArray[0]) + decimalToHex(colorArray[1]) + decimalToHex(colorArray[2]);
	};
	
	
	/**
	 *  @param {Array<number>} index
	 *  
	 *  @return {Array<number>}
	 */
	this.createHighlightedIndex = function (index){
		//TODO array copy!!!
		//index[features_classes.add] = 3; //TODO adaptive!
		return index;
	}
	
	/**
	 * @return {number}
	 */
	this.getNumPolygonColors = function (){
		return numCols;
	}
	
	/**
	 * @return {number}
	 */
	this.getNumMarkingColors = function (){
		return numAdd;
	}
}

/**
 *
 *@constructor
 *
 * A symbol scheme describes how colors, border_colors, shapes and letters are combined to display certain information.
 *
 * In principle there is always a main category divided into sub-categories with maybe additional information, e.g.
 * 		Main Category: Concept
 *      Sub Category: Lexical types for this concept
 *      Add.: Sub-concept information
 *
 * The default scheme is structured the following:
 * 		Main: Shape
 *      Sub: Color + Letter
 *      Add: Border_Color
 *
 * If all possible values of a feature are used it will be re-iterated in combination with unused values of the other features,
 * e.g. (assuming there are only squares and circles):
 *
 * 	1 : Circle (Red A, Green B, Blue C)
 *  2 : Square (Red A, Green B)
 *  3 : Circle (Yellow D, Pink E)
 * etc.
 *
 * There is one exception: For symbols that don't have any sub-categories at all, the same main feature value will be used
 * (the first one available at that point), e.g.
 *
 * 1 : Circle (Red A, Green B, Blue C)
 * 2 : Square (Red A)
 * 3 : Square (Green B)
 * 4 : Circle (Yellow D, Pink E)
 * 5 : Square (Blue C)
 *
 * @param {Array<Feature<string|Array<number>>>} main main features
 * @param {Array<Feature<string|Array<number>>>} sub sub-features
 * @param {Array<Feature<string|Array<number>>>} add additional features
 * @param {Array<Array<number>>} colors for polygons and line strings
 */
function ColorScheme(main, sub, add, colors) {

	//Compute value ranges
	/**
	 * @type Array<Array<Array<string|Array<number>>>>
	 */
	var ranges = [computeRange(main), computeRange(sub), computeRange(add)];

	/**
	 * @type {Array<Array<Feature<string|Array<number>>>>}
	 */
	var descriptions = [main, sub, add];

	/**
	 * @param {number} fclass
	 * @param {number} index
	 * 
	 * @return {Object<string, *>}
	 */
	this.getSingleFeature = function (fclass, index){
		var res = {};
		var desc = descriptions[fclass];
		for (var i = 0; i < desc.length; i++) {
			res[desc[i].name] = ranges[fclass][index][i];
		}
		return res;
	};

	/**
	 * @param {Array<number>} indexArray
	 * @param {number} markingSize
	 *
	 * @return {Object<string, *>}
	 */
	this.getFeatureCombination = function(indexArray, markingSize) {
		var res = {};
		for (var j = 0; j < indexArray.length; j++) {
			var desc = descriptions[j];
			for (var i = 0; i < desc.length; i++) {
				res[desc[i].name] = ranges[j][indexArray[j]][i];
			}
		}
		
		if (markingSize > 0){
			res["msize"] = markingSize * markingScaleFunction(res);
		}
		
		return res;
	};

	/**
	 * @param {number} fclass
	 *
	 * @return {number}
	 */
	this.getNumCombinations = function(fclass) {
		return ranges[fclass].length;
	};

	/**
	 * @return {number}
	 */
	this.getNumPolygonColors = function() {
		return colors.length;
	};
	
	/**
	 * @param {number} index
	 *
	 * @return {Array<number>}
	 */
	this.getPolygonColor = function(index) {
		return colors[index];
	};
	
	/**
	 * @param {Array<Feature<string|number|Array<number>>>} arr
	 *
	 * @return {Array<Array<string|number|Array<number>>>}
	 */
	function computeRange(arr) {
		if (arr.length == 0)
			return [];
		if (arr.length == 1)
			return arr[0].values.map(
				/**
				 * @template G
				 * 
				 * @param {G} e
				 * 
				 * @return {Array<G>} 
				 */
				function(e) {
					return [e];
				});
		if (arr[0].independent)
			return cartesianProductFlat(arr[0].values, computeRange(arr.slice(1)));
		return combineArrays(arr);
	}

	/**
	 *
	 * @param {Array<Feature<string|number|Array<number>>>} arr
	 *
	 * @return {Array<Array<string|number|Array<number>>>}
	 */
	function combineArrays(arr) {
		var/** number */ countLongest = 0;
		var/** number */ numberFeatures = arr.length;

		for (var/** number */ i = 0; i < numberFeatures; i++) {
			var/** number */ len = arr[i].values.length;
			if (len > countLongest)
				countLongest = len;
		}

		/** 
		 * @type {Array<Array<string|number|Array<number>>>} 
		 */
		var res = new Array(countLongest);
		for (i = 0; i < countLongest; i++) {
			var/** Array<string|number|Array<number>> */ element = new Array(numberFeatures);
			for (var/** number */ j = 0; j < numberFeatures; j++) {
				var/** Array<string|number|Array<number>> */ vals = arr[j].values;
				if (vals[i] == null) {
					element[j] = vals[vals.length - arr[j].overflow + ((i - vals.length) % arr[j].overflow)];
				} else {
					element[j] = vals[i];
				}
			}
			res[i] = element;
		}
		return res;
	}

	/**
	 * @template T1, T2
	 *
	 * @param {Array<T1>} arr1
	 * @param {Array<T2>} arr2
	 *
	 * @return {Array<Array<T1|T2>>}
	 */
	function cartesianProductFlat(arr1, arr2) {
		var/** number */ l1 = arr1.length;
		var/** number */ l2 = arr2.length;
		/** 
		 * @type{Array<Array<?>>} 
		 */
		var res = new Array(l1 * l2);
		for (var/** number */ i = 0; i < l1; i++) {
			for (var/** number */ j = 0; j < l2; j++) {
				res[i * l2 + j] = [arr1[i]].concat(arr2[j]);
			}
		}
		return res;
	}
	
	/**
	 * @return {string}
	 */
	this.exportScheme = function (){
		var result = {};
		
		result["main"] = [];
		for (var i = 0; i < main.length; i++){
			result["main"].push(main[i].exportFeature());
		}
		
		result["sub"] = [];
		for (var i = 0; i < sub.length; i++){
			result["sub"].push(sub[i].exportFeature());
		}
		
		result["add"] = [];
		for (var i = 0; i < add.length; i++){
			result["add"].push(add[i].exportFeature());
		}
		
		result["colors"] = colors;
		
		return JSON.stringify(result);
	};

}

/**
 * @constructor
 *
 * @param {string} name Name of the feature
 * @param {Array<string|number|Array<number>>} values Value array
 * @param {number=} overflow Gives the number of values (counting from the end) that will be repeated if the array overflows.
 *        This is only used if it used together with another feature with a bigger value range.
 *        e.g. Feature (A, [a1, a2, a3, a4, a5]) together with Feature (B, [b1, b2, b3], 2) have the following combined values:
 * 		  (a1,b1),(a2,b2),(a3,b3),(a4,b2),(a5, b3)
 * @param {boolean=} independent If this feature is independent of the other features (cartesian product). Only the first n features can be independent so
 *        [Ind, !Ind, Ind] will be treated as [Ind, !Ind, !Ind]
 *
 */

function Feature(name, values, independent, overflow) {
	/** @type{string} */
	this.name = name;
	
	/** @type{Array<string|number|Array<number>>} */
	this.values = values;
	
	/** @type{number} */
	this.overflow = overflow == null ? values.length : overflow;
	
	/** @type{boolean} */
	this.independent = independent == null? false: independent;
	
	/**
	 * @return {Object<string, ?>}
	 */
	this.exportFeature = function (){
		return {"name" : this.name, "values" : this.values, "overflow" : this.overflow, "independent" : this.independent};
	};
}