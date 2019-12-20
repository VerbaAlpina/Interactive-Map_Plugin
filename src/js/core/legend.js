/**
 * @constructor
 * @struct
 * 
 * @implements{Iterable<LegendElement>}
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
	 * @type{number}
	 * @private
	 */
	this.numLoading = 0;
	
	/**
	 * @type {number}
	 * @public
	 */
	this.numActive = 0;


	/**
	 * @type {number}
	 * @private
	 */
	this.globalZindex = 2;

	/**
	 * @type {number}
	 * @private
	 */
	this.scrollPosTop = 0;
	

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
	
	/**
	 * @return {undefined}
	 */
	this.unhighlightAll = function (){
		jQuery(".focused").removeClass("focused");
	};
	
	/**
	 * @param {number} category
	 * 
	 * @return {undefined}
	 */
	this.removeElementsByCategory = function (category){
		for (var i = 0; i < this.elements.length; i++){
			var /** LegendElement|MultiLegendElement */ currentElement = this.elements[i];
			if(currentElement instanceof LegendElement){
				if (currentElement.category == category){
					this.removeElement(currentElement, true);
				}
			}
			else {
				for (var j = 0; j < currentElement.subElements.length; j++){
					var /** LegendElement */ currentSubElement = currentElement.subElements[j];
					if (currentElement.category == category){
						this.removeElement(currentElement, true);
						break;
					}
				}
			}
		}
	};

	/**
	 * @return{undefined} 
	 */
	this.update = function() {
		jQuery(document).trigger("im_legend_before_rebuild", this); //TODO comment
		
		//Rebuild legend
	    var /** Element */ tablecontainer = document.createElement("div");
		var /** Element */ table = document.createElement("table");
		var /** Element */ tablebody = document.createElement("tbody");
		table.appendChild(tablebody);
		if (this.elements.length != 0) {
			table.className = "legendtable";
			for (var/** number */ i = 0; i < this.elements.length; i++) {
				var /**LegendElement|MultiLegendElement*/ element = this.elements[i];
				if (element == null)
					continue;
				else if (optionManager.inEditMode() && !element.editable){
					element.visible(false);
					continue;
				}
				legendRow(this.elements, i, tablebody);
			}

		}

		tablecontainer.className = "legendtablecontainer";
		tablecontainer.appendChild(table);

		jQuery("#IM_legend").html(tablecontainer);
			
		jQuery(document).trigger("im_legend_after_update", this); //TODO comment

		//TODO maybe not call this for every legend update
		for (var/** number */ j = 0; j < mapState.getInfoWindowCount(); j++) {
			mapState.getInfoWindowOwner(j).updateInfoWindow();
		}
		if(this.scrollPosTop!=0){
			 jQuery('.legendtable tbody').scrollTop(this.scrollPosTop);
		}
	};

	/** 
	 * @param {LegendElement|MultiLegendElement} element
	 * @param {boolean} deleteFromArray If the LegendElement has to be removed from the elements or subElements array
	 * 
	 * @return {undefined} 
	 */
	this.removeElement = function(element, deleteFromArray) {
		
		var /** LegendElement|MultiLegendElement|boolean */ qelement = symbolClusterer.checkQuantify();
		if(qelement == element){
			symbolClusterer.displayMarkers(true);
			symbolClusterer.toggleQuantifyMode();
			qelement = null;
		}
		
		if(element instanceof MultiLegendElement){
			for(var /** number */ i = 0; i < element.subElements.length; i++){
				this.removeElement(element.subElements[i], false);
			}
		}
		else {
			symbolClusterer.removeOverlays(element);
			element.unblockColorIndexes();
			
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
			
			if(qelement){
				symbolClusterer.reQuantify();
			}
		}
		
		if (deleteFromArray || element instanceof MultiLegendElement){
			mapInterface.repaint(true);
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
	 * @return {undefined} 
	 */
	this.deactivateAll = function (){
		for (let /** LegendElement */ le of this){
			le.setActive(false);
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
				for (let j = 0; j < currElement.subElements.length; j++){
					if(!currElement.subElements[j].visible()){
						currentFilterData = storeRemovedElement(currentFilterData, currElement.subElements[j].key);
					}
				}
			}
			
			var /** boolean|Array<number> */ active;
			if (currElement instanceof LegendElement){
				active = currElement.active;
			}
			else {
				active = [];
				for (let j = 0; j < currElement.subElements.length; j++){
					if(currElement.subElements[j].active){
						active.push(j);
					}
				}
			}
			
			result[i] = {
				"category" : currElement.category, 
				"key" : currElement.key, 
				"filter" : currentFilterData, 
				"fixedColors" : currElement.getColorAssignment(),
				"active" : active
			};
		}
		return result;
	};
	
	/**
	 * @param {?number} subIndex
	 * @param {number} mainIndex
	 * 
	 * @return {LegendElement}
	 */
	this.getElementByIndexes = function (subIndex, mainIndex){
		if(subIndex){
			return this.elements[mainIndex].subElements[subIndex];
		}
		else {
			return /** @type{LegendElement} */ (this.elements[mainIndex]);
		}
	};
	
	/**
	 * @param {number} category
	 * @param {string} key
	 * 
	 * @return {LegendElement|MultiLegendElement|undefined}
	 */
	this.getElementByKey = function (category, key){
		for (let i = 0; i < this.elements.length; i++){
			
			let element = this.elements[i];
			
			if (element.category == category && element.key == key){
				return element;
			}
			
			if (element instanceof MultiLegendElement){
				for (let j = 0; j < element.subElements.length; j++){
					let subElement = element.subElements[j];
					
					if (subElement.category == category && subElement.key == key){
						return subElement;
					}
				}
			}
		}
	};
	
	/**
	 * @param{Array<Object>} data
	 * 
	 * @return {undefined}
	 */
	this.switchToState = function (data){
		//TODO better implementation that does not reload everything
		legend.removeAll();
		
		for (var i = 0; i < data.length; i++){
			var /** Object */ currElement = data[i];
			
			categoryManager.loadData(currElement["category"] * 1, currElement["key"], "stateChange", currElement["filter"], currElement["fixedColors"]);
		}
	}
	
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
			row["className"] = "im_parent_legend_element addComment";
		}
		else {
			if(element.parent == null){
				row["className"] = "im_single_legend_element addComment";
			}
			else {
				row["className"] = "im_child_legend_element addComment";
			}
		}
		
		if(element instanceof MultiLegendElement){
			row.addEventListener ("click", function (event){
    		    var scrollpos = /** number */  parseInt(jQuery('.legendtable tbody').scrollTop(), 10);
    		    var rowpos = jQuery(row).position().top-115;
			    legend.scrollPosTop = scrollpos + rowpos; // scroll clicked element as good in view as possible
		
				if((event.target || event.srcElement) instanceof HTMLInputElement)
					return;
				element.childrenInLegend = !element.childrenInLegend;

				legend.update();

			});
		}
		else {
			if(element.openInfoWindowsNumber > 0){
				row["className"] += " focused";
			}
		}

		row["tabIndex"] = -1;
		row["dataset"]["index"] = index;
		if(mainIndex != null){ //Sub-Element
			row["dataset"]["mainIndex"] = mainIndex;
		}
		
		var /** Element */ col = document.createElement("td");
		var /** Element */ span;
		
		if(element instanceof MultiLegendElement){
			col["className"] = "collapseSymbol";
			span = document.createElement("span");
			if(element.childrenInLegend){
				var minus = document.createElement("i");
		     	minus.className = "fa fa-caret-down collapsesymbol_icon";
				span.appendChild(minus);
				}
			else{
				var plus = document.createElement("i");
		     	plus.className = "fa fa-caret-right collapsesymbol_icon";
				span.appendChild(plus);
			}
			col.appendChild(span);
		}

		else{
			if(element.overlayType == OverlayType.PointSymbol && !symbolClusterer.checkQuantify()){



				span = document.createElement("span");
				var dot = document.createElement("i");
		    	dot.className = "fa fa-circle activate_symbol_icon";
			    span.appendChild(dot);
			    col.appendChild(span);
			    row.className += " toggle"
			    if(element.active){
			    	dot.className += " active";
			    }
			    
			    row.addEventListener("click", function(){

	    		    var scrollpos = /** number */  parseInt(jQuery('.legendtable tbody').scrollTop(), 10);
    			    legend.scrollPosTop = scrollpos;

    			    var /** boolean */ active = !this.active;
			    	this.setActive(active);

			    	if(this.active && !this.visible()){
			    		 this.visible(true, false);
			    	}

			    	var /** boolean */ largeRepaint = (active && legend.numActive == 1) || (!active && legend.numActive == 0);
			    	if(largeRepaint){
			    		//Repainting all symbols is more efficient for pretty much every case, since the symbols for all elements except one have to be repainted
			    		symbolClusterer.repaintPointSymbols();
			    	}
			    	else {
			    		symbolClusterer.repaintPointSymbols(this);
			    	}

					legend.update();
					mapInterface.repaint(true);
				}.bind(element));
		    }
		}

		row.appendChild(col);
		
		
		col = document.createElement("td");
		if(element.loading || element.symbolStandard){
			var /** HTMLImageElement */ img = /** @type{HTMLImageElement} */ (document.createElement("img"));
			if (element.loading) {
				 img["src"] = PATH["Loading"];
			} else {
		
				if(!element.active && element.overlayType == OverlayType.PointSymbol && legend.numActive>0) img["src"] = element.symbolInactive.toDataURL();
				else img["src"] = element.symbolStandard.toDataURL();
	
				img["style"]["width"] = symbolSize + " px";
				img["style"]["height"] = symbolSize + "px";
			}
			col.appendChild(img);
		}
		row.appendChild(col);
		
		
		col = document.createElement("td");
		appendTextPart(col, element);
		row.appendChild(col);

		col = document.createElement("td");
	

		if(showControls && element.isQuantifiably()){

	     	var /** Element */ qButton = /** @type{Element} */ (document.createElement("div"));
	     	var /**Element */  qButtonParent  = /** @type{Element} */ (document.createElement("div"));
	     	var /**Element */  qClickable  = /** @type{Element} */ (document.createElement("div"));
 	    	var /**Element */  qButtonIcon = /** @type{Element} */ (document.createElement("i"));
 	    	var /**Element */  qButtonIcon2 = /** @type{Element} */ (document.createElement("i"));
 	    	var /**Element */  qButtonIcon3 = /** @type{Element} */ (document.createElement("img"));
 	    	var /**Element */  qIconSpan= /** @type{Element} */ (document.createElement("span"));

 	        qButtonIcon3["src"] = PATH["quantify"];
 	       // qButtonIcon3["type"] = "image/svg+xml";

     		if(!element.quantify){
     			qButtonIcon.className ="far fa-times-circle qcheck q-stack1 fa-stack-1x"; 
     		}
     		else{
     			qButtonIcon.className ="far fa-check-circle qcheck q-stack1 greensymbol fa-stack-1x";
     		}

     		if(element.loading_quantify){
     			qButtonIcon.className="qcheck q-stack1 fa-stack-1x fa fa-cog fa-spin";

     		}

     		// qButtonIcon3.className="far fa-circle ring";
     		qButtonIcon2.className ="fa fa-circle qcheck q-stack fa-stack-1x"; 
     		qIconSpan.className ="q-span fa-stack";
     		qButton.title = "Quantify";
			qButton["style"]["vertical_align"] = 'middle';
			qButton["style"]["opacity"] = '0.6';
			// qButton.innerHTML = "Q";
			qButton.className = "quantifyButton";
			qButton["id"] = "qbutton_"+element.key;
			qButtonParent.className="qButtonParent";


			jQuery(qButton).on('click', function(event){  //second listener for clicks while loading

			     event.stopPropagation();
			     event.preventDefault();
			});

			if(!element.loading_quantify){ 
				jQuery(qButton).one( "click", function(event) {

					 var scrollpos = /** number */  parseInt(jQuery('.legendtable tbody').scrollTop(), 10);
					 legend.scrollPosTop = scrollpos;

					legend.deactivateAll();
					symbolClusterer.repaintPointSymbols();

					hideAllOtherPolygonGrps(element);
					if(!element.visible())
						element.visible(true,false);

					event.stopPropagation();
					event.preventDefault();

					//only do things if quantify is not running on other element
					if(jQuery('#IM_legend').find('.fa-cog').length == 0 && element.visible() && !element.loading_quantify){
	
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

		    qButton.appendChild(qButtonIcon3);
			qButtonParent.appendChild(qButton);
			qButton.appendChild(qIconSpan);
			qIconSpan.appendChild(qButtonIcon);
		    qIconSpan.appendChild(qButtonIcon2);
			col.appendChild(qButtonParent);	
		}

		var builder = categoryManager.getListBuilder(element.category);

		if(!element.loading && builder && (element instanceof MultiLegendElement || (element instanceof LegendElement && element.parent==null)) && !element.isQuantifiably()){
			var /**Element */  exportIcon = /** @type{Element} */ (document.createElement("i"));
	    	var /**Element */  expParent  = /** @type{Element} */ (document.createElement("div"));
	 		exportIcon.className ="list_export_icon fas fa-file-download"; 
			expParent.appendChild(exportIcon);	
			expParent.className ="list_export_icon_parent"; 
			col.appendChild(expParent);

			jQuery(exportIcon).on( "click", function(event) {
					event.stopPropagation();
					event.preventDefault();

					jQuery('.select_export_popup').modal();

					var builder = categoryManager.getListBuilder(element.category);
					var manager = new ListManager(builder, element);	

					// var active_legend_icons = [];

					// 	if(legend.numActive == 0){
					// 		 active_legend_icons = [];
					// 	}
					// 	else{
					// 			var /** number */ numSub = element.getNumSubElements();
					// 			for(var j = 0; j < numSub; j++){
					// 				var subelement_l = element.getSubElement(j);
					// 				if(subelement_l.active){
					// 					active_legend_icons.push(subelement_l);
					// 				}
					// 			}
					// 	}

						// TODO USE ACTIVE ELEMENTS FOR EXPORT 
						// ALLOW EXPORT FOR OTHER CATEGORIES THAN INFORMANTS

					jQuery('.select_export_popup').one('shown.bs.modal',function(){

						jQuery('.select_export_popup #export_json').off().one('click',function(){
							manager.showResult(0);
							jQuery('.select_export_popup').modal('hide');
						})

						jQuery('.select_export_popup #export_csv').off().one('click',function(){
							manager.showResult(2);
							jQuery('.select_export_popup').modal('hide');
						})

						jQuery('.select_export_popup #export_list').off().one('click',function(){
							manager.showResult(1);
							jQuery('.select_export_popup').modal('hide');
						})

					})

			})

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
		cb.className = "legend_checkbox";
		var /** function () */ cbFun;
		cb.addEventListener ("click", function (event){


		    var scrollpos = /** number */  parseInt(jQuery('.legendtable tbody').scrollTop(), 10);
	        legend.scrollPosTop = scrollpos;

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
		var /** boolean */ forbidRemoving;
		if(element instanceof LegendElement && element.parent != null){
			forbidRemoving = categoryManager.forbidRemoving(element.parent.category, element.key);
		}
		else {
			forbidRemoving = categoryManager.forbidRemoving(element.category, element.key);
		}
		
		if(showControls && !forbidRemoving){
			var delete_symbol = document.createElement("i");
			// delete_symbol["src"] = PATH["Delete"];
			delete_symbol.className = "fa fa-times delete_symbol"

			delete_symbol.addEventListener ("click", function (event){
				var scrollpos = /** number */  parseInt(jQuery('.legendtable tbody').scrollTop(), 10);
				legend.scrollPosTop = scrollpos;

				var needs_repaint = false;

				if(element instanceof MultiLegendElement && element.containsPointSymbols()){
						var /*number */ len = element.subElements.length;
						for (var /** number */ i = 0; i < len; i++){
							if(element.subElements[i].active){
								element.subElements[i].setActive(false);
								needs_repaint =true;
							}
						}
				}
				else {
				   if(element.active){
				   		element.setActive(false);	
		   				needs_repaint =true;
				   }
				}	

				if(needs_repaint){
					//this.repaintSymbols(); //TODO performance do not repaint all symbols in all cases
					for (var i = 0; i < legend.elements.length; i++){
			    		legend.elements[i].repaintSymbols();
			    	}
			    	needs_repaint = false;
				}
	        

				legend.removeElement(element, true);
				history.pushState({"content" : legend.getCompleteExport(true)}, "");

		        if(legend.elements.length==0){
		        	jQuery('#legend_heading').parent()
		        	.removeClass('keep_shadow')
		        	.removeClass('active')
		        	.find('.fa-caret-down')
		        	.removeClass('fa-caret-down')
		        	.addClass('fa-caret-right');
	        	  	jQuery('#legend_heading').parent().find('.menu_collapse').hide();

	        	  	jQuery('#legend_heading').addClass('l_disabled');
		        }

				event.stopPropagation();
			});
			col.appendChild(delete_symbol);
		}

		row.appendChild(col);
		
		table.appendChild(row);
		
		jQuery(document).trigger("im_legend_element_created", element, row); //TODO document
		
		if(element instanceof MultiLegendElement){
			var /*number */ len = element.subElements.length;
			for (var /** number */ i = 0; i < len; i++){
				if(element.childrenInLegend){
					legendRow(element.subElements, i, table, index);
				}
				else {
					if(element.subElements[i].openInfoWindowsNumber > 0){
						row["className"] += " focused";
						break;
					}
				}
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
	};
	
	/**
	 * @return {LegendElement}
	 */
	this[Symbol.iterator] = function* (){
		var length = this.elements.length;
		for (let i = 0; i < length; i++){
			var /** LegendElement|MultiLegendElement */ child = this.elements[i];
			if (child instanceof LegendElement){
				yield child;
			}
			else {
				var subLength = child.subElements.length;
				for (let j = 0; j < subLength; j++){
					yield child.subElements[j];
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
		divElement.className = "l_span_container";


		for(var /** number */ i = 0; i < keys.length; i++){
			var /** !Object<string, string>|undefined */ commentTranslations = commentManager.getComment(keys[i]);
			
			var /**Element*/ spanStart = document.createElement("span");
			var /**Element*/ spanMiddle = document.createElement("span");

			if(element.key == -1){
				spanStart.appendChild(document.createTextNode(categoryManager.getEmptyCategoryName(element.category)));
			}
			else {
				var /** string */ catName;
				if(element.category == -3 /* Tags */){
					catName = categoryManager.getTagTranslation(element.parent.filterData["selectedTag"]);
				}
				else {
					catName = categoryManager.getCategoryName(element.category, true);
				}
				
				spanStart.appendChild(document.createTextNode((i > 0? " + ": "") + catName + " "));
				var /** string */ elementName;
				if(element.category == -1){ //All distinct
					elementName = categoryManager.getAllDistinctElementName(keys[i], element.parent.key);
				}
				else if(element.category == -3){ //Tags
					elementName = categoryManager.getTagTranslation(keys[i].substring(1));
				}
				else {
					elementName = categoryManager.getElementName(element.category, keys[i]);
				}
				spanMiddle["style"]["font-weight"] = "bold";
				spanMiddle.appendChild(document.createTextNode(elementName + " "));
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
			var /** number */ numRecords = element.getNumOverlays();
			divElement.appendChild(document.createTextNode(categoryManager.getCountString(element.category, numRecords)));
		}
		
		col.appendChild(divElement);
		
		if(element.filterData !== undefined && element.filterData["markings"] !== undefined){
			var /** string */ tagName = element.filterData["markings"]["tagName"];
			var /** Object<string,number>*/ values = element.filterData["markings"]["tagValues"];
			var /** Element */ markDiv = document.createElement("div");
			markDiv.className="mark_parent";

			for (var key in values){

				var /** Element */ markItem = document.createElement("div");
				markItem.className="mark_item";

				markDiv.appendChild(markItem);
				
				var /** Element */ mimg = /** @type{HTMLImageElement} */ (document.createElement("img"));
				// mimg["style"]["marginLeft"] = "10px";
				mimg["style"]["verticalAlign"] = "middle";
			    mimg["style"]["width"] = "23px";  // TODO: USE CORRECT SIZES BASED ON  markingScaleFunction(symbolInfo)

				var /** number */ colIndex = element instanceof LegendElement? element.colorIndex[0]: element.mainColorIndex;
				mimg["src"] = symbolManager.createSymbolURLForMarking(colIndex, values[key]);
				markItem.appendChild(mimg);
				
				markItem.appendChild(document.createTextNode(" = "));
				
				var /** Element */ tagNameElement = document.createElement("span");
				tagNameElement.appendChild(document.createTextNode(tagName + " "));
				tagNameElement["style"]["font-weight"] = "bold";
				markItem.appendChild(tagNameElement)
				
				markItem.appendChild(document.createTextNode(key));
			}
			col.appendChild(markDiv);
		}	
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
			// id = key.substring(7);
			// var builder = categoryManager.getListBuilder(element.category);
			// var manager = new ListManager(builder, element);
			// manager.showSelectionDialog();
		}
	};

	/**
	 * @param {function()=} callback
	 * 
	 * @return {undefined} 
	 */
	this.reloadOverlays = function(callback) {
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
					
				mapInterface.repaint(true);
				
				if(callback)
					callback();
			}
		};
		
		for (var /** number */ i = 0; i < legendLength; i++) {
			var /** LegendElement|MultiLegendElement */ element = this.elements[i];
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
 * @param {MultiLegendElement=} parent
 *
 * Concrete instance of an legend element. Contains info about markers, comments for the category, visibility status etc.
 */
function LegendElement(category, key, parent) {
	
	/** @type {number} */
	this.category = category;
	
	/** @type {string} */
	this.key = key;

	/** @type {number} */
	this.zIndex = 0;
	
	/** 
	 * @type {boolean} 
	 */
	this.active = false;
	
	/**
	 * @type {number}
	 */
	this.currentElementIndex = 0;
	
	/**
	 * @type {number}
	 */
	this.openInfoWindowsNumber = 0;
	
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
	 * @return {number}
	 */
	this.getZindex = function (){
		return this.zIndex;
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
	 * @param {boolean} active
	 * 
	 * @return {undefined}
	 */
	this.setActive = function (active){
		if(this.active == active)
			return;
		
		this.active = active;
		if (active){
			legend.numActive++;
			legend.globalZindex++;
			if(legend.globalZindex > 999999)
				legend.globalZindex = 2; 
			this.zIndex = legend.globalZindex;
		}
		else{
			legend.numActive--;
			this.zIndex = 0;
		}
	};
	
	/**
	 * @return {undefined}
	 */
	this.repaintSymbols = function (){
		if(this.overlayType != OverlayType.Polygon){
			symbolClusterer.repaintPointSymbols(this);
		}
	};
	
	/**
	 * @return {number}
	 */
	this.getSubElementIndex = function (){
		if(this.parent == null){
			return -1;
		}
		
		return this.parent.subElements.indexOf(this);
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

	/** @type{Element} */
	this.symbolStandard = null;

	/** @type{Element} */
	this.symbolInactive  = null;

	/** @type{Array<OverlayInfo>} */
	this.overlayInfos = new Array();
	
	/** @type {jQuery} */
	this.htmlElement = null;
	
	/** @type{MultiLegendElement} */
	this.parent = null;
	if(parent)
		this.parent = parent;
	
	/**
	* @type{boolean} 
	* @private
	*/
	this.loading;
	
	/**
	 * @param {boolean} state
	 * 
	 * @return {undefined}
	 */
	this.setLoading = function (state){
		this.loading = state;
		
		if(this.parent == null){
			if(state){
				legend.numLoading++;
				optionManager.enableOptions(false);
			}
			else {
				legend.numLoading--;
				if(legend.numLoading == 0)
					optionManager.enableOptions(true);
			}
		}
	};
	this.setLoading(true);

	var/** boolean */ isVisible = true;

	/**
	 * @return {number}
	 */
	this.getNumOverlays = function (){
		var result = 0;
		for (var i = 0; i < this.overlayInfos.length; i++){
			result += this.overlayInfos[i].infoWindowContents.length;
		}
		return result;
	}
	
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
					var /** boolean */ movable = optionManager.inEditMode() && categoryManager.categoryAllowsFieldDataEditingForElement(this.category, this.key, this.overlayType);
					var /** number */ len = this.overlayInfos.length;
					for (i = 0; i < len; i++){
						symbolClusterer.addOverlay(this.overlayInfos[i], this, movable);
					}
					
					if(this.parent != null){
						this.parent.subElementsVisible++;
						this.parent.visible(true, this.parent.subElementsVisible == 1, true);
					}
				}
				else {
					this.openInfoWindowsNumber = 0;
					symbolClusterer.removeOverlays(this);
					
					if(this.parent != null){
						this.parent.subElementsVisible--;
						if(this.parent.subElementsVisible == 0){
							this.parent.visible(false, true, true);
						}
					}
					
				}
			
				if(updateLegend){
			    	legend.update();
			    	mapInterface.repaint(true);
				}
			}
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
	
	this.isActive = function (){
		if(legend.numActive == 0){
			return true;
		} 
		else{
			return this.active;
		}
	}


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
	this.highlight = function (){
		var /** jQuery */ element;
		
		if(this.parent != null && !this.parent.childrenInLegend){
			element = this.parent.htmlElement;
		}
		else {
			element = this.htmlElement;
		}
		
		this.openInfoWindowsNumber++;
		
		element.focus();
		element.addClass("focused");

	    var scrollpos = /** number */  parseInt(jQuery('.legendtable tbody').scrollTop(), 10);
        legend.scrollPosTop = scrollpos;

	};
	
	this.unhighlight = function (){
		this.openInfoWindowsNumber--;
		
		if(this.openInfoWindowsNumber == 0){
			if(this.parent != null && !this.parent.childrenInLegend){
				for (var i = 0; i < this.parent.subElements.length; i++){
					if(this.parent.subElements[i].openInfoWindowsNumber > 0){
						return;
					}
				}
				this.parent.htmlElement.removeClass("focused");
			}
			else
			{
				this.htmlElement.removeClass("focused");
			}
		}
	}
	
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
		if (this.loading){
			if(callback)
				callback();
			return;
		}
	
		this.setLoading(true);
		this.removeOverlayInfo();
		
		this.unblockColorIndexes();
		categoryManager.loadData(this.category, this.key, "reload", (filterData? filterData: this.filterData), this.getColorAssignment(), callback);
	};
	
	this.unblockColorIndexes = function (){
		if(this.colorIndex !== undefined){
			if (this.overlayType == OverlayType.PointSymbol) {
				symbolManager.unblockFeatureCombination(/** @type {Array<number>}*/ (this.colorIndex)[0], /** @type {Array<number>}*/ (this.colorIndex)[1]);
			} else {
				symbolManager.unblockColor(this.overlayType, /** @type {number}*/ (this.colorIndex));
			}
		}
	}
	
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
			return symbolManager.getPolygonColorString(/** @type{number} */ (this.colorIndex));
		}
	};
	
	/**
	 * @return {string}
	 */
	this.getColorHex = function (){
		var str = this.getColorString();
		return "0x" + str.substring(1);
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
	 * @return {undefined}
	 */
	this.repaintSymbols = function (){
		for (var i = 0; i < this.subElements.length; i++){
			this.subElements[i].repaintSymbols();
		}
	};
	
	/**
	 * @return {number}
	 */
	this.getIndex = function (){
		return this.index;
	};
	
	/**
	 * @param {boolean} active
	 * 
	 * @return {undefined}
	 */
	this.setActive = function (active){
		for (var i = 0; i < this.subElements.length; i++){
			this.subElements[i].setActive(active);
		}
	}


	/**
	 * @type {number}
	 *
	 */
	this.mainColorIndex;
	
	/** @type {Object<string, ?>} */
	this.filterData;
	
	/** @type{number} */
	this.overlayType = -1;

	/**
	* @type{boolean} 
	* @private
	*/
	this.loading;
	
	/**
	 * @param {boolean} state
	 * 
	 * @return {undefined}
	 */
	this.setLoading = function (state){
		this.loading = state;
		
		if(state){
			legend.numLoading++;
			optionManager.enableOptions(false);
		}
		else {
			legend.numLoading--;
			if(legend.numLoading == 0)
				optionManager.enableOptions(true);
		}
	};
	this.setLoading(true);

	/** @type{Element} */
	this.symbolStandard = null;
	
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
			
			if(updateLegend){
				legend.update();
				mapInterface.repaint(true);
			}
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
		if (this.loading){
			if(callback)
				callback();
			return;
		}
		
		this.setLoading(true);
		this.removeOverlayInfo();
		
		this.unblockColorIndexes();		
		categoryManager.loadData(this.category, this.key, "reload", (filterData? filterData: this.filterData), this.getColorAssignment(), callback);
	};
	
	this.unblockColorIndexes = function (){
		for (var i = 0; i < this.subElements.length; i++){
			this.subElements[i].unblockColorIndexes();
		}
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
