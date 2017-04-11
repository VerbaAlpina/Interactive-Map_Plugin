/**
 * @deprecated
 * @param {string} titleKey The object key of the title attribute
 * @param {Object<string, string>} descriptionKeys The elements to show (key) and how they should be named (value)
 * @param {(function(InfoWindowContent):string|string)=} template The template which should be used:
 *      - specified function taking an Array with String keys (the key of the property) and string properties (the content of the object's property)
 *      - "TABLE" All data is shown in a table (default)
 * @param {function(MapSymbol,LegendElement):boolean=} tryMergeFunction The function retrieves the current info window object and the old (to tryMerge given) info window object and attempts to merge them
 * @return {function(new:InfoWindowContent,Object)}
 */
 function GenericInfoWindow(titleKey, descriptionKeys, template, tryMergeFunction){
    /**
     * Template definition section
     */

    /**
     *
     * @param {InfoWindowContent} content The info window
     * @return {string}
     */
    var tableTemplate = function(content){
        var result = "<table class='infoWindowDescriptionElementTable'>";
        var rowCount = 0;
        for (var key in descriptionKeys) {
            if(rowCount>7){
                result+="</table><table class='infoWindowDescriptionElementTable'>";
                rowCount=0;
            }
            result+="<tr>";
            if(descriptionKeys[key]!=null){
                result+="<td>"+descriptionKeys[key]+"</td>";
            } else {
                result+="<td></td>";
            }
            result+="<td>";
            if(typeof content.descriptions[key]!="undefined"&&content.descriptions[key]!=null
                &&content.descriptions[key]){
                result+=content.descriptions[key];
            }
            result+="</td>";
            result+="</tr>";
            rowCount++;
        }
        result += "</table>";
        return result;
    }

    /**
     * @param {InfoWindowContent} content The info window
     * @return {string}
     */
     var divTemplate = function (content){
        var result = "";
        for (var key in content.descriptions) {
            result+="<div class='infoWindowDescriptionElement'>";
            if(descriptionKeys[key]!=null){
                result+="<h3>"+descriptionKeys[key]+"</h3>";
            }
            result+=content.descriptions[key];
            result+="</div>";
        }
        return result;
     }

    /**
     * @type {function(InfoWindowContent):string}
     */
    var templateFunction;
    /**
     * Parameter processing section
     */
    if(typeof template != "function"){
        switch(template){
            case "DIV":
                templateFunction = divTemplate;
            break;
            case "TABLE":
            default:
                templateFunction = tableTemplate;
            break;
        }
    } else {
        templateFunction = template;
    }
    /**
     * Constructor building section
     */
    return (
        /**
         * @constructor
         * @struct
         * @implements {InfoWindowContent}
         * 
         * @param {Object} information
         */
        function (information){
            /**
             * @type {Object}
             */
            this.information = information;
            /**
             * @type {string}
             */
            this.title = information[titleKey];
            /**
             * @type {Object<string,string>}
             */
            this.descriptions = {};
            for (var key in descriptionKeys) {
                this.descriptions[key]=information[key];
            }
            var self = this;
            
            /**
             * @override
             * 
             * @return {string}
             */
            this.getHtml = function (){
                return (
                    "<div class='genericInfoWindow'>"
                    +"<h2>"+this.title+"</h2>"
                    +"<div class='infoWindowDescription'>"
                    +templateFunction(self)
                    +"</div>"
                    +"</div>"
                    );
            };
            
            /**
             * @override
             * 
             * @param {MapSymbol} mapSymbol
             * @param {LegendElement} owner
             */
            this.tryMerge = function (mapSymbol, owner){
                if(typeof tryMergeFunction != "function"){
                    return false;
                } else {
                    return tryMergeFunction(mapSymbol, owner);
                }
            };
            
            /**
        	 * @override
        	 * 
        	 * @param {Element} content
        	 * 
        	 * @return {undefined} 
        	 */
        	this.onClose = function (content){
        	}
        	
        	/**
        	 * @override
        	 * 
        	 * @param {Element} content
        	 * 
        	 * @return {undefined} 
        	 */
        	this.onOpen = function (content){
        	}
        	
        	/**
        	 * @override
        	 * 
        	 * @return {Array<Object<string, string>>} 
        	 */
        	this.getData = function () {
        		return [this.information];
        	};
        	
        	/**
        	 * @override
        	 * 
        	 * @return {string}
        	 */
        	this.getName = function (){
        		return "";
        	}

            this.tableTemplate = tableTemplate;

            this.divTemplate = divTemplate;
        }
    );

 }