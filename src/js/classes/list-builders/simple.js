/**
 * A list builder for elements represented by a default generic Info Window
 *
 * @constructor
 * @implements AbstractListBuilder
 *
 * @param {Array<string>=} customListFieldsParam The custom fields of the info window to show in the list
 */

function SimpleListBuilder(customListFieldsParam){
    /**
     * @type {Array<string>|undefined}
     */
    this.customListFields = customListFieldsParam;
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
        // Necessary in case not all of the tokens contain the same information.
        if(typeof this.customListFields=="undefined"){
            this.customListFields=[];
            for(var i = 0; i<curOverlayInfos.length;i++){
                var tokens = curOverlayInfos[i].infoWindowContent.getData();
                for(var k = 0; k<tokens.length;k++){
                    for(var key in tokens[k]){
                        this.customListFields.push(key);  
                    }
                }
            }
        }
        for(var i = 0; i<curOverlayInfos.length;i++){
            var tokens = curOverlayInfos[i].infoWindowContent.getData();
            for(var k = 0; k<tokens.length;k++){
                var curObj = {};
                for(var j = 0; j<this.customListFields.length;j++){
                    curObj[this.customListFields[j]]=tokens[k][this.customListFields[j]];
                }
                printerInput.push(curObj);
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