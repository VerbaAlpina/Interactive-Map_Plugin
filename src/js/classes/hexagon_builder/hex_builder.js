/**
 * @fileoverview
 * 
 * @suppress{checkTypes}
 */




/**
 * Utility that helps creating hexagongird of polygongroup
 *
 * @constructor
 * 
 * @param {Object} options object of options for hexBuilder
 * 
 */

function hexgonBuilder(options){

  map.setOptions({keyboardShortcuts:false});

 var projection = options.map.getProjection();	
 var first_result = []; // result of fitting process may be adjusted by manual removements.
 var test_hex;
 var stroke_weight = 2;
 var selected_hexagons = [];
 var allow_exchange = false;
 var assigned_hexagons = {};
 var polygons_to_country = {};


 var dont_use_cdata = false;   //** SET TO TRUE FOR POLYGONS THAT HAVE COUNTRY RELATIONS"

 var global_offset = -4.5;

	//goal for Sprachgebiete = 7
	//0.9 == 7 // Sprachgebiete + Sprachgebiete

	//goal for NUTS-3 = 99
	//0.2937 ==99 // GOAL FOR NUTS3 + NUTS3

	//goal for gemeinde_grenzen = 5771

  //0.03304 == 5789  GEMEINDE + GEMEINDE;
	//0.0329708 == 5771 // GOAL FOR GEMEINDEN + ALPENKONVENTION.
	//0.033 == 5809 GEMEINDE + GEMEINDE
	//0.0331 == 5773 for GEMEINDE + GEMEINDE;  + 2 Manual Remove
  //0.03315 == 5746 for GEMEINDE + GEMEINDE; 
  //0.033115 == 5756 for GEMEINDE + GEMEINDE
  //0.0333 was size for final Gemeinde


  //*** 0.341  current NUTS SIZE for saved overlays***

  // save file to WKT WHEN "S" is pressed

  jQuery(document).on("keypress", function (e) {
     if(e.which==115){ // s key
         saveToWKT();
      }
    });

if(typeof options.polygongrp == 'object') {

 var size =0.09;  //in px (global map px not screen px)
 var width = size *2;
 var horizontal_step =  width *3/4;
 var vertical_step =  Math.sqrt(3)/2 *width;


var polygrp = {};

		var /** number */ numSub =  options.polygongrp.getNumSubElements();
			for(var j = 0; j < numSub; j++){
				var subowner =  options.polygongrp.getSubElement(j);
				for(var id in subowner.googleFeatures){
					polygrp[id] = subowner.googleFeatures[id];
			  }

			}

 var colors = getColorsByCountries(options.polygongrp);


  var gPolygons =[];
	var all_lats = [];
  var all_lngs = [];

  	//construct bounds of multipolygon

   var count = 0; 

    for (var id in polygrp){
      var gPolygon = getPolygonFromDataPolygon(polygrp[id].getGeometry());
      gPolygon['id']  = id;
      gPolygon['idx']  = count;  
			gPolygons.push(gPolygon);
      count++;
		}


		for (var key in gPolygons){

			var obj = gPolygons[key];

			obj.getPaths().forEach(function(path){

				path.getArray().forEach(function(LatLng){

						all_lats.push(LatLng.lat())
						all_lngs.push(LatLng.lng())
				})
			})


		}


  var lat_min = getMin(all_lats);
  var lat_max = getMax(all_lats);

  var lng_min = getMin(all_lngs);
  var lng_max = getMax(all_lngs);
 
  var bounds = [{lat:lat_max, lng:lng_min},{lat:lat_max, lng:lng_max},{lat:lat_min, lng:lng_max},{lat:lat_min, lng:lng_min}];

  var point_bounds = [ 
  projection.fromLatLngToPoint(new google.maps.LatLng(bounds[0])), 
  projection.fromLatLngToPoint(new google.maps.LatLng(bounds[1])), 
  projection.fromLatLngToPoint(new google.maps.LatLng(bounds[2])),
  projection.fromLatLngToPoint(new google.maps.LatLng(bounds[3])),
  ]

     var multipolygon_bounds = new google.maps.Polygon({
          paths: bounds,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: stroke_weight,
          fillColor: '#FF0000',
          fillOpacity: 0.35
        });
     // multipolygon_bounds.setMap(options.map);

        // GET BOUNDS AND DETERMINE NUM ROWS AND COLS THAT FIT IN


 		// get number of rows and columns

   if(options.alternate_build){

      console.log("ALTERNATE");

    var url = PATH["hexagonFolder"];
    var path = url+"/"+options.loaded_centers;

    jQuery.ajax({
        type: 'GET',
        url: path,
        success: function (data) {

      var center_data = JSON.parse(data);

      var ids_to_polys = {};
      var ids_to_countries = {};

     for(var i=0; i<gPolygons.length;i++){
       var id= gPolygons[i].id;
       ids_to_polys[id] = gPolygons[i];
      }

    for(var ckey in center_data){
      var countrygrp = center_data[ckey];
      for(var key in countrygrp){
         var point = parseGeoData(countrygrp[key]).get();
         ids_to_polys[key]['center'] = point;
         ids_to_countries[key] = ckey;
      }
    }
     
     addNeighboursToPolygons(gPolygons,"neighbours_60.txt","names_60.json",function (){

        // var manualstop = 0;
  
        // performAlternateMethod(gPolygons,ids_to_countries,manualstop);

         testAlternateMethod(gPolygons,ids_to_countries);




     // visuallyIterateHexagons(route,true);

     // testNeighbours(route,false);

  

     // console.log(gPolygons);

     });
    

        }

      })

   }

   else{


        var horiz_dist = getDistance(point_bounds[0],point_bounds[1]);
        var col_count = Math.ceil(horiz_dist / horizontal_step);

        var vert_dist = getDistance(point_bounds[0],point_bounds[3]);
        var row_count = Math.ceil(vert_dist / vertical_step);

        // centering the grid

        var endpoint_x = new google.maps.Point(point_bounds[0].x + ((col_count-1) * horizontal_step), point_bounds[0].y);
        var dist_x = getDistance(endpoint_x,point_bounds[1]) / 2;

        var endpoint_y = new google.maps.Point(point_bounds[0].x, point_bounds[0].y + ((row_count-1) * vertical_step));
        var dist_y = getDistance(endpoint_y,point_bounds[3]) / 2;


     
      	var startpoint = new google.maps.Point(point_bounds[0].x+dist_x, point_bounds[0].y+dist_y);



      	// BUILD GRID

      	var gridcount = row_count*col_count;
      	console.log("GRIDMARKERS:" + gridcount);

        var grid = buildGrid(row_count,col_count,startpoint,horizontal_step,vertical_step,size);  


// REMOVE POINTS THAT ARE OUT OF POLYGONS

var marker_count = 0;
console.log("Process:" + grid.length);


    for(var i=0; i<grid.length;i++){

      			for(var j=0; j<grid[i].length;j++){

      				if(grid[i][j]==null)continue;

      				var point = grid[i][j];
              var hex_points = calculatePolygonPoints(point.x,point.y,6,size);

              var break_k = false;

          for (var k=0;k<hex_points.length;k++){
      			   
             if(break_k)break;
               var mpoint = hex_points[k];

					  for (var l = 0; l<gPolygons.length;l++){

							var obj = gPolygons[l];

							if(google.maps.geometry.poly.containsLocation(mpoint, obj)){

									// var marker = new google.maps.Marker({
							  //         position: mpoint,
							  //         map: options.map,
							  //         title: 'Hello World!'
							  //       });
							
							       // method for manually removing polygons 

											var addRemoveListener = function(hexagon) {
											  google.maps.event.addListener(hexagon, 'click', function (event) {
   
                             first_result.splice(hexagon.idx, 1);

                                 for(var i=0; i<first_result.length;i++){

                                      var hex = first_result[i];
                                      hex.idx =i;
                                 }

                          hexagon.setMap(null);
                          console.log("CURRENT_POLYGONS: " +first_result.length);
											  });  
											}

									     var hexagon = new google.maps.Polygon({
									          paths: hex_points,
									          strokeColor: 'purple',
									          strokeOpacity: 0.8,
									          strokeWeight: stroke_weight,
									          fillColor: '#ff80ff',
									          fillOpacity: options.hex_opacity,
									          idx: marker_count
									        });
									        hexagon.setMap(options.map);

									        addRemoveListener(hexagon);

									        first_result.push(hexagon);
					        	            marker_count++;
                      break_k = true;          
							        break;
							}

				  	}

          }

      		}
      		console.log("process:" +i);
      	}

      	console.log("************");
      	console.log("real: " + marker_count);
      	console.log("target: " +options.target_number);

if(first_result.length>0) addEditMode();

}// standard build mode

} // BUILD MODE 


else{

//** EDIT OVERLAY MODE ** // 

var url = PATH["hexagonFolder"];

first_result = [];


jQuery.ajax({
    type: 'GET',
    url: url+"/"+options.polygongrp,
    success: function (data) {

        var loaded_geometry = parseGeoData(data);
        var cnt = 0;


   for(var key in loaded_geometry.getArray()){

          var poly = loaded_geometry.getArray()[key];

              var path = [];

                 for(var i=0;i<poly.getAt(0).getArray().length;i++){

                  var p = poly.getAt(0).getArray()[i];
                  path.push(p);

                 }


                  var addRemoveListener = function(hexagon) {
                        google.maps.event.addListener(hexagon, 'click', function (event) {
   
                             first_result.splice(hexagon.idx, 1);

                                 for(var i=0; i<first_result.length;i++){

                                      var hex = first_result[i];
                                      hex.idx =i;
                                 }

                          hexagon.setMap(null);
                          console.log("CURRENT_POLYGONS: " +first_result.length);
                        });  
                      }


                    var addExchangeListener = function(hexagon) {
                        google.maps.event.addListener(hexagon, 'click', function (event) {
                        if(selected_hexagons.length<2){

                              var samehex = false;
                              var id = hexagon.idx;

                            if(selected_hexagons.length==0){
                              hexagon.setOptions({strokeColor:"red",zIndex:1001})
                            }
                            if(selected_hexagons.length==1){
                              hexagon.setOptions({strokeColor:"green",zIndex:1001})
                              if(selected_hexagons[0].idx==id){
                                hexagon.setOptions({strokeColor:"white",zIndex:1000})
                                samehex=true;
                              }
                            }


                           if(!samehex)selected_hexagons.push(hexagon);
                           else selected_hexagons = [];

                           if(selected_hexagons.length==2)allow_exchange = true;
                           else allow_exchange = false;

                         } 

                         else{

                          for(var i=0;i<selected_hexagons.length;i++){
                            var hex_id = selected_hexagons[i].idx;

                              if(hex_id==hexagon.idx){
                                selected_hexagons.splice(i,1);
                                hexagon.setOptions({strokeColor:"white",zIndex:1000})
                              }

                              selected_hexagons[0].setOptions({strokeColor:"red",zIndex:1001});

                          }

                          if(selected_hexagons.length==2)allow_exchange = true;
                          else allow_exchange = false;



                         }

                 
                        });  
                      }



                  var addSelectListener = function(hexagon) {
                        google.maps.event.addListener(hexagon, 'click', function (event) {

                              var hexfound = false;
                                  for(var i=0;i<selected_hexagons.length;i++){
                                       if(hexagon.idx==selected_hexagons[i].idx){
                                        selected_hexagons.splice(i,1); 
                                        hexagon.setOptions({strokeColor:"white",zIndex:1000})
                                        hexfound = true;
                                       }
                                    }
                                  
                                  if(!hexfound){
                                     selected_hexagons.push(hexagon);
                                     hexagon.setOptions({strokeColor:"red",zIndex:1001});
                                  }
                                
                        });  
                      }


               
             var hexagon = new google.maps.Polygon({
                  paths: path,
                  strokeColor: 'purple',
                  strokeOpacity: 0.8,
                  strokeWeight: stroke_weight,
                  fillColor: '#ff80ff',
                  fillOpacity: options.hex_opacity,
                  idx: cnt,
                  zIndex: 1000
                });
                hexagon.setMap(options.map);

              if(typeof options.reference_polygons != "string") addRemoveListener(hexagon);
              else {

               if(!options.manualcountrymode){ 
                     addExchangeListener(hexagon);
               }
               else{
                addSelectListener(hexagon);
               }

              }


             first_result.push(hexagon);
             cnt++;
    }   

    first_result = sortFirstResult(first_result);

 

    if(typeof options.reference_polygons == "string"){referencePolygons();    
      if(!options.manualcountrymode)addExchangeKeyPress();
    }
    else {addEditMode(); addNudgeMode();}

   


    }//success
});


}


var test_array = [];

function performAlternateMethod(gPolygons,ids_to_countries,manualstop){

     //   for(var i=0; i<gPolygons.length;i++){
     //  gPolygons[i]['neighbours'] = sortNeighboursByTopLeft(gPolygons[i]['neighbours']);
     // }


    var min_lat = Number.POSITIVE_INFINITY;
    var startpolygon = null;
    var number_of_polygons = gPolygons.length;

     for(var i=0; i<gPolygons.length;i++){
      var poly = gPolygons[i];

         poly.getPaths().forEach(function(path){
              var array = path.getArray();
              for(var k=0;k<array.length;k++){
                var lat = array[k].lat();
                if(lat<min_lat){min_lat = lat; startpolygon = poly;}
              } 
          }) 

       }


      var country = ids_to_countries[startpolygon.id];
      var startcolor = colors[country];
      var start_point = projection.fromLatLngToPoint(startpolygon.center);

     var start_hex = addHexagonToMap(start_point,'purple',startcolor,global_offset);

     start_hex.setMap(options.map);
     first_result.push(start_hex);   



      var used_polygons = {};
      used_polygons[startpolygon.id] = true;


      var used_hexagons = {};
      var identifier = start_point.x.toFixed(3).toString()+start_point.y.toFixed(3).toString();  


      startpolygon['hexagon'] = {center: projection.fromLatLngToPoint(startpolygon['center']),polygon:startpolygon,identifier:identifier}; 

      used_hexagons[identifier] = startpolygon['hexagon'];

      var current_polygons = [startpolygon];     



  var whilecount = 0;

     while(first_result.length<number_of_polygons){

        console.log("++++++++++++++++");

    var all_possible_hexagons = {}; 

   
    for(var i=0; i<current_polygons.length;i++){



        var hex_candidates = {};

             var current_poly = current_polygons[i];
             var country = ids_to_countries[current_poly.id];
             var color = colors[country];



            var hex = current_poly['hexagon'];

         var all_neighbours  =  getHexNeighbours(hex['center'],size,vertical_step,horizontal_step);
         var count = 0;  
         for(var j=0; j<all_neighbours.length;j++){ 

                 var cur_center = all_neighbours[j];
                var identifier = cur_center.x.toFixed(3).toString() + cur_center.y.toFixed(3).toString();
                if(used_hexagons[identifier]==null){
                   var candidate = {center:cur_center,identifier:identifier,color:color,"relatedPolygons":[current_poly]};
          
                   if(all_possible_hexagons[identifier]==null)all_possible_hexagons[identifier] = candidate;
                   else {
                    candidate = all_possible_hexagons[identifier];
                    all_possible_hexagons[identifier]['relatedPolygons'].push(current_poly);
                   }

                   hex_candidates[count] = candidate;
                }
             count ++;

         } 

         current_poly['hex_candidates'] = hex_candidates;

       }

        for (var j=0; j<test_array.length;j++){
          var hex = test_array[j];
            if(hex!=null)hex.setMap(null);
  
        }

        test_array = [];


       for(var key in all_possible_hexagons){

        var hex_c = all_possible_hexagons[key];
        var hexagon = addHexagonToMap(hex_c.center,'red','transparent',global_offset);
        test_array.push(hexagon);
       }

 

          for(var i=0; i<current_polygons.length;i++){

                    var current_poly = current_polygons[i];
                    var neighbours = current_poly['neighbours'];
                    var hex_candidates = current_poly['hex_candidates'];

                    for(var j=0; j<neighbours.length;j++){
                            var neighbour = neighbours[j];

                            //           var marker = new google.maps.Marker({
                            //   position: neighbour.center,
                            //   map: options.map,
                            //   title: 'Hello World!'
                            // });
                            
                            var id = neighbour.id;
                            if(used_polygons[neighbour.id]==null && current_polygons.indexOf(neighbour)==-1){

                           
                                       var best_hex = getBestHexByAngle(current_poly,neighbour,false);
                                       // var best_hex_by_share = getBestHexByNeighbourhood(current_poly,current_polygons,neighbour,best_hex);


                                       // if(best_hex_by_share!=null){
                                       //      if(best_hex!==best_hex_by_share) best_hex = best_hex_by_share;               
                                       //  }
                              


                                           if(best_hex==null){
                                                  // var polyangle =  getBestHexByAngle(current_poly,neighbour,true);
                                                  // var position = getPositionByAngle(polyangle);
                                                  // var best_hex_idx = dealWithConflict(position,polyangle,hex_candidates);
                                                  // var best_hex = hex_candidates[best_hex_idx];
                                                  
                                            } //optimal hexagon already in use


                                          
                                           if(best_hex!=null){ 

                                              neighbour['proposal_origin'] = current_poly;

                                             if(best_hex['wants_to_be_used_by'] == null){
                                              best_hex['wants_to_be_used_by'] = [neighbour];
                                 
                                              var obj = new Object();
                                              var arr = [obj];
                                              obj[current_poly.id] = neighbour;
                                              best_hex['assignment_map'] = arr;
                                            }
                                             else {
                                              best_hex['wants_to_be_used_by'].push(neighbour);

                                              var obj = new Object();
                                              obj[current_poly.id] = neighbour;
                                              best_hex['assignment_map'].push(obj)
                                            }

                                            
                                            //assignment_map; polygon_x says i want to use this hexagon (best_hex) for this one of my neighbours

                                             
                                              
                                                        
                                        }

                                        else{
                                            // even second best hex already in use;
                                            // console.log("SECOND BEST IN USE");
                                        }
                                           

                            }

                          
                    }
          }

      






      if(whilecount>=manualstop){
          break;
        }


        var next_polygons = [];


        for(var key in all_possible_hexagons){
            var hex = all_possible_hexagons[key];
            var use_list = hex['wants_to_be_used_by'];

           if(use_list!=null){

              use_list = removeDoublesFromClearCases(use_list,polygon,all_possible_hexagons);  // best case: one hex = one polygon // polygon is ONLY assigned to this hex and to no other
              
              var test = false;
       
              if(use_list.length==1){  

                    var polygon = use_list[0];
                    removePolygonfromOtherListsIfAssignmentClear(polygon,all_possible_hexagons,use_list);

                    var multi_assignment = checkIfPolygonOccuresInOtherLists(all_possible_hexagons,use_list,polygon);
                         
                    if(multi_assignment){
                       console.log("RARE CASE");
                    }
                    else{

                      assignHexagonToPolygon(hex,polygon,ids_to_countries,used_hexagons);
                      addPolygonToNextPolygons(next_polygons,polygon);
                       
                      
                    }
              }

              else{


               var polygon = getBestCandidateByDistance(use_list);
               assignHexagonToPolygon(hex,polygon,ids_to_countries,used_hexagons);
               addPolygonToNextPolygons(next_polygons,polygon);

          
              }




           }



        }

      console.log(all_possible_hexagons);

        
         // var next_polygons = [];
         // for(var i=0; i<current_polygons.length;i++){

      
         //      var current_poly = current_polygons[i];
         //      var country = ids_to_countries[current_poly.id];
         //      var color = colors[country];

         //      var hex_candidates = current_poly['hex_candidates'];
         //      var neighbours = current_poly['neighbours'];

         //       for(var j=0;j<neighbours.length;j++){
         //            var neighbour = neighbours[j];

         //             if(used_polygons[neighbour.id]==null){

                      
         //              var polycenter = projection.fromLatLngToPoint(current_poly.center);
         //              var neighbourcenter = projection.fromLatLngToPoint(neighbour.center);
  
         //               var polyangle = getAngle(polycenter,neighbourcenter);
         //               var position = getPositionByAngle(polyangle);
         //               var best_hex_idx = getNeighbourByPosition(position);
         //               var best_hex = hex_candidates[best_hex_idx];


            
                          

         //               if(best_hex==null){

         //                var new_position = dealWithConflict(position,polyangle,hex_candidates);
         //                if(new_position!="no_solution_found"){
         //                     best_hex_idx = getNeighbourByPosition(new_position);
         //                     best_hex = hex_candidates[best_hex_idx];
         //                }
                             
         //               }

         //                if(best_hex!=null){

         //                    var hexagon = addHexagonToMap(best_hex.center,'purple',color);
         //                    first_result.push(hexagon);
         //                    used_hexagons[best_hex.identifier] = best_hex;
         //                   neighbour['hexagon'] = best_hex;

          
         //               }



         //               else{

         //                  if(Object.keys(hex_candidates).length>0){
         //                     var firsthexkey = Object.keys(hex_candidates)[0];
         //                     var random_hex = hex_candidates[firsthexkey];
         //                     best_hex = random_hex;

         //                      var hexagon = addHexagonToMap(best_hex.center,'purple',color);
                              
         //                       first_result.push(hexagon);

         //                       used_hexagons[best_hex.identifier] = best_hex;
         //                       neighbour['hexagon'] = best_hex;

         //                  }

         //                  else{

         //                    console.log("NO HEXAGONS AVAILABLE");
         //                  }
                        
         //               }


                       

         //               next_polygons.push(neighbour);  
         //               used_polygons[neighbour.id] = true;


         //              }

         //       }
         // }

           for(var i=0; i<current_polygons.length;i++){
               used_polygons[current_polygons[i].id] = true;
           }

         current_polygons = next_polygons; 


         whilecount++;
  
     }

  };


  function getBestCandidateByDistance(_in){

    var min_dist = Number.POSITIVE_INFINITY;
    var best_candidate = null;

    for(var i=0; i<_in.length;i++){

      var c_center = projection.fromLatLngToPoint(_in[i]['center']);
      var origin_center = projection.fromLatLngToPoint(_in[i]['proposal_origin']['center']);
      var dist = getDistance(origin_center,c_center); 
      if(dist<min_dist){
        min_dist = dist;
        best_candidate =  _in[i];
      }

    }

    return best_candidate;

  }


  function checkIfAssignmentMapHasUniformOrigin(assignment_map, current_polygons){

    var res = true;
    var firstkey = Object.keys(assignment_map[0])[0];

     for(var i=1;i<assignment_map.length;i++){
          var obj = assignment_map[i];
          var key = Object.keys(obj)[0];

          if(key!=firstkey){
            res = false;
            break;
          }

    }

    if(res){

      res = {};

      for(var i=0; i<current_polygons.length;i++){
           var cp = current_polygons[i];
           if(cp['id']==firstkey) {
             res['origin'] = cp;
             res['candidates'] = []; 
             break;
           }   
      }

          for(var i=0;i<assignment_map.length;i++){
              var obj = assignment_map[i];
              var key = Object.keys(obj)[0];
              var candidate = obj[key];
              res['candidates'].push(candidate);
          }

    }

    return res;

  }


  function addPolygonToNextPolygons(next_polygons,polygon){

          var already_in = false;  
          for(var k=0;k<next_polygons.length;k++){
          if(next_polygons[k].id==polygon.id)already_in=true;
          }        
          if(!already_in)next_polygons.push(polygon); 
  }


  function getBestHexByNeighbourhood(current_poly,current_polygons,neighbour,best_hex){


    var sharing_polys = []; //other current polygons that share the same current neighbour (param)

    for(var i=0; i<current_polygons.length;i++){
      var other_poly = current_polygons[i];
      if(other_poly!==current_poly){
          var neighbours = other_poly['neighbours'];
          for(var j=0;j<neighbours.length;j++){
              if(neighbours[j]===neighbour)sharing_polys.push(other_poly);
          }
      }
    }
   
  var current_hex_candidates = current_poly['hex_candidates'];

  var sharing_hex_candidates = [];

  for(var i=0; i<sharing_polys.length;i++){
 
    var other_hex_candidates = sharing_polys[i]['hex_candidates'];
    for(var key in current_hex_candidates){

      var hex_candidate= current_hex_candidates[key];

      for(var o_key in other_hex_candidates){
        var other_candidate = other_hex_candidates[o_key];
        if(other_candidate===hex_candidate)sharing_hex_candidates.push(hex_candidate);
      }

    }
  }

   for(var j=0; j<sharing_hex_candidates;j++){
     if(sharing_hex_candidates[j]===best_hex)sharing_hex_candidates.splice(j,1);
   }

    return sharing_hex_candidates[0];  // find method to determine best shared hex count should be the thing

  }


  function getBestHexByAngle(current_poly,neighbour,get_only_angle){

    var polycenter = projection.fromLatLngToPoint(current_poly.center);
    var neighbourcenter = projection.fromLatLngToPoint(neighbour.center);
    var polyangle = getAngle(polycenter,neighbourcenter);
    var position = getPositionByAngle(polyangle);
    var best_hex_idx = getNeighbourByPosition(position);
    var best_hex = current_poly['hex_candidates'][best_hex_idx];
  
  if(!get_only_angle)return best_hex;
  else return polyangle;

}


function getPositionForNewHexByAngle(origin,candidate){
    var origincenter = projection.fromLatLngToPoint(origin.center);
    var candidatecenter = projection.fromLatLngToPoint(candidate.center);
    var polyangle = getAngle(origincenter,candidatecenter);
    var position = getPositionByAngle(polyangle);
    return position;
}


  function removePolygonfromOtherListsIfAssignmentClear(polygon,all_possible_hexagons,use_list){

    // remove a Polygon that already can be clearly assigned to one Hexagon for all other lists 
    // that contain other Polygons than itsself. 


      var pid = polygon.id;

       for(var key in all_possible_hexagons){
             var hex = all_possible_hexagons[key];

             if(hex['wants_to_be_used_by']!=null){

              var other_use_list = hex['wants_to_be_used_by'];

               if(other_use_list.length>1){

                 var check = checkifListContainsOtherEntries(other_use_list)

                 if(check){

                     for(var i=0;i<other_use_list.length;i++){
                      var id = other_use_list[i].id;
                        if(id==pid){
                          other_use_list.splice(i,1);
                        }

                    }

                 }

                  else{

                      // case polygon occures in other use_list more than once with no other 

                 }

              }

          }
       }

  };


  function checkifListContainsOtherEntries(list){

    var res = false;
    for(var i=0;i<list.length;i++){
       if(list[i]!==list[0]){
        res = true;
        break;
       }
    }
    return res;
  }

  function checkOccurencesInList(list,entry){
    var res = 0;
    for(var i=0;i<list.length;i++){
       if(list[i]==entry){
        res ++;
       }
    }
    return res;
  }


  function checkIfPolygonOccuresInOtherLists(all_possible_hexagons,use_list,proposal){

    var res = false;

       for(var key in all_possible_hexagons){
              var hex = all_possible_hexagons[key];

               if(hex['wants_to_be_used_by']!=null){
                 var other_use_list = hex['wants_to_be_used_by'];

                 if(other_use_list!==use_list){
                     
                  if(other_use_list.indexOf(proposal)!=-1){
                    res = true;
                    break;
                  }

                 }

                }
         } 
  }


  function removeDoublesFromClearCases(use_list,all_possible_hexagons){

   //if one hex is assigned for one polygon by multiple Polygons rm all assignements except one => lenght = 1
   // will remove duplicate entries from a use_list
   // but only if the proposed polygon will not occur in any other use list 
   // if poly occures in other list the other list needs to be checked. If the count of occurence in own list is greater than other list
   // remove all occurences from other list and remain with own. If the count in other list is greater remove all occurances from own list

       var sameid= true;
       var proposal = use_list[0];
       var first_check = checkifListContainsOtherEntries(use_list);     

       if(!first_check) {

          var second_check = checkIfPolygonOccuresInOtherLists(all_possible_hexagons,use_list,proposal)
           if(!second_check){
                 use_list.splice(1);
           }
    
       }
  
     return use_list;
  };


  function removePolygonsBasedOnLength(all_possible_hexagons){

    var longest_uniform_use_list;
    var max = Number.NEGATIVE_INFINITY;

       for(var key in all_possible_hexagons){
              var hex = all_possible_hexagons[key];

               if(hex['wants_to_be_used_by']!=null){ 

                var use_list = hex['wants_to_be_used_by'];
                if(!checkifListContainsOtherEntries(use_list)){
                    if(use_list.length>max){
                      max = use_list.length;
                      longest_uniform_use_list = use_list;
                    }
                }

               }
        }

        console.log(longest_uniform_use_list);

     //   for(var key in all_possible_hexagons){
     //          var hex = all_possible_hexagons[key];

     //           if(hex['wants_to_be_used_by']!=null){
     //             var other_use_list = hex['wants_to_be_used_by'];

     //             if(other_use_list!==longest_uniform_use_list){
                    
     //                 var first_check = checkifListContainsOtherEntries(other_use_list);  
     //                   if(!first_check){
     //                      other_use_list=[];                     
     //                   }  
     //               }

     //            }
     //     } 

     // longest_uniform_use_list.splice(1);    
  }


  function assignHexagonToPolygon(hex,polygon,ids_to_countries,used_hexagons){

          var country = ids_to_countries[polygon.id];
          var color = colors[country];

          var hexagon = addHexagonToMap(hex.center,'purple',color,global_offset);
          first_result.push(hexagon);
          used_hexagons[hex.identifier] = hex;
          polygon['hexagon'] = hex;


    hexagon.addListener('click', function() {

    var infoWindow = new google.maps.InfoWindow();  
    infoWindow.setContent("ID : " + polygon.id + " Name: " + polygon['loc_name']);
    var pos = new google.maps.Point(hex.center.x+global_offset,hex.center.y);
    infoWindow.setPosition(projection.fromPointToLatLng(pos));     
    infoWindow.open(options.map);

    });



};


function testAlternateMethod(gPolygons,ids_to_countries){
 
  var i = -1;       

          jQuery(document).on("keydown", function (e) {

              for(var j=0;j<first_result.length;j++){
                  var hex = first_result[j];
                   hex.setMap(null); 
              }

              first_result = [];


              if(e.which == 37){i--} //left
              if(e.which == 39){i++} // right
               if(i<-1) i=-1;

              performAlternateMethod(gPolygons,ids_to_countries,i);
          })

}

function addNeighboursToPolygons(gPolygons,neighbours,names,callback){

   if(typeof callback == "function"){


    var url = PATH["hexagonFolder"];
    var path = url+"/"+neighbours;

    jQuery.ajax({
        type: 'GET',
        url: path,
        success: function (data) {


       var url = PATH["hexagonFolder"];
       var path = url+"/"+names;


        jQuery.ajax({
        type: 'GET',
        url: path,
        success: function (n_data) { 

        var gPolygonsbyIdx = {};

         for(var i=0; i<gPolygons.length;i++){
          var poly = gPolygons[i];
          gPolygonsbyIdx[poly['id']] = poly;
         }


         var neighbourslist = JSON.parse(data);

         var names_list = {};

         for(var key in n_data){
          var obj = n_data[key];
          names_list[obj['ID_Ort']] = obj['NAME'];
         }

         for(var i=0; i<gPolygons.length;i++){
            var poly = gPolygons[i];
            poly['neighbours'] = [];
            var neighbourids = neighbourslist[poly['id']];

            for(var j=0; j<neighbourids.length;j++){
               var id = neighbourids[j];
               poly['neighbours'].push(gPolygonsbyIdx[id]);
            }

            poly['loc_name'] = names_list[poly['id']];

          } 

           callback();

           }

         })

        }


      })


    }

 else{

 for(var i=0; i<gPolygons.length;i++){

      var poly = gPolygons[i];

      if( poly['neighbours']==null)poly['neighbours'] = [];
    

         poly.getPaths().forEach(function(path){

              var array = path.getArray();

              for(var k=0;k<array.length;k++){
               
               var kpoint =  projection.fromLatLngToPoint(array[k]);

                for(var j=0; j<gPolygons.length;j++){

                  var jpoly = gPolygons[j];
                  var already_checked = false;

                    if(poly['neighbours'].length>0){
                     if(poly['neighbours'].indexOf(jpoly)!=-1){
                      already_checked = true;
                     }
                    }

                  var distance = getDistance(projection.fromLatLngToPoint(jpoly.center), projection.fromLatLngToPoint(poly.center)); 

                  if(distance<1.5){

                  if(jpoly['idx']!=poly['idx'] && !already_checked){

                   jpoly.getPaths().forEach(function(jpath){

                      var jarray = jpath.getArray();

                        for(var l=0;l<jarray.length;l++){

                              var lpoint =  projection.fromLatLngToPoint(jarray[l]);

                            if(getDistance(kpoint, lpoint)<0.0001){
                                if( poly['neighbours'].indexOf(jpoly)==-1){
                                      poly['neighbours'].push(jpoly);

                                  if(jpoly['neighbours']==null)jpoly['neighbours'] = [];    
                                   if(jpoly['neighbours'].indexOf(poly)==-1){
                                         jpoly['neighbours'].push(poly);
                                     }

                                 break;
                                }

                            }

                        
                            }

                        })


                   } // if idx

                  }

                }

             
             }


           })
          
     }    

   }
}



function addNudgeMode(){

 jQuery(document).on("keydown", function (e) {

  var nudge_x = 0;
  var nudge_y = 0;
  var nudefactor = 0.01

  if(e.which == 37){nudge_x = -nudefactor} //left
  if(e.which == 39){nudge_x =  nudefactor} // right
  if(e.which == 38){nudge_y = nudefactor} //up
  if(e.which == 40){nudge_y = -nudefactor} // down 

   if(e.which>36 && e.which<41){

    for(var i=0; i<first_result.length;i++){

        var hex = first_result[i];

        var new_path = [];

             hex.getPaths().forEach(function(path){
             path.getArray().forEach(function(LatLng){

             var new_lat_lng = new google.maps.LatLng({lat: LatLng.lat()+nudge_y, lng: LatLng.lng()+nudge_x}); 
             new_path.push(new_lat_lng);
             })


           })

          hex.setPath(new_path);   
      } 


    }

 })

}

function addExchangeKeyPress(){

    jQuery(document).on("keypress", function (e) {

      if(allow_exchange){
        if(e.which==120){  // x key
          var firstid = selected_hexagons[0].idx;
          var secondid = selected_hexagons[1].idx;
          var firstpolyid = assigned_hexagons[firstid];
          var secondpolyid = assigned_hexagons[secondid];

          var color_1 = selected_hexagons[0].get('fillColor');
          var color_2 = selected_hexagons[1].get('fillColor');
          selected_hexagons[0].setOptions({fillColor:color_2,strokeColor:"white",zIndex:1000});   
          selected_hexagons[1].setOptions({fillColor:color_1,strokeColor:"white",zIndex:1000}); 

          assigned_hexagons[firstid] = secondpolyid;
          assigned_hexagons[secondid] = firstpolyid;

          selected_hexagons = [];
                 
           }

        }

     });

}


function referencePolygons(){



var url = PATH["hexagonFolder"];
var path = url+"/"+options.reference_polygons;
var path2 =  url+"/country_bounds.txt"

jQuery.ajax({
    type: 'GET',
    url: path,
    success: function (data) {

      var geodata = JSON.parse(data);
      var owner = options.legend_element;


    jQuery.ajax({
        type: 'GET',
        url: path2,
        success: function (cdata) { 


            var country_data = JSON.parse(cdata);
            
            for(var key in country_data){
            var wkt = country_data[key];
            var parsedpoly = parseGeoData(wkt);
            country_data[key] = parsedpoly;

            }


            var colors = getColorsByCountries(owner);

         
            var original_keys = [];

            for(var key in geodata){
              original_keys.push(key);
            }

            polygons_to_country = createPolygonsToCountry(original_keys,geodata);


            assigned_hexagons = performHungarianMethod(original_keys,geodata,country_data,colors);
            // assigned_hexagons = performColumnMethod(geodata,colors,original_keys);
            //assigned_hexagons = performPathMethod(geodata,country_data,colors);
           // assigned_hexagons = perfromSimpleMethod(geodata,colors);
           //performPseudoMethod(original_keys,geodata,country_data,colors);



            // reassign countrys after manual correct with  "f";

          jQuery(document).on("keypress", function (e) {
             if(e.which==102){
                reAssignHexagonsByCountry(original_keys,geodata,colors);
              }
            });

            


           // write assignment list to console on keypress "e";

          jQuery(document).on("keypress", function (e) {
             if(e.which==101){

              var res_string = "";

                for(var key in assigned_hexagons){
                  res_string+=key;
                  res_string+=":";
                  res_string+=assigned_hexagons[key];
                  res_string+="\n";
                }
                    console.log(res_string);
              }
            });



         } //succ 2 

      })
   

      } //succ 1

    })



}


function createPolygonsToCountry(original_keys, geodata){

var result = {};

  for(var j=0; j<original_keys.length; j++){

             var key = original_keys[j];
             var grp = geodata[key];
              for(var id in grp){ 
                result[id] = key;
             }


          }
return result;
}


function reAssignHexagonsByCountry(original_keys,geodata,colors){


 var assignments_by_countries = getAssignementsByCountry(assigned_hexagons,polygons_to_country);

          var polyids_to_points = {};
          for(var j=0; j<original_keys.length; j++){
                var key = original_keys[j];
                var grp = geodata[key];
                 for(var id in grp){ 
                  var point =  projection.fromLatLngToPoint(parseGeoData(grp[id]).get());
                  polyids_to_points[id] = point;
              } 
          }



         for(var key in assignments_by_countries){

              var assignments = assignments_by_countries[key];
              var matrix = [];
              var original_values = [];

              for(var i=0;i<assignments.length;i++){

                  var hex = first_result[Object.keys(assignments[i])[0]];
                  var hex_center = getHexCenter(hex);
                  var mat_column = [];

                      for(var j=0;j<assignments.length;j++){

                          var key = Object.keys(assignments[j])[0];
                          var val = assignments[j][key];
                          var point = polyids_to_points[val];
                          var dist = getDistance(hex_center,point);
                          mat_column.push(dist);

                      }

                  matrix.push(mat_column);
                  original_values.push(assignments[i][Object.keys(assignments[i])[0]]);

              }

           var m = new Munkres();
           var indices = m.compute(matrix);

           for(var k=0;k<indices.length;k++){
                var pair = indices[k];
                var targetval = original_values[pair[1]];
                var obj = assignments[k];
                var objkey =  Object.keys(obj)[0];
                obj[objkey] = targetval;

           }

     }


     for(var key in assignments_by_countries){

      var assignments = assignments_by_countries[key];

      for(var j=0;j<assignments.length;j++){

      var obj = assignments[j];
      var objkey = Object.keys(obj)[0];
      var val = obj[objkey];
      assigned_hexagons[objkey] = val;

      }

     }


     checkAssignedPolygons(assigned_hexagons,colors);

     console.log("REASSIGNMENT DONE!");
     console.log(assigned_hexagons);
}


function getAssignementsByCountry(assigned_hexagons,polygons_to_country){


       var assignments_by_countries = {};

          for(var idx in assigned_hexagons){

          var polyid = assigned_hexagons[idx];
          var countrykey = polygons_to_country[polyid];

            var obj = new Object();
            obj[idx] = polyid;

            if(assignments_by_countries[countrykey]==null)assignments_by_countries[countrykey]=[obj];
            else assignments_by_countries[countrykey].push(obj);

                      
        }

return assignments_by_countries;
}


function perfromSimpleMethod(geodata,colors){



             var sorted_keys = ['svn','lie','ita','mco','deu','aut','che','fra'];
             var assigned_hexagons = {};

            // var sorted_keys = ['mco','lie','deu','fra','aut','che','svn','ita'];  // for gemeinden

             for(var i=0; i<sorted_keys.length; i++){

                 var key = sorted_keys[i];
                 var grp = geodata[key];
                 var color = colors[key];
                  for(var id in grp){
                     var point = projection.fromLatLngToPoint(parseGeoData(grp[id]).get());
                     var min_dist = Number.POSITIVE_INFINITY;
                     var closest_hex = null;


                        for(var j=0; j<first_result.length;j++){

                                          var hex = first_result[j];

                                            if(assigned_hexagons[hex.idx]==null){

                                            var center = getHexCenter(hex);
                                            var dist = getDistance(point,center);
                                            if(dist<min_dist){
                                                min_dist=dist
                                                closest_hex = hex;
                                            }

                                          }

                         }
                     
                          closest_hex.setOptions({fillColor:color,strokeColor:"white",strokeOpacity:1.0,fillOpacity:1.0});   
                          assigned_hexagons[closest_hex.idx] =id; 

                  }

               } 


}


function performPseudoMethod(original_keys,geodata,country_data,colors){


  var pseudo_assigned_hexagons = {};

  if(options.reloadresultincountrymode==null){

  var gpolys = {}; 
  var first_spare_hexagons = [];
  
  for(var key in country_data){
    gpolys[key] = getPolygonFromDataPolygon(country_data[key]);
    pseudo_assigned_hexagons[key] = [];
  }

      for(var i=0; i<first_result.length;i++){
        console.log(i);
        var hex = first_result[i];
        var center = projection.fromPointToLatLng(getHexCenter(hex));
        var unassigned = true;

            for(var key in gpolys){
              var gpoly  = gpolys[key];
              var color = colors[key];
                if(google.maps.geometry.poly.containsLocation(center, gpoly)){
                  hex.setOptions({fillColor:color,strokeColor:"white",strokeOpacity:1.0,fillOpacity:0.9});  
                  if(pseudo_assigned_hexagons[key].indexOf(hex)==-1){pseudo_assigned_hexagons[key].push(hex);hex['country']=key;}
                  unassigned = false;
                  break;
                }

            }

            if(unassigned)first_spare_hexagons.push(hex);
      }

  for(var i=0; i<first_spare_hexagons.length;i++){

    var hex = first_spare_hexagons[i];

        hex.getPaths().forEach(function(path){
           path.getArray().forEach(function(LatLng){

          for(var key in gpolys){
              var gpoly  = gpolys[key];
              var color = colors[key];
                if(google.maps.geometry.poly.containsLocation(LatLng, gpoly)){
                  hex.setOptions({fillColor:color,strokeColor:"white",strokeOpacity:1.0,fillOpacity:0.9});  
                  if(pseudo_assigned_hexagons[key].indexOf(hex)==-1){pseudo_assigned_hexagons[key].push(hex);hex['country']=key;}
                  unassigned = false;
                  break;
                }

            }


                })
         })

  }   

  assignKeyListeners(pseudo_assigned_hexagons,colors,geodata);

  }

else{

var url = PATH["hexagonFolder"];
var path = url+"/"+options.reloadresultincountrymode;

jQuery.ajax({
    type: 'GET',
    url: path,
    success: function (data) {
     var loaded_assignement = data;
        
        for(var key in loaded_assignement){

            var color = colors[key];
            var array = loaded_assignement[key];
            for(var i=0; i<array.length;i++){
              var idx = array[i];

                for(var j=0;j<first_result.length;j++){
                  var index = first_result[j].idx;
                  if(idx==index){
                    array[i]  = first_result[j]; 
                    first_result[j].setOptions({fillColor:color,strokeColor:"white",strokeOpacity:1.0,fillOpacity:0.9}); 
                    first_result[j]['country']=key;  
                    break;
                  }
                }


            }

            pseudo_assigned_hexagons[key] = array;

        }

    assignKeyListeners(pseudo_assigned_hexagons,colors,geodata);

    } //success

    })



  }




// var neighbours = {
//                   aut:["deu","che","svn","lie","ita"],
//                   deu:["aut"],
//                   ita:["aut","svn","che","fra"],
//                   fra:["ita","che","mco"],
//                   svn:["aut","ita"],
//                   lie:["aut","che"],
//                   mco:["fra"]
//                  }



}


function assignKeyListeners(pseudo_assigned_hexagons,colors,geodata){

    var differences = {};

    for(var key in pseudo_assigned_hexagons){
      differences[key] = Object.keys(geodata[key]).length - pseudo_assigned_hexagons[key].length;
    }
    console.log(differences);

  jQuery(document).on("keypress", function (e) {
     if(e.which==49){ 
       reassignSelectedHexagons("deu",pseudo_assigned_hexagons,colors);
     }

      if(e.which==50){ 
         reassignSelectedHexagons("fra",pseudo_assigned_hexagons,colors);
     }

      if(e.which==51){ 
         reassignSelectedHexagons("ita",pseudo_assigned_hexagons,colors);
     }

      if(e.which==52){ 
         reassignSelectedHexagons("lie",pseudo_assigned_hexagons,colors);
     }

      if(e.which==53){ 
         reassignSelectedHexagons("mco",pseudo_assigned_hexagons,colors);
     }

      if(e.which==54){ 
         reassignSelectedHexagons("aut",pseudo_assigned_hexagons,colors);
     }

      if(e.which==55){ 
         reassignSelectedHexagons("che",pseudo_assigned_hexagons,colors);
     }

     if(e.which==56){ 
       reassignSelectedHexagons("svn",pseudo_assigned_hexagons,colors);
     }

     if(e.which>48 && e.which<57){

        for(var key in pseudo_assigned_hexagons){
          differences[key] = Object.keys(geodata[key]).length - pseudo_assigned_hexagons[key].length;
          // pseudo_assigned_hexagons[key] = sortFirstResult(pseudo_assigned_hexagons[key]);
        }
        console.log(differences);
     }

    });


  //save assignment on key "L"


   jQuery(document).on("keypress", function (e) {
     if(e.which==108){ 
     var json_str = saveCountryAssignment(pseudo_assigned_hexagons);
      var newWindow = window.open();
      newWindow.document.write(json_str);
     }
 });



}


function saveCountryAssignment(pseudo_assigned_hexagons){

var result = "{"

for(var key in pseudo_assigned_hexagons){

  var array = pseudo_assigned_hexagons[key];

if(array.length>0){

  result += "\""+key+"\":[";

        for(var i=0;i<array.length;i++){
         var hex = array[i];
         result+=(hex.idx+","); 
        }

      result = result.slice(0, -1);
      result+="],"  
   }

}

result = result.slice(0, -1);
result+="}";

return result;

}


function reassignSelectedHexagons(countrykey,pseudo_assigned_hexagons,colors){

  if(selected_hexagons.length>0){


    for(var i=0;i<selected_hexagons.length;i++){
      var selected_hex = selected_hexagons[i];
      var origin_country = selected_hex.country;
        for(var j=0; j<pseudo_assigned_hexagons[origin_country].length;j++){
            if(selected_hex.idx==pseudo_assigned_hexagons[origin_country][j].idx){pseudo_assigned_hexagons[origin_country].splice(j,1);}
        }

      if(pseudo_assigned_hexagons[countrykey]==null)pseudo_assigned_hexagons[countrykey] = [];
      var targethexes = pseudo_assigned_hexagons[countrykey];


        var color = colors[countrykey];
        selected_hex.setOptions({fillColor:color,strokeColor:"white"});  
        targethexes.push(selected_hex);
        selected_hex.country=countrykey;

    }


    selected_hexagons = [];



  }

}


function performPathMethod(geodata,country_data,colors){

             var sorted_keys = ['fra','svn','aut','deu','lie','ita','mco','che'];
              var assigned_hexagons = {};

               for(var i=0; i<sorted_keys.length; i++){

        

                 var key = sorted_keys[i];
                 var grp = geodata[key];
                 var color = colors[key];

                 var max_y = Number.NEGATIVE_INFINITY;
                 var max_x = Number.NEGATIVE_INFINITY;
                 var oldpoint;
                 var used_ids = [];
                 var start_id;

                 var grpbounds = country_data[key];
        

                  for(var id in grp){
                     var point = projection.fromLatLngToPoint(parseGeoData(grp[id]).get());
                     if(point.y>max_y && point.x>max_x){
                      max_y=point.y; 
                      max_x=point.x; 
                      oldpoint = point; 
                      start_id=id

                    };
                   }

                   used_ids.push(start_id);

                   console.log("TARGET: " + Object.keys(grp).length);

                   while(used_ids.length<Object.keys(grp).length){

                   var mindist = Number.POSITIVE_INFINITY;
                   var current_point;
                   var current_id;

                     for(var idx in grp){

                      if(used_ids.indexOf(idx)==-1){

                             var point = projection.fromLatLngToPoint(parseGeoData(grp[idx]).get());
                             var mindist_to_bounds = getPolyPointMinDist(grpbounds,point);


                             var dist = getDistance(point,oldpoint)+2*mindist_to_bounds;

                                 if(dist<mindist){
                                     mindist = dist;
                                     current_point = point;
                                     current_id = idx;
                                 }

                      
                   
                          }

                       }

                          
                      used_ids.push(current_id);
                      oldpoint = current_point;                      
                  }


                  for(var k=0;k<used_ids.length;k++){

                    var id = used_ids[k];
                    var point = projection.fromLatLngToPoint(parseGeoData(grp[id]).get()); 
                    var mindist = Number.POSITIVE_INFINITY;
                    var hex;

                    for(var j=0;j<first_result.length;j++){

                      var cur_hex = first_result[j];

                      if(assigned_hexagons[cur_hex.idx]==null){

                        var dist = getDistance(getHexCenter(cur_hex),point);
                        if(dist<mindist){
                           mindist = dist;
                           hex = first_result[j];
                        }

                      }

                    }

                    hex.setOptions({fillColor:color,strokeColor:"white",strokeOpacity:1.0,fillOpacity:1.0});   
                    assigned_hexagons[hex.idx]=id;

                    var next_id = used_ids[k+1];
                    if(next_id){
                    var curpoint = projection.fromLatLngToPoint(parseGeoData(grp[id]).get()); 
                    var nextpoint = projection.fromLatLngToPoint(parseGeoData(grp[next_id]).get()); 

                    var coords = [projection.fromPointToLatLng(curpoint),projection.fromPointToLatLng(nextpoint)];

                       var flightPath = new google.maps.Polyline({
                            path: coords,
                            geodesic: true,
                            strokeColor: '#FF0000',
                            strokeOpacity: 1.0,
                            strokeWeight: 2,
                            zIndex: 1001
                          });

                    // flightPath.setMap(map);


                  }
              

                  }




              }


return assigned_hexagons;
}


function performColumnMethod(geodata,colors,original_keys){


            var used_ids =[];
            var assigned_hexagons = {};


            for(var i=0;i<first_result.length;i++){

              var hex = first_result[i];
              var min_dist = Number.POSITIVE_INFINITY;
              var closest_point = null;
              var closest_id = null;
              var color;

              for(var j=0; j<original_keys.length; j++){

                 var key = original_keys[j];
                 var grp = geodata[key];

                  for(var id in grp){

                    if(used_ids.indexOf(id)==-1){

                       var point = projection.fromLatLngToPoint(parseGeoData(grp[id]).get());
                       var dist = getDistance(point,getHexCenter(hex));
                       if(dist<min_dist){
                        min_dist = dist;
                        closest_point = closest_point; 
                        closest_id = id;
                        color = colors[key];
                       }

                     }

                  }
        
                }

                  used_ids.push(closest_id);
                  assigned_hexagons[i]= closest_id;
                  hex.setOptions({fillColor:color,strokeColor:"white",strokeOpacity:1.0,fillOpacity:1.0});   


            }


            return assigned_hexagons;

}


function performHungarianMethod(original_keys,geodata,country_data,colors){


  console.log(colors);
          
           var count = 0;
           var poly_indices_to_ids = {}; 

            for(var i=0; i<original_keys.length; i++){

                 var key = original_keys[i];
                 var color = colors[key];
                 var grp = geodata[key];
                  for(var id in grp){

                  poly_indices_to_ids[count]={id:id,color:color};
                  count++;
                  }

            }


           var matrix = buildMatrix(geodata,country_data);
           var m = new Munkres();
           var indices = m.compute(matrix);

            var assigned_hexagons = {};
          
            for(var i=0;i<indices.length;i++){
               var pair = indices[i];
               assigned_hexagons[pair[0]]= poly_indices_to_ids[pair[1]].id;
               var color =  poly_indices_to_ids[pair[1]].color;
               first_result[pair[0]].setOptions({fillColor:color,strokeColor:"white",strokeOpacity:1.0,fillOpacity:0.8});  
            }


return assigned_hexagons;


}


function buildMatrix(geodata,country_data){


  var original_keys = [];

    for(var key in geodata){
      original_keys.push(key);
   }


   var matrix = [];


      for(var j=0; j<first_result.length;j++){

       if(j%10==0)console.log(j);

      var hex = first_result[j];
      var hex_center = getHexCenter(hex);
      var mat_column = [];


      for(var i=0; i<original_keys.length; i++){

         var key = original_keys[i];
         var grp = geodata[key];
         var grpbounds = country_data[key];
         var mindist_to_bounds =  0.5;
         if(!dont_use_cdata) mindist_to_bounds = getPolyPointMinDist(grpbounds,hex_center);

          for(var id in grp){
                   var point = projection.fromLatLngToPoint(parseGeoData(grp[id]).get());
                   var dist = getDistance(hex_center,point);
                   dist+= 2*mindist_to_bounds;
                   mat_column.push(dist);
             }

       } 

       matrix.push(mat_column);
        
    }
             
        
return matrix;


}


function getPolyPointMinDist(g_data_polygon,r_point){

var min_dist = Number.POSITIVE_INFINITY;
var poly = getPolygonFromDataPolygon(g_data_polygon);
    
      poly.getPaths().forEach(function(path){

       path.getArray().forEach(function(LatLng){

        var point = projection.fromLatLngToPoint(LatLng);
        var dist = getDistance(point,r_point);
        if(dist<min_dist)min_dist = dist;

       })

     })

  return min_dist;
}


function sortFirstResult(first_result){

        var hex_columns = getColumnsAsArray(first_result);

        var sorted_hexagons = [];
        for(var i=0; i<hex_columns.length;i++){
          var column = hex_columns[i];

            for(var j=0; j<column.length;j++){
              sorted_hexagons.push(column[j]);
            }


        }

       for(var i=0; i<sorted_hexagons.length;i++){
        sorted_hexagons[i].idx = i;
       }

       return sorted_hexagons;
}


function getColumnsAsArray(first_result){

  var columns = getColumns(first_result);


  var columns_array =[];


  for(var key in columns){
    var hexagons = columns[key]['hexagons'];
    columns_array.push(hexagons);
  }

        for(var i=0;i<columns_array.length;i++){
          var column = columns_array[i];

            for(var j=0; j<column.length;j++){
                var hex = column[j];
                var center_y = getHexCenter(hex).y;
                hex['center_y'] = center_y;

            }

        }


  for(var i=0;i<columns_array.length;i++){

      var column = columns_array[i];
       column.sort(function(a, b) {
         return parseFloat(a['center_y']) - parseFloat(b['center_y']);
      });


  }

  return columns_array;

}


function testNeighbours(polygons,show_neighbours){

  var i = 0;       
        var previouspoly = null;  
        var previous_neighbours = [];   
        var previous_marker = null;        

            // function myLoop () {         
               // setTimeout(function () {  

              jQuery(document).on("keydown", function (e) {


                  if(e.which == 37){i--} //left
                  if(e.which == 39){i++} // right

                    if(i<0)i=0;
                    if(i>polygons.length-1)i=polygons.length-1;


                 if (i < polygons.length) {        

                     // myLoop();
                       if(previous_marker!=null){
                        previous_marker.setMap(null);
                       }

                      if(previouspoly!=null){
                        previouspoly.setOptions({fillColor:'#ff80ff',strokeColor:"white",strokeOpacity:0.8,fillOpacity:0.8})
                        previouspoly.setMap(null);
                      };

                      if(previous_neighbours.length>0){

                        for(var j=0;j<previous_neighbours.length;j++){
                          var neighbour = previous_neighbours[j];
                          neighbour.setMap(null);
                        }

                      }

                      var poly = polygons[i];
                      poly.setOptions({fillColor:"red",strokeColor:"white",strokeOpacity:1.0,fillOpacity:1.0});   
                      poly.setMap(options.map); 

                      if(show_neighbours){  

                        for(var j=0;j<poly['neighbours'].length;j++){
                          var neighbour = poly['neighbours'][j];
                          neighbour.setOptions({fillColor:"blue",strokeColor:"white",strokeOpacity:1.0,fillOpacity:1.0}); 
                          neighbour.setMap(options.map);   
                        }

                      }

                         var marker = new google.maps.Marker({
                                    position: poly.center,
                                    map: options.map,
                                    title: 'Hello World!'
                         });

                      previous_neighbours = poly['neighbours'];
                      previouspoly = poly;     
                      previous_marker = marker;    
                  }


                  })


                  // i++;                         
               // }, 1000)
            // }
          // myLoop();         
}


function visuallyIterateHexagons(hexagons,add){

        var i = 0;       
        var previoushex = null;             

            function myLoop () {         
               setTimeout(function () {                             
                 if (i < hexagons.length) {            
                     myLoop();
                      if(previoushex!=null)previoushex.setOptions({fillColor:'#ff80ff',strokeColor:"white",strokeOpacity:0.8,fillOpacity:0.8});                
                      var hex = hexagons[i];
                      hex.setOptions({fillColor:"red",strokeColor:"white",strokeOpacity:1.0,fillOpacity:1.0});   
                      if(add)hex.setMap(options.map);   
                      previoushex = hex;         
                  }
                  i++;                         
               }, 1000)
            }
          myLoop();                   
}


function addEditMode(){

 
  var calculated_size = getHexSize(first_result[0]);  
  var calculated_width = calculated_size *2;
  var calculated_horizontal_step =  calculated_width *3/4;
  var calculated_vertical_step =  Math.sqrt(3)/2 *calculated_width;

  var grid = reBuildGrid(first_result,calculated_vertical_step,calculated_horizontal_step);
      

google.maps.event.addListener(options.map,"mousemove",function(e){

var mouse_pos = projection.fromLatLngToPoint(e.latLng); 
var closest_point;
var min_dist = Number.POSITIVE_INFINITY;


    for(var i=0;i<grid.length;i++){
      var column = grid[i];
      for(var j=0;j<column.length;j++){
          var point = column[j];
          var dist = getDistance(mouse_pos,point);
          if(dist<min_dist){min_dist=dist;closest_point=point;}
       }
    }


     if(test_hex != null){
        test_hex.setMap(null);
      }

   var test_hex_points = calculatePolygonPoints(closest_point.x,closest_point.y,6,calculated_size);

     test_hex = new google.maps.Polygon({
                  paths: test_hex_points,
                  strokeColor: 'green',
                  strokeOpacity: 0.8,
                  strokeWeight: stroke_weight,
                  fillColor: 'green',
                  fillOpacity: 0.6,
                });

    test_hex.setMap(options.map); 


        var addAddListener = function(hexagon) {
                        google.maps.event.addListener(test_hex, 'click', function (event) {

                      var addRemoveListener = function(hexagon) {
                             google.maps.event.addListener(hexagon, 'click', function (event) {
                             first_result.splice(hexagon.idx, 1);
                                 for(var i=0; i<first_result.length;i++){

                                      var hex = first_result[i];
                                      hex.idx =i;
                                 }

                             
                          add_hex.setMap(null);

                            console.log("CURRENT_POLYGONS: " +first_result.length);
                        });  
                      }

      
                          var add_hex = new google.maps.Polygon({
                            paths: test_hex_points,
                            strokeColor: 'purple',
                            strokeOpacity: 0.8,
                            strokeWeight: stroke_weight,
                            fillColor: '#ff80ff',
                            fillOpacity: options.hex_opacity,
                            idx: first_result.length
                          });

                          add_hex.setMap(options.map); 
                          first_result.push(add_hex);
                          grid = reBuildGrid(first_result,calculated_vertical_step,calculated_horizontal_step);
   

                            addRemoveListener(add_hex);

                            console.log("CURRENT_POLYGONS: " +first_result.length);

                        });  
                      }


      addAddListener(test_hex);


})


}


function getColumns(first_result){

var result_x = {};
var count = 1;
   for(var i=0; i<first_result.length;i++){
         var hex = first_result[i];
         var center = getHexCenter(hex);

         if(result_x[center.x.toFixed(3)]==null){

          result_x[center.x.toFixed(3)] = {"hexagons":[hex],"id":count,"center":center.x.toFixed(3)};
          count++;
         
         }

         else result_x[center.x.toFixed(3)]["hexagons"].push(hex);
}

var sorted_result = sortObject(result_x);

return sorted_result;

}

function getRows(first_result){

var result_y = {};
var count = 1;

   for(var i=0; i<first_result.length;i++){
         var hex = first_result[i];
         var center = getHexCenter(hex)

         if(result_y[center.y.toFixed(8)]==null){

          result_y[center.y.toFixed(8)] = {"hexagons":[hex],"id":count,"center":center.y.toFixed(8)};
          count ++;

        }

         else result_y[center.y.toFixed(8)]["hexagons"].push(hex);

  }


var sorted_result = sortObject(result_y);

count = 1;

for(var key in sorted_result){
  sorted_result[key]["id"] = count;
  count++;
}

return sorted_result;


}

function reBuildGrid(first_result, _vertical_step,_horizontal_step){

  var columns = getColumns(first_result);  



  var max_y = Number.NEGATIVE_INFINITY;
  var min_y = Number.POSITIVE_INFINITY;


    for(var i=0; i<first_result.length;i++){
         var hex = first_result[i];
         var center = getHexCenter(hex);
         if(center.y<min_y)min_y=center.y;
         if(center.y>max_y)max_y=center.y;
    }

  min_y -= _vertical_step;
  max_y += _vertical_step;


    var grid = [];  


    for(var x_value in columns){

      var min_y_in_column = Number.POSITIVE_INFINITY;
      var max_y_in_column = Number.NEGATIVE_INFINITY;
      var saved_center_x;
      var grid_points = [];

        var hexagons = columns[x_value]['hexagons'];


        for(var i=0;i<hexagons.length;i++){

          var hexagon = hexagons[i];
          var center = getHexCenter(hexagon);
          if(i==0)saved_center_x = center.x;
          if(center.y<min_y_in_column)min_y_in_column=center.y;
          if(center.y>max_y_in_column)max_y_in_column=center.y;

        }

        var value_top = min_y_in_column;
        var value_bottom = max_y_in_column;

        while(value_top>=min_y){
          value_top-=_vertical_step;
        }

        while(value_bottom<=max_y){
          value_bottom+=_vertical_step;
        }

          while(value_top<=value_bottom){
          var point = new google.maps.Point(saved_center_x,value_top);
          grid_points.push(point);
          value_top+=_vertical_step;
        }

        grid.push(grid_points);

    }





    var larger_column;

    if(grid.length>1){
     larger_column= Math.max(grid[0].length, grid[1].length);
    }

    else{
      larger_column = grid[0].length;
    }

    var top_left;
    var top_right;

    if(grid[0].length==larger_column)top_left = new google.maps.Point(grid[0][0].x-_horizontal_step,grid[0][0].y+_vertical_step/2);
    else top_left = new google.maps.Point(grid[0][0].x-_horizontal_step,grid[0][0].y-_vertical_step/2);

    if(grid[grid.length-1].length==larger_column)top_right = new google.maps.Point(grid[grid.length-1][0].x+_horizontal_step,grid[grid.length-1][0].y+_vertical_step/2);
    else top_right = new google.maps.Point(grid[grid.length-1][0].x+_horizontal_step,grid[grid.length-1][0].y-_vertical_step/2);

    var top_left_y = top_left.y;
    var new_col_left = [];

    while(top_left_y<=max_y+_vertical_step){
      var point = new google.maps.Point(top_left.x, top_left_y);
      top_left_y += _vertical_step;
      new_col_left.push(point);
    }

    grid.unshift(new_col_left);

    var top_right_y = top_right.y;
    var new_col_right = [];

    while(top_right_y<=max_y+_vertical_step){
      var point = new google.maps.Point(top_right.x, top_right_y);
      top_right_y += _vertical_step;
      new_col_right.push(point);
    }

    grid.push(new_col_right);

    // visualizeGridWithMarkers(grid);

    return grid;

}

function visualizeGridWithMarkers(grid){

    for(var i=0;i<grid.length;i++){
      var column = grid[i];
      for(var j=0;j<column.length;j++){
          var point = column[j];
              var marker = new google.maps.Marker({
                        position: projection.fromPointToLatLng(point),
                        map: options.map,
                        title: 'Hello World!'
                      });
       }
    }

}


function getColorsByCountries(owner){

var colors = {};
            if(owner instanceof MultiLegendElement){
              var /** number */ numSub = owner.getNumSubElements();
              for(var j = 0; j < numSub; j++){
                var subowner = owner.getSubElement(j);
                var skey = subowner.key;
                skey = skey.replace('#','');
                var color = subowner.getColorString();
                colors[skey] = color;

              }
            }


return colors;
}



function buildGrid(_row_count,_col_count,_startpoint,_horizontal_step,_vertical_step,_size){

var grid = [];

 var x = _startpoint.x;

        for(var i=0; i<_col_count;i++){

         var y = _startpoint.y;
         var num_of_rows = _row_count;

          if(i%2>0){
           y = _startpoint.y + _vertical_step/2;
           num_of_rows -=1;
          }
        
          grid[i] = [];

          for(var j=0;j<num_of_rows;j++){

            var point = new google.maps.Point(x,y); 


           var hex_points = calculatePolygonPoints(point.x,point.y,6,_size);

             // var hexagon = new google.maps.Polygon({
             //      paths: hex_points,
             //      strokeColor: 'yellow',
             //      strokeOpacity: 0.8,
             //      strokeWeight: stroke_weight,
             //      fillColor: 'yellow',
             //      fillOpacity: options.hex_opacity
             //    });
             //    hexagon.setMap(options.map);

            grid[i][j] = point; 
                
            y+= _vertical_step; 
            
          }
          x+= _horizontal_step; 
        }

return grid;

}




function saveToWKT(){

var wktstr = "MULTIPOLYGON(";

   for(var i=0; i<first_result.length;i++){

     wktstr+="((";

      var hex = first_result[i];

      var start_lat;
      var start_lng;

      var hex_needs_closing = false;
    
      hex.getPaths().forEach(function(path){

           if(path.length==6) hex_needs_closing = true;

           start_lng = path.getAt(0).lng().toString();
           start_lat = path.getAt(0).lat().toString();

          path.getArray().forEach(function(LatLng){

            wktstr+= LatLng.lng().toString();
            wktstr+= " ";
            wktstr+= LatLng.lat().toString();
            wktstr+= ",";

            
          })

        })                  

       if(hex_needs_closing){
         wktstr+= start_lng;
         wktstr+= " ";
         wktstr+= start_lat;
       }

        wktstr+=")),"
    }

    wktstr = wktstr.substring(0, wktstr.length - 1) + ")";


    var newWindow = window.open();
    newWindow.document.write(wktstr);

};


function getHexSize(hex){

 var size = 0;


      hex.getPaths().forEach(function(path){

        var first_point  = projection.fromLatLngToPoint(path.getAt(0)); 
        var second_point = projection.fromLatLngToPoint(path.getAt(1)); 

        size = getDistance(first_point,second_point);


        })    

return size;

}


function getHexCenter(hex){

var size = getHexSize(hex);
var result;

      hex.getPaths().forEach(function(path){

        var third_point  = projection.fromLatLngToPoint(path.getAt(0)); 
        third_point.x -= size;
        result = third_point;

        })      

return result;

}

//returns centers of possible hexagon neighbours of a given center

function getHexNeighbours(hex_center,size,vertical_step,horizontal_step){

var result = [

  new google.maps.Point(hex_center.x, hex_center.y - vertical_step), //top
  new google.maps.Point(hex_center.x -horizontal_step, hex_center.y - vertical_step/2), //top left
  new google.maps.Point(hex_center.x +horizontal_step, hex_center.y - vertical_step/2), //top_right
  new google.maps.Point(hex_center.x, hex_center.y + vertical_step), //bottom
  new google.maps.Point(hex_center.x -horizontal_step, hex_center.y + vertical_step/2), //bottom left,
  new google.maps.Point(hex_center.x +horizontal_step, hex_center.y + vertical_step/2)  //bottom right

]

return result;

};


function createHexByPosition(hex_center,size,vertical_step,horizontal_step,position,polygon,ids_to_countries){

var hex = {};

if(position =="top") hex['center'] = new google.maps.Point(hex_center.x, hex_center.y - vertical_step);
if(position =="top_right") hex['center'] = new google.maps.Point(hex_center.x +horizontal_step, hex_center.y - vertical_step/2);
if(position =="bottom_right") hex['center'] = new google.maps.Point(hex_center.x +horizontal_step, hex_center.y + vertical_step/2);
if(position =="bottom") hex['center'] = new google.maps.Point(hex_center.x, hex_center.y + vertical_step);
if(position =="bottom_left") hex['center'] = new google.maps.Point(hex_center.x -horizontal_step, hex_center.y + vertical_step/2);
if(position =="top_left") hex['center'] =  new google.maps.Point(hex_center.x -horizontal_step, hex_center.y - vertical_step/2);

  var country = ids_to_countries[polygon.id];
  var color = colors[country];
  var identifier = hex['center'].x.toFixed(3).toString() + hex['center'].y.toFixed(3).toString();
  hex['identifier'] = identifier;
  hex['color']  = color;
  hex['relatedPolygons'] = [polygon];

  return hex;

};

function getNeighbourByPosition(position){

if(position =="top") return 0;
if(position =="top_right") return 2;
if(position =="bottom_right") return 5;
if(position =="bottom") return 3;
if(position =="bottom_left") return 4;
if(position =="top_left") return 1;

};


function dealWithConflict(position,angle,hex_candidates){

var solution = "no_solution_found";

if(position =="top"){
  if(angle>270 && hex_candidates[2]!=null)solution = "top_right";
  if(angle<270 && hex_candidates[1]!=null)solution = "top_left";
}

if(position=="top_right"){
   if(hex_candidates[0]!=null) solution = "top";
   else if(hex_candidates[1]!=null) solution ="bottom_right";
}

if(position=="top_left"){
   if(hex_candidates[0]!=null) solution = "top";
   else if(hex_candidates[2]!=null) solution ="bottom_left";
}

if(position =="bottom"){
  if(angle>90 && hex_candidates[4]!=null)solution = "bottom_left";
  if(angle<90 && hex_candidates[5]!=null)solution = "bottom_right";
}

if(position=="bottom_right"){
   if(hex_candidates[3]!=null) solution = "bottom";
   else if(hex_candidates[4]!=null) solution ="top_right";
}

if(position=="bottom_left"){
   if(hex_candidates[3]!=null) solution = "bottom";
   else if(hex_candidates[5]!=null) solution ="top_left";
}

if(solution!="no_solution_found") solution = getNeighbourByPosition(solution);

return solution;

};


function addHexagonToMap(center,stroke_color,fill_color,offset){

var hex_points = calculatePolygonPoints(center.x+offset,center.y,6,size);

var hexagon = new google.maps.Polygon({
                          paths: hex_points,
                          strokeColor: stroke_color,
                          strokeOpacity: 0.8,
                          strokeWeight: stroke_weight,
                          fillColor: fill_color,
                          fillOpacity: options.hex_opacity,
                        });

hexagon.setMap(options.map);

return hexagon;

};


function sortNeighboursByTopLeft(neighbours){
var obj ={};


 for(var i=0;i<neighbours.length;i++){

  var poly = neighbours[i];
  var center = projection.fromLatLngToPoint(poly.center);

 var min_x = Number.POSITIVE_INFINITY;
 var min_y = Number.POSITIVE_INFINITY;

  poly.getPaths().forEach(function(path){
        var array = path.getArray();

          for(var k=0;k<array.length;k++){ 

             var point =  projection.fromLatLngToPoint(array[k]);
             if(point.x<min_x) min_x=point.x;
             if(point.y<min_y) min_y=point.y;
            
          } 
    })

    obj[center.x + center.y] = poly;

  }


  var res = sortObject(obj);
  var result = [];

  for(var key in res){
    result.push(res[key]);
  }

  return result;

}


function calculatePolygonPoints (x,y,n,r){
     
  var result = [];  


     for (var i = 0; i < n; i++) {
 
      var point = {x:0,y:0};
      point.x = x + r * Math.cos(2 * Math.PI * i / n); 
      point.y = y + r * Math.sin(2 * Math.PI * i / n);   //switch sin / cos for polygon orientation // different polyorientation need different grid!

      point = projection.fromPointToLatLng(point);

      result.push(point);
    }

    return result;

  };


    function getMax(values){

    var max = Number.NEGATIVE_INFINITY;

    for (var i=0;i<values.length;i++){
    	var value = values[i];
    	if(value>max)max = value;
    }

    return max; 	

    };



    function getMin(values){

    var min = Number.POSITIVE_INFINITY;

    for (var i=0;i<values.length;i++){
    	var value = values[i];
    	if(value<min)min = value;
    }

    return min; 	

    };	 	

    function getManhattenDistance (point_a, point_b){

     return Math.abs(point_a.x-point_b.x)+Math.abs(point_a.y-point_b.y);

    };

    function getDistance (point_a, point_b){

    	return Math.sqrt(Math.pow(point_a.x-point_b.x,2)+Math.pow(point_a.y-point_b.y,2));

    };

    function getAngle(p1,p2){
      var res =  Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      if(res<0) res+=360;
      return res;
    };

    function getPositionByAngle(angle){
      if(angle> 240  && angle <  300)   return "top";
      if(angle> 300  && angle <  360)   return "top_right";
      if(angle> 0    && angle <   60)   return "bottom_right";
      if(angle> 60   && angle <  120)   return "bottom";
      if(angle> 120  && angle <  180)   return "bottom_left";
      if(angle> 180  && angle <  240)   return "top_left";
    }

    function sortObject(o) {
    var sorted = {},
    key, a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}


function checkAssignedPolygons(assigned_hexagons,colors){


 var assignments_by_countries = getAssignementsByCountry(assigned_hexagons,polygons_to_country);


  for(var i in assigned_hexagons){
   var val = assigned_hexagons[i];
   var count = 0;

     for(var j in assigned_hexagons){
      var val_c = assigned_hexagons[j];
      if(val==val_c)count++;

     }

  if(count>1)console.log("WARNING");

  }

  // check if colors have changed

  for(var key in assignments_by_countries){
    var color = colors[key];
    var assignments = assignments_by_countries[key];

   for(var j=0;j<assignments.length;j++){

          var key = Object.keys(assignments[j])[0];
          var hex = first_result[key];
          hex.setOptions({fillColor:color});  

      }

  }

}









} // CLASS





//SAVE OF NON GRID BASED MOUSE LISTNER FOR EDIT MODE


// google.maps.event.addListener(options.map,"mousemove",function(e){


// var mouse_pos = projection.fromLatLngToPoint(e.latLng); 



// var selected_column = null;

//   for(var x_value in columns){

//     var x = parseFloat(x_value);
//     var left_x = x-calculated_size;
//     var right_x = x+calculated_size;


//     if(mouse_pos.x <= right_x && mouse_pos.x > left_x){
//       selected_column = columns[x_value];
//     }


//   }
   

     // for(var i=0; i<first_result.length;i++){
     //     var hex = first_result[i];
     //     hex.setOptions({fillColor:"#ff80ff"});  
     //  }



   // if(selected_column!=null){

   //    var hexagons = selected_column['hexagons'];

   //    for(var key in hexagons){
   //      var hex = hexagons[key];
   //      hex.setOptions({fillColor:"red"});
   //    }


   //  }


   // var closest_column_hex_center = null;
   // var min_dist_column = Number.POSITIVE_INFINITY;
   // var new_hex_pos_column;

   //  if(selected_column!=null){

   //    var hexagons = selected_column['hexagons'];

   //    for(var key in hexagons){
   //      var hex = hexagons[key];
   //      var center = getHexCenter(hex)
   //      var dist = getDistance(center,mouse_pos);
   //      if(dist<min_dist_column){min_dist_column = dist; closest_column_hex_center = center;}
   //    }

    

   //    if(mouse_pos.y>closest_column_hex_center.y){
   //         new_hex_pos_column = new google.maps.Point(closest_column_hex_center.x,closest_column_hex_center.y+calculated_vertical_step);

   //    }

   //    else{
   //        new_hex_pos_column = new google.maps.Point(closest_column_hex_center.x,closest_column_hex_center.y-calculated_vertical_step);
   //    }

   //  }



// var selected_row =null;
  
//     for(var y_value in rows){

//       var y = parseFloat(y_value);
//       var top_y = y-calculated_size;
//       var bottom_y = y+calculated_size;

//       if(mouse_pos.y <= bottom_y && mouse_pos.y > top_y){
//         selected_row = rows[y_value];
//       }


//     }


    // if(selected_row!=null){

    //   var hexagons = selected_row['hexagons'];

    //   for(var key in hexagons){
    //     var hex = hexagons[key];
    //     hex.setOptions({fillColor:"red"});
    //   }


    // }


//    var closest_row_hex_center = null;
//    var min_dist_row = Number.POSITIVE_INFINITY;
//    var new_hex_pos_row;

//     if(selected_row!=null){

//       var hexagons = selected_row['hexagons'];


//       for(var key in hexagons){
//         var hex = hexagons[key];
//         var center = getHexCenter(hex);
//         var dist = getDistance(center,mouse_pos);

//         if(dist<min_dist_row){min_dist_row = dist; closest_row_hex_center = center;}
//       }

        
//       if(mouse_pos.x>closest_row_hex_center.x){

//            if(min_dist_row< 2*calculated_horizontal_step){
//            new_hex_pos_row = new google.maps.Point(closest_row_hex_center.x+calculated_horizontal_step,closest_row_hex_center.y-=calculated_vertical_step/2);
//            }
//            else {
//            new_hex_pos_row = new google.maps.Point(closest_row_hex_center.x+2*calculated_horizontal_step,closest_row_hex_center.y);
//            }

//       }

//       else{
          
//            if(min_dist_row< 2*calculated_horizontal_step){
//            new_hex_pos_row = new google.maps.Point(closest_row_hex_center.x-calculated_horizontal_step,closest_row_hex_center.y-=calculated_vertical_step/2);
//            }
//            else {
//            new_hex_pos_row = new google.maps.Point(closest_row_hex_center.x-2*calculated_horizontal_step,closest_row_hex_center.y);
//            }


//       }



//      var test_hex_points =null;


//      if(min_dist_row<min_dist_column){
//          test_hex_points = calculatePolygonPoints(new_hex_pos_row.x,new_hex_pos_row.y,6,calculated_size);
//      }

//      else{
//         test_hex_points = calculatePolygonPoints(new_hex_pos_column.x,new_hex_pos_column.y,6,calculated_size);
//      }



//      if(test_hex != null){
//         test_hex.setMap(null);
//       }

//      test_hex = new google.maps.Polygon({
//                   paths: test_hex_points,
//                   strokeColor: 'green',
//                   strokeOpacity: 0.8,
//                   strokeWeight: stroke_weight,
//                   fillColor: 'green',
//                   fillOpacity: 0.6,
//                 });

//     test_hex.setMap(options.map); 

//     }



//         var addAddListener = function(hexagon) {
//                         google.maps.event.addListener(test_hex, 'click', function (event) {


//                       var addRemoveListener = function(hexagon) {
//                              google.maps.event.addListener(hexagon, 'click', function (event) {
//                              first_result.splice(hexagon.idx, 1);
//                                  for(var i=0; i<first_result.length;i++){

//                                       var hex = first_result[i];
//                                       hex.idx =i;
//                                  }

//                                columns = getColumns(first_result);     
//                                rows = getRows(first_result);       
                             

//                           add_hex.setMap(null);

//                             console.log("CURRENT_POLYGONS: " +first_result.length);
//                         });  
//                       }

      
//                           var add_hex = new google.maps.Polygon({
//                             paths: test_hex_points,
//                             strokeColor: 'purple',
//                             strokeOpacity: 0.8,
//                             strokeWeight: stroke_weight,
//                             fillColor: '#ff80ff',
//                             fillOpacity: options.hex_opacity,
//                             idx: first_result.length
//                           });

//                           add_hex.setMap(options.map); 
//                           first_result.push(add_hex);

//                                columns = getColumns(first_result);     
//                                rows = getRows(first_result);     

//                             addRemoveListener(add_hex);

//                             console.log("CURRENT_POLYGONS: " +first_result.length);

//                         });  
//                       }


//       addAddListener(test_hex);


// })