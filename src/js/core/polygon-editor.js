

function polygonEditor (pixioverlay, controlDiv){


	appendControlDiv(controlDiv);

	var that = this;
	var map = pixioverlay.getMap();
	var selectMarker;
	var new_mode = false;
	var hole_mode = false;
  var blockpolyclick = false;
  var draw_rect = false;
  var rect_mode = false;
  var selectRect;
  var startpoint = null;
  var selectBounds;

  this.newPolyCount = 0;

	this.edit_markers = [];

	var polygons = pixioverlay.pixipolygons;

	var ctrl = false;
	var dragging = false;
	var block_unselect = false;

	for(var i=0; i<polygons.length;i++){
		    var polygon = polygons[i];
            polygon.savedClickListener = polygon.clickListener;
	        polygon.clickListener = newClickFunction;
		 }

document.addEventListener("visibilitychange", function() {
	//case that if ctrl is pressed on browser tab switch
    if (document.hidden){
         ctrl = false;
         dragging = false;

      	 jQuery('body').removeClass('ctrl');
      
    } else {
    
    }
});


jQuery(document).mouseleave(function() {
    ctrl = false;
    dragging = false;
});


map.on('click', addPointWhenPointSelected);


function addPointWhenPointSelected (){

		if(ctrl && selectMarker){
			addNewPointFromSelectMarker(selectMarker.res,selectMarker.pointIdx,selectMarker.holeIdx);
		}

		var edited_polygon = pixioverlay.getEditedPolygon();

  		
		if(!ctrl && !block_unselect){		

			 if(!pixioverlay.active_polygon && edited_polygon){
		   
	 			unselectPolygon();
		    jQuery('.poly_container').remove();
		    jQuery('.polyslider').remove();
	      jQuery('.polybreak').remove();

			 }

		}  	 

		
}



map.on('mousemove',ctrlMousemove)



function ctrlMousemove(e){

if(ctrl){

	var current_mousepos = e.latlng;
		addSelectMarker(current_mousepos);

   } //ctrl


   else{
   	  that.removeSelectMarker();
   }

   pixioverlay.renderMarkers();

}


function addSelectMarker(current_mousepos){


   	var edited_polygon = pixioverlay.getEditedPolygon();	

   		var latlng = edited_polygon.latlng;
   		var min_length = 100000;
   		var res;
   		var threshold = 25;
   		var dist_to_cur_point = Math.NEGATIVE_INFINITY;
   		var dist_to_next_point = Math.NEGATIVE_INFINITY;
   		var point_res1;
   		var point_res2;

   		var point_idx;
   		var hole_idx;

   		var latlngs = [latlng];
   		var holes = edited_polygon.holes;

   		if(holes){

				for(var i=0; i<holes.length;i++){

					var hole = holes[i];
					latlngs.push(hole);
				}

		}


  for(var k=0; k<latlngs.length;k++){

      	   var cur_latlng = latlngs[k];

   	 
	   	 for(var i=0; i<cur_latlng.length;i++){

	   	 	var current = cur_latlng[i];
	   	 	var next;


	   	 	if(i==cur_latlng.length-1){
	   	 		next = cur_latlng[0];
	   	 	}

	   	 	else{
	 			next = cur_latlng[i+1];	
	   	 	}

	   	 	var projected_current = map.latLngToLayerPoint(current);
	   	 	var projected_next = map.latLngToLayerPoint(next);
	   	 	var projected_mouse = map.latLngToLayerPoint(current_mousepos);
	   	 
	   	 	var d = [projected_next.x-projected_current.x,projected_next.y-projected_current.y];
	   	 	var d2 = [projected_mouse.x-projected_current.x,projected_mouse.y-projected_current.y];


	   	 	var s1 = dot_product(d,d2);
	   	 	var s2 = dot_product(d,d);
	   	 	
	   	 	var t = s1/s2;

	   	 	if(t>=0 && t<=1){


		   	 	 var r =  [projected_next.x * t, projected_next.y * t];
		   	 	 var one_minus_t = 1-t;
		 	 	 var q =  [projected_current.x * one_minus_t, projected_current.y * one_minus_t];

		 	 	 var l = [r[0]+q[0],r[1]+q[1]];

		 	 	 var diff_to_mouse = [l[0]-projected_mouse.x,l[1]-projected_mouse.y];

		 	 	 var length =  Math.sqrt(dot_product(diff_to_mouse,diff_to_mouse));
	  			 
	  			 if(length<min_length){
	  			 	min_length=length;
	  			 	res = l;
	  		 		point_res1 =projected_current;
	  		 		point_res2 =projected_next;
	  		 		point_idx = i;
	  		 		if(k>0)hole_idx = k;
	  			 }	
	  		}

	   	 }

   	 }


   	 		if(!res)return;

		
   	 	    var a = [res[0]-point_res1.x,res[1]-point_res1.y];
   	 	    var b = [res[0]-point_res2.x,res[1]-point_res2.y];

   	 		var dist1 =  dot_product(a,a);
   	 		var dist2 =  dot_product(b,b);

   	 		var too_close = false;
   		    var dist_threshold=15;

   	 		if(dist1<dist_threshold || dist2<dist_threshold ){
   	 				too_close = true;
   	 		}


   	 res = map.layerPointToLatLng(res);


   	var hex_color = edited_polygon.fill_color.replace('0x','#');
   	var contrast_color = shadeColor(hex_color,-20);

    var canvas  = createMarkerImage(9, "", hex_color,contrast_color, "circle", false, 0, null, true);
	  var texture = PIXI.Texture.from(canvas, { width: canvas.width / 2, height: canvas.height / 2 });


	if(!too_close && min_length < threshold && !selectMarker){ 


		   	 		selectMarker = new pixioverlay.pixiMarker({
						latlng: res,
						zIndex: 1,
						texture: texture,
						interactive: true,
						alpha: 0.66,
						clickListener: function() {
							//the function to add points is added in map clicklistener 

						}
						});

		   	 		 selectMarker.res = res;
		   	 		 selectMarker.movable_marker=true;
		   	 		 selectMarker.pointIdx = point_idx;
		   	 		 selectMarker.holeIdx =  hole_idx;

		   }

		   else if(!too_close && min_length < threshold && selectMarker){

					var markerCoords = pixioverlay.project(res);
					selectMarker.x = markerCoords.x;
					selectMarker.y = markerCoords.y;
					selectMarker.pointIdx = point_idx;
	   	 		selectMarker.holeIdx =  hole_idx;
 			    selectMarker.res = res;


		   }

		   else{

		   	that.removeSelectMarker();

		   }


}


function addNewPointFromSelectMarker(pro_res,pointIdx,holeIdx){

	var edited_polygon = pixioverlay.getEditedPolygon();	
	pixioverlay.addSinglePolygonPoint(edited_polygon,pointIdx,holeIdx,pro_res);
	that.removeEditMarkers();
	addEditMarkers(edited_polygon);

}


function dot_product(vector1, vector2) {
  let result = 0;
  for (let i = 0; i < 2; i++) {
    result += vector1[i] * vector2[i];
  }
  return result;
}



jQuery(document).keydown(function(event) {


   	var edited_polygon = pixioverlay.getEditedPolygon();	

    if (event.ctrlKey && !ctrl && !dragging && edited_polygon){ 

		 	jQuery('body').addClass('ctrl');
	    	ctrl=true; 
	    	map.dragging.disable();
	    	pixioverlay.stop_drag_enable = true;
    }
});

jQuery(document).keyup(function(event) {


 if (event.keyCode==17 && ctrl && !dragging){
 	jQuery('body').removeClass('ctrl');
 	map.dragging.enable();

 	that.removeSelectMarker();
   	  pixioverlay.stop_drag_enable = false;
    ctrl=false;
    }


   if (event.keyCode==17){
		  map.dragging.enable();
   	 ctrl=false;
   }  


});

this.removeSelectMarker = function(){

 	if(selectMarker)pixioverlay.removeMarker(selectMarker);
    pixioverlay.renderMarkers();
    selectMarker = null;


}

this.destroy = function(){

jQuery(document).off('keydown');
jQuery(document).off('keyup');

that.removeEditMarkers();

	var edited_polygon = pixioverlay.getEditedPolygon();	
	pixioverlay.writeEditPolygonToMainBuffer(edited_polygon);

	for(var i=0; i<polygons.length;i++){
		    var polygon = polygons[i];
            polygon.clickListener = polygon.savedClickListener;
		 }


		//remove editing function

}


function newClickFunction(polygon){

	jQuery('.ctrlkey.edit_section').show();

	if(ctrl) return;
	if(blockpolyclick) return;

	if(new_mode || hole_mode){
		jQuery('.fast_exit').remove();
		new_mode = false;
		rect_mode=false;
		draw_rect=false;
		hole_mode =false;
	}


	var polygon = this;
	var edited_polygon = pixioverlay.getEditedPolygon();


	that.removeEditMarkers();
	addEditMarkers(polygon);

	if(polygon==edited_polygon) return;

	 pixioverlay.deleteSinglePolygon(polygon);
	 pixioverlay.completeDraw();
   pixioverlay.writePolygonToEditBuffer(polygon);



	var edited_polygon = pixioverlay.getEditedPolygon();

	addPolygonInfoToContainer(edited_polygon);
	jQuery('.new_polybutton.hole').show();
	

}


function addPolygonInfoToContainer(edited_polygon){

	var rgb = hexToRgb(edited_polygon.fill_color);
	jQuery('.poly_container').remove();
	var idx = edited_polygon.idx;
	var div = getPolyContainer(rgb,idx);

	var parent = controlDiv.find('.edit_info_div');
	parent.append(div);

	var pickerdiv = document.querySelector("#pickerdiv");
	var default_color = jQuery('.poly_hex_span').text();
	pickerdiv.value = default_color;
	pickerdiv.addEventListener("input", updateColorDiv, false);

	jQuery("#pickerdiv").on('click',function(e){
		e.stopPropagation();
	})

	if(jQuery('.polyslider').length>0)jQuery('.polyslider').remove();
	if(jQuery('.polybreak').length>0)jQuery('.polybreak').remove();


	var alpha_value = edited_polygon.alpha;

	var slider = jQuery('<div class="polyslider"><input id="polysliderinput" type="range" min="0" max="1" value="'+alpha_value+'" step="0.01"></div>');
	parent.append(slider);

	var polysliderinput = document.querySelector("#polysliderinput");
	polysliderinput.addEventListener("input", updateOpacity, false);

	polysliderinput.addEventListener("change", resetDrag, false);

	var polybreak = jQuery('<div class="polybreak"></div>');
	parent.append(polybreak);
}


function updateOpacity(e){

e.preventDefault();
e.stopPropagation();

map.dragging.disable();
	
pixioverlay.updatePolygonAlpha(e.target.value);


}

function resetDrag(e){

blockpolyclick = true;
setTimeout(function() {blockpolyclick=false}, 10);
map.dragging.enable();
}

function updateColorDiv(event) {

  const c = jQuery("#color_div");

  if (c.length>0) {
  	var color = event.target.value;
    c.css('background-color', color);
  	var contrast_color = shadeColor(color,-20);
    c.css('border-color', contrast_color);
    jQuery('.poly_hex_span').text(color);
    updatePolyColor(color);
  }
}


function updatePolyColor(color){


	var contrast_color = shadeColor(color,-20);

  var canvas  = createMarkerImage(9, "", color,contrast_color, "circle", false, 0, null, true);
	var texture = PIXI.Texture.from(canvas, { width: canvas.width / 2, height: canvas.height / 2 });

	for(var i=0; i<that.edit_markers.length;i++){
		 var edit_marker = that.edit_markers[i];
		 edit_marker.texture = texture;
	}

	var contrast_color_hex = contrast_color.replace("#", "0x");
 	var hex_color = color.replace("#", "0x");

	var edited_polygon = pixioverlay.getEditedPolygon();
	pixioverlay.updatePolygonColor(edited_polygon,hex_color,contrast_color_hex);


}

function shadeColor(color, percent) {

    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}


function getPolyContainer(rgb,idx){

	var div = jQuery('<div class="poly_container"></div>');
	var color_div = jQuery('<div id="color_div" class="poly_color"></div>');

	div.append(color_div);

	var pickerdiv = jQuery('<input id="pickerdiv" type="color"/>');

	color_div.append(pickerdiv);

	var hex = "#"+rgbToHex(rgb);

	color_div.css('background-color',hex);
	var contrast_color = shadeColor(hex,-20);
	color_div.css('border-color',contrast_color);

	var span = jQuery('<span class="poly_hex_span">'+hex+'</span>');
	var trash_icon = jQuery('<span class="poly_trash"><i class="fa fa-trash"></i></span>');
	div.append(span);
	
	var times_icon = jQuery('<span class="poly_trash times"><i class="fa fa-times"></i></span>');

	times_icon.on('click',function(e){
		e.stopPropagation();
		unselectPolygon();
	    jQuery('.poly_container').remove();
	    jQuery('.polyslider').remove();
      jQuery('.polybreak').remove();
      jQuery('.new_polybutton.hole').hide();
	})


	trash_icon.on('click',function(e){
		e.stopPropagation();
	  performSelectedPolyDelete();
	})

	div.append(times_icon);
	div.append(trash_icon);

	return div;

}


function performSelectedPolyDelete(){

		  deleteSelectedPolygon();
	    jQuery('.poly_container').remove();
	    jQuery('.polyslider').remove();
      jQuery('.polybreak').remove();
      jQuery('.new_polybutton.hole').hide();

}



	function createMarkerImage (size,label,color,contrast_color,form,outline_only,markingSize,markingcolor,active){

			  var rescaleFactor = 2;
				size*=rescaleFactor;

				var strokewidth = 3;
	
				var /** HTMLCanvasElement */ canvas = /** @type{HTMLCanvasElement} */ (document.createElement('canvas'));
				var context = canvas.getContext("2d");

				var add_for_marking = 0;

				if(markingSize==0){

				canvas.width = size;
				canvas.height = size;

				}

				else{
					add_for_marking = markingSize*4;
					canvas.width = size +add_for_marking;
					canvas.height = size +add_for_marking;
				}

				var centerX = canvas.width / 2;
				var centerY = canvas.height / 2;

	
			      if(!active){
			      	contrast_color ='rgba(120,120,120,1)';
			      	color = "rgba(220,220,220,1)";
			      }

	          context.beginPath();
   			    drawCircle(centerX,centerY,context,size,strokewidth);
   			    context.fillStyle = color;
      	  	context.fill();
			      context.lineWidth = strokewidth;
			      context.strokeStyle = contrast_color;
			      context.closePath();
			      context.stroke();

		
			      return canvas;
			};



	function drawCircle (centerX,centerY,context,size,strokewidth){

		 var radius = (size/2)- strokewidth/2;
    	 context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	}	


function unselectPolygon(){

	new_mode=false;
  rect_mode=false;
  draw_rect=false;
  hole_mode = false;

	var edited_polygon = pixioverlay.getEditedPolygon();
	  pixioverlay.writeEditPolygonToMainBuffer(edited_polygon);
    pixioverlay.setEditedPolygon(null);
    that.removeEditMarkers(); 
    jQuery('.polyslider').remove();

  	jQuery('.ctrlkey.edit_section').hide();
  	jQuery('.new_polybutton.hole').hide();
}


function deleteSelectedPolygon(){

		var edited_polygon = pixioverlay.getEditedPolygon();
		pixioverlay.deleteSinglePolygon(edited_polygon);
		pixioverlay.setEditedPolygon(null);
		pixioverlay.completeDraw();
		that.removeEditMarkers();

   	jQuery('.ctrlkey.edit_section').hide();

}



function addEditMarkers(polygon){

	var color_hex = polygon.fill_color.replace("0x", "#");
	var contrast_color = shadeColor(color_hex,-20);

  var canvas  = createMarkerImage(9, "", color_hex,contrast_color, "circle", false, 0, null, true);
	var texture = PIXI.Texture.from(canvas, { width: canvas.width / 2, height: canvas.height / 2 });

    that.edit_markers = [];

	var holes = polygon.holes;


	for(var i=0; i<holes.length;i++){
		var hole = holes[i];

		for(var j=0; j<hole.length;j++){

		  	 var latlngpoint = hole[j];
		  	 var latlng_p = [latlngpoint.lat, latlngpoint.lng];


				var marker = new pixioverlay.pixiMarker({
				latlng: latlng_p,
				zIndex: 1,
				texture: texture,
				interactive: true,
				alpha: 1.0,
				clickListener: function() {
					clickMarker(this, polygon);
					dragging=false;
				}
				});

			 marker.prevent_drag = true;
			 marker.movable_marker=true;

			 marker.pointIdx = j;
			 marker.holeIdx = i;



		 	    marker.on_drag = function(latlng){

	         	map.dragging.disable();

		    		var new_lat_lng = latlng;

			    	polygon.holes[this.holeIdx][this.pointIdx] = latlng;
			    	pixioverlay.updateSinglePolygonPoint(polygon,this.pointIdx,this.holeIdx);

		    		dragging=true;
	
			
		      }

      		 that.edit_markers.push(marker);

		}

	}


	var polylatlng = polygon.latlng;



	  for(var j=0; j<polylatlng.length;j++){

	  	 var latlngpoint = polylatlng[j];
	  	 var latlng_for_marker = [latlngpoint.lat, latlngpoint.lng];
			
				var marker = new pixioverlay.pixiMarker({
				latlng: latlng_for_marker,
				zIndex: 1,
				texture: texture,
				interactive: true,
				alpha: 1.0,
				clickListener: function() {
					dragging=false;
					clickMarker(this, polygon);
				}
				});

	    marker.prevent_drag = true;
	    marker.movable_marker=true;
	    marker.pointIdx = j;

	    marker.on_drag = function(latlng){

	    	map.dragging.disable();

    		var new_lat_lng = latlng;
   
	    	polygon.latlng[this.pointIdx] = latlng;
	    	pixioverlay.updateSinglePolygonPoint(polygon,this.pointIdx,null);

	    	dragging=true;
		
	    }

	    that.edit_markers.push(marker);

	  }



	pixioverlay.renderMarkers();







}


function appendControlDiv(div){

		var info_div = jQuery('<div class="edit_info_div"> <div class="edit_section">Click on polygon to edit</div> <div style="display:none;"  class="ctrlkey edit_section"> <span class="ctrl">CTRL</span> to add / delete points</div></div>');
		div.append(info_div);

		var button = jQuery('<div class="new_polybutton add_poly"><i class="fas fa-plus"></i> Add New Polygon</div>');
		div.find('.edit_info_div').append(button);

		var button_hole = jQuery('<div style="display:none;" class="new_polybutton hole"><i class="fas fa-plus"></i> Add Hole</div>');

		div.find('.edit_info_div').append(button_hole);

		button_hole.on('click',function(e){
			e.stopPropagation();

			if(hole_mode){
				 performFastExitHole();	 
			}
			else{
				 that.drawHole();
			}

	  

		})

		button.on('click',function(e){

					e.stopPropagation();

			if(new_mode) {
					performFastExit();
			}
			else{
				that.addNewPolygon();
			}


		})


		info_div.on('click',function(e){
			e.stopPropagation();
		})

}

this.drawHole = function(){

	if(hole_mode) return;

	hole_mode = true;
	rect_mode = true;
		jQuery('.polybreak').after('<div class="hole_msg">Drag a Rectangle to add a Hole</div>');

	var fast_exit =jQuery('<i class="fast_exit hole fa fa-times"></i>');
	jQuery('.new_polybutton.hole').append(fast_exit);

	//listeners defined in addnewpolygon below
}


this.addNewPolygon = function(){

	if(new_mode) return;

	if(hole_mode) {
		hole_mode=false;
		jQuery('.hole_msg').remove();
	}

	jQuery('.fast_exit.hole').remove();

	new_mode = true;

	jQuery('.polyslider').remove();
	jQuery('.poly_container').remove();
	jQuery('.polybreak').remove();
  jQuery('.new_polybutton.hole').hide();

	that.removeEditMarkers();
	that.removeSelectMarker();

	if(jQuery('.poly_container').length>0){
		jQuery('.poly_container').children().remove();
	}

	else{
		var div = jQuery('<div class="poly_container"></div>');
		controlDiv.find('.edit_info_div').append(div);
	}

	jQuery('.poly_container').text('Drag a Rectangle to add a Polygon');

	var fast_exit =jQuery('<i class="fast_exit fa fa-times"></i>');
	jQuery('.new_polybutton.add_poly').append(fast_exit);

	// fast_exit.on('click',function(e){
	//     e.stopPropagation();
	// 		performFastExit();
	// })

	var edited_polygon = pixioverlay.getEditedPolygon();
	pixioverlay.writeEditPolygonToMainBuffer(edited_polygon);

	rect_mode = true;

	map.on('mousedown', startDrawingRect);
	map.on('mouseup',stopDrawingRect);

}


function performFastExit(){

		  new_mode=false;
		  rect_mode=false;
		  draw_rect=false;
	    jQuery('.fast_exit').remove();
	    jQuery('.poly_container').remove();
      jQuery('.new_polybutton.hole').hide();
      map.dragging.enable();
	
}

function performFastExitHole(){
	hole_mode  = false;
  rect_mode=false;
  draw_rect=false;
  jQuery('.fast_exit.hole').remove();
	jQuery('.hole_msg').remove();
	map.dragging.enable();

}


function startDrawingRect(e){

		if(draw_rect) return;
		if(!rect_mode) return;


		if(selectBounds) selectBounds=null;

		draw_rect = true;
		map.dragging.disable();
		map.on('mousemove',dragRect)

		startpoint = e.latlng;


}



function stopDrawingRect(e){


	if(!draw_rect) return;
	if(!rect_mode) return;
	if(!selectBounds) return;

	draw_rect = false;

	map.dragging.enable();

	startpoint = null;
	 if(selectRect)selectRect.remove();

		rect_mode=false;


		if(new_mode && !hole_mode){

			jQuery('.fast_exit').remove();
			jQuery('.poly_container').remove();

			new_mode=false;

			var latlng_coords = getRectPoints();

				var fake_obj = {

					boundingBox:[selectBounds[0][1], selectBounds[0][0], selectBounds[1][1], selectBounds[1][0]],
					coordinates: latlng_coords,
					idx: "123456"+that.newPolyCount,
					type: "Polygon"
				}

				var polygon = new pixioverlay.pixiPolygon(
				latlng_coords,
				fake_obj,
				null,  					//in_obj.center,
			  1.5, 						//in_obj.line_width,
				"0x4287f5", //in_obj.fill_color,
				0.2, //in_obj.fill_alpha,
				"0x4287f5", //in_obj.stroke_color,
				1,
				null,
				true,
				null,
				"0x4287f5",
				0.75,
				"0x4287f5",
				4,
				newClickFunction,
				null,
				[]
		    );

    	   pixioverlay.completeDraw();

    	   polygon.clickListener();

    	   that.newPolyCount++;
   

		}


		if(hole_mode){


		   hole_mode=false;
		   var latlng_coords = getRectPoints();
		   var edited_polygon = pixioverlay.getEditedPolygon();

		  //CHECK IF HOLE IS VALID BEFORE ADD check if four points are in polygon

		   var check_count = 0;


		   for(var i=0; i<latlng_coords.length;i++){
		   		   var latlng = latlng_coords[i];
		   		   var point = [latlng.lat,latlng.lng];
		   		   if(inside(point,edited_polygon.latlng))check_count++;
		   }

		   if(check_count==4){

			    pixioverlay.addHoleToPolygon(edited_polygon,latlng_coords);
			    jQuery('.hole_msg').remove();
			  	edited_polygon.clickListener();
				  jQuery('.fast_exit.hole').remove();


			 }

			 else{

				hole_mode=false;
				rect_mode=false;
				draw_rect=false;
			  jQuery('.fast_exit.hole').remove();
	       jQuery('.hole_msg').remove();
			  //possible here show error msg
			 }

		}	

}


function getRectPoints(){


	var one = L.latLng(selectBounds[0][0],selectBounds[0][1]); //topleft
	var two = L.latLng(selectBounds[1][0],selectBounds[0][1]); //topright	
	var three = L.latLng(selectBounds[1][0],selectBounds[1][1]); //bottom right
	var four = L.latLng(selectBounds[0][0],selectBounds[1][1]); //bottom left

	var list = [four,three,two,one];

  return list;
}

function dragRect(e){

		if(!draw_rect) return;
		if(!rect_mode) return;

		var curpoint = e.latlng;

		var startpoint_c = map.latLngToContainerPoint(startpoint);
		var curpoint_c = map.latLngToContainerPoint(curpoint);

		var distance = startpoint_c.distanceTo(curpoint_c);	
		
			 if(selectRect)selectRect.remove();


			 if(distance < 5) {

				 	if(selectRect)selectRect.remove();
		 		 	if(selectBounds)selectBounds = null;
				 	return;

			 }

			selectBounds = [[startpoint.lat, startpoint.lng], [curpoint.lat, curpoint.lng]];
			selectRect = L.rectangle(selectBounds, {color: "#4287f5", weight: 1}).addTo(map);


}


this.removeEditMarkers = function(){


	for(var i=0; i<that.edit_markers.length;i++){
		 var edit_marker = that.edit_markers[i];
		 pixioverlay.removeMarker(edit_marker);
	}

		pixioverlay.renderMarkers();

}


function clickMarker(marker,polygon){

	var block = false;

	if(ctrl){

		//check if less than 3 points => remove polygon or hole

		var numpointsleft = polygon.latlng.length-1;

		if(marker.holeIdx!=undefined){
			numpointsleft = polygon.holes[marker.holeIdx].length-1;
		}


				if(numpointsleft>2){
					pixioverlay.removeSinglePolygonPoint(polygon,marker.pointIdx,marker.holeIdx);
				}

				else{

								if(marker.holeIdx!=undefined){
										pixioverlay.deleteSingleHole(polygon,marker.holeIdx);
								}

								else{
								 ctrl=false;
								 jQuery('body').removeClass('ctrl');
								 performSelectedPolyDelete();
								 block = true;
						  	 map.dragging.enable();
								}

				}


		that.removeEditMarkers();
		if(!block)addEditMarkers(polygon);
	}

	if(!ctrl){

			block_unselect = true;
			setTimeout(function() {
				block_unselect = false;
			}, 1);


	}
	
}

function rgbToHex(rgb) {

 var value = valueToHex(rgb[0]) + valueToHex(rgb[1]) + valueToHex(rgb[2]);

  return value;

}

function valueToHex(c) {
  var hex = c.toString(16).padStart(2, '0');
  return hex
}


function hexToRgb(hex) {
  var result = /^0x?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
   parseInt(result[1], 16),
   parseInt(result[2], 16),
   parseInt(result[3], 16)
   ]
}


 function inside(point, vs) {
	 
	    var x = point[0], y = point[1];

	    var inside = false;
	    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
	        var xi = vs[i].lat, yi = vs[i].lng;
	        var xj = vs[j].lat, yj = vs[j].lng;

	        var intersect = ((yi > y) != (yj > y))
	            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
	        if (intersect) inside = !inside;
	    }

	    return inside;
	};

}