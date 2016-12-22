/**
 * @interface
 * 
 *
 * Method which builds a list builder containing all desired elements
 * 
 * @param {LegendElement|MultiLegendElement=} elements
 */
function AbstractListBuilder (elements) {}; 

/**
 * Method which adds a possible list printer (JSON, HTML...) to the builder
 *
 * @param {ListPrinter} printer
 */
AbstractListBuilder.prototype.addListPrinter = function(printer) {};

/**
 * Method which returns all available printers
 *
 * @return {Array<string>}
 */
AbstractListBuilder.prototype.getListPrinters = function(){};

/**
 * Method which returns the data of the selected printer in String Format
 *
 * @param {number} printerID The printer ID to be used (index in the array of showListPrinters);
 * @param {LegendElement|MultiLegendElement} elementsParam
 * @return {Array<Object>} First element: The data type, Second element: The output, Third element: Whether or not the result is a download, Fourth: The name used during download
 */
 AbstractListBuilder.prototype.retrieveList = function(printerID, elementsParam) {};

/**
 * @interface
 */
function ListPrinter(){};

/**
 * @return {string}
 */
ListPrinter.prototype.getName = function(){};

/**
 * @return {string}
 */
 ListPrinter.prototype.getType = function(){};

 /**
  * @param {Array<Object>} data
  * @return {string}
  */
ListPrinter.prototype.buildList = function(data){};

/**
 * Whether the result should be offered as download or presented on the page
 * @return {boolean}
 */
ListPrinter.prototype.isDownload = function(){};

/**
 * The name used for the download
 * @return {string}
 */
ListPrinter.prototype.downloadName = function(){};

/**
 * @constructor
 */
function PrinterManager(){
    /**
     * @private
     * @type {Array<ListPrinter>}
     */
    this.printers = [];

    /**
     * @param {ListPrinter} printer
     */
    this.addPrinter = function (printer){
        this.printers.push(printer);
    }

    /**
     * @return {Array<string>}
     */
    this.getPrinters = function(){
        var result = [];
        for(var i = 0; i<this.printers.length;i++){
            result.push(this.printers[i].getName());
        }
        return result;
    }

    /**
     * @param {number} printerID
     * @return {ListPrinter}
     */
    this.getSinglePrinter = function(printerID){
        return this.printers[printerID];
    }
}

// TODO: Implement printers