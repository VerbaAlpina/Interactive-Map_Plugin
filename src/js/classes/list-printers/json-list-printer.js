/**
 * @constructor
 * @implements ListPrinter
 */
function JsonListPrinter(){
    this.getName = function(){
        return "JSON-Format";
    }
    this.getType = function(){
        return "application/json;charset=utf8"
    }
    this.buildList = function(data){
        return JSON.stringify(data);
    }
    this.isDownload = function(){
        return true;
    }
    this.downloadName = function(){
        return "list.json";
    }
}