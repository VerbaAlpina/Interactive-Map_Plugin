/**
 * A list builder for elements represented by a default generic Info Window
 *
 * @constructor
 * @implements AbstractListBuilder
 *
 * @param {function (number):Array<string>|Array<string>=} customListFieldsParam The custom fields of the info window to show in the list
 */

function SimpleListBuilder(customListFieldsParam){
    /**
     * @type {function (number):Array<string>|Array<string>|undefined}
     */
    this.customListFieldsParam = customListFieldsParam;
    this.printerManager = new PrinterManager();

    /**
     * Method which returns all available printers
     *
     * @return {Array<string>}
     */
    this.getListPrinters = function(){
        return this.printerManager.getPrinters();
    };

    /**
     * Method which returns the data of the selected printer in String Format
     *
     * @param {number} printerID The printer ID to be used (index in the array of showListPrinters);
     * @param {LegendElement|MultiLegendElement} elementsParam
     * @return {Array<Object>} First element: The data type, Second element: The output, Third element: Whether or not the result is a download, Fourth: The name used during download
     */
     this.retrieveList = function(printerID, elementsParam) {
        /**
         * @type {Array<OverlayInfo>}
         */
        var curOverlayInfos = elementsParam.getOverlayInfos();
        /**
         * @type {ListPrinter}
         */
        var curPrinter = this.printerManager.getSinglePrinter(printerID);
        /**
         * @type {Array<Object>}
         */
        var printerInput = [];
        
        var /** Array<string> */ customListFields;
        
        // Necessary in case not all of the tokens contain the same information.
        if(typeof this.customListFieldsParam === "undefined"){
            
        	customListFields = [];
            for(var i = 0; i<curOverlayInfos.length;i++){
            	for (var u = 0; u < curOverlayInfos[i].infoWindowContents.length; u++){
            		 var tokens = curOverlayInfos[i].infoWindowContents[u].getData();
                     for(var k = 0; k<tokens.length;k++){
                         for(var key in tokens[k]){
                             customListFields.push(key);  
                         }
                     }
            	}
            }
        }
        else if (typeof this.customListFieldsParam === "function"){
        	customListFields = this.customListFieldsParam(printerID);
        }
        else {
        	customListFields = this.customListFieldsParam;
        }
        
        for(var i = 0; i<curOverlayInfos.length;i++){
        	for (var u = 0; u < curOverlayInfos[i].infoWindowContents.length; u++){
        		var tokens = curOverlayInfos[i].infoWindowContents[u].getData();
                for(var k = 0; k<tokens.length;k++){
                    var curObj = {};
                    for(var j = 0; j< customListFields.length;j++){
                        curObj[customListFields[j]]=tokens[k][customListFields[j]];
                    }
                    printerInput.push(curObj);
                }
        	}
        }
        var result =[curPrinter.getType(), curPrinter.buildList(printerInput), curPrinter.isDownload(), curPrinter.downloadName()];
        printerInput = null;
        return result;
     };
}
/**
 * Method which adds a possible list printer (JSON, HTML...) to the builder
 *
 * @param {ListPrinter} printer
 */
SimpleListBuilder.prototype.addListPrinter = function(printer) {
    this.printerManager.addPrinter(printer);
}