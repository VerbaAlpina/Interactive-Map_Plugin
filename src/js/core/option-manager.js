/**
 * 
 * @constructor
 * @struct
 */
function OptionManager (){
	
	/**
	 * @type{Element}
	 */
	this.optionsElement;
	
	/**
	 * @type {Object<string, GuiOption>}
	 */
	this.options = {};
	
	/**
	 * @private
	 * @type{Object<string, string|boolean>}
	 */
	this.state = {};
	
	/**
	 * @type{Array<number>}
	 */
	this.editableCategories;
	
	/**
	 * @private
	 * @type {boolean}
	 */
	this.editMode = false;
	
	/**
	 * @return {boolean}
	 */
	this.inEditMode = function (){
		return this.editMode;
	}
	
	/**
	 * @private
	 * @type {Array<UndoableOperation>}
	 */
	this.changeHistory = [];
	
	/**
	 * @param {UndoableOperation} change
	 * 
	 * @return {undefined}
	 */
	this.addChange = function (change){
		this.changeHistory.push(change);
		if(this.changeHistory.length == 1){
			mapInterface.updateUndoComponent(TRANSLATIONS["UNDO_CHANGES"], true, true);
		}
	};
	
	/**
	 * @return {undefined}
	 */
	this.redoHistory = function (){
		var /** number */ len = this.changeHistory.length;
		for (var i = 0; i < len; i++){
			this.undoChange(true);
		}
	};
	
	/**
	 * @param {boolean} undoAll
	 * 
	 * @return {undefined}
	 */
	this.undoChange = function (undoAll){
		if (this.changeHistory.length > 0){
			var /**UndoableOperation */ lastChange = this.changeHistory.pop();
			lastChange.undo(undoAll);
			
			if(this.changeHistory.length == 0){
				mapInterface.updateUndoComponent(TRANSLATIONS["LEAVE_EDIT_MODE"], false, false);
			}
		}
		
	};
	
	/**
	 * @return {Array<{operation : string, id : string, category : number}>}
	 */
	this.getChangeList = function (){
		
		var /** number */ len = this.changeHistory.length;
		var /**Array<{operation : string, id : string, category : number}>*/ list = [];
		for (var i = 0; i < len; i++){
			list = list.concat(this.changeHistory[i].getCommitInformation());
		}
		
		//Find all movements
		var /** Object<string,Array<number>>*/ movedMarkers = {};
		for (var i = 0; i < list.length; i++){
			if(list[i]["operation"] == "markerMoved"){
				if(!movedMarkers[list[i]["id"]]){
					movedMarkers[list[i]["id"]] = [];
				}
				movedMarkers[list[i]["id"]].push(i);
			}
		}
		
		//Find all data changes
		var /** Object<string,Array<number>>*/ changedData = {};
		for (var i = 0; i < list.length; i++){
			if(list[i]["operation"] == "dataChanged"){
				if(!changedData[list[i]["id"]]){
					changedData[list[i]["id"]] = [];
				}
				changedData[list[i]["id"]].push(i);
			}
		}
		
		//Join changes on the same marker
		for (var id in changedData){
			var /** !Object <string, *> */ dataOld = list[changedData[id][0]]["valuesOld"];
			var /** !Object <string, *> */ dataNew = list[changedData[id][0]]["valuesNew"];
			for (i = 1; i < changedData[id].length; i++){
				for (var did in list[changedData[id][i]]["valuesOld"]){
					if(!dataOld[did]){
						dataOld[did] = list[changedData[id][i]]["valuesOld"][did];
					}
				}
				dataNew = Object.assign(dataNew, list[changedData[id][i]]["valuesNew"]);
			}
		}
		
		for (i = 0; i < list.length; i++){
			if(list[i]["operation"] == "overlayAdded"){
				if(movedMarkers[list[i]["id"]]){
					//Remove movements for newly added markers (the current position is used anyway)
					delete movedMarkers[list[i]["id"]];
				}	
				
				var /** Array<number> */ changeOps = changedData[list[i]["id"]];
				if(changeOps){
					for (var j = 0; j < changeOps.length; j++){
						list[i]["valuesNew"] = Object.assign(list[i]["valuesNew"], list[changeOps[j]]["valuesNew"]);
					}
					delete changedData[list[i]["id"]];
				}
			}
		}
		
		var /**Array<{operation : string, id : string, category : number}>*/ newList = [];
		for (i = 0; i < list.length; i++){
			//Remove multiple movements
			if(list[i]["operation"] == "markerMoved"){
				var /** Array<number>*/ indexList = movedMarkers[list[i]["id"]];
				if(indexList != undefined && i == indexList[indexList.length - 1]){
					list[i]["oldPosition"] = list[indexList[0]]["oldPosition"];
					newList.push(list[i]);
				}
			}
			else if (list[i]["operation"] == "dataChanged"){
				var /** Array<number>*/ indexListC = changedData[list[i]["id"]];
				//Ignore all but the first entry, since all changes are merged into that one
				if(indexListC != undefined && indexListC.indexOf(i) == 0){
					newList.push(list[i]);
				}
			}
			else {
				newList.push(list[i]);
			}
		}
		list = newList;
		
		//Check for required fields
		for (i = 0; i < list.length; i++){
			if(list[i]["operation"] == "overlayAdded" || list[i]["operation"] == "dataChanged"){
				var /** Array<FieldInformation>*/ infos = categoryManager.getEditFields(list[i]["category"], list[i]["type"]);
				for (var j = 0; j < infos.length; j++){
					if(infos[j].name in list[i]["valuesNew"]){
						var value = list[i]["valuesNew"][infos[j].name];
						if(infos[j].required && infos[j].type.isEmpty(value))
							throw TRANSLATIONS["FIELD_IS_EMPTY"].replace("%s", infos[j].name);
					}
				}
			}
		}
		
		return list;
	};
	
	/**
	 * @type {number}
	 */
	this.categoryForAdding = -1;
	
	/**
	 * @param {string} key
	 * @param {GuiOption} option
	 * 
	 * @return {undefined}
	 */
	this.addOption = function (key, option){
		this.options[key] = option;
	};
	
	/**
	 * @param {string} key
	 * @param {boolean|string} value
	 * @param {Object<string,?>=} details
	 * 
	 * @return {undefined}
	 */
	this.setOption = function (key, value, details){
		this.state[key] = value;
		
		var /** GuiOption */ option = this.options[key];
		if(option != null){
			option.applyState(value, details);
		}
	};
	
	/**
	 * @param {string} key
	 * 
	 * @return {string|boolean}
	 */
	this.getOptionState = function (key){
		return this.state[key];
	}
	
	/**
	 * @param {string} key
	 * @param {string|boolean} val
	 * 
	 * @return {undefined}
	 */
	this.setOptionState = function (key, val){
		this.state[key] = val;
	}
	
	/**
	 * @type {boolean}
	 * @private
	 */
	this.optionsEnabled = true;
	
	/**
	 * @param {boolean} val
	 * 
	 * @return {undefined}
	 */
	this.enableOptions = function (val){
		
		if(this.optionsEnabled != val){
			this.optionsEnabled = val;
			for (var key in this.options){
				this.options[key].setEnabled(val);
			}
		}
	};
	
	
	/**
	 * @param {boolean} activate
	 * 
	 * @return {undefined}
	 */
	this.setEditMode = function (activate){
		if(this.editMode == activate)
			return;
		
		jQuery("#IM_Syn_Map_Cotainer").toggle(!activate);
		
		if(activate){
			//Stop quantify mode
			var /** boolean|LegendElement|MultiLegendElement */ cQuantify = symbolClusterer.checkQuantify();
			if(cQuantify !== false){
				symbolClusterer.toggleQuantifyMode();
				symbolClusterer.quantify(/** @type{LegendElement|MultiLegendElement}*/ (cQuantify), false);
			}
			
			map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].pop();
			
			mapInterface.addUndoComponent(
			{
				name : TRANSLATIONS["LEAVE_EDIT_MODE"],
				img : PATH["Delete"],
				callback : function (){
					this.redoHistory();
					this.setOption("editMode", false);
				}.bind(this),
				show : true
			},
			{
				name : TRANSLATIONS["UNDO_CHANGE"],
				img : PATH["Undo"],
				callback : this.undoChange.bind(this, false),
				show : false
			},
			{
				name : TRANSLATIONS["COMMIT_CHANGES"],
				img : PATH["Commit"],
				callback : function (){
					try {
						var /**Array<{operation : string, id : string, category : number}>*/ changeList = this.getChangeList();
					}
					catch (e){
						alert(e);
						return;
					}
					
					jQuery.post(ajaxurl, {
						"action" : "im_u",
						"namespace" : "edit_mode",
						"changes" : changeList
					}, function (response){
						alert(response);
						optionManager.redoHistory();
						optionManager.setOption("editMode", false);
					});
				}.bind(this),
				show : false
			});
			
			//New elemets control:
			var /**Array<{id : number, name: string}>*/ options = [];
			for (var i = 0; i < this.editableCategories.length; i++){
				if(categoryManager.categoryAllowsNewElements(this.editableCategories[i]) !== false){
					options.push({id : this.editableCategories[i], name : categoryManager.getCategoryName(this.editableCategories[i])});
				}
			}
			if(options.length > 0)
				mapInterface.addNewOverlaysComponent(options, this.overlayFinished.bind(this));
			
			jQuery(document).trigger("im_edit_mode_started"); //TODO document
			jQuery("#IM_Syn_Map_Selection").chosen("destroy");
			
			//Commit changes button that also calls zling() resp. zgeo and reloads all data also Community-Id, Alpine Convention and Position!!
			//TODO make polygons changable
		}
		else{
			mapInterface.removeUndoComponent();
			mapInterface.removeNewOverlaysComponent();
			
			this.categoryForAdding = -1;
			map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(this.optionsElement);
			jQuery("#IM_OptionsPane").toggle(false);
			for (var i = 0; i < legend.getLength(); i++){
				legend.getElement(i).visible(true);
			}
			jQuery("#IM_Syn_Map_Selection").chosen({allow_single_deselect: true});
			jQuery(document).trigger("im_edit_mode_stopped"); //TODO document
		}
		this.editMode = activate;
		legend.reloadMarkers();
	};
	

	/**
	 * @param {number} categoryID
	 * @param {OverlayType} overlayType
	 * @param {Object} overlay
	 * 
	 * @return {(MapSymbol|MapShape)}
	 */
	this.overlayFinished = function (categoryID, overlayType, overlay){
		var /** EditableInfoWindowContent */ infoWin = new EditableInfoWindowContent(categoryID, "XXX", overlayType); //TODO element id here????

		if(overlayType == OverlayType.PointSymbol){
			var /** MapSymbol */ mapSymbol = new MapSymbol ([infoWin], null, -1);
			mapSymbol.setMarker(overlay);
			mapSymbol.openInfoWindow(0);
			var /** OverlayAddedOperation */ changeOp = new OverlayAddedOperation(overlay, categoryID, overlayType, mapSymbol.infoWindow);
			this.addChange(changeOp);
			infoWin.markerID = changeOp.overlayID;
			return mapSymbol;
		}
		else {
			return null; //TODO
		}
	};

	
	/**
	 * @returns {undefined}
	 */
	this.createOptionsDiv = function (){
		var /** OptionManager */ thisObject = this;

		var /** Element */ result = document.createElement('div');
		result.style.backgroundColor = '#fff';
		result.style.border = '2px solid #fff';
		result.style.borderRadius = '3px';
		result.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
		result.style.marginRight = '10px';
		result.style.textAlign = 'center';
		
		var /** Element */ controlText = document.createElement('div');
		controlText.style.color = 'rgb(25,25,25)';
		controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
		controlText.style.fontSize = '16px';
		controlText.style.lineHeight = '38px';
		controlText.style.paddingLeft = '5px';
		controlText.style.paddingRight = '5px';
		controlText.style.fontWeight = "bold";
		controlText.style.cursor = "pointer";
		controlText.innerHTML = '<i class="fa fa-cog" aria-hidden="true"></i>';
		result.appendChild(controlText);
		
		this.optionsElement = result;
		
		var /**Element */ optionsDiv = document.createElement('div');
		optionsDiv.id = "IM_Options_Div";
		optionsDiv.appendChild(result);
		optionsDiv.index = 1;
		
		jQuery(document).trigger("im_add_options"); //TODO document this, also stuff like addXY in categoryManager
		
		thisObject.addOptionPane();
	}
	
	/**
	 * @return {undefined}
	 */
	this.addOptionPane = function (){
		var /** OptionManager */ thisObject = this;
		
		var /** Element */ optionPane = document.createElement('div');
		optionPane.style.display = "none";
		optionPane.style.position = "absolute";
		optionPane.style.bottom = "-67px";
		optionPane.style.right = "30px";
		optionPane.style.background = "#fff";
		optionPane.style.border = '2px solid #fff';
		optionPane.style.borderRadius = "3px 0 3px 3px";
		optionPane.style.marginRight = '5px';
		optionPane.style.minWidth = "270px";
		optionPane.style.textAlign = 'left';
		optionPane.style.paddingTop = "10px";
		optionPane.style.paddingBottom = "16px";
		optionPane.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.3)";
		optionPane.id = "IM_OptionsPane";
		
		this.editableCategories = categoryManager.getEditableCategories();
		
		//Edit mode options
		var /** {result : boolean}*/ paramObject = {result: true};
		jQuery(document).trigger("im_show_edit_mode", [paramObject]); //TODO document
		
		if(paramObject.result && PATH["userCanEditMapData"] == "1" && this.editableCategories.length > 0){
			this.addOption ("editMode", new BoolOption(false, TRANSLATIONS["EDIT_MODE"], this.setEditMode));
		}

		for (var key in this.options){
			var /** GuiOption */ option = this.options[key];
			
			if(this.state[key] === undefined)
				this.state[key] = option.getDefaultValue();
			
			option.setKey(key);
			option.applyState(this.state[key], {"first" : true});
			option.appendHtmlElements(optionPane);
		}
		
		if(!this.editMode){
			map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(this.optionsElement);
		}
		
		this.optionsElement.appendChild(optionPane);
		
		jQuery(this.optionsElement).off();
		
		this.optionsElement.addEventListener("mouseover", function (){
			optionPane.style.display = "block";
			optionPane.className = "visible";
		});
		
		this.optionsElement.addEventListener("mouseout", function (){
			optionPane.className = "";
			window.setTimeout(function (){
				if(optionPane.className == "")
					optionPane.style.display = "none";
			}, 100);
		});
	};
}

/**
 * @struct
 * @interface
 * 
 * @template T
 * 
 */
function GuiOption (){}

/**
 * @param {string} key
 * 
 * @return {undefined}
 */
GuiOption.prototype.setKey = function (key){};

/**
 * @return {T}
 */
GuiOption.prototype.getDefaultValue = function (){};

/**
 * @param {Element} parent
 */
GuiOption.prototype.appendHtmlElements = function (parent){};

/**
 * @param {T} val
 * @param {Object<string,?>=} details
 */
GuiOption.prototype.applyState = function (val, details){};

/**
 * @param {boolean} val
 * 
 * @return {undefined}
 */
GuiOption.prototype.setEnabled = function (val){};

/**
 * @constructor
 * @struct
 *
 * @returns {undefined}
 */
function EditConfiguration (){
	
	/**
	 * @private
	 * @type {Array<Array<FieldInformation>>}
	 */
	this.fields = [null, null, null];
	
	/**
	 * @private
	 * @type {Array<boolean>}
	 */
	this.arrNewOverlays = [false, false, false];
	
	/**
	 * @private
	 * @type {Array<boolean|function(string):boolean>}
	 */
	this.arrChangeData = [false, false, false];
	
	/**
	 * @private
	 * @type {Array<boolean|function(string):boolean>}
	 */
	this.arrChangeGeoData = [false, false, false];
	
	/**
	 * @param {OverlayType} overlayType
	 * @param {!Array<!FieldInformation>} fields
	 * 
	 * @return {undefined}
	 */
	this.setFieldData = function (overlayType, fields){
		this.fields[overlayType] = fields;
		
	};
	
	/**
	 * @param {OverlayType} overlayType
	 * @param {function (string) : boolean=} filterFunction
	 * 
	 * @return {undefined}
	 */
	this.allowDataChange = function (overlayType, filterFunction){
		if(filterFunction === undefined)
			this.arrChangeData[overlayType] = true;
		else
			this.arrChangeData[overlayType] = filterFunction;
	};
	
	/**
	 * @param {OverlayType} overlayType
	 * @param {function (string) : boolean=} filterFunction
	 * 
	 * @return {undefined}
	 */
	this.allowGeoDataChange = function (overlayType, filterFunction){
		if(filterFunction === undefined)
			this.arrChangeGeoData[overlayType] = true;
		else
			this.arrChangeGeoData[overlayType] = filterFunction;
	};
	
	/**
	 * @param {OverlayType} overlayType
	 * 
	 * @return {undefined}
	 */
	this.allowNewOverlays = function (overlayType){
		this.arrNewOverlays[overlayType] = true;
	};
	
	/**
	 * @param {OverlayType=} overlayType
	 * 
	 * @return {boolean}
	 */
	this.canAddNewOverlays = function (overlayType){
		return this.arrNewOverlays.reduce((a,b) => a || b, false);
	};
	
	/**
	 * @param {string} elementID
	 * @param {OverlayType=} overlayType
	 * 
	 * @return {boolean}
	 */
	this.canEditGeoData = function (elementID, overlayType){
		if(overlayType === undefined)
			return this.arrChangeGeoData.reduce((a,b) => a || (typeof b == "function"? b(elementID): b), false);
		
		var /** boolean|function(string):boolean*/ arrVal = this.arrChangeGeoData[overlayType];
		return typeof arrVal == "function"? arrVal(elementID) : arrVal;
	};
	
	/**
	 * @param {string} elementID
	 * @param {OverlayType=} overlayType
	 * 
	 * @return {boolean}
	 */
	this.canEditFieldData = function (elementID, overlayType){
		if(overlayType === undefined)
			return this.arrChangeData.reduce((a,b) => a || (typeof b == "function"? b(elementID): b), false);
		
		var /** boolean|function(string):boolean*/ arrVal = this.arrChangeData[overlayType];
		return typeof arrVal == "function"? arrVal(elementID) : arrVal;
	};
	
	/**
	 * @return {Array<string>}
	 */
	this.getGoogleTypesForNewOverlays = function (){
		var /** Array<string> */ result = [];

		if(this.arrNewOverlays[OverlayType.PointSymbol]){
			result.push(google.maps.drawing.OverlayType.MARKER);
		}
		if(this.arrNewOverlays[OverlayType.Polygon]){
			result.push(google.maps.drawing.OverlayType.POLYGON);
		}
		if(this.arrNewOverlays[OverlayType.LineString]){
			result.push(google.maps.drawing.OverlayType.POLYLINE);
		}
			
		return result;
	};
	
	/**
	 * @param {number} overlayType
	 * 
	 * @return {Array<FieldInformation>}
	 */
	this.getEditFields = function (overlayType){
		return this.fields[overlayType];
	};
}

/**
 * 
 * @param {string} name
 * @param {FieldType} type
 * @param {boolean} required
 * @param {string|number=} value
 * 
 * 
 * @constructor
 * @struct
 */
function FieldInformation (name, type, required, value){
	/**
	 * @type {string}
	 * @const
	 */
	this.name = name;
	
	/**
	 * @type {FieldType}
	 */
	this.type = type;
	
	/**
	 * @type {boolean}
	 */
	this.required = required;
}

/**
 * @interface
 * @struct
 * 
 * @template Type
 * 
 */
function FieldType (){};

/**
 * @param {Type} startValue
 * 
 * @return {string}
 */
FieldType.prototype.createInputString = function (startValue){};

/**
 * 
 * @param {jQuery} content
 * @param {function(Element, Type, Type)} listener First parameter is old value, second parameter is new value 
 * 
 * @return {undefined}
 */
FieldType.prototype.bindChangeListener = function (content, listener){};

/**
 * @param {jQuery} content
 * 
 * @return {undefined}
 */
FieldType.prototype.removeChangeListener = function (content){};

/**
 * @return {string}
 * 
 * Should return %s (string), %d (int) or %f (float)
 */
FieldType.prototype.getSQLType = function (){};

/**
 * @return {Type}
 * 
 */
FieldType.prototype.getDefaultValue = function (){};

/**
 * @param {Type} val
 * 
 * @return {boolean}
 * 
 */
FieldType.prototype.isEmpty = function (val){};

/**
 * @param {Element} element
 * @param {Type} val
 * 
 * @return {undefined}
 */
FieldType.prototype.setValue = function (element, val){};

/**
 * @interface
 * @struct
 */
function UndoableOperation (){}

/**
 * 
 * @param {boolean} undoAll
 * 
 * @return {undefined}
 */
UndoableOperation.prototype.undo = function (undoAll){};

/**
* @return{Array<{operation : string, id : string, category : number}>}
*/
UndoableOperation.prototype.getCommitInformation = function (){};