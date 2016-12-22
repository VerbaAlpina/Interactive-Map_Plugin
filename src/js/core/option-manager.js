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
	 * @type{Object<string, string|boolean>}
	 */
	this.state = {};
	
	/**
	 * @type{Array<number>}
	 */
	this.editableCategories;
	
	/**
	 * @private
	 * @const
	 * @type {google.maps.drawing.DrawingManager}
	 */
	this.drawingManager;
	
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
	 * 
	 * @return {undefined}
	 */
	this.setOption = function (key, value){
		this.state[key] = value;
	};
	
	/**
	 * @param {boolean} val
	 * 
	 * @return {undefined}
	 */
	this.enableOptions = function (val){
		for (var key in this.options){
			this.options[key].setEnabled(val);
		}
	};
	
	
	/**
	 * @param {boolean} activate
	 * 
	 * @return {undefined}
	 */
	this.setEditMode = function (activate){
		if(!this.drawingManager){
			this.initDrawingManager();
		}
		
		if(activate){
			var /** Element|null */ addingOverlay = this.createNewOverlaysElement();
			if(addingOverlay != null){
				map.controls[google.maps.ControlPosition.TOP_CENTER].push(addingOverlay);
			}
			//Only informants and extra ling
			//Commit changes button that also calls zling() resp. zgeo and reloads all data also Community-Id, Alpine Convention and Position!!
			//TODO new cat button
			//TODO Warning to save if element added to cat and when cat removed
			//TODO dropdown before marker etc. symbols to switch between categories
			//TODO only show markers applicable for the respective category
			//TODO make existing overlays moveable
		}
		else{
			this.drawingManager.setMap(null);
			map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
			this.categoryForAdding = -1;
		}
		
	}
	
	/**
	 * @param {number} categoryID
	 * 
	 * @return {undefined}
	 */
	this.setEditCategory = function (categoryID){
		this.categoryForAdding = categoryID;
		if(categoryID == -1){
			this.drawingManager.setMap(null);
		}
		else {
			this.drawingManager.setOptions ({
				drawingControlOptions : {
					drawingModes: categoryManager.getOverlayTypes(categoryID),
					position: google.maps.ControlPosition.TOP_CENTER
				}
			});
			this.drawingManager.setMap(map);
		}
	};
	
	/**
	 * @return {undefined}
	 */
	this.initDrawingManager = function (){
		this.drawingManager = new google.maps.drawing.DrawingManager({
			drawingControl : true,
			markerOptions: {
				icon : PATH["symbolGenerator"] + "?size=20&shape=circle&color=255,255,255", //TODO remove constant size
				draggable: true,
				zIndex : 9999
			},
			polygonOptions : {
				fillColor: "#fff",
				fillOpacity: 1,
				borderColor: "000",
				strokeWeight: 1,
				draggable : true,
				editable : true,
				zIndex : 9999
			},
			polylineOptions : {
				strokeWeight: 5,
				strokeOpacity: 1,
				strokeColor : "#fff",
				draggable : true,
				editable : true,
				zIndex : 9999
			}
		});
		
		google.maps.event.addListener(this.drawingManager, "overlaycomplete", this.overlayFinished.bind(this));
	}
	
	/**
	 * @param {google.maps.drawing.OverlayCompleteEvent} event
	 * 
	 * @return {undefined}
	 */
	this.overlayFinished = function (event){
		var /** Array<FieldInformation> */ fields = categoryManager.getEditFields(this.categoryForAdding, event.type);
		if(fields.length > 0){
			var /** InfoBubble */ infoWindow = new InfoBubble({
				"minWidth" : 50,
				"content" : this.createEditDataWindow(fields)
			});
			infoWindow.open(map, event.overlay);
		}
	};
	
	/**
	 * @param {Array<FieldInformation>} fields
	 * 
	 * @return {Element}
	 */
	this.createEditDataWindow = function (fields){
		var /** Element */ resultDiv = document.createElement("div");
		var /** Element */ table = document.createElement("table");
		
		for (var i = 0; i < fields.length; i++){
			var /** Element */ row = document.createElement("tr");
			var /** FieldInformation */ field = fields[i];
			
			var nameField = document.createElement("td");
			nameField.style.paddingRight = "10px";
			nameField.innerHTML = field.name;
			row.appendChild(nameField);
			
			var valueField = document.createElement("td");
			valueField.appendChild(field.type.createInputElement());
			row.appendChild(valueField);
			
			table.appendChild(row);
		}
		resultDiv.appendChild(table);
		return resultDiv;
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
		result.style.margin = '5px';
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
		controlText.innerHTML = TRANSLATIONS["OPTIONS"];
		result.appendChild(controlText);
		
		jQuery(result).on("mouseover", function (){
			/*The option pane is created when it is opened by the user for the first time. So you can be sure that all information has been
			 * added (e.g. categories, custom options etc.)
			 */
			thisObject.addOptionPane();
		});
		
		this.optionsElement = result;
	}
	
	/**
	 * @return {undefined}
	 */
	this.addOptionPane = function (){
		var /** OptionManager */ thisObject = this;
		
		var /** Element */ optionPane = document.createElement('div');
		optionPane.style.display = "none";
		optionPane.style.position = "absolute";
		optionPane.style.bottom = "-45";
		optionPane.style.right = "0";
		optionPane.style.background = "#fff";
		optionPane.style.border = '2px solid #fff';
		optionPane.style.borderRadius = "3px 0 3px 3px";
		optionPane.style.marginRight = '5px';
		optionPane.style.minWidth = "300px";
		optionPane.style.textAlign = 'left';
		optionPane.style.paddingTop = "10px";
		optionPane.style.paddingBottom = "20px";
		
		this.editableCategories = categoryManager.getEditableCategories();
		
		//Edit mode options
		if(PATH["userCanEditMapData"] == "1" && this.editableCategories.length > 0){
			this.addOption ("editMode", new BoolOption(false, "Edit Mode", this.setEditMode)); //TODO translate
		}
		
		for (var key in this.options){
			var /** GuiOption */ option = this.options[key];
			
			if(this.state[key] === undefined)
				this.state[key] = option.getDefaultValue();
			
			option.setKey(key);
			option.applyState(this.state[key]);
			option.appendHtmlElements(optionPane);
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
		
		optionPane.style.display = "block";
		optionPane.className = "visible";
	};
	
	/**
	 * @return {Element|null}
	 */
	this.createNewOverlaysElement = function (){
		var /** OptionManager */ thisObject = this;
		
		var /** Element */ result = document.createElement("div");
		result.index = 0;
		result.style.background = "#fff";
		result.style.border = '2px solid #fff';
		result.style.borderRadius = '3px';
		result.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
		result.style.margin = '5px';
		result.appendChild(document.createTextNode(TRANSLATIONS["ADD_NEW_DATA"] + ":"));
		var /** Element */ selectObject = document.createElement("select");
		var /** Element */ defaultOption = document.createElement("option");
		defaultOption.value = "-1";
		defaultOption.innerHTML = TRANSLATIONS["CHOOSE_CATEGORY"];
		defaultOption.selected = "selected";
		selectObject.appendChild(defaultOption);
		
		var /** number */ numOptions = 0;
		for (var i = 0; i < this.editableCategories.length; i++){
			if(categoryManager.categoryAllowsNewElements(this.editableCategories[i])){
				var /** Element */ option = document.createElement("option");
				option.innerHTML = categoryManager.getCategoryName(this.editableCategories[i]);
				option.value = this.editableCategories[i];
				selectObject.appendChild(option);
				numOptions++;
			}
		}
		
		if(numOptions == 0)
			return null;
		
		selectObject.addEventListener ("change", function (){
			thisObject.setEditCategory(this.value);
		});
		
		result.appendChild(selectObject);
		return result;
	}

	var /**Element */ optionsDiv = document.createElement('div');
	this.createOptionsDiv();
	optionsDiv.appendChild(this.optionsElement);
	optionsDiv.index = 1;
	map.controls[google.maps.ControlPosition.TOP_RIGHT].push(optionsDiv);
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
 */
GuiOption.prototype.applyState = function (val){};

/**
 * @param {boolean} val
 * 
 * @return {undefined}
 */
GuiOption.prototype.setEnabled = function (val){};

/**
 * @struct
 * @constructor
 * @implements {GuiOption}
 * 
 * @param {boolean} defaultValue
 * @param {string} name
 * @param {function(boolean)} changeListener
 */
function BoolOption (defaultValue, name, changeListener){
	
	/**
	 * @type {boolean}
	 */
	this.defaultValue = defaultValue;
	
	/**
	 * @type {string}
	 */
	this.key;
	
	var /** Element */ checkbox = document.createElement("input");
	checkbox["type"] = "checkbox";
	
	checkbox.addEventListener("change", 
	function (){
		var /** boolean */ checked = jQuery(this).is(":checked");
		optionManager.state[this.key] = checked;
		changeListener.bind(optionManager)(checked);
	});
	
	/**
	 * @type {Array<Element>}
	 */
	this.elements = [];
	this.elements.push(checkbox);
	this.elements.push(document.createTextNode(name));
	this.elements.push(document.createElement("br"));
	
	/**
	 * @override
	 * 
	 * @param {Element} parent
	 */
	this.appendHtmlElements = function (parent){
		for (var i = 0; i < this.elements.length; i++){
			parent.appendChild(this.elements[i]);
		}
	};
	
	/**
	 * @override
	 * 
	 * @param{boolean} val
	 * 
	 * @return {undefined}
	 */
	this.setEnabled = function (val){
		if(val)
			this.elements[0].removeAttribute("disabled");
		else
			this.elements[0]["disabled"] = "disabled";
	};
	
	/**
	 * @override
	 * 
	 * @param{boolean} val
	 * 
	 * @return {undefined}
	 */
	this.applyState = function (val){
		if(val)
			this.elements[0]["checked"] = "checked";
		else
			this.elements[0].removeAttribute("checked");
	};
	
	/**
	 * @override
	 * 
	 * @param {string} key
	 * 
	 * @return {undefined}
	 */
	this.setKey = function (key){
		this.key = key;
	};

	/**
	 * @override
	 * 
	 * @return {boolean}
	 */
	this.getDefaultValue = function (){
		return this.defaultValue;
	};
}

/**
 * @constructor
 * @struct
 * 
 * @param {!Object<string, Array<FieldInformation>>} fieldsForOverlay
 * 		A mapping from one or more of the following constants 
 * 			google.maps.drawing.OverlayType.MARKER,
        	google.maps.drawing.OverlayType.POLYGON,
            google.maps.drawing.OverlayType.POLYLINE
        to an array of FieldInformation objects.
        If an overlay type is not contained in the set, it cannot be added/changed, 
        if it maps to an empty array just the overlay can be added without addional data.
 * @param {boolean} canAddNewOverlays
 * @param {boolean} canChangeData
 * @param {boolean} canChangeGeodata
 * 
 * @returns {undefined}
 */
function EditConfiguration (fieldsForOverlay, canAddNewOverlays, canChangeData, canChangeGeodata){
	
	/**
	 * @type {!Object<string, Array<FieldInformation>>}
	 */
	this.fields = fieldsForOverlay;
	
	/**
	 * @type {boolean}
	 */
	this.canAddNewOverlays = canAddNewOverlays;
	
	/**
	 * @type {boolean}
	 */
	this.canChangeData = canChangeData;
	
	/**
	 * @type {boolean}
	 */
	this.canChangeGeodata = canChangeGeodata;
}

/**
 * 
 * @param {string} name
 * @param {FieldType} type
 * @param {boolean} required
 * @param {string|number=} value
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
	
	/**
	 * @type {string|number|undefined}
	 */
	this.value = value;
}

/**
 * @type {number}
 * @const
 */
FieldInformation.STRING = 0;

/**
 * @type {number}
 * @const
 */
FieldInformation.INT = 1;

/**
 * @interface
 * @struct
 * 
 */
function FieldType (){};

/**
 * @return {Element}
 */
FieldType.prototype.createInputElement = function (){};

/**
 * @return {number}
 */
FieldType.prototype.valueType = function (){};