/**
 * @constructor
 * @struct
 * @implements {InfoWindowContent}
 * 
 * @param {Object<string, string>} data
 */
function MergeableTableInfoWindow(data){
    var tokenTitle="name";
    this.tokens = {};
    this.tokens[data[tokenTitle]] = data;

    this.title = data.title;

    this.getHtmlString = function(){
        var result = "<div class='tableInfoWindowWrapper'>";
        // Iterate over all elements in the merged info window table
        for(var key in this.tokens){
            result+="<div class='infoWindowElement'>"
            result+="<h3 class='infoWindowElementName'>"+key+"</h3>";
            result+="<div class='infoWindowElementContent'>";
            result+="<table>";
            var i = 1;
            // Iterate over all properties of the info window element
            for(var propertyKey in this.tokens[key]){
                if(propertyKey.indexOf("hidden_")===-1&&propertyKey!=tokenTitle){
                    result+="<tr>";
                    result+="<td>"+propertyKey+"</td>";
                    result+="<td>"+this.tokens[key][propertyKey]+"</td>";
                    result+="</tr>";
                    if(i%8 === 0){
                        result+="</table><table>";
                    }
                }
            }
            result+="</table>";
            result+="</div>";
            result+="</div>";
        }
        result += "</div>";
        return result;
    };

    this.tryMerge = function(mapSymbol, owner){
        if(typeof owner !== "undefined"
            &&MergeableTableInfoWindow.prototype.isPrototypeOf(owner)){
            if(this.title===owner.title){
                for(var key in this.tokens){
                    owner.tokens[key]=this.tokens[key];
                }
                return true;
            }
        }
        return false;
    };

    this.onOpen = function(infoWindow){

    };

    this.onClose = function(){

    };

    this.getData = function(){
        var result = [];
        for (var key in this.tokens){
            result.push(this.tokens[key]);
        }
        return result;
    };
}