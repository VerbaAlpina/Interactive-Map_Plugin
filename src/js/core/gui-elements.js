/**
 * @enum {number}
 */
var selectModes = {
	Chosen : 0,
	Select2 : 1
};


/**
 * 
 * @param {string=} selector
 * @param {number=} mode
 * @param {string=} dbName
 * @param {function(Object)=} callback
 * 
 * @returns {undefined}
 */
function addNewEnumValueScript (selector, mode, dbName, callback){
	if(selector == undefined)
		selector = ".im_enum_select";
	
	if(mode == undefined)
		mode = selectModes.Chosen;
	
	jQuery(selector).change(function (){
		var /** jQuery */ selectObject = jQuery(/** @type{HTMLSelectElement} */ (this));
		if(selectObject.val() == "###NEW###"){
			updateSelect(selectObject, "", /** @type{number} */ (mode))
			newEnumEntry(this, /** @type{string} */ (selectObject.data("table")), /** @type{string} */ (selectObject.data("column")), /** @type{string} */ (selectObject.data("nonce")), /** @type{number} */ (mode), dbName, callback);
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

// TODO addNewValue for already selected elements
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
	
	// Listener to add new rows to the database
	jQuery(".im_table_select:visible").val("").chosen(chosenSettings);
	// addNewValueScript(".im_table_select", "reload", selectModes.Chosen, NEW_ELEMENTS_VAL);
	
	jQuery(".im_table_select").each(function (){
		// Function to get the current value from a select menu
		jQuery(this).data("getSelectedValue", function (){
			return jQuery(this).val();
		}.bind(this));
		
		// Function to get the current name from a select menu
		jQuery(this).data("getName", function (key){
			key = key.substring(1); // Remove prefix
			return jQuery(this).children("option[value='" + key + "']").first().text();
		}.bind(this));
		
		// Function to reset the select element
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
			key = key.substring(1); // Remove prefix
			return jQuery(this).find("a[data-id=" + key + "]").text();
		}.bind(this));
		
		jQuery(this).data("reset", function (){
			// Not needed
		});
	});
	
	var /** jQuery */ synMap = jQuery("#IM_Syn_Map_Selection");
	synMap.val("").trigger("chosen:updated");
	synMap.change(function(){
		// Disable quantify mode if enabled
		if(symbolClusterer.checkQuantify() !== false){
			symbolClusterer.toggleQuantifyMode();
		}
		
		// Load map:
		categoryManager.loadSynopticMap(synMap.val() * 1, "USER");
		jQuery(document).trigger("im_load_syn_map");
		synMap.val("").trigger("chosen:updated");


	});
	
	jQuery("#IM_Save_Syn_Map_Button").click(function (){
		if(legend.getLength() == 0){
			alert(TRANSLATIONS["NO_SELECTION"]); 
		}
		else {
			jQuery("#IM_Syn_Map_Name").val("");
			jQuery("#IM_Syn_Map_Description").val("");
			jQuery('#IM_Save_Syn_Map').modal();
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
	createLocNavigationDiv();
	createAddLayerDiv();
	addSelect2ToSearchField();

	window.onpopstate = function (event){
		mapState.inPopState = true;
				
		if(event.state && event.state["tk"]){
			categoryManager.loadSynopticMap(event.state["tk"], "URL");
		}
		else if(event.state && event.state["content"]){
			legend.switchToState(event.state["content"]);
		}
		else if(event.state && (event.state["layer"] || event.state["layer"] === 0)){
			mapInterface.setLayer(event.state["layer"]);
		}
		else {
			legend.switchToDefaultState();
		}
		
		mapState.inPopState = false;
	}

	jQuery('.leafletcustom').on('click',function(e){
		e.stopPropagation();
	}); 

// jQuery(window).resize(function (){
// 	if(jQuery('.modal').hasClass('in')){
// 	adjustMapModalContent();
// 	}
// });

	jQuery(document).on("click", ".similarity_button", function (){
		let id = /** @type{string}*/ (jQuery(this).data("id"));
		
		let data = {
			"action" : "im_a",
			"namespace" : "get_similarity_data",
			"id_polygon" : id,
			"_wpnonce" : jQuery("#_wpnonce").val()
		};
		
		jQuery.post(ajaxurl, data, function (response){
			let data = /** @type{{similarities: Object<string,number>, html: string}}*/ (JSON.parse(response));
			let /**MapShape*/ mapShape = symbolClusterer.showSimilarity(id, data["similarities"]);
			
			mapShape.infoWindowContent = new SimpleInfoWindowContent (-99, "", OverlayType.Polygon, {"name": "Test", "description": data["html"]});
			mapShape.updateInfoWindow();
		});
	});

}


/**
 * Opens a dialog window for a tableEntryBox (compare with table_entry_box in gui-elements.php)
 * 
 * @param {string} id The id of the content that is supposed to be showed
 * @param {function(Object<string, *>)|string|null} callback A function that is called if the dialog is closed using the confirm button. The
 *            shortcode "reload" triggers a page reload.
 * @param {number} mode
 * @param {string=} dbName
 * @param {boolean=} suppressUserName
 * @param {string=} primaryKeyField
 * @param {string=} updateId
 * @param {Object<string, string>=} values
 * 
 * @return {undefined}
 */
function showTableEntryDialog(id, callback, mode, dbName, suppressUserName, primaryKeyField, updateId, values){

	var /** jQuery */ divObject = jQuery('#' + id);
	jQuery("#error" + id).html("");
	
	divObject.dialog({
		'minWidth' : 700, 
		'modal': true
	});
	
	if (values !== undefined){
		for (var key in values){
			// TODO also make this work for checkboxes
			divObject.find("form[name=inputNewConceptForTree] [name=" + key + "]").val(values[key]);
		}
	}
	
	if(mode == selectModes.Chosen){
		// Rebuild Chosen elements (this is needed since Chosen sets the width of a hidden element to zero)
		divObject.find('select').chosen("destroy");
		divObject.find('select').chosen({allow_single_deselect: true});
	}
	else if (mode == selectModes.Select2){
		divObject.find('select').select2("destroy");
		divObject.find('select').select2();
	}
	
	// Set button value
	if(primaryKeyField && updateId)
		jQuery("#save" + id).val(/** @type{string} */ (jQuery("#save" + id).data("update-value")));
	else
		jQuery("#save" + id).val(/** @type{string} */ (jQuery("#save" + id).data("insert-value")));
	
	// Bind callback function
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
	
	var /** Array<HTMLFormElement> */ elementArray = [];
	var /** string */ nonce;
	
	for (var /** number */ i = 0; i < e.length; i++){
		
		if(e[i]["name"] == "_wpnonce"){
			nonce = e[i]["value"];
		}
		else if(e[i]["parentNode"]["className"] != "chosen-search"){
			// Ignore the input elements added by Chosen
			elementArray.push(e[i]);
		}
	}

	var /** Object<string, string>? */ data = getJSONDataFromInputWindow(elementArray, table, suppressUserName, primaryKeyField, updateId);
	
	if(data == null){
		return;
	}
		
	data["_wpnonce"] = nonce;
	
	if(dbName != undefined){
		data["dbname"] = dbName;
	}

	jQuery.post(ajaxurl, data, function (response){
		if(response == "-1"){
			jQuery("#error" + selectId).html("Not allowed!");
		}
		else if (!response){
			jQuery("#error" + selectId).html("No server response!");
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
						alert("Unknown callback shortcut!"); // TODO translate
				}
			}

			else if(callback != null)
				/** @type{function(Object<string, *>)} */ (callback)(paramData);

		}
	}).fail(function (){
		jQuery("#error" + selectId).html("Server error! Request failed!");
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
	var /** Array<string> */ defaultFields = [];
	
	for (var /** number */ i = 0; i < elements.length; i++){
		if(suppressUserName && elements[i].dataset["meta"] == "user"){
			continue;
		}
		
		if((elements[i]["value"] == "" || elements[i]["value"] == null) && elements[i]["dataset"]["nonempty"] == "1"){
			alert("Das Feld \"" + elements[i]["name"] + "\" darf nicht leer sein!"); // TODO translation
			return null;
		}
		
		var indexName = rows.indexOf(elements[i].name);
		if(indexName === -1){
			if(elements[i]["dataset"]["emptydefault"] == '1' && elements[i]["value"] == ""){
				if(updateId){
					defaultFields.push(elements[i].name);
				}
				// Ignore, so that the default value is used
			}
			else if(elements[i]["dataset"]["type"] == 'B'){
				values.push(elements[i]["checked"]? "1":"0");
				format.push('%d');
				rows.push(elements[i].name);
			}
			else if(elements[i]["dataset"]["type"] == 'S'){
				values.push(elements[i]["checked"]? elements[i]["value"] : "");
				format.push('%s');
				rows.push(elements[i].name);
			}
			else if(elements[i]["dataset"]["type"] == 'N'){
				if(isNaN(elements[i]["value"])){
					alert("Im Feld '" + elements[i].name + "' muss eine Nummer stehen!");
					return null;
				}
				
				values.push(elements[i]["value"]);
				format.push('%d');
				rows.push(elements[i].name);
			}
			else {
				values.push(elements[i]["value"]);
				format.push('%s');
				rows.push(elements[i].name);
			}
		}
		else if(elements[i]["checked"]) {
			if(values[indexName] == "")
				values[indexName] = elements[i]["value"];
			else
				values[indexName] += ("+" + elements[i]["value"]);
		}
	}
	var /** Object<string, ?> */ data = {
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
	
	if(updateId){
		data["defaultFields"] = defaultFields;
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
 * @param {function(Object)=} callback
 * 
 * @returns{undefined}
 */
function newEnumEntry(caller, table, col, nonce, mode, dbName, callback){
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
				if(callback)
					callback({"newValue" : newVal});
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
 * @returns {undefined}
 */
 function createLocNavigationDiv (){
	 mapInterface.addLocationDiv(function(e){
		 jQuery('#IM_loc_nav_popup').modal();
	 }, function (){
		 jQuery('#IM_loc_nav_popup').one('shown.bs.modal',function(){
			 var ajax_data_loc = getAjaxData("load_loc_data");
			 var select2_lang = PATH["language"];
			 if(select2_lang=="si")
				 select2_lang="sl";

			 var loc_select2 = jQuery('.loc_data_select').select2({
				 "ajax": ajax_data_loc,
				 "minimumInputLength": 3,
				 "placeholder":  TRANSLATIONS['SEARCH_PLACEHOLDER'],
				 "escapeMarkup": function (markup) { return markup; },
				 "delay": 250,
				 "templateResult": formatLocResults,
				 "width" : "100%",
				 "language": select2_lang
	    	});

			loc_select2.on('select2:select', function (e) {
				jQuery('#IM_loc_nav_popup').modal('hide');
				var data = e['params']['data'];
				gotoLocation(data['id'], true);
			});

			var ajax_data_lang = getAjaxData("global_search"); // change when ajax done
		  })

		jQuery('#IM_loc_nav_popup').on('show.bs.modal',function(){
			try {
				jQuery('.loc_data_select').val('').trigger('change');
			}
			catch(e) {
				    
			}
		})
	 });
}


/**
 * @returns {undefined}
 */
 function createAddLayerDiv (){
	 mapInterface.addAddLayerDiv(
	 	function(e){

		 jQuery('#IM_add_overlay_popup').modal({backdrop:false});
	 }, 
	  function (){

	      	 jQuery('#IM_add_overlay_popup').one('shown.bs.modal',function(){

	      	 		var mayr = L.tileLayer('https://www.verba-alpina.gwi.uni-muenchen.de/tiles/mayr/{z}/{x}/{y}.png', {
					  attribution: 'Map tiles based on scan by <a href="https://www.davidrumsey.com/">David Rumsey</a> CC BY-NC-SA 3.0',
			          minZoom: 0, maxZoom: 12,
			          noWrap: true,
			          tms: false,
			          zIndex: 1000
			 		});

		 			var czoernig = L.tileLayer('https://www.verba-alpina.gwi.uni-muenchen.de/tiles/czoernig/{z}/{x}/{y}.png', {
					  attribution: 'Map tiles based on scan by <a href="https://opacplus.bsb-muenchen.de/title/BV012651353">Bsb Muenchen</a> CC BY-NC-SA 3.0',
			          minZoom: 0, maxZoom: 12,
			          noWrap: true,
			          tms: false,
			          zIndex: 1000
			 		});

		 			var kirchenprovinzen = L.tileLayer('https://www.verba-alpina.gwi.uni-muenchen.de/tiles/kirchenprovinzen/{z}/{x}/{y}.png', {
					  attribution: 'Map tiles based on scan by <a href="https://www.digitale-bibliothek-mv.de/viewer/image/PPN636492214/36/LOG_0031/">Digitale Bibliothek MV</a> CC BY-NC-SA 3.0',
			          minZoom: 0, maxZoom: 11,
			          noWrap: true,
			          tms: false,
			          zIndex: 1000
			 		});

					var ald_blue_layer = L.tileLayer('https://www.ald.gwi.uni-muenchen.de/tiles/{z}/{x}/{y}.png', {
				    minZoom: 0, maxZoom: 12,
					noWrap: true,
					tms: false,
				     zIndex: 1000
					});


					var Stamen_Labels = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-labels/{z}/{x}/{y}{r}.{ext}', {
						attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
						subdomains: 'abcd',
						minZoom: 0,
						maxZoom: 20,
						ext: 'png',
						opacity: 0.9,
						tms:false,
						zIndex: 1000
					});


	      	 		jQuery('.map_overlay_group span').on('click',function(){
	      	 			 jQuery(this).parent().find('input').click();
	      	 		})


	      	 		jQuery('#czoernig').on('change',function(){
	      	 			toggleOverlay(this,czoernig);
	      	 		});

      	 			jQuery('#kirchenprovizen').on('change',function(){
	      	 			toggleOverlay(this,kirchenprovinzen);
	      	 		});

	      	 		jQuery('#mayr_overlay').on('change',function(){
	      	 			toggleOverlay(this,mayr);
	      	 		});

  	 				jQuery('#ald_overlay').on('change',function(){
	      	 			toggleOverlay(this,ald_blue_layer);
	      	 		});

  	 				jQuery('#stamen_labels').on('change',function(){
	      	 			toggleOverlay(this,Stamen_Labels);
	      	 		});
					
  	 				jQuery('.map_overlay_group').each(function(){
  	 						var that = jQuery(this);
  	 						addBiblioQTips(that);
  	 				})
					

	      	 })
	 })
}


/**
 * @returns {undefined}
 */
function toggleOverlay(_this,overlay){

	var slider = jQuery(_this).parent().find('.overlay_slider').find('input');

		if(jQuery(_this).is(':checked')){
		 	overlay.addTo(mapInterface.map);

			slider.prop("disabled", false);

				slider[0].oninput = function() {
				  overlay.setOpacity(this.value/100);
				}
			
			 //jQuery(_this).parent().parent().prepend(jQuery(_this).parent()); //sort layers not intuitive
		}
		else{
		  overlay.remove(mapInterface.map);
		  	slider.prop("disabled", true);
		  		// jQuery(_this).parent().parent().append(jQuery(_this).parent());
		}

}


 function addSelect2ToSearchField(){

	var ajax_data_loc = getAjaxData("load_loc_data");
	var select2_lang = PATH["language"];
	
	if(select2_lang=="si")
		select2_lang="sl";

	var ajax_data_lang = getAjaxData("global_search"); // change when ajax done

	var lang_select2 = jQuery('.global_search').select2({
		"ajax": ajax_data_lang,
		"minimumInputLength": 3,
		"placeholder":  TRANSLATIONS['SEARCH_PLACEHOLDER'],
		"escapeMarkup": function (markup) { return markup; },
		"templateResult": formatLocResults,
		"width" : "100%",
	 	"language": select2_lang,
	});

	lang_select2.on('select2:select', function (e) {

		jQuery('#IM_lang_search_modal').modal('hide');
		var data = e['params']['data'];

		var type = 0;
		var id = data['id'];

		if(id.startsWith("SYN")){
			categoryManager.loadSynopticMap(id.substring(3), "USER");
		}

		else if(id.startsWith("LOC")){
		   gotoLocation(id.substring(3), true);
		}

		else {
			categoryManager.showFilterScreen(categoryManager.categoryFromId(id), id);
		}
		lang_select2.val(null).trigger('change');
	});

	lang_select2.on('select2:open',function(e){
		var id = jQuery(this).parent().find('.select2-selection.select2-selection--multiple').attr('aria-owns');
		var dropdown = jQuery('#'+id).parent().parent().parent();
		dropdown.attr('id','global_search_dropdown');

		var height = jQuery('#leftTable').height();
		if(height<300)height=300;
		dropdown.find('ul.select2-results__options').css('max-height',(height)+"px");
	});


}


function getAjaxData(namespace){

return {
    dataType: 'json',
			    "type": "POST",
			    url: ajaxurl,
			    delay: 250,
				"data": function (params) {

					var query = {
					"search" : params['term'],
					"action" : "im_a",
 					"namespace" : namespace,
					"lang" : PATH["language"],
					"_wpnonce" : jQuery("#_wpnonce").val()
				}

				 return query;
				},

				 "processResults": function (data, params) {
			 	  var results_by_categories = {}; 
			      params['page'] = params['page'] || 1;

			      // group results by categories

			      for(var key in data['results']){
			      		var item = data['results'][key];
			      		var desc = item['description'];
			      		if(results_by_categories[desc]==null){
			      			results_by_categories[desc] = [];
			      		}

			      		results_by_categories[desc].push(item);
			      }

			     var res_objs = []

			      for(var key in results_by_categories){
			      	  var res_obj = {};
			      	  var obj = results_by_categories[key];
			      	  res_obj['text'] = key;
			      	  res_obj['children'] = obj;
			      	  res_objs.push(res_obj);
			      }

			      return {
			        "results": res_objs,
			        "pagination": {
			          "more": (params['page'] * 30) < data['total_count']
			        }
			      };
			    }

}

}

function formatLocResults(data){

 if (data['loading']) {
    return TRANSLATIONS['SEARCH_LOADING'];
  }
	var markup ="";
	var desc = data['description'];

	 markup+='<div>'+data['text']+'</div>';

	return markup;
}

/**
 * 
 * @param {string} id
 * @param {boolean} zoom
 * 
 * @return {undefined}
 */
function gotoLocation(id, zoom){

	var data = {
		'action' : 'im_a',
		'namespace' : 'goto_loc',
		'loc_id' : id,
		'_wpnonce' : jQuery("#_wpnonce").val()
	};

	jQuery.post(ajaxurl, data, function (response) {
		if(response == "-1"){
			alert("Not allowed!");
		}
		else {
			var responseData = JSON.parse(response);
			
			var /** string */ pointstr = responseData["point"];
			var /** string */ text = responseData["text"];
			
			var match = pointstr.match(/\(\(\s*(.*?)\s*\,/)[1];
			var res = match.split(" ");
			
			var marker = mapInterface.addLocationMarker(parseFloat(res[1]), parseFloat(res[0]), text, id, zoom);
			mapState.addLocationMarker(id, marker);
		}	
	});
}

/**
 * @return {undefined}
 */
function adjustMapModalContent(){

	var window_height = window.innerHeight;
	jQuery('.im_map_modal_body').css('height','auto');
	var current_height = jQuery('.im_map_modal_body').height();
	var remaining_height = window_height - jQuery('.im_map_modal_body').offset().top - jQuery('.modal-footer.im_custom_footer_big').outerHeight() - 25; // margin bottom

	if(remaining_height<current_height)jQuery('.im_map_modal_body').height(remaining_height -30);

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
	var listout = false;

	var list = jQuery('<ul class="canvas_list"></ul>');
	container.append(list);
	
	var canvas_size = 256;
	
	var icon = jQuery('<i style="display:none" class="fas fa-long-arrow-alt-up canvas_icon" aria-hidden="true"></i>');
	container.append(icon);
	
	container.append(jQuery('<div id="activediv"></div>'));

	var startblock = jQuery('<div id="gradient_startblock"></div>')
	container.append(startblock);
	
	for (var i=0; i<gradients.length;i++){
	
		var gradient = gradients[i];
		
		var gdiv = jQuery('<canvas id="barcanvas_'+i+'" class="barcanvas" width='+canvas_size+'" height="35" ></canvas>');
		
		
		if(i == 0){
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
	   jQuery('.gradient_help').hide();
	
	
	}, function(){
	   jQuery(this).find('.hoverdiv').hide();
	   jQuery(this).find('.canvastext').hide();
	   jQuery('#listcontainer').find('.canvas_icon').hide();
	   jQuery('.gradient_help').show();
	});
	
	
	
	jQuery('#activediv').click(function() {
	  listout = adjustCanvasList(listout,true);
	
	});
	
	jQuery('#gradient_startblock').on('click',function(){
	    if(listout) listout = adjustCanvasList(listout,false);
	})
	
	
	jQuery('.canvas_list li').click(function(){
		jQuery('.hoverdiv').hide();
		jQuery('.canvastext').hide();
		
		 var clicked_canvas = jQuery(this).children();
		
		 var old_active = jQuery('.exchangeparent').children();
		
		 jQuery('.canvas_list').slideToggle();
		 if(jQuery('.colorbarlegenditem').css('display','none'))
			 setTimeout(function() {
				 jQuery('.colorbarlegenditem').fadeIn('slow');
			 }, 200);
		 jQuery('.canvas_icon').toggleClass('fas fa-long-arrow-alt-up fas fa-long-arrow-alt-down');
		
		 jQuery('.exchangeparent').append(clicked_canvas);
		
		
		jQuery(this).prepend(old_active);
		 // jQuery(this).parent().append(old_active);
		listout = false;
		
		symbolClusterer.changePolygonColor(false);
		 mapInterface.repaint(true);
	});



	var colorpicker = jQuery('#gradient_startblock').colorPicker(
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
	
	    		var initial_color = jQuery('#gradient_startblock').css('background-color');
	
	    	    this['color']['setColor'](initial_color);
	    	    this['render']();
	
	    	}
	    	else{
	    	  symbolClusterer.changePolygonColor(false);
	    	}
	
	    	if(!toggled)changeStartColor(rgb,alpha,canvas,false);
	
	    }
	});

	var help_symbol = jQuery('<i class="gradient_help far fa-question-circle aria-hidden="true"></i>');
	
	jQuery('#listcontainer').append(help_symbol);
	
	im_addMouseOverHelp(help_symbol, TRANSLATIONS["GRADIENT_HELP"]);
	
	var thediv = document.getElementById('listcontainer');
	jQuery('#listcontainer').hide();
	//mapInterface.addQuantifyColorDiv(thediv);

}// createCanvasMenu



/**
 * 
 * @param {boolean} listout
 * @param {boolean} keep_overlay
 * @return {boolean}
 */

function adjustCanvasList(listout,keep_overlay){
	listout= !listout;
    jQuery('.canvas_list').slideToggle();
    jQuery('.canvas_icon').toggleClass('fas fa-long-arrow-alt-up fas fa-long-arrow-alt-down');
    jQuery('.colorbarlegenditem').hide();

    if(!listout){

         setTimeout(function() { jQuery('.colorbarlegenditem').fadeIn('slow');}, 200);
    }

    if(!keep_overlay){
	    jQuery('.hoverdiv').hide();
  	    jQuery('.canvastext').hide();
    }
    

    return listout;
}


/**
 * 
 * @param {Element} canvas
 * @param {Object} gradient
 * @param {number} canvas_size
 * 
 * @return {undefined}
 */
function createCanvas(canvas, gradient, canvas_size) {

	var /** CanvasRenderingContext2D */ ctx = canvas.getContext('2d');
	ctx.rect(0, 0, canvas.width, canvas.height);
	
	var grd = ctx.createLinearGradient(0,0,canvas_size,0);
	
	for (var i = 0; i < gradient['stops'].length; i++){
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
 * 
 * @return {undefined}
 */
function changeStartColor(rgb,alpha_in,canvas,global_alpha){


 // var ctx = canvas.getContext('2d');
 // ctx.globalAlpha=alpha_in;

 // if(global_alpha)ctx.globalAlpha=1.0;

 // var alpha = Math.floor(alpha_in*255);

 // var imgd = ctx.getImageData(0, 0, 1, 35);
 // var pix = imgd.data;

 // for (var i = 0, n = pix.length; i <n; i += 4) {
              
 // pix[i] = rgb['r'];
 // pix[i+1] = rgb['g'];
 // pix[i+2] = rgb['b'];
 // pix[i+3] = alpha;
 // }

 // ctx.putImageData(imgd, 0, 0);

    jQuery('#gradient_startblock').css('background-color',"rgba(" + rgb['r'] + "," + rgb['g'] + "," + rgb['b'] + "," + alpha_in +")");

}

/**
 * 
 * @param {jQuery|string} input
 * 
 * @return {Array<string>}
 */

function parseColor(input) {
    return input.split("(")[1].split(")")[0].split(",");
}