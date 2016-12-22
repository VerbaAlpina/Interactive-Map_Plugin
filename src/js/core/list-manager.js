/**
 * @constructor
 * @param {AbstractListBuilder} listBuilderParam
 * @param {LegendElement|MultiLegendElement} elementParam
 */
function ListManager(listBuilderParam, elementParam){
    this.listBuilder = listBuilderParam;
    this.element = elementParam;

    this.dialog = null;
    var self = this;

    /**
     * @return {Element}
     */
    this.buildDialog = function(){
        var listDialog = document.createElement("div");
        var table = document.createElement("table");
        var tr1 = document.createElement("tr");
        var tdLabel = document.createElement("td");
        tdLabel.appendChild(document.createTextNode(TRANSLATIONS["SELECT_LIST_TYPE"]));
        tr1.appendChild(tdLabel);
        
        var tdSelect = document.createElement("td");
        var select = document.createElement("select");
        select.id = "listManagerPrinterSelection";
        var printers = this.listBuilder.getListPrinters();
        for(var i = 0; i < printers.length; i++) {
            var option = document.createElement("option");
            option.value = i;
            option.appendChild(document.createTextNode(printers[i]));
            select.appendChild(option);
        }
        tdSelect.appendChild(select);
        tr1.appendChild(tdSelect);
        table.appendChild(tr1);

        listDialog.appendChild(table);
        return listDialog;
    }

    this.showResult = function(event){
        var printerSelect = document.getElementById("listManagerPrinterSelection");
        var printerID = printerSelect.options[printerSelect.selectedIndex].value;
        var printerResult = self.listBuilder.retrieveList(printerID,self.element);
        if(printerResult[2]==true){
            var blob = new Blob([printerResult[1]], {type: printerResult[0]});
            var a = window.document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = printerResult[3];

            // Append anchor to body.
            document.body.appendChild(a)
            a.click();

            // Remove anchor from body
            document.body.removeChild(a)
            a.href = null;
            blob = null;
            a = null;
        }else{
            var jQueryElement;
            if(printerResult[0].indexOf("text/html")!=-1){
                jQueryElement = jQuery("<div class='htmlTypeListView'>"+printerResult[1]+"</div>")
            } else {
                jQueryElement = jQuery("<div class='customTypeListView'><pre>"+printerResult[1]+"</pre></div>");
            }
            jQueryElement.dialog({
                "minWidth" : 700,
                "maxHeight" : 700
            });
        }
        printerResult = null;
        jQuery(this).dialog("close");
        jQuery(this).dialog("destroy");
    }

    this.showSelectionDialog = function(){
        //if(this.dialog===null){
            var options = {
                    resizable: false,
                    minHeight:180,
                    modal: true,
                    buttons: {
                        "Cancel": function() {
                            jQuery( this ).dialog( "close" );
                        }
                    }
                };
            options.buttons[TRANSLATIONS["PRINT_LIST"]]=this.showResult;
            this.dialog = jQuery(this.buildDialog()).dialog(options)
        /*} else {
            jQuery(this.dialog).dialog('open');
        }*/
    }
}