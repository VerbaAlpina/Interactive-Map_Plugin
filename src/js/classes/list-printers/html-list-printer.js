/**
 * @constructor
 * @implements ListPrinter
 */
function HtmlListPrinter(){
    this.getName = function(){
        return "Tabelle anzeigen";
    }
    this.getType = function(){
        return "text/html;charset=utf8"
    }
    this.buildList = function(data){
        var result = "<table>";
        if(data.length>0){
            var keys = [];
            for(var key in data[0]){
                keys.push(key);
            }
            var datalen = data.length;
            var keyslen = keys.length;
            result+="<thead><tr>";
            for(var i = 0; i < keyslen;i++){
                result+='<th>'+keys[i]+'</th>';
            }
            result+="</tr></thead><tbody>"
            for(var i = 0; i < datalen; i++){
                result+="<tr>";
                for(var j = 0; j < keyslen; j++){
                    result+='<td>'+data[i][keys[j]]+'</td>';
                }
                result+="</tr>";
            }
        }
        result+="</tbody></table>";
        return result;
    }
    this.isDownload = function(){
        return false;
    }
    this.downloadName = function(){
        return null;
    }
}