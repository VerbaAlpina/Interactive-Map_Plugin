/**
 * @enum {number}
 */
var OverlayType = {
	PointSymbol : 0,
	Polygon : 1,
	LineString : 2
};
/**
 * @const
 * @type {number}
 */
var num_types = 3;

/**
 * @constructor
 *
 * @param {ColorScheme} colorScheme
 */

function SymbolManager(colorScheme) {

	//Point Symbols

	var/** number */ numMain = colorScheme.getNumCombinations(features_classes.main);
	var/** number */ numSub = colorScheme.getNumCombinations(features_classes.sub);

	var/** number */ numCols = colorScheme.getNumColors();

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
	var /** number */ x1 = maxIdenticalIcons + 1;
	var /** number */ y1 = symbolSize * (1 + minimumSymbolEnlargement / 100) / 2;
	var /** number */ x2 = 100;
	var /** number */ y2 = symbolSize * (1 + decSymbolEnlargement / 100) / 2;
	
	var /** number */ a = (y1 - y2) / (Math.log(x1) - Math.log(x2));
	var /** number */ b = y1 - a * Math.log(x1);

	//Other overlays
	var/**Array<number> */ firstFreeColor = new Array(num_types);
	var/**Array<Array<boolean>> */ freeColors = new Array(num_types);
	for (i = 1; i < num_types; i++) {
		freeColors[i] = new Array(numCols);
	}

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
		for (var i = 1; i < num_types; i++) {
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
	this.getColorString = function (index){
		var /** Array<number> */ colorArray = colorScheme.getColor(index % numCols);
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
				res[foundIndexes++] = [mainIndex, i, 15];
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
	 * @param {Array<number>} indexArray
	 * @param {number=} size
	 * @param {number=} markingSize
	 *
	 * @return {string}
	 */
	this.createSymbolURL = function(indexArray, size, markingSize) {
		if (size == null)
			size = symbolSize;
		
		if (markingSize == null){
			markingSize = 0;
		}
		
		var /** Object<string, *> */ symbolInfo = colorScheme.getFeatureCombination(indexArray, markingSize);
		var /** string */ url = PATH["symbolGenerator"] + "?size=" + size;
		for (var /** string */ prop in symbolInfo) {
			url += "&" + prop + "=" + encodeURIComponent(/** @type{string} */ (symbolInfo[prop]));
		}
		
		return url;
	};
	
	this.getLogSizeForCount = function (count){
		return 2 * Math.round(a * Math.log(count) + b) + 1;
	}
	
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
		var /** string */ url = PATH["symbolGenerator"] + "?size=" + size;
		for (var /** string */ prop in symbolInfo) {
			url += "&" + prop + "=" + encodeURIComponent(/** @type{string} */ (symbolInfo[prop]));
		}
		return url;
	};

	/**
	 * @param {number} index
	 *
	 * @return {string}
	 */
	this.createColorURL = function(index) {
		var /** Array<number> */ color = colorScheme.getColor(index % numCols);
		var /** string */ url = PATH["symbolGenerator"] + "?size=" + symbolSize + "&shape=circle";
		url += "&color=" + color;
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
		var /** string */ url = PATH["symbolGenerator"] + "?size=" + symbolSize
			+ "&msize=" + markingSize + "&mcolor=" + colorScheme.getColor(colorIndex % numCols);
		for (var /** string */ prop in symbolInfo) {
			url += "&" + prop + "=" + encodeURIComponent(/** @type{string} */ (symbolInfo[prop]));
		}
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
	this.getNumColors = function (){
		return numCols;
	}
}

/**@enum {number}*/
var features_classes = {
	main : 0,
	sub : 1,
	add : 2
};

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
 * @param {Array<Array<number>>} colors addional pointer to the color array, since it is needed for polygons and line strings
 */
function ColorScheme(main, sub, add, colors) {

	//Compute value ranges
	/**
	 * @type Array<Array<Array<string|Array<number>>>>
	 */
	var ranges = [computeRange(main), computeRange(sub), computeRange(add)];

	/**
	 * @param {Feature<string|Array<number>>} e
	 *
	 */
	var delVal = function(e) {
		delete e.values;
	};

	/**
	 * @type {Array<Array<Feature<string|Array<number>>>>}
	 */
	var descriptions = [main, sub, add];
	for (var/** number */ i = 0; i < descriptions.length; i++)
		descriptions[i].map(delVal);

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
			res["msize"] = markingSize;
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
	this.getNumColors = function() {
		return colors.length;
	};

	/**
	 * @param {number} index
	 *
	 * @return {Array<number>}
	 */
	this.getColor = function(index) {
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
}