<?php
function im_ajax_handler_users (){
	
	$db = IM_Initializer::$instance->database;
	
	//Disable error messages to allow error management
	$db->hide_errors();
	
	if(isset($_POST['dbname'])){
		$db->select($_POST['dbname']);
	}
	
	switch ($_POST['namespace']){
		case 'gui_elements':
			switch ($_POST['query']){
				case 'add_new_entry_to_table':
					check_ajax_referer('im_aett_' . $_POST['table'], '_wpnonce', true);
					
					//Only allowed for users with the right capability
					if(!current_user_can_for_blog(1, IM_Initializer::$instance->cap_for_db)){
						die (-1);
					}
					
					$rowsA = json_decode(stripslashes($_POST['rows']));
					$valuesA = json_decode(stripslashes($_POST['values']));
					$formatA = json_decode($_POST['format']);

					if(!$db->insert($_POST['table'], array_combine($rowsA, $valuesA), $formatA)){
						echo 'Error: ' . $db->last_error;
						die;
					}
					echo $db->insert_id;
					break;
				
				case 'update_table_value':
					check_ajax_referer('im_aett_' . $_POST['table'], '_wpnonce', true);
					
					//Only allowed for users with the right capability
					if(!current_user_can_for_blog(1, IM_Initializer::$instance->cap_for_db)){
						die (-1);
					}
					
					$rowsA = json_decode(stripslashes($_POST['rows']));
					$valuesA = json_decode(stripslashes($_POST['values']));
					$whereA = array($_POST['key_field'] => $_POST['id']);
					$formatA = json_decode($_POST['format']);
					
					if(!$db->update($_POST['table'], array_combine($rowsA, $valuesA), $whereA, $formatA)){
						echo 'Error: ' . $db->last_error;
						die;
					}
					echo $_POST['id'];
					break;
				
				case 'add_enum_value':
					check_ajax_referer('im_anev_' . $_POST['table'] . $_POST['col'], '_wpnonce', true);
						
					//Only allowed for users with the right capability
					if(!current_user_can_for_blog(1, IM_Initializer::$instance->cap_for_db)){
						die (-1);
					}
					
					if(isset($_POST['dbname'])){
						$dbname = $_POST['dbname']; //TODO not really helpfull, since the alter table statement ist not executed in this db!
					}
					else {
						$dbname = $db->dbname;
					}
						
					$old = $db->get_var("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" . $_POST['table'] . "' AND COLUMN_NAME = '" . $_POST['col'] . "' AND TABLE_SCHEMA = '" . $dbname . "'");
					$newValue = substr($old, 0, strlen($old) - 1) . ',\'' . $_POST['val']  . '\')';
				
					if(!$db->query("alter table " . $_POST['table'] . " modify column " . $_POST['col'] . " $newValue")){
						echo 'Error: ' . $db->last_error;
						die;
					}
					echo 'success';
					break;
			}
		break;
		
		case 'comments':
			check_ajax_referer('im_edit_comments', '_wpnonce', true);
			
			if(!current_user_can_for_blog(1, 'im_edit_comments'))
				die;
			
			switch($_POST['mode']){
				case 'update':
					if ($_POST['content'] == ''){ //Delete entry from table
						$sql = $db->prepare('DELETE FROM im_comments WHERE Id = %s AND Language = %s', $_POST['key'], $_POST['lang']);
						$db->query($sql);
					}
					else {
						$comment = stripslashes($_POST['content']);
						$db->query($db->prepare(
							"INSERT INTO im_comments (Id, Source, Author, Language, Comment) 
							VALUES(%s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE Comment = %s", 
							$_POST['key'],
							$_POST['name'],
							wp_get_current_user()->user_login,
							$_POST['lang'],
							$comment,
							$comment));
					}
					
					if($db->last_error != ''){
						echo 'Error: ' . $db->last_error;
						die;
					}
					
					$ret = stripslashes($_POST['content']);
					echo apply_filters('im_comment', $ret, $_POST['key']);
					break;
					
				case 'get':
					$sql = $db->prepare('SELECT Comment FROM im_comments WHERE Id = %s AND Language = %s', $_POST['key'], $_POST['lang']);
					echo json_encode($db->get_var($sql));
					break;
			}
		break;
		
		case 'save_syn_map':
			check_ajax_referer('im_save_map', '_wpnonce', true);
			
			$name = $db->get_var("SELECT Name FROM im_syn_maps WHERE Name = '" . $_POST['name'] . "'");
			if($name != NULL){
				echo 'NAME_EXISTS';
			}
			else {
				$db->insert('im_syn_maps', array (
						'Name' => $_POST['name'],
						'Description' => $_POST['description'],
						'Zoom' => $_POST['zoom'],
						'Center_Lat' => $_POST['center_lat'],
						'Center_Lng' => $_POST['center_lng'],
						'Author' => $_POST['author'],
						'Released' => $_POST['release']
				),
						array ('%s', '%s', '%d', '%s', '%s', '%s'));
				
				if($db->last_error != ''){
					echo 'Error: ' . $db->last_error;
					die;
				}
					
				$map_id = $db->insert_id;
					
				foreach ($_POST['data'] as $index => $value){
					$db->insert('im_syn_maps_elements', 
						array(
							'Id_Syn_Map' => $map_id,
							'Position' => $index,
							'Data' => json_encode($value)
						),
						array('%d', '%d', '%s'));
					
					if($db->last_error != ''){
						echo 'Error: ' . $db->last_error;
						die;
					}
				}
				
				echo $map_id;
			}
			break;
	}
	die;
}

function im_ajax_handler_all (){
	     
	$db = IM_Initializer::$instance->database;
	check_ajax_referer('im_load_data', '_wpnonce', true);
	
	switch ($_POST['namespace']){
		case 'load_data':
			$result = IM_Initializer::$instance->load_data();
			
			if(!isset($_POST['noComments']))
				$result->addComments($_POST['key'], $db);
			
			if(isset($_POST['filter']) && isset($_POST['filter']['removed']))
				$result->removeSubCategories($_POST['filter']['removed']);
			
			echo $result->createResultString();
			break;
		
		case 'load_syn_map':
			$query1 = 'SELECT Zoom, Center_Lat, Center_Lng FROM im_syn_maps WHERE Id_Syn_Map = ' . $_POST['key'];
			$query2 = 'SELECT Data FROM im_syn_maps_elements WHERE Id_Syn_Map = ' . $_POST['key'] . ' ORDER BY Position ASC';
			$map_main_data = $db->get_row($query1, 0);
			
			if($map_main_data){
				echo json_encode(array(
					$map_main_data, 
					array_map('json_decode', $db->get_col($query2, 0))
				));
			}
			else {
				echo 'NO_MAP';
			}
			break;
	}
	die;
}

class IM_Result {
	/**
	 * This variable stores if the result contains point symbols. If the result consists
	 * solely of polygons or line strings only a colour is needed for visualization, otherwise
	 * a point symbol (color, shape, letter) has to be created.
	 */
	private $contains_point_symbols = array();
	private $contains_polygons = array();
	private $contains_line_strings = array();
	
	private $element_data = array();
	private $comments = array();
	
	private $debug_data;
	

	/**
	 * @param string $sub_id Id for the subcategory or -1 if no sub-category is given
	 * @param ElementInfoWindowData $element_info Data which is used to create the popup window for this element
	 * @param string $geo_data Geo data in WKT format
	 * @param array<string, string|number> $quant_info optional
	 * 		Enables quantification for this element.
	 * 		The parameter has to be an array that contains a mapping from category ids to element ids.
	 * 		In general, this is only meaningfull if the MapElement is a point symbol and the given category
	 * 		only contains polygons.
	 */
	function addMapElement ($sub_id, IM_ElementInfoWindowData $element_info, $geo_data, $quant_info = NULL){
		if(!array_key_exists($sub_id, $this->element_data)){
			$this->element_data[$sub_id] = array ();
			$this->contains_point_symbols[$sub_id] = false;
			$this->contains_polygons[$sub_id] = false;
			$this->contains_line_strings[$sub_id] = false;
		}	
			
		if(!$this->contains_point_symbols[$sub_id]){
			if(strpos($geo_data, 'POINT') === 0){
				$this->contains_point_symbols[$sub_id] = true;
			}
			else {
				if(!$this->contains_polygons[$sub_id]){
					if(strpos($geo_data, 'POLYGON') === 0 || strpos($geo_data, 'MULTIPOLYGON') === 0){
						$this->contains_polygons[$sub_id] = true;
					}
				}
				
				if(!$this->contains_line_strings[$sub_id]){
					if(strpos($geo_data, 'LINESTRING') === 0 || strpos($geo_data, 'MULTILINESTRING') === 0){
						$this->contains_polygons[$sub_id] = true;
					}
				}
			}
		}	
		
		$this->element_data[$sub_id][] = array ($element_info->getData(), $geo_data, $quant_info);
	}
	
	function setDebugData($str){
		$this->debug_data = $str;
	}
	
	function removeSubCategories ($arr){
		if($arr == null)
			return;
		
		foreach ($arr as $sub_id){
			$this->element_data[$sub_id] = count($this->element_data[$sub_id]);
		}
	}
	//TODO comment the comment filter
	function addComments ($id, $db){
		//Get main element comments
		$mainComments = $this->getAllLangComments($id, $db);
		if(count($mainComments) > 0){
			$mcommentList = array();
			foreach ($mainComments as $lc){
				$ctext = apply_filters('im_comment', $lc[1], $id);
				$mcommentList[$lc[0]] = $ctext;
			}
			$this->comments[$id] = $mcommentList;
		}

		//Get sub-element comments
		foreach ($this->element_data as $id => $data) {
			if($id == -1)
				continue;
			$id_splited = explode('+', $id);
			foreach ($id_splited as $id_p){
				$currentSubComments = $this->getAllLangComments($id_p, $db);
				if(count($currentSubComments) > 0){
					$scommentList = array();
					foreach ($currentSubComments as $lc){
						$ctext = apply_filters('im_comment', $lc[1], $id_p);
						$scommentList[$lc[0]] = $ctext;
					}
					$this->comments[$id_p] = $scommentList;
				}
			}
		}
	}
	
	private function getAllLangComments ($id, &$db){
		$sql = $db->prepare('SELECT Language, Comment FROM im_comments WHERE Id = %s', $id);
		return $db->get_results($sql, ARRAY_N);
	}
	
	function createResultString (){
	
		$result_data = array ();
		$num_point_sub_categories = 0;
		$num_polygon_sub_categories = 0;
		$num_line_string_sub_categories = 0;
		foreach ($this->element_data as $sub_id => $data){
		
			if(is_int($data)){
				$result_data[$sub_id] = $data;
			}
			else {
					
				//Find out the overlay type of the result for visualization. As soon as there are two types of overlays it is treated like a point symbol.
				if($this->contains_point_symbols[$sub_id]){
					$overlay_type = 0; //Point
					$num_point_sub_categories++;
				}
				else {
					if($this->contains_line_strings[$sub_id] && !$this->contains_polygons[$sub_id]){
						$overlay_type = 2; //Line string
						$num_line_string_sub_categories++;
					}
					else if ($this->contains_polygons[$sub_id] && !$this->contains_line_strings[$sub_id]){
						$overlay_type = 1; //Polygon
						$num_polygon_sub_categories++;
					}
					else {
						$overlay_type = 0; //Point as default
						$num_point_sub_categories++;
					}
				}
				
				$result_data[$sub_id] = array ($overlay_type, $data);
			}
		}
		
		$num_types_per_category = array($num_point_sub_categories, $num_polygon_sub_categories, $num_line_string_sub_categories);
		$result = array($num_types_per_category, $result_data, $this->comments);
		 if($this->debug_data){
		 	$result[] = $this->debug_data;
		 }
		
		return json_encode($result);
	}
}

class IM_Error_Result extends IM_Result {
	private $error_msg;
	
	function __construct($msg){
		$this->error_msg = $msg;
	}
	
	function addComments ($id, $db){
		//Do nothing
	}
	
	function removeSubCategories ($arr){
		//Do nothing
	}
	
	function createResultString (){
		return 'Error: ' . $this->error_msg;
	}
}



abstract class IM_ElementInfoWindowData {
	private $element_type;
	
	/**
	 * @param string $element_type
	 * 		This type is used by the JS code to identify which kind of popup window should be created. 
	 * 		E.g. for VerbaAlpina where are following types:
	 * 			- SimpleInfoWindow (just name and description)
	 * 			- RecordInfoWindow (for linguistic data; contains information about types, concepts, sources etc.)
	 * 		The $element_type describes which of them should be created whereas the getTypeSpecificData method should produce all the data needed for this
	 */
	function __construct ($element_type){
		$this->element_type = $element_type;
	}
	
	/**
	 * @return array
	 * 
	 * Should return an associative array with all the data needed to create the popup window. The array key "elementType" must not be used.
	 */
	abstract protected function getTypeSpecificData ();
	
	function getData (){
		$result = $this->getTypeSpecificData();
		$result['elementType'] = $this->element_type;
		return $result;
	}
}

class IM_SimpleElementInfoWindowData extends IM_ElementInfoWindowData {
	private $data;
	
	function __construct ($name, $description){
		parent::__construct('simple');
		$this->data = array ('name' => $name, 'description' => $description);
	}
	
	protected function getTypeSpecificData (){
	 	return $this->data;
	}
}

/**
 * Returns a string with %d's for integer list
 */
function im_key_placeholder_list ($arr){
	return '(' . implode(',', array_fill(0, count($arr), '%d')) . ')';
}

/**
 * Removes the first character from all strings in an array
 */
 function im_remove_prefixes ($arr){
 	return array_map(function ($v){
 		return substr($v, 1);
 	}, $arr);
 }

 
function im_ajax_handler_backend (){
	switch ($_POST['query']){
		case 'set_option':
			if(current_user_can('activate_plugins')){
				update_site_option($_POST['option'], $_POST['value']);
				echo 'success';
			}
			break;
			
		case 'copy_tables':
			if(current_user_can('activate_plugins')){
				$old_connection = IM_Initializer::$instance->database;
				$logins = get_option('sth_default_logins');
				
				if ($logins === false){
					_e('Slug does not exist!', 'interactive-map');
					die;
				}
				if($_POST['slug'] === DEFAULT_VALUE){
					global $wpdb;
					$new_connection = $wpdb;
				}
				else {
					$slug = $logins[$_POST['slug']];
					if (!$slug){
						_e('Slug does not exist!', 'interactive-map');
						die;
					}
					if(!$slug['db']){
						_e('Only a slug with a given (default) database can be used. Please edit the slug in the SQLToHtml options and add a data base!', 'interactive-map');
						die;
					}
					/*$host_old = substr($old_connection->dbhost, strpos($old_connection->dbhost, ':'));
					if($slug['db'] === $old_connection->dbname && $slug['host'] ===){
						_e('Same data base!', 'interactive-map');
						die;
					}
					$new_connection = new wpdb($slug['user'], $slug['password'], $slug['db'], $slug['host']);*/
				}
				//im_create_comment_table($new_connection);
				//im_copy_table_data($old_connection, $new_connection, 'im_comments');
					
					
				//im_create_map_tables($new_connection);
				//im_create_test_tables($new_connection);
					
				echo 'success';
			}
			break;
	}
	die;
}

function im_copy_table_data($new, $old, $name){
	$count = $old->get_var("SELECT count(*) FROM $table");
	for ($i = 0; i < $count; $i++){
		$results = $old->get_row("SELECT * FROM $name LIMIT $i, 1", ARRAY_A);
		$new->insert($name, $results);
	}
}
?>