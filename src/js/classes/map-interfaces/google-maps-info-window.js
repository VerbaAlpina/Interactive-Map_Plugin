GM_Info_Window.prototype = new google.maps.OverlayView();

/**
 * @constructor
 * @struct
 * 
 * @param {Array<string>} symbols
 * @param {Array<Element>} elements
 * @param {Array<InfoWindowContent>} infoWindowContents
 * 
 * @extends {google.maps.OverlayView}
 */
function GM_Info_Window (symbols, elements, infoWindowContents){
	/**
	 * @private
	 * @type{Element}
	 */
	this.content;
	
	/**
	 * @private
	 * @type {google.maps.LatLng}
	 */
	this.position;
	
	/**
	 * @private
	 * @type {Array<string>}
	 */
	this.symbols = symbols;
	
	/**
	 * @type {Array<Element>}
	 */
	this.elements = elements;
	
	/**
	 * @private
	 * @type {Array<InfoWindowContent>}
	 */
	this.infoWindowContents = infoWindowContents;
	
	/**
	 * @private
	 * @type {number}
	 */
	this.baseZIndex = 100;
	
	/**
	 * @private
	 * @type {number}
	 */
	this.arrowSize = 10;
	
	/**
	 * @private
	 * @type {Array<google.maps.MapsEventListener>}
	 */
	this.listeners;
}

/**
 * @param {google.maps.LatLng} position
 * @param {number} tabIndex
 * 
 * @return {undefined}
 */
GM_Info_Window.prototype.open = function (position, tabIndex){
	this.position = position;
	this.setMap(map);
};

/**
 * @override
 * 
 * @return {undefined}
 */
GM_Info_Window.prototype.onAdd = function (){
	
	var /** GM_Info_Window */ thisObject = this;
	
	//Container
	var /**Element */ content = document.createElement("div");
	content.style.background = "white";
	content.style.position = "absolute";
	content.style.borderStyle = "solid";
	content.style.borderRadius = "10px";
	content.style.borderColor = "cccccc";
	
	//Close button
	var /** Element */ close = document.createElement("IMG");
	close.style["position"] = "absolute";
	close.style["border"] = "0";
	close.style["zIndex"] = "" + this.baseZIndex + 1;
	close.style["cursor"] = "pointer";
	close.style["right"] = "3px";
	close.style["top"] = "3px";
	close.src = PATH["Close"];
	
	google.maps.event.addDomListener(close, 'click', function(e) {
		thisObject.setMap(null);
		e.stopPropagation();
	});
	
	content.appendChild(close);
	
	// Arrow
	var /** Element*/ arrow = document.createElement("DIV");
	arrow.style["position"] = "relative";
	
	var arrowOuter = document.createElement("DIV");
	var arrowInner = document.createElement("DIV");
	
	arrowOuter.style["position"] = arrowInner.style["position"] = "absolute";
	arrowOuter.style["left"] = arrowInner.style["left"] = "50%";
	arrowOuter.style["height"] = arrowInner.style["height"] = "0";
	arrowOuter.style["width"] = arrowInner.style["width"] = "0";
	arrowOuter.style["marginLeft"] = (- this.arrowSize) + "px";
	arrowOuter.style["borderWidth"] = this.arrowSize + "px";
	arrowOuter.style["borderBottomWidth"] = "0";
	
	arrow.appendChild(arrowOuter);
	arrow.appendChild(arrowInner);
	content.appendChild(arrow);
	
	content.appendChild(this.elements[0]);
	
	this.getPanes().floatPane.appendChild(content);
	this.content = content;
	
	this.addEvents();
};

/**
 * @override
 * 
 * @return {undefined}
 */
GM_Info_Window.prototype.draw = function (){
	var /** google.maps.MapCanvasProjection*/ overlayProjection = this.getProjection();
	
	var pixelPos = overlayProjection.fromLatLngToDivPixel(this.position);
	
	this.content.style.left = pixelPos.x + "px";
	this.content.style.top = pixelPos.y + "px";
};

/**
 * @override
 * 
 * @return {undefined}
 */
GM_Info_Window.prototype.onRemove = function (){
	this.content.parentNode.removeChild(this.content);
	this.content = null;
	
	for (var i = 0, listener; listener = this.listeners[i]; i++) {
		 google.maps.event.removeListener(listener);
	}
};

/**
 * Add events to stop propagation
 * @private
 */
GM_Info_Window.prototype.addEvents = function() {
  // We want to cancel all the events so they do not go to the map
	var /** Array<string>*/ events = ["mousedown", "mousemove", "mouseover", "mouseout", "mouseup",
      "mousewheel", "DOMMouseScroll", "touchstart", "touchend", "touchmove",
      "dblclick", "contextmenu", "click"];

	this.listeners = [];
	for (var i = 0, event; event = events[i]; i++) {
		this.listeners.push(
			google.maps.event.addDomListener(this.content, event, function(e) {
				e.cancelBubble = true;
				if (e.stopPropagation) {
					e.stopPropagation();
				}
			})
		);
	}
};