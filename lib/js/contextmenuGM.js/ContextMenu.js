/*
	ContextMenu v1.0
	
	A context menu for Google Maps API v3
	http://code.martinpearman.co.uk/googlemapsapi/contextmenu/
	
	Copyright Martin Pearman
	Last updated 21st November 2011
	
	developer@martinpearman.co.uk
	
	This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

	This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

	You should have received a copy of the GNU General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @typedef {{
 * 	className: (string|undefined), 
 * 	eventName: string, id: (string|undefined), 
 * 	label: string}}
 */
var ContextMenuItem;

/**
 * @typedef {{
 * 	classNames: ({menu : (string|undefined), 
 * 	menuSeparator: (string|undefined)}|undefined), 
 * 	menuItems: Array<ContextMenuItem>, 
 * 	pixelOffset: (google.maps.Point|undefined)}}
 */
var ContextMenuOptions;

/**
 * @constructor
 * @struct
 * @extends {google.maps.OverlayView}
 * 
 * @param {google.maps.Map} map
 * @param {ContextMenuOptions}  options
 * 
 */
function ContextMenu(map, options){
	options=options || {};
	
	this.setMap(map);
	
	this.classNames_= options.classNames || {};
	/**
	 * @type{google.maps.Map}
	 */
	this.map_= map;
	
	/**
	 * @type{Element}
	 */
	this.mapDiv_= map.getDiv();
	
	/**
	 * @type {Array<ContextMenuItem>}
	 */
	this.menuItems_= options.menuItems || [];
	
	/**
	 * @type {google.maps.Point}
	 */
	this.pixelOffset = options.pixelOffset || new google.maps.Point(10, -5);
	
	/**
	 * @private
	 * @type{boolean}
	 */
	this.isVisible_;
	
	/**
	 * @private
	 * @type {Element}
	 */
	this.menu_;
	
	/**
	 * @private
	 * @type{google.maps.LatLng}
	 */
	this.position_;
}

ContextMenu.prototype=new google.maps.OverlayView();

/**
 * @return {undefined}
 */
ContextMenu.prototype.draw=function(){
	if(this.isVisible_){
		var mapSize=new google.maps.Size(this.mapDiv_.offsetWidth, this.mapDiv_.offsetHeight);
		var menuSize=new google.maps.Size(this.menu_.offsetWidth, this.menu_.offsetHeight);
		var mousePosition=this.getProjection().fromLatLngToDivPixel(this.position_);
		
		var left=mousePosition.x;
		var top=mousePosition.y;
		
		if(mousePosition.x>mapSize.width-menuSize.width-this.pixelOffset.x){
			left=left-menuSize.width-this.pixelOffset.x;
		} else {
			left+=this.pixelOffset.x;
		}
		
		if(mousePosition.y>mapSize.height-menuSize.height-this.pixelOffset.y){
			top=top-menuSize.height-this.pixelOffset.y;
		} else {
			top+=this.pixelOffset.y;
		}
		
		this.menu_.style.left=left+'px';
		this.menu_.style.top=top+'px';
	}
};

/**
 * @return {boolean}
 */
ContextMenu.prototype.getVisible=function(){
	return this.isVisible_;
};

/**
 * @return {undefined}
 */
ContextMenu.prototype.hide=function(){
	if(this.isVisible_){
		this.menu_.style.display='none';
		this.isVisible_=false;
	}
};

/**
 * @return {undefined}
 */
ContextMenu.prototype.onAdd=function(){
	/**
	 * @param {ContextMenuItem} values
	 * 
	 * @return {Element}
	 */
	function createMenuItem(values){
		var menuItem=document.createElement('div');
		menuItem.innerHTML=values.label;
		if(values.className){
			menuItem.className=values.className;
		}
		if(values.id){
			menuItem.id=values.id;
		}
		menuItem.style.cssText='cursor:pointer; white-space:nowrap';
		menuItem.onclick=function(){
			google.maps.event.trigger($this, 'menu_item_selected', $this.position_, values.eventName);
		};
		return menuItem;
	}
	
	/**
	 * @return {Element}
	 */
	function createMenuSeparator(){
		var menuSeparator=document.createElement('div');
		if($this.classNames_.menuSeparator){
			menuSeparator.className=$this.classNames_.menuSeparator;
		}
		return menuSeparator;
	}
	var $this=this;	//	used for closures
	
	var menu=document.createElement('div');
	if(this.classNames_.menu){
		menu.className=this.classNames_.menu;
	}
	menu.style.cssText='display:none; position:absolute';
	for(var i=0, j=this.menuItems_.length; i<j; i++){
		if(this.menuItems_[i].label && this.menuItems_[i].eventName){
			menu.appendChild(createMenuItem(this.menuItems_[i]));
		} else {
			menu.appendChild(createMenuSeparator());
		}
	}
	
	delete this.classNames_;
	delete this.menuItems_;
	
	this.isVisible_=false;
	this.menu_=menu;
	this.position_=new google.maps.LatLng(0, 0);
	
	google.maps.event.addListener(this.map_, 'click', function(mouseEvent){
		$this.hide();
	});
	
	this.getPanes().floatPane.appendChild(menu);
};

/**
 * @return {undefined}
 */
ContextMenu.prototype.onRemove=function(){
	this.menu_.parentNode.removeChild(this.menu_);
	delete this.mapDiv_;
	delete this.menu_;
	delete this.position_;
};

/**
 * @return {undefined}
 */
ContextMenu.prototype.show=function(latLng){
	if(!this.isVisible_){
		this.menu_.style.display='block';
		this.isVisible_=true;
	}
	this.position_=latLng;
	this.draw();
};
