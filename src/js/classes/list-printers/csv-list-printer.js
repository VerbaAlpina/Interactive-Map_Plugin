/**
 * @constructor
 * @implements ListPrinter
 */
function CsvListPrinter(){
    this.getName = function(){
        return "CSV-Format (Standard)";
    }
    this.getType = function(){
        return "text/csv;charset=utf8"
    }
    /**
     * 
     * @return {string}
     */
    this.buildList = function(data){
        return CsvBuildList(data, "\t", "");
    }
    this.isDownload = function(){
        return true;
    }
    this.downloadName = function(){
        return "list.csv";
    }
}

/**
 * @constructor
 * @implements ListPrinter
 */
function ExcelCsvListPrinter(){
    this.getName = function(){
        return "CSV-Format (Excel-Kompatibel)";
    }
    this.getType = function(){
        return "text/csv;charset=utf-16"
    }
    /**
     * 
     * @return {string}
     */
    this.buildList = function(data){
        return "\ufeff"+CsvBuildList(data, ";", '"');
    }
    this.isDownload = function(){
        return true;
    }
    this.downloadName = function(){
        return "list.csv"; 
    }
}

/**
 * 
 * @return {string}
 */
function CsvBuildList(data, delimiter, fieldEscape){
    var result = "";
    if(data.length>0){
        var keys = [];
        for(var key in data[0]){
            keys.push(key);
        }
        var datalen = data.length;
        var keyslen = keys.length;
        for(var i = 0; i < keyslen;i++){
            result+=(i>0) ? delimiter : "";
            result+=fieldEscape+keys[i]+fieldEscape;
        }
        result+="\n"
        for(var i = 0; i < datalen; i++){
            for(var j = 0; j < keyslen; j++){
                result+=(j>0) ? delimiter : "";
                result+=fieldEscape+data[i][keys[j]]+fieldEscape;
            }
            result+=(j!=(datalen-1)) ? "\n" : "";
        }
    }
    return result;
}