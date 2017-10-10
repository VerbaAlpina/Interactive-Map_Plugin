/**
 * 
 * @constructor
 * @implements {SortType}
 * @struct 
 */
function AlphabetSorter (){
	
	/**
	 * @type {number} 
	 */
	this.sortOrder;
	
	/**
	 * @type{Object<string,string>} 
	 */
	this.nameMapping;
	
	/**
	 * @override 
	 * 
	 * @param {Array<string>} keyArray The sub-element keys
	 * @param {Object<string,?>} data The original data array as returned from the server.
	 * @param {number} subElementCategory
	 * 
	 * @return{undefined}
	 */
	this.initFields = function (keyArray, data, subElementCategory){
		this.nameMapping = Sorter.createNameMapping(keyArray, subElementCategory);
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
		if(a == -1)
			return -1;
		if(b == -1)
			return 1;
		
		if(this.sortOrder == 0)
			return this.nameMapping[a].localeCompare(this.nameMapping[b]);
		else
			return this.nameMapping[b].localeCompare(this.nameMapping[a]);
	};
	
	/** 
	 * @override
	 * 
	 * @return {string} 
	 */
	this.getName = function (){
		return TRANSLATIONS["ALPHABETICAL"];
	};
	
	/**
	 * @override
	 * 
	 * return{number} 
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
		else {
			return TRANSLATIONS["DESC"];
		}
	};
	
	/**
	 * @override
	 * 
	 * @return {number} 
	 */
	this.getDefaultSortOrder = function (){
		return 0;
	};
}
