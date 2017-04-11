/**
 * @constructor
 * @struct
 *
 * Contains the complete information about the data visualized on the map
 */
function Legend() {
	/** 
	 * @type{Array<LegendElement|MultiLegendElement>}
	 * @private
	 *
	 */
	this.elements = new Array();
	
	/**
	 *  @return {number}
	 */
	this.getLength = function (){
		return this.elements.length;
	}
	
	/**
	 * @param {number} index
	 * 
	 * @return {LegendElement|MultiLegendElement}
	 */
	this.getElement = function (index){
		return this.elements[index];
	};
	
	/**
	 * @param {LegendElement|MultiLegendElement} element
	 * @param {number=} fixedIndex
	 * 
	 * @return {undefined}
	 */
	this.addElement = function (element, fixedIndex){
		if(fixedIndex !== undefined){
			element.setIndex(fixedIndex);
			this.elements.splice(fixedIndex, 0, element);
			for (var i = fixedIndex + 1; i < this.elements.length; i++){
				this.elements[i].setIndex(i);
			}
		}
		else {
			element.setIndex(this.elements.length);
			this.elements.push(element);
		}
	};

	/**
	 * @param {number} category
	 * @param {string} key
	 *
	 * @return {LegendElement|MultiLegendElement}
	 */
	this.getMainElement = function(category, key) {
		for (var /** number */ i = 0; i < this.elements.length; i++) {
			var /** LegendElement|MultiLegendElement */ e = this.elements[i];
			if (e.category == category && e.key == key)
				return e;
		}
		return null;
	};
	
	/**
	 * @param {number} category
	 * @param {string} key
	 *
	 * @return {Array<LegendElement|MultiLegendElement>}
	 */
	this.getElements = function (category, key){
		var /**Array<LegendElement|MultiLegendElement>*/ results = [];
		for (var /** number */ i = 0; i < legend.elements.length; i++){
			var /** LegendElement|MultiLegendElement */ currentElement = legend.elements[i];
			if(currentElement.category == category && currentElement.key == key)
				results.push(currentElement);
			if(currentElement instanceof MultiLegendElement){
				for (var /** number */ j = 0; j < currentElement.subElements.length; j++){
					var /** LegendElement*/ currentSubElement = currentElement.subElements[j];
					if(currentSubElement.category == category && currentSubElement.key == key)
						results.push(currentSubElement);
				}
			}
		}
		return results;
	};
	
	this.unhighlightAll = function (){
		jQuery(".focused").removeClass("focused");
	};

	/**
	 * @return{undefined} 
	 */
	this.update = function() {

		jQuery(document).trigger("im_legend_before_rebuild", this); //TODO comment
		
		//Rebuild legend
		var /** Element */ table = document.createElement("table");
		if (this.elements.length != 0) {
			table.className = "easy-table easy-table-default";
			for (var/** number */ i = 0; i < this.elements.length; i++) {
				var /**LegendElement|MultiLegendElement*/ element = this.elements[i];
				if (element == null)
					continue;
				else if (optionManager.inEditMode() && !element.editable){
					element.visible(false);
					continue;
				}
				legendRow(this.elements, i, table);
			}
		}
		jQuery("#IM_legend").html(table);
			
		jQuery(document).trigger("im_legend_after_update", this); //TODO comment
	};

	/** 
	 * @param {LegendElement|MultiLegendElement} element
	 * @param {boolean} deleteFromArray If the LegendElement has to be removed from the elements or subElements array
	 * 
	 * @return {undefined} 
	 */
	this.removeElement = function(element, deleteFromArray) {
		if(element instanceof MultiLegendElement){
			for(var /** number */ i = 0; i < element.subElements.length; i++){
				this.removeElement(element.subElements[i], false);
			}
		}
		else {
			symbolClusterer.removeOverlays(element);
			
			if(element.colorIndex !== undefined){
				if (element.overlayType == OverlayType.PointSymbol) {
					symbolManager.unblockFeatureCombination(/** @type {Array<number>}*/ (element.colorIndex)[0], /** @type {Array<number>}*/ (element.colorIndex)[1]);
				} else {
					symbolManager.unblockColor(element.overlayType, /** @type {number}*/ (element.colorIndex));
				}
			}
			if(element.parent != null){
				element.parent.filterData = storeRemovedElement(element.parent.filterData, element.key);
				
				if(element.visible()){
					element.parent.subElementsVisible--;
				}
			}
		}
		
		commentManager.removeComment(element.key);
		
		if(deleteFromArray){
			var /** boolean */ finished = false;
			for (i = 0; i < this.elements.length; i++){
				var /** LegendElement|MultiLegendElement */ currentElement = this.elements[i];
				if(element == currentElement){
					this.elements.splice(i,1);
					//Update indexes
					for(; i < this.elements.length; i++){
						this.elements[i].setIndex(i);
					}
					break;
				}
				else if (currentElement instanceof MultiLegendElement){
					for (var /** number */ j = 0; j < currentElement.subElements.length; j++){
						if(element == currentElement.subElements[j]){
							currentElement.subElements.splice(j,1);
							if(currentElement.subElements.length == 0){
								this.removeElement(currentElement, true);
							}
							finished = true;
							break;
						}
					}
					if(finished)
						break;
				}
			}
			this.update();
		}
	};
	

	/**
	 * @return {undefined} 
	 */
	this.removeAll = function (){
		var /** number */ length = this.elements.length;
		for (var /** number */ i = 0; i < length; i++){
			this.removeElement(this.elements[0], true);
		}
	};
	
	/**
	* @param {boolean} useHiddenElements
	*
	* @return {Array}
	*/
	this.getCompleteExport = function (useHiddenElements){
		var /** Array */ result = [];
		for (var /** number */ i = 0; i < this.elements.length; i++){
			var /** LegendElement|MultiLegendElement */ currElement = this.elements[i];
			if(!useHiddenElements && !currElement.visible())
				continue;
			
			var /** Object<string, ?> */ currentFilterData = currElement.filterData;
			if(!useHiddenElements && currElement instanceof MultiLegendElement){
				for (var j = 0; j < currElement.subElements.length; j++){
					if(!currElement.subElements[j].visible()){
						currentFilterData = storeRemovedElement(currentFilterData, currElement.subElements[j].key);
					}
				}
			}
			
			result[i] = {
				"category" : currElement.category, 
				"key" : currElement.key, 
				"filter" : currentFilterData, 
				"fixedColors" : currElement.getColorAssignment()
			};
		}
		return result;
	};
	
	/**
	 *  @param {Object<string, ?>} filterData
	 *  @param {string} key
	 *  
	 *  @return {Object<string, ?>}
	 */
	function storeRemovedElement (filterData, key){
		var /**Object<string, ?>*/ result = jQuery.extend({}, filterData);
		
		var /** Array<string> */ removedElements = result["removed"];
		if(removedElements == undefined){
			removedElements = result["removed"] = [];
		}
		removedElements.push(key);
		return result;
	}

	/**
	 * @param {Array<LegendElement>} elements
	 * @param {number} index
	 * @param {Element} table
	 * @param {number=} mainIndex
	 *
	 * @return {undefined}
	 */
	function legendRow(elements, index, table, mainIndex) {
		var /** LegendElement|MultiLegendElement */ element = elements[index];
		var /** boolean */ showControls = !element.loading && !optionManager.inEditMode();
		
		var /** Element */ row = document.createElement("tr");
		element.htmlElement = jQuery(row);
		
		if(element instanceof MultiLegendElement){
			row["style"]["backgroundColor"] = "lightgray";
			row["style"]["cursor"] = "pointer";
			
			row.addEventListener ("click", function (event){
				if((event.target || event.srcElement) instanceof HTMLInputElement)
					return;
				element.childrenInLegend = !element.childrenInLegend;
				legend.update();
			});
		}
		else {
			if (element.parent == null){
				row["style"]["backgroundColor"] = "lightgray";
			}
		}
		row["className"] = "addComment";
		row["tabIndex"] = -1;
		row["dataset"]["index"] = index;
		if(mainIndex != null){ //Sub-Element
			row["dataset"]["mainIndex"] = mainIndex;
		}
		
		var /** Element */ col = document.createElement("td");
		
		if(element instanceof MultiLegendElement){
			col["className"] = "collapseSymbol";
			var /** Element */ span = document.createElement("span");
			if(element.childrenInLegend)
				span.appendChild(document.createTextNode("-"));
			else
				span.appendChild(document.createTextNode("+"));
			col.appendChild(span);
		}
		else {
			col["style"]["background-color"] = "lightgray";
			col["style"]["padding"] = "8px 0";
		}
		row.appendChild(col);
		
		
		col = document.createElement("td");
		if(element.loading || element.symbolStandard != ""){
			var /** HTMLImageElement */ img = /** @type{HTMLImageElement} */ (document.createElement("img"));
			if (element.loading) {
				 img["src"] = PATH["Loading"];
			} else {
				img["src"] = element.symbolStandard;
			}
			col.appendChild(img);
		}
		row.appendChild(col);
		
		
		col = document.createElement("td");
		appendTextPart(col, element);
		row.appendChild(col);

		col = document.createElement("td");
		col["style"]["padding"] = "8px 0";

		if(showControls && element.isQuantifiably()){

	     	var /** Element */ qButton = /** @type{Element} */ (document.createElement("div"));
	     	var /**Element */  qButtonParent  = /** @type{Element} */ (document.createElement("div"));
	     	var /**Element */  qClickable  = /** @type{Element} */ (document.createElement("div"));
 	    	var /**Element */  qButtonIcon = /** @type{Element} */ (document.createElement("i"));
 	    	var /**Element */  qButtonIcon2 = /** @type{Element} */ (document.createElement("i"));
 	    	var /**Element */  qIconSpan= /** @type{Element} */ (document.createElement("span"));
     		qButtonParent["style"]["float"] = 'right';

     		if(!element.quantify){
     			qButtonIcon.className ="fa fa-times-circle-o qcheck q-stack1 fa-stack-1x"; 
     		}
     		else{
     			qButtonIcon.className ="fa fa-check-circle-o qcheck q-stack1 greensymbol fa-stack-1x";
     		}

     		if(element.loading_quantify){
     			qButtonIcon.className="qcheck q-stack1 fa-stack-1x fa fa-cog fa-spin";

     		}

     		qButtonIcon2.className ="fa fa-circle qcheck q-stack fa-stack-1x"; 
     		qIconSpan.className ="q-span fa-stack";
     		qButton.title = "Quantify";
			qButton["style"]["vertical_align"] = 'middle';
			qButton["style"]["opacity"] = '0.6';
			qButton.innerHTML = "Q";
			qButton.className = "quantifyButton";
			qButton["id"] = "qbutton_"+element.key;

			jQuery(qButton).on('click',function(event){  //second listener for clicks while loading
			     event.stopPropagation();
			     event.preventDefault();
			});

			if(!element.loading_quantify){ 
				jQuery(qButton).one( "click", function(event) {

					hideAllOtherPolygonGrps(element);
					if(!element.visible())element.visible(true,false);

					event.stopPropagation();
					event.preventDefault();

					//only do things if quantify is not running on other element
					if(jQuery('#IM_legend').find('.fa-cog').length == 0 && element.visible() && !element.loading_quantify){
	
						var /** jQuery */ clicked_icon = jQuery(this).find('.q-stack1');
						var /** LegendElement|MultiLegendElement|boolean} */ checkQuant = symbolClusterer.checkQuantify();
			   
						element.loading_quantify = true;
						legend.update();

						setTimeout(function() {
							symbolClusterer.quantify(element, false, function(){ // quantify callback
								setTimeout(function() {
									element.loading_quantify = false;
									legend.update();
									if(!checkQuant || checkQuant == element)
										symbolClusterer.toggleQuantifyMode();
								}, 100);
							});
						}, 200);
					}	 
				});
			}

			qButtonParent.appendChild(qButton);
			qButton.appendChild(qIconSpan);
			qIconSpan.appendChild(qButtonIcon);
		    qIconSpan.appendChild(qButtonIcon2);
			col.appendChild(qButtonParent);	
		}

	    row.appendChild(col);
		
		col = document.createElement("td");
		if(showControls){
			var /** Element */ cb = document.createElement("input");
			if((element.quantify && element.isQuantifiably())||element.loading_quantify)cb['disabled']="disabled";

			if(symbolClusterer.checkQuantify())
			{	
	
			if(element instanceof MultiLegendElement){
				var /** number */ numSub = element.getNumSubElements();
				for(var j = 0; j < numSub; j++){
					var subelement_l = element.getSubElement(j);
					if(subelement_l.overlayType == OverlayType.Polygon){
						cb['disabled']="disabled";
					}
				}
			}
			else {
				if(element.overlayType == OverlayType.Polygon){
					cb['disabled']="disabled";
				}
			}	

		}

		cb.type = "checkbox";
		var /** function () */ cbFun;
		cb.addEventListener ("click", function (event){
			element.visible(this.checked, true);
			if(symbolClusterer.checkQuantify() && element.containsPointSymbols())
				symbolClusterer.reQuantify();
				event.stopPropagation();
			});
			cb.checked = element.visible();
			col.appendChild(cb);

		}
		row.appendChild(col);

		col = document.createElement("td");
		if(showControls){
			img = /** @type{HTMLImageElement} */ (document.createElement("img"));
			img["src"] = PATH["Delete"];
			img["width"] = 10;
			img["height"] = 10;
			img["style"]["cursor"] = "auto";
			
			img.addEventListener ("mouseover", function (){
				this.src = PATH["Delete_M"];
			});
			img.addEventListener ("mouseout", function (){
				this.src = PATH["Delete"];
			});
			img.addEventListener ("click", function (event){
				var /** LegendElement|MultiLegendElement|boolean */ qelement = symbolClusterer.checkQuantify();
				if(qelement == element){
					symbolClusterer.displayMarkers(true);
					symbolClusterer.toggleQuantifyMode();
				}
				
				legend.removeElement(element, true);
				
				if((qelement && element.overlayType == OverlayType.PointSymbol) || (qelement == element.parent)){
					symbolClusterer.reQuantify();
				}
				
				event.stopPropagation();
			});
			col.appendChild(img);
		}
		if(element instanceof LegendElement && element.parent != null){
			col["style"]["borderRight"] = "1px solid";
			col["style"]["borderColor"] = "lightgrey";
		}
		row.appendChild(col);
		
		table.appendChild(row);
		
		jQuery(document).trigger("im_legend_element_created", element, row); //TODO document
		
		if(element instanceof MultiLegendElement && element.childrenInLegend){
			var /*number */ len = element.subElements.length;
			for (var /** number */ i = 0; i < len; i++){
				legendRow(element.subElements, i, table, index);
			}
		}
	}


	/**
	 * @param {!LegendElement|MultiLegendElement} element
	 * 
	 * @return {undefined}
	 */
	function hideAllOtherPolygonGrps(element){
		for(var i = 0; i < legend.getLength(); i++){
			var /**LegendElement|MultiLegendElement*/ element_l = legend.getElement(i);

			if(element !== element_l)	{
				var type = element_l.overlayType;
		
				if(element_l instanceof MultiLegendElement){
					var /** number */ numSub = element_l.getNumSubElements();
					for(var j = 0; j < numSub; j++){
						var /**LegendElement*/ subelement_l = element_l.getSubElement(j);
						if(subelement_l.overlayType == OverlayType.Polygon){
							element_l.visible(false, true);	
						}
					}
				}
				else {
					if(type == OverlayType.Polygon){
						element_l.visible(false, true);
					}
				}
			}
		}
	}



	/**
	 *
	 * @param {Element} col
	 * @param {LegendElement|MultiLegendElement} element
	 *
	 * @return {undefined}
	 *
	 */
	function appendTextPart(col, element) {

		var /** Array<string> */ keys = element.key.split("+");
		
		var divElement = document.createElement("div");
		
		for(var /** number */ i = 0; i < keys.length; i++){
			var /** !Object<string, string>|undefined */ commentTranslations = commentManager.getComment(keys[i]);
			
			var /**Element*/ spanStart = document.createElement("span");
			var /**Element*/ spanMiddle = document.createElement("span");
			spanMiddle["style"]["font-weight"] = "bold";
			
			if(element.key == -1){
				spanStart.appendChild(document.createTextNode(categoryManager.getEmptyCategoryName(element.category)));
			}
			else {
				spanStart.appendChild(document.createTextNode((i > 0? " + ": "") + categoryManager.getCategoryName(element.category) + " "));
				spanMiddle.appendChild(document.createTextNode(categoryManager.getElementName(element.category, keys[i]) + " "));
			}

			
			
			divElement.appendChild(spanStart);
			divElement.appendChild(spanMiddle);

			if(commentTranslations !== undefined){
				var /** Element */ img = /** @type{HTMLImageElement} */ (document.createElement("img"));
				img["style"]["vertical_align"] = 'middle';
				img["src"] = PATH["Info"];
				img.addEventListener("click", function (keyE, event) {
					commentManager.openCommentWindow(element.category, keyE, false);
					event.stopPropagation();
				}.bind(this, keys[i]));
				divElement.appendChild(img);
			}
		}


		
		if(element instanceof LegendElement){
			var /** number */ numRecords = element.overlayInfos.length;
			divElement.appendChild(document.createTextNode(categoryManager.getCountString(element.category, numRecords)));
		}

	
		
//		if(showSliders && element instanceof LegendElement && element.overlayType == overlay_types.Polygon){ //TODO only polygon here
//			var /** Element */ slider = document.createElement("input");
//			//TODO only stroke for line string
//			//TODO set start value
//			//TODO store opacity
//			slider.type = "range";
//			slider.style.height = "1em";
//			slider.style.width = "5em";
//			slider.style.margin_top = "0.3em";
//				slider.addEventListener("change", function (element, event){
//					symbolClusterer.changeOverlayOpacity(element, this.value / 100);
//			}.bind(slider, element));
//			
//			var /** Element */ slider2 = document.createElement("input");
//			slider2.type = "range";
//			slider2.max = "10";
//			slider2.style.height = "1em";
//			slider2.style.width = "5em";
//			slider2.style.margin_top = "0.3em";
//				slider2.addEventListener("change", function (element, event){
//					symbolClusterer.changeOverlayStrokeWeight(element, this.value);
//			}.bind(slider2, element));
//			
//			divElement.appendChild(slider);
//			divElement.appendChild(slider2);
//		}
		
		col.appendChild(divElement);
	}

	/**
	 * @param {number} index
	 * @param {number} mainIndex
	 * 
	 * @return {Object} 
	 */
	this.getMenuItems = function (index, mainIndex) {
		var items = {};
		var /**LegendElement|MultiLegendElement*/ element;
		if(isNaN(mainIndex)){
			element = legend.elements[index];
		}
		else {
			element = legend.elements[mainIndex].subElements[index];
		}
		
		if(element.key != "-1"){
			var /**Array<string> */ keys = element.key.split("+");
			
			for (var /** number */ i = 0; i < keys.length; i++){
				var text = categoryManager.getNewCommentText(element.category, keys[i], keys.length > 1);
				if(!commentManager.hasComment(keys[i]) && text){
					if (PATH["userCanEditComments"] == "1" && commentManager.showCommentMenu(element.category, element.key)) {
						items["addComment" + keys[i]] = createMenuPoint(text);
					}
				}
				text = categoryManager.getListRetrievalText(element.category, keys[i], keys.length > 1);
				if(text){
					items["getList" + keys[i]] = createMenuPoint(text)
				}
			}
		}	
		return items;
	};
	
	/**
	 * @param {string} name
	 * 
	 * @return {Object<string, string>} 
	 */
	function createMenuPoint (name){
		return {"name" : name,
				"icon" : "edit"
		};
	}
	
	/**
	 * @param {string} key
	 * @param {Object} options
	 * 
	 * @return {undefined}
	 * 
	 * 
	 */
	this.menuCallback = function (key, options) {
		var /**LegendElement|MultiLegendElement*/ element;
		var /** number */ index = options["$trigger"].attr("data-index") * 1;
		var /** number */ mainIndex = options["$trigger"].attr("data-main-index") * 1;
		if(isNaN(mainIndex)){
			element = legend.elements[index];
		}
		else {
			element = legend.elements[mainIndex].subElements[index];
		}
		var /** string */ id;
		if(key.indexOf("addComment") === 0){
			id = key.substring(10);
			commentManager.openCommentWindow(element.category, id, true);
		}
		else if(key.indexOf("getList") === 0){
			id = key.substring(7);
			var builder = categoryManager.getListBuilder(element.category);
			var manager = new ListManager(builder, element);
			manager.showSelectionDialog();
		}
	};

	/**
	 * @param {function()=} callback
	 * 
	 * @return {undefined} 
	 */
	this.reloadMarkers = function(callback) {
		var /** number */ legendLength = this.elements.length;
		if(legendLength == 0){
			if(callback)
				callback();
			return;
		}
		
		var /** function () */ elementCallback;
		var /** LegendElement|MultiLegendElement|boolean */ checkQuant = symbolClusterer.checkQuantify();
		
		var /** number */  counter = 0;
		elementCallback = function (){
			counter++;
			if (counter == legendLength){
				if(checkQuant)
					symbolClusterer.reQuantify();
					
				if(callback)
					callback();
			}
		};
		
		for (var /** number */ i = 0; i < legendLength; i++) {
			var /** LegendElement|MultiLegendElement */ element = this.elements[i];
			element.removeGoogleFeatures();
			element.reloadSymbols(elementCallback);
		}
		this.update();
	};
	
		
	/**
	 * @param {boolean=} reload
	 *
	 * @return {undefined} 
	 */
	this.collapseAll = function (reload){
		if(reload == undefined)
			reload = true;
		
		for (var i = 0; i < this.elements.length; i++){
			if(this.elements[i] instanceof MultiLegendElement){
				this.elements[i].childrenInLegend = false;
			}
		}
		if(reload)
			this.update();
	};
}

/**
 * @constructor
 * @struct
 *
 * @param {number} category
 * @param {string} key
 *
 * Concrete instance of an legend element. Contains info about markers, comments for the category, visibility status etc.
 */
function LegendElement(category, key) {
	
	/** @type {number} */
	this.category = category;
	
	/** @type {string} */
	this.key = key;
	
	/** 
	 * @type{number}
	 * @private 
	 * 
	 * Index in the legend. Is the index of the parent if it exists.
	 */
	this.index;

	/**
	 * @return {number}
	 */
	this.getIndex = function (){
		return this.index;
	};
	
	/**
	 * @param {number} index
	 * 
	 * @return {undefined}
	 */
	this.setIndex = function (index){
		this.index = index;
	};

	/**
	 * @type {Array<number>|number}
	 *
	 * Indexes for color scheme (point symbol) or just a color index (polygon etc.)
	 */
	this.colorIndex;
	
	/** @type {Object<string, ?>} */
	this.filterData;

	/** @type{OverlayType} */
	this.overlayType;

	/** @type{boolean} */
	this.loading = true;

	/** 
	 * @type{boolean} 
	 * @private
	 */
	this.quantify = false;
	
	/**
	 * @private
	 * @type{boolean}
	 */
	this.editable = categoryManager.categoryAllowsFieldDataEditingForElement(this.category, this.key)
		|| categoryManager.categoryAllowsGeoDataEditingForElement(this.category, this.key);
	
	/**
	 * @return {boolean}
	 */
	this.isEditable = function (){
		return this.editable;
	};
	
	/**
	 * @return {boolean}
	 */
	this.containsPointSymbols = function (){
		return this.overlayType == OverlayType.PointSymbol;
	}

	/**
	* @type{boolean}
	* @private
	*/
	this.loading_quantify = false;

	/** @type{string} */
	this.symbolStandard = "";

	/** @type{string} */
	this.symbolHighlighted = "";

	/** @type{Array<OverlayInfo>} */
	this.overlayInfos = new Array();

	//Is only filled for polygons
	/** @type{Object<string, google.maps.Data.Feature>}*/
	this.googleFeatures = {};
	
	/** @type {jQuery} */
	this.htmlElement = null;
	
	/** @type{MultiLegendElement} */
	this.parent = null;

	var/** boolean */ isVisible = true;

	/**
	 * @param {boolean=} visible
	 * @param {boolean=} updateLegend
	 *
	 * @return {boolean}
	 */
	this.visible = function(visible, updateLegend) {

	//Setter:
	var /** number*/ i;
	if (visible != null){
		
		if(visible != isVisible) {
			isVisible = visible;
			if(visible){
				if(this.overlayType == OverlayType.Polygon){
					for (var id in this.googleFeatures){
						map.data.add(this.googleFeatures[id]);
					}
				}
				else{
					var /** boolean */ movable = optionManager.inEditMode() && categoryManager.categoryAllowsFieldDataEditingForElement(this.category, this.key, this.overlayType);
					var /** number */ len = this.overlayInfos.length;
					for (i = 0; i < len; i++){
						symbolClusterer.addOverlay(this.overlayInfos[i], this, "", movable);
					}
				}						
				if(this.parent != null){
					this.parent.subElementsVisible++;
					this.parent.visible(true, this.parent.subElementsVisible == 1, true);
				}
			}
			else {
				if(this.overlayType == OverlayType.Polygon){
					for (var id in this.googleFeatures){
						map.data.remove(this.googleFeatures[id]);
					}
				}
				else {
					symbolClusterer.removeOverlays(this);
				}
				
				if(this.parent != null){
					this.parent.subElementsVisible--;
					if(this.parent.subElementsVisible == 0){
						this.parent.visible(false, true, true);
					}
				}
				
			}
		}

		if(updateLegend)
	    	legend.update();

		}
		//Getter
		return isVisible;
	};
	
	/**
	 * @param {LegendElement} element
	 * 
	 * @return {boolean}
	 */
	this.hasChild = function (element){
		return false;
	};

	/**
	* @param{boolean} q
	*
	*@return {undefined}
	*/
	this.setQuantify = function (q){
		this.quantify = q;
	};
	
	/**
	 * @return {Array<OverlayInfo>}
	 */
	this.getOverlayInfos = function (){
		if (this.visible())
			return this.overlayInfos;
		return [];
	};
	
	/**
	 * @return {undefined}
	 */
	this.removeGoogleFeatures = function (){
		this.googleFeatures = {};
	};
	
	/**
	 * @return {undefined} 
	 */
	this.highlight = function (){
		if(this.parent != null && !this.parent.childrenInLegend){
			this.parent.htmlElement.focus();
			this.parent.htmlElement.addClass("focused");
		}
		else
		{
			this.htmlElement.focus();
			this.htmlElement.addClass("focused");
		}
	};
	
	/**
	 * @return {undefined} 
	 */
	this.blur = function (){
		this.htmlElement.blur();
	};
	
	/**
	* @return {Array<string>}
	*/
	this.getSubElementIds = function (){
		return [-1];
	};
	
	/**
	 * @param {function ()} callback
	 * @param {Object<string,?>=} filterData
	 * 
	 * @return {undefined} 
	 */
	this.reloadSymbols = function (callback, filterData){
		//TODO identical in MultiLE and LE => maybe move to a super class?
		this.loading = true;
		this.removeOverlayInfo();
		categoryManager.loadData(this.category, this.key, (filterData? filterData: this.filterData), this.getColorAssignment(), callback);
	};
	
	/** 
	* @return {Object<string, Array<number>|number>}
	* 
	*/
	this.getColorAssignment = function (){
		return {"-1" : this.colorIndex};
	};
	
	/**
	 * @return {string}
	 */
	this.getColorString = function (){
		if(this.overlayType == OverlayType.PointSymbol){
			return symbolManager.getColorStringForSymbol(/** @type{Array<number>} */ (this.colorIndex));
		}
		else {
			return symbolManager.getColorString(/** @type{number} */ (this.colorIndex));
		}
	};
	
	/** 
	* @return {undefined}
	*/
	this.removeOverlayInfo = function (){
		symbolClusterer.removeOverlays(this);
		this.overlayInfos = new Array();
	};
	
	/**
	 * @return {boolean}
	 */
	this.isQuantifiably = function (){
		return this.overlayType == OverlayType.Polygon && this.parent == null;
	};
}

/**
 * @constructor
 * @struct
 *
 * @param {number} category
 * @param {string} key
 *
 * Concrete instance of an legend element with children. Contains info about markers, comments for the category, visibility status etc. and a list of children
 */
function MultiLegendElement(category, key) {
	
	/** @type {number} */
	this.category = category;
	
	/** @type {string} */
	this.key = key;
	
	/** 
	 * @type{number}
	 * @private 
	 * 
	 * Index in the legend.
	 */
	this.index;
	
	/**
	 *  @param {number} index
	 *  
	 *  @return {undefined}
	 */
	this.setIndex = function (index){
		this.index = index;
		for (var i = 0; i < this.subElements.length; i++){
			this.subElements[i].setIndex(index);
		}
	};
	
	/**
	 * @return {number}
	 */
	this.getIndex = function (){
		return this.index;
	};

	/**
	 * @type {Array<number>|number}
	 *
	 * Indexes for color scheme (point symbol) or just a color index (polygon etc.)
	 */
	this.colorIndex;
	
	/** @type {Object<string, ?>} */
	this.filterData;
	
	/** @type{number} */
	this.overlayType = -1;

	/** @type{boolean} */
	this.loading = true;

	/** @type{string} */
	this.symbolStandard = "";

	/** @type{string} */
	this.symbolHighlighted = "";
	
	/**
	 *  @private
	 *  @type{Array<LegendElement>} 
	 */
	this.subElements = [];
	
	/**
	 * @return {number}
	 */
	this.getNumSubElements = function (){
		return this.subElements.length;
	};
	
	/**
	 * @param {number} index
	 * 
	 * @return {LegendElement}
	 */
	this.getSubElement = function (index){
		return this.subElements[index];
	};
	
	/**
	 * @return {boolean}
	 */
	this.containsPointSymbols = function (){
		for (var i = 0; i < this.subElements.length; i++){
			if(this.subElements[i].containsPointSymbols()){
				return true;
			}
		}
		return false;
	}
	
	/**
	 *  @param {LegendElement} element
	 *  
	 *  @return {undefined}
	 */
	this.addSubElement = function (element){
		element.setIndex(this.index);
		this.subElements.push(element);
	};
	
	/**
	 * @return {undefined}
	 */
	this.removeGoogleFeatures = function (){
		for (var i = 0; i < this.subElements.length; i++){
			this.subElements[i].googleFeatures = {};
		}
	};
	
	/** @type{number} */
	this.subElementsVisible = 0;
	
	/** @type {jQuery} */
	this.htmlElement = null;

	/**
	* @type{boolean}
	* @private
	*/
	this.quantify = false;

	/**
	* @param{boolean} q
	*
	* @return {undefined}
	*/
	this.setQuantify = function (q){
		this.quantify = q;
		for (var i = 0; i < this.subElements.length; i++){
			this.subElements[i].quantify = q;
		}
	};
	
	/**
	 * @return {Array<OverlayInfo>}
	 */
	this.getOverlayInfos = function (){
		var /** Array<OverlayInfo> */ result = [];
		for (var i = 0; i < this.subElements.length; i++){
			if(this.subElements[i].visible())
				result = result.concat(this.subElements[i].overlayInfos);
		}
		return result;
	}


	/**
	* @type{boolean}
	* @private
	*/
	this.loading_quantify = false;

	var/** boolean */ isVisible = true;

	/**
	 * @param {boolean=} visible
	 * @param {boolean=} updateLegend
	 * @param {boolean=} ignoreChildren
	 *
	 * @return {boolean}
	 */
	this.visible = function(visible, updateLegend, ignoreChildren) {
		//Setter:
		if (visible != null && visible != isVisible) {
			isVisible = visible;
			if(!ignoreChildren) {
				for (var i = 0; i < this.subElements.length; i++){
					this.subElements[i].visible(visible, false);
				}
			}
		}
		if(updateLegend)
			legend.update();

		//Getter
		return isVisible;
	};
	
	/**
	 * @param {LegendElement} element
	 * 
	 * @return {boolean}
	 */
	this.hasChild = function (element){
		for (var i = 0; i < this.subElements.length; i++){
			if(this.subElements[i] == element)
				return true;
		}
		return false;
	};
	
	/** 
	 * @type{boolean} 
	 */
	this.childrenInLegend = true;
	
	/**
	 * @param {number} category
	 * @param {string} key
	 * 
	 * @return {LegendElement} 
	 */
	this.getElement = function(category, key) {
		for (var /** number */ i = 0; i < this.subElements.length; i++) {
			var /** LegendElement */ e = this.subElements[i];
			if (e.category == category && e.key == key)
				return e;
		}
		return null;
	};
	
	//TODO could also be moved to a super-class
	/**
	 * @return {undefined} 
	 */
	this.focus = function (){
		this.htmlElement.focus();
	};
	
	/**
	 * @return {undefined} 
	 */
	this.blur = function (){
		this.htmlElement.blur();
	};
	
	/**
	* @return {Array<string>}
	*/
	this.getSubElementIds = function (){
		return this.subElements.map(function(e){
			return e.key;
		});
	};
	
	/**
	 * @param {function ()=} callback
	 * @param {Object<string,?>=} filterData
	 * 
	 * @return {undefined} 
	 */
	this.reloadSymbols = function (callback, filterData){
		this.loading = true;
		this.removeOverlayInfo();
		categoryManager.loadData(this.category, this.key, (filterData? filterData: this.filterData), this.getColorAssignment(), callback);
	};
	
	/** 
	* @return {Object<string, Array<number>|number>}
	*/
	this.getColorAssignment = function (){
		var /**Object<string, Array<number>|number> */ result = {};
		for (var /** number */ i = 0; i < this.subElements.length; i++){
			var /**LegendElement */ subElement = this.subElements[i];
			result[subElement.key] = subElement.colorIndex
		}
		return result;
	};
	
	/** 
	* @return {undefined}
	*/
	this.removeOverlayInfo = function (){
		for (var /** number */ i = 0; i < this.subElements.length; i++){
			var /** LegendElement */ subElement = this.subElements[i];
			symbolClusterer.removeOverlays(subElement);
			subElement.overlayInfos = new Array();
			subElement.loading = true;
		}
	};
	
	/**
	 *  @return undefined
	 */
	this.removeSubElements = function (){
		this.subElements = [];
	}
	
	/**
	 * @return {boolean}
	 */
	this.isQuantifiably = function (){
		for (var i = 0; i < this.subElements.length; i++){
			if(this.subElements[i].overlayType == OverlayType.Polygon)
				return true;
		}
		return false;
	};
}
