var selectModes = {
	Chosen : 0,
	Select2 : 1
};

/**
 * 
 * @param {string=} selector 
 * @param {number=} mode 
 * @param {string=} dbName
 * 
 * @returns {undefined}
 */
function addNewEnumValueScript (selector, mode, dbName){
	if(selector == undefined)
		selector = ".im_enum_select";
	
	if(mode == undefined)
		mode = selectModes.Chosen;
	
	jQuery(selector).change(function (){
		var /** jQuery */ selectObject = jQuery(/** @type{HTMLSelectElement} */ (this));
		if(selectObject.val() == "###NEW###"){
			updateSelect(selectObject, "", /** @type{number} */ (mode))
			newEnumEntry(this, /** @type{string}*/ (selectObject.data("table")), /** @type{string}*/ (selectObject.data("column")), /** @type{string}*/ (selectObject.data("nonce")), /** @type{number} */ (mode), dbName);
		}
	});
}

/**
 * 
 * @param selector {string}
 * @param callback {string|function}
 * @param mode {number}
 * 
 * @returns {undefined}
 */

//TODO addNewValue for already selected elements
function addNewValueScript (selector, callback, mode){
	jQuery(selector).change(function (){
		var /** jQuery */ selectObject = jQuery(/** @type{HTMLSelectElement} */ (this));
		if(selectObject.val() == "###NEW###"){
			updateSelect(selectObject, "", mode);
			showTableEntryDialog("TEB_" + selectObject.prop("id"), callback, mode);
		}
	});
}

function initGuiElements (){
	
	//Listener to add new rows to the database
	jQuery(".im_table_select").val("").chosen({allow_single_deselect: true});
	//addNewValueScript(".im_table_select", "reload", selectModes.Chosen, NEW_ELEMENTS_VAL);
	
	jQuery(".im_table_select").each(function (){
		//Function to get the current value from a select menu
		jQuery(this).data("getSelectedValue", function (){
			return jQuery(this).val();
		}.bind(this));
		
		//Function to get the current name from a select menu
		jQuery(this).data("getName", function (key){
			key = key.substring(1); //Remove prefix
			return jQuery(this).children("option[value='" + key + "']").first().text();
		}.bind(this));
		
		//Function to reset the select element
		jQuery(this).data("reset", function (){
			jQuery(this).val("0").trigger("chosen:updated");
		}.bind(this));
	});
	
	jQuery(".editCommentLink").click(commentManager.editComment);
	jQuery(".saveCommentButton").click(function (){
		commentManager.saveComment ();
	});
	
	jQuery(".sf-menu-toplevel").superfish();
	
	jQuery(".sf-tree-leaf").click(function (){
		var /** jQuery */ topLevel = jQuery(this).closest(".sf-menu-toplevel");
		topLevel.data("lastValue", jQuery(this).data("id"));
		topLevel.trigger("change");
		jQuery(topLevel).superfish("hide");
	});
	
	jQuery(".sf-menu-toplevel").each(function (){
		jQuery(this).data("getSelectedValue", function (){
			return jQuery(this).data("lastValue");
		}.bind(this));
		
		jQuery(this).data("getName", function (key){
			key = key.substring(1); //Remove prefix
			return jQuery(this).find("a[data-id=" + key + "]").text();
		}.bind(this));
		
		jQuery(this).data("reset", function (){
			//Not needed
		});
	});
	
	var /** jQuery */ synMap = jQuery("#IM_Syn_Map_Selection");
	synMap.val("").trigger("chosen:updated");
	synMap.change(function(){
		//Disable quantify mode if enabled
		if(symbolClusterer.checkQuantify() !== false){
			symbolClusterer.toggleQuantifyMode();
		}
		
		//Empty legend:
		legend.removeAll();
		
		//Load map:
		categoryManager.loadSynopticMap(synMap.val() * 1);
		synMap.val("").trigger("chosen:updated");
	});
	
	jQuery("#IM_Save_Syn_Map_Button").click(function (){
		if(legend.getLength() == 0){
			alert(TRANSLATIONS["NO_SELECTION"]); 
		}
		else {
			jQuery("#IM_Syn_Map_Name").val("");
			jQuery("#IM_Syn_Map_Description").val("");
			jQuery('#IM_Save_Syn_Map').dialog({minWidth : 500});
		}
	});
	
	jQuery("#IM_Save_Syn_Map_Final_Button").click(categoryManager.saveSynopticMap);
	
	jQuery('#helpRelease').qtip({
		content : {
			text : TRANSLATIONS["HELP_RELEASE"]
		},
		style : {
			classes : 'qtip-blue'
		}
	});

	initCanvasMenu();
}


/**
 * Opens a dialog window for a tableEntryBox (compare with table_entry_box in gui-elements.php)
 * 
 * @param {string} id The id of the content that is supposed to be showed
 * @param {function(Object<string, *>)|string|null} callback A function that is called if the dialog is closed using the confirm button. The shortcode "reload" triggers a page reload.
 * @param {number} mode
 * @param {string=} dbName
 * @param {boolean=} suppressUserName
 * @param {string=} primaryKeyField
 * @param {string=} updateId
 * 
 * @return {undefined}
 */
function showTableEntryDialog(id, callback, mode, dbName, suppressUserName, primaryKeyField, updateId){

	var /** jQuery */ divObject = jQuery('#' + id);
	jQuery("#error" + id).html("");
	
	divObject.dialog({
		'minWidth' : 700, 
		'modal': true
	});
	
	if(mode == selectModes.Chosen){
		//Rebuild Chosen elements (this is needed since Chosen sets the width of a hidden element to zero)
		divObject.find('select').chosen("destroy");
		divObject.find('select').chosen({allow_single_deselect: true});
	}
	else if (mode == selectModes.Select2){
		divObject.find('select').select2("destroy");
		divObject.find('select').select2();
	}
	
	//Set button value
	if(primaryKeyField && updateId)
		jQuery("#save" + id).val(/** @type{string} */ (jQuery("#save" + id).data("update-value")));
	else
		jQuery("#save" + id).val(/** @type{string} */ (jQuery("#save" + id).data("insert-value")));
	
	//Bind callback function
	jQuery("#save" + id).unbind("click");
	jQuery("#save" + id).click(function (){
		addEntryToTable(/** @type {string} */ (divObject.data("table")), id, callback, mode, dbName, suppressUserName, primaryKeyField, updateId);
	});
}

/**
 * 
 * @param {string} table
 * @param {string} selectId
 * @param {function(Object<string, *>)|string|null} callback
 * @param {number} mode
 * @param {string=} dbName
 * @param {boolean=} suppressUserName
 * @param {string=} primaryKeyField
 * @param {string=} updateId
 * 
 * @return {undefined}
 */
function addEntryToTable (table, selectId, callback, mode, dbName, suppressUserName, primaryKeyField, updateId){
	var /** HTMLCollection */ e = document["forms"]["input" + selectId].elements;
	
	var /**Array<HTMLFormElement> */ elementArray = [];
	var /** string */ nonce;
	
	for (var /** number */ i = 0; i < e.length; i++){
		
		if(e[i]["name"] == "_wpnonce"){
			nonce = e[i]["value"];
		}
		else if(e[i]["parentNode"]["className"] != "chosen-search"){
			//Ignore the input elements added by Chosen
			elementArray.push(e[i]);
		}
	}

	var /** Object<string, string>? */ data = getJSONDataFromInputWindow(elementArray, table, suppressUserName, primaryKeyField, updateId);
	
	if(data == null)
		return;
		
	data["_wpnonce"] = nonce;
	
	if(dbName != undefined){
		data["dbname"] = dbName;
	}

	jQuery.post(ajaxurl, data, function (response){
		if(response == "-1"){
			jQuery("#error" + selectId).html("Not allowed!");
		}
		else if(response.indexOf("Error: ") === 0){
			jQuery("#error" + selectId).html(response);
		}
		else {
			resetFields(e, mode);
			jQuery("#" + selectId).dialog("close");
			
			var paramData = {};
			var /** Array<string> */ rows = /** @type{Array<string>} */ (JSON.parse(data["rows"]));
			var /** Array<string> */ values = /** @type{Array<string>} */  (JSON.parse(data["values"]));
			for(var i = 0; i < rows.length; i++){
				paramData[rows[i]] = values[i];
			}
			paramData["id"] = response;
			
			if(typeof callback == "string"){
				switch (callback){
					case "reload":
						location.reload();
						break;
						
					default:
						alert("Unknown callback shortcut!"); //TODO translate
				}
			}

			else if(callback != null)
				/** @type{function(Object<string, *>)} */ (callback)(paramData);

		}
	});
	
}

/**
 * 
 * @param {HTMLCollection} e
 * @param {number} mode
 * 
 * @return {undefined}
 */
function resetFields (e, mode){
	for (var i = 0; i < e.length; i++){
		if(e[i]["type"] != "hidden"){
			var currentE = jQuery(e[i]);
			var currentType = currentE.prop("tagName").toLowerCase();
			
			if(currentType === "select"){
				currentE[0].selectedIndex = 0;
				
				if(mode == selectModes.Chosen){
					currentE.trigger("chosen:update");
				}
				else if (mode == selectModes.Select2 && e[i]["className"].indexOf("select2-hidden-accessible") !== -1){
					currentE.trigger("change");
				}
			}
			else if (currentType === "input" && currentE.prop("type") === "checkbox"){
				currentE.prop("checked", false);
			}
			else {
				currentE.val("");
			}
		}
	}
}

/**
 * 
 * @param {Array<HTMLFormElement>} elements
 * @param {string} table
 * @param {boolean=} suppressUserName
 * @param {string=} primaryKeyField
 * @param {string=} updateId
 * 
 * @return {Object<string, string>?}
 */
function getJSONDataFromInputWindow (elements, table, suppressUserName, primaryKeyField, updateId){

	var /** Array<string> */ rows = [];
	var /** Array<string> */ values = [];
	var /** Array<string> */ format = [];
	
	for (var /** number */ i = 0; i < elements.length; i++){
		if(suppressUserName && elements[i].dataset["meta"] == "user"){
			continue;
		}
		
		if((elements[i]["value"] == "" || elements[i]["value"] == null) && elements[i]["dataset"]["nonempty"] == "1"){
			alert("Das Feld \"" + elements[i]["name"] + "\" darf nicht leer sein!"); //TODO translation
			return null;
		}
		var indexName = rows.indexOf(elements[i].name);
		if(indexName === -1){
			rows.push(elements[i].name);
		
			if(elements[i]["dataset"]["type"] == 'B'){
				values.push(elements[i]["checked"]? "1":"0");
				format.push('%d');
			}
			else if(elements[i]["dataset"]["type"] == 'S'){
				values.push(elements[i]["checked"]? elements[i]["value"] : "");
				format.push('%s');
			}
			else {
				values.push(elements[i]["value"]);
				format.push('%s');
			}
		}
		else if(elements[i]["checked"]) {
			if(values[indexName] == "")
				values[indexName] = elements[i]["value"];
			else
				values[indexName] += ("+" + elements[i]["value"]);
		}
	}
	var /** Object<string, string> */ data = {
		'action' : 'im_u',
		'namespace' : 'gui_elements',
		'query': updateId? 'update_table_value' : 'add_new_entry_to_table',
		'table': table,
		'rows' : JSON.stringify(rows),
		'values' : JSON.stringify(values),
		'format' : JSON.stringify(format)
	};
	
	if(updateId && primaryKeyField){
		data["id"] = updateId;
		data["key_field"] = primaryKeyField;
	}
	
	return data;
}	

/**
 * @param {Element} caller
 * @param {string} table
 * @param {string} col
 * @param {string} nonce
 * @param {number} mode
 * @param {string=} dbName
 * 
 * @returns{undefined}
 */
function newEnumEntry(caller, table, col, nonce, mode, dbName){
	var selectObject = jQuery(caller);
	var newVal = prompt(TRANSLATIONS["NEW_ENTRY"], "");
	if(newVal != null && newVal != ""){
		var data = {'action' : 'im_u',
					'namespace' : 'gui_elements',
					'query' : 'add_enum_value',
					'table' : table,
					'col' : col,
					'val' : newVal,
					'_wpnonce' : nonce
		};
		
		if(dbName){
			data["dbname"] = dbName;
		}
		
		jQuery.post(ajaxurl, data, function (response) {
			if(response == "-1"){
				alert("Not allowed!");
			}
			else if(response.indexOf("Error: ") === 0){
				alert(response);
			}
			else{
				selectObject.append("<option value='" + newVal + "'>" + newVal + "</option>");
				updateSelect(selectObject, newVal, mode);
				alert(TRANSLATIONS["VALUE_ADDED"]);
			}	
		});
	}
	else {
		updateSelect(selectObject, [], mode);
	}
}

/**
 * @param {jQuery} element
 * @param {string|Array<string>} value
 * @param {number} mode
 * 
 * @return {undefined}
 */
function updateSelect(element, value, mode){
	element.val(value);
	switch (mode){
		case selectModes.Chosen:
			element.trigger("chosen:updated");
		case selectModes.Select2:
			element.trigger("change");
	}
}

/** 
* @return {undefined}
*/
function initCanvasMenu(){
	jQuery.ajax({
		dataType: "json",
		url: PATH["gradientFile"],
		success: function(data){
			createCanvasMenu(data);
		}
	});

	jQuery.ajax({
		dataType: "json",
		url: PATH["mapStyleDark"],
		success: function(data){
			style_for_quantify = data;
		}
	});

}

/**
 * 
 * @param {Array<Object>} gradients
 * 
 * @returns {undefined}
 */
function createCanvasMenu (gradients){

	var container = jQuery('<div id="listcontainer"></div>');
	jQuery('body').append(container);
	var edithover = false;
	var listout = false;
	
	var list = jQuery('<ul class="canvas_list"></ul>');
	container.append(list);
	
	var canvas_size = 256;
	
	var icon = jQuery('<i style="display:none" class="fa fa fa-long-arrow-up canvas_icon" aria-hidden="true"></i>');
	container.append(icon);
	
	container.append(jQuery('<div id="activediv"></div>'));
	
	for (var i=0; i<gradients.length;i++){
	
	var gradient = gradients[i];
	
	var gdiv = jQuery('<canvas id="barcanvas_'+i+'" class="barcanvas" width='+canvas_size+'" height="35" ></canvas>');
	
	
	if(i==0){
		var active = jQuery('#activediv');
		var exchangeparent = jQuery('<div class="exchangeparent"></div>');

		var legend_0 = jQuery('<div id="colorbarlegend_left" class="colorbarlegenditem">0</div>');
		var legend_max = jQuery('<div id="colorbarlegend_right" class="colorbarlegenditem">142</div>');

		active.append(legend_0);
		active.append(legend_max);
	
		active.append(exchangeparent);
		
		exchangeparent.append(gdiv);
	
		var hoverdiv = jQuery('<div class="hoverdiv"></div>');
		exchangeparent.append(hoverdiv);
	
		var canvastextdiv = jQuery('<div class="canvastext">'+gradient.name+'</div>');
		exchangeparent.append(canvastextdiv);
	
		var canvas  = document.getElementById('barcanvas_'+i);
		createCanvas(canvas,gradient,canvas_size);
	
		var editsymbol = jQuery('<i style="display:none;" class="fa fa-pencil-square editsymbol" aria-hidden="true"></i>');
		active.append(editsymbol);
	
		var editsymbolbg = jQuery('<i style="display:none;" class="fa fa-square editsymbolbg" aria-hidden="true"></i>');
		active.append(editsymbolbg);

	}
	else {
		var lidiv = jQuery('<li></li>'); 
		lidiv.append(gdiv);
		jQuery('.canvas_list').prepend(lidiv);

		var hoverdiv = jQuery('<div class="hoverdiv"></div>');
		lidiv.append(hoverdiv);

		var canvastextdiv = jQuery('<div class="canvastext">'+gradient.name+'</div>');
		lidiv.append(canvastextdiv);

		var canvas  = document.getElementById('barcanvas_'+i); 
		createCanvas(canvas,gradient,canvas_size);
	}
}

jQuery(".canvas_list li").hover(function(){
   jQuery(this).find('.hoverdiv').show();
   jQuery(this).find('.canvastext').show();
}, function(){
   jQuery(this).find('.hoverdiv').hide();
   jQuery(this).find('.canvastext').hide();
});

jQuery("#activediv").hover(function(){
   jQuery(this).find('.hoverdiv').show();
   jQuery(this).find('.canvastext').show();
   jQuery('#listcontainer').find('.canvas_icon').show();
   if(!listout){
   jQuery(this).find('.editsymbol').show();
   jQuery(this).find('.editsymbolbg').show();
   }
}, function(){
   jQuery(this).find('.hoverdiv').hide();
   jQuery(this).find('.canvastext').hide();
   jQuery('#listcontainer').find('.canvas_icon').hide();
   jQuery(this).find('.editsymbol').hide();
   jQuery(this).find('.editsymbolbg').hide();
});

jQuery(".editsymbol").hover(function(){
   edithover = true;
}, function(){
   edithover = false;
});


jQuery('#activediv').click(function() {
  if(!edithover){
    listout= !listout;
    jQuery('.canvas_list').slideToggle();
    jQuery('.canvas_icon').toggleClass('fa fa-long-arrow-up fa fa-long-arrow-down');
    jQuery(this).find('.editsymbol').hide();
    jQuery(this).find('.editsymbolbg').hide();
    jQuery('.colorbarlegenditem').hide();
    if(!listout){
         jQuery(this).find('.editsymbol').show();
         jQuery(this).find('.editsymbolbg').show();
         setTimeout(function() { jQuery('.colorbarlegenditem').fadeIn('slow');}, 200);
        
    }
    }
});


jQuery('.canvas_list li').click(function(){

 var clicked_canvas = jQuery(this).children();
 var hover =  jQuery(this).find('.hoverdiv');

 var old_active = jQuery('.exchangeparent').children();

 jQuery('.canvas_list').slideToggle();
 if(jQuery('.colorbarlegenditem').css('display','none'))setTimeout(function() { jQuery('.colorbarlegenditem').fadeIn('slow');}, 200);
 jQuery('.canvas_icon').toggleClass('fa fa-long-arrow-up fa fa-long-arrow-down');

 jQuery('.exchangeparent').append(clicked_canvas);


jQuery(this).prepend(old_active);
 // jQuery(this).parent().append(old_active);
listout = false;
symbolClusterer.changePolygonColor(false);
})



var colorpicker = jQuery('.editsymbol').colorPicker(
{	
    "doRender" : false,
    "opacity": true,
    "buildCallback": function(elm) {jQuery('#listcontainer').append(jQuery('.cp-color-picker'));},
    "renderCallback": /** @this{Object} */ function(elm, toggled) {
    	var colors = this['color']['colors']; // the whole color object

    	var rgb = colors['RND']['rgb']; // the RGB color in 0-255
    	var alpha = colors['alpha'];   
    	var canvas  = document.querySelector("#activediv canvas");

    	if (toggled) { // on show colorPicker

    		var /** CanvasRenderingContext2D */ ctx = canvas.getContext('2d');
	        var /** ImageData */ pix = ctx.getImageData(0, 0, 1, 1);
	        var /**Uint8ClampedArray */ color_arr = pix.data;
	        	
	        var /** number*/ r = color_arr[0];
	        var /** number*/ g = color_arr[1];
	        var /** number*/ b = color_arr[2];
	        var /** number*/ a = Math.round((color_arr[3]/255)*10)/10;

	        var initial_color = "rgba(" + r + "," + g + "," + b + "," + a +")";	
    	    this['color']['setColor'](initial_color);
    	    this['render']();

    	}
    	else{
    	  symbolClusterer.changePolygonColor(false);
    	}

    	if(!toggled)updateActiveCanvas(rgb,alpha,canvas);
    }
});




var thediv = document.getElementById('listcontainer');
jQuery('#listcontainer').hide();
map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(thediv);

}//createCanvasMenu


function createCanvas(canvas,gradient,canvas_size) {

 var  ctx = canvas.getContext('2d');
 ctx.rect(0, 0, canvas.width, canvas.height);

 var grd = ctx.createLinearGradient(0,0,canvas_size,0);

 for (var i=0;i<gradient['stops'].length;i++){

  grd.addColorStop(gradient['stops'][i].value,gradient['stops'][i].color);

 } 
// Fill with gradient
ctx.fillStyle = grd;
ctx.fillRect(0,0,canvas_size,35);

}

/**
 * 
 * @param {{r : number, g : number, b : number}} rgb 
 * @param {number} alpha_in 
 * @returns {undefined}
 */

function updateActiveCanvas(rgb,alpha_in,canvas){


 var ctx = canvas.getContext('2d');
     ctx.globalAlpha=alpha_in;

      var alpha = Math.floor(alpha_in*255);

      var imgd = ctx.getImageData(0, 0, 1, 35);
      var pix = imgd.data;

      for (var i = 0, n = pix.length; i <n; i += 4) {
              
              pix[i] = rgb['r'];
              pix[i+1] = rgb['g'];
              pix[i+2] = rgb['b'];
              pix[i+3] = alpha; 
      }

     ctx.putImageData(imgd, 0, 0);

}