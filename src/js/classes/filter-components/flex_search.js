/**
 * @constructor
 * @struct
 * @implements FilterComponent
 *
 * Enables the fitlering of elements by flexsearch
 *
 * @param {Object<string, (Object|boolean|function(number, string):Object)>} optionsParam

 */
 function FlexSearchComponent(optionsParam){
    /**
     * @type {Object<string, (Object|boolean|function(number, string):Object)>}
     */
    this.options = optionsParam;
    this.options["activeSearch"] = false;
    this.elementId = "flexSearchFilterComponent";
    var self = this;
    this.getFilterScreenElement = function(categoryId, elementId) {
        var divContainer = document.createElement("div");
        divContainer.id = this.elementId;
        divContainer.setAttribute("class","flexSearchFilterComponent");
        /**
         * @type {Object<string, (Object|function(number, string):Object)>}
         */
        this.options["node"] = divContainer;
        var originalFields = this.options["fields"]
        if(typeof this.options["fields"] === "function"){
            this.options["fields"] = /** @type {function(number, string):Object} */ (this.options["fields"])(categoryId, elementId);
        }
        QB.init(this.options);
        this.options["node"]=null;
        this.options["fields"]=originalFields;
        var str = jQuery.param({"categoryId":categoryId, "elementId":elementId});
        Autocomplete.setAdditionalRequestParams(str)
        return divContainer;
    }

    this.storeData = function(data) {
        var searchRequest = QB.getRequestData();
        data["flexSearch"]=searchRequest.request;
        data["flexSearchPostId"]=self.options["postID"];
        return true;
    }
    
    this.storeDefaultData = function(data) {
    	
    }

    this.afterAppending=function(element, categoryId, elementId){

    }
 }