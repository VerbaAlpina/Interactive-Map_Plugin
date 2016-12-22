/**
 * @constructor
 * @implements {SortType}
 * @struct 
 */
function RecordNumberSorter (){
	
	/**
	 * @type{number}
	 */
	this.sortOrder;
	
	/**
	 * @type {Object<string, number>} 
	 */
	this.countMapping;
	
	/**
	 * @type{Object<string,string>} 
	 */
	this.nameMapping;
	
	 /**
	 * @override 
	 * 
	 * @param {Array<string>} keyArray The sub-element keys
	 * @param {Object<string,?>} data The original data array as returned from the server.
	 * @param {Object<string,?>} filterData The complete filter data for the element.
	 * 
	 * @return{undefined}
	 */
	this.initFields = function (keyArray, data, filterData){
		this.countMapping = Sorter.createCountMapping(keyArray, data);
		this.nameMapping = Sorter.createNameMapping(keyArray, filterData);
	};
	
	/**
	 * @override
	 *
	 * @param {string} a First element key
	 * @param {string} b Second element key
	 * 
	 * 
	 * @return {number} The sorted key array
	 */
	this.compareFunction = function (a, b){
		var /** number */ countA = this.countMapping[a];
		var /** number */ countB = this.countMapping[b];
		if(countA == countB){
			if(a == -1)
				return -1;
			if(b == -1)
				return 1;
			
			return this.nameMapping[a].localeCompare(this.nameMapping[b]);
		}
		else
			if(this.sortOrder == 0)
				return countA - countB;
			else
				return countB - countA;
	};
	
	/**
	 * @override 
	 * 
	 * @return {string}
	 */
	this.getName = function (){
		return TRANSLATIONS["NUM_RECORDS"];
	};
	
	/**
	 * @override
	 * 
	 * @return {number} 
	 */
	this.getNumSortOrders = function (){
		return 2;
	};
	
	/**
	 * @override
	 * 
	 * @param {number} index
	 * 
	 * @return {string} 
	 */
	this.getSortOrderName = function (index){
		if(index == 0){
			return TRANSLATIONS["ASC"];
		}
		return TRANSLATIONS["DESC"];
	};
	
		/**
	 * @override
	 * 
	 * @return {number} 
	 */
	this.getDefaultSortOrder = function (){
		return 1;
	};
}
