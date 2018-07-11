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
					
					if($db->update($_POST['table'], array_combine($rowsA, $valuesA), $whereA, $formatA) === false){
						echo 'Error: ' . $db->last_error;
						die;
					}
					
					foreach($_POST['defaultFields'] as $col){
						$db->query($db->prepare('UPDATE ' . $_POST['table'] . ' SET ' . $col . ' = DEFAULT WHERE ' . $_POST['key_field'] . ' = %s', $_POST['id']));
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
			
			$key = apply_filters('im_comment_key', $_POST['key']); //TODO document
			
			switch($_POST['mode']){
				case 'update':
					if ($_POST['content'] == ''){ //Delete entry from table
						$sql = $db->prepare('DELETE FROM im_comments WHERE Id = %s AND Language = %s', $key, $_POST['lang']);
						$db->query($sql);
					}
					else {
						$comment = stripslashes($_POST['content']);
						$db->query($db->prepare(
							"INSERT INTO im_comments (Id, Source, Author, Language, Comment) 
							VALUES(%s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE Comment = %s, Locked = NULL", 
							$key,
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
					echo apply_filters('im_comment', $ret, $key, $_POST['lang']); //TODO document
					break;
					
				case 'get':
					$locked =  $db->get_var($db->prepare('SELECT NOW() - Locked FROM im_comments WHERE Id = %s AND Language = %s', $key, $_POST['lang']));
					
					if($locked != NULL && $locked < 3600){
						echo '§§§LOCKED§§§';
						break;
					}

					$db->query($db->prepare('UPDATE im_comments SET Locked = NOW() WHERE Id = %s AND Language = %s', $key, $_POST['lang']));
					$sql = $db->prepare('SELECT Comment FROM im_comments WHERE Id = %s AND Language = %s', $key, $_POST['lang']);
					echo json_encode($db->get_var($sql));
					break;
					
				case 'removeLock':
					$db->query($db->prepare('UPDATE im_comments SET Locked = NULL WHERE Id = %s AND Language = %s', $key, $_POST['lang']));
					break;
			}
		break;
			
		case 'edit_mode':
			if(current_user_can_for_blog(1, 'im_edit_map_data'))
				echo IM_Initializer::$instance->edit_data();
		break;
	}
	die;
}

function im_ajax_handler_all (){
	     
	$db = IM_Initializer::$instance->database;

	switch ($_POST['namespace']){
		case 'load_data':
			check_ajax_referer('im_load_data', '_wpnonce', true);
			
			$result = IM_Initializer::$instance->load_data();
			
			if(!isset($_POST['noComments']))
				$result->addComments($_POST['key'], $db);
			
			if(isset($_POST['filter']) && isset($_POST['filter']['removed']))
				$result->removeSubCategories($_POST['filter']['removed']);
			
			echo $result->createResultString();
			
			break;

			case 'load_loc_data':
				check_ajax_referer('im_load_data', '_wpnonce', true);
				
				$result = [];
				if(is_callable(IM_Initializer::$instance->search_location_function)){
					$result = call_user_func(IM_Initializer::$instance->search_location_function, $_POST['search']);
				}
				echo json_encode($result);
			break;

			case 'goto_loc':
				check_ajax_referer('im_load_data', '_wpnonce', true);
				
				$result = NULL;
				if(is_callable(IM_Initializer::$instance->get_location_function)){
					$result = call_user_func(IM_Initializer::$instance->get_location_function, $_POST['loc_id']);
				}
				echo json_encode($result);
			break;

			case 'global_search':
				check_ajax_referer('im_load_data', '_wpnonce', true);

				$result = [];
				if(is_callable(IM_Initializer::$instance->global_search_function)){
					$result = call_user_func(IM_Initializer::$instance->global_search_function, $_POST['search'], $_POST['lang']);
				}
				echo json_encode($result);
			break;

		
		case 'load_syn_map':
			check_ajax_referer('im_load_data', '_wpnonce', true);
			
			$query1 = 'SELECT Zoom, Center_Lat, Center_Lng, Opened, Options, Quant, Info_Windows, Location_Markers FROM im_syn_maps WHERE Id_Syn_Map = ' . $_POST['key'];
			$query2 = 'SELECT Data FROM im_syn_maps_elements WHERE Id_Syn_Map = ' . $_POST['key'] . ' ORDER BY Position ASC';
			$map_main_data = $db->get_row($query1, 0);

			if($map_main_data){
				$map_main_data->Options = $map_main_data->Options == null? []: json_decode($map_main_data->Options);
				$map_main_data->Info_Windows = $map_main_data->Info_Windows == null? []: json_decode($map_main_data->Info_Windows);
				$map_main_data->Location_Markers = $map_main_data->Location_Markers == null? []: json_decode($map_main_data->Location_Markers);
				echo json_encode(array(
					$map_main_data, 
					array_map('json_decode', $db->get_col($query2, 0))
				));
			}
			else {
				echo 'NO_MAP';
			}
			break;
			
		case 'save_syn_map':
			check_ajax_referer('im_save_map', '_wpnonce', true);
			
			$anonymous = $_POST['name'] == 'Anonymous';
			
			if(!$anonymous && !is_user_logged_in()){
				return;
			}
		
			$name = NULL;
			if(!$anonymous)
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
						'Released' => $_POST['release'],
						'Colors' =>  $_POST['colors'],
						'Opened' => $_POST['opened'],
				        'Options' => isset($_POST['options']) && $_POST['options']? json_encode($_POST['options']): null,
						'Quant' => $_POST['quant'],
				        'Info_Windows' => isset($_POST['info_windows']) && $_POST['info_windows']? json_encode($_POST['info_windows']): null,
				        'Location_Markers' => isset($_POST['location_markers']) && $_POST['location_markers']? json_encode($_POST['location_markers']): null
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
									'Data' => json_encode(array_map('stripslashes_deep', $value))
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
	private $extra_data = array();
	
	private $debug_data;
	
	private $key;
	
	function __construct($key){
		$this->key = $key;
	}
	

	/**
	 * @param string $sub_id Id for the subcategory or -1 if no sub-category is given
	 * @param ElementInfoWindowData $element_info Data which is used to create the popup window for this element
	 * @param string $geo_data Geo data in WKT format
	 * @param array<number> bounding_box Topleft and bottomright corner of the bounding box [x1,y1,x2,y2]. Ignored for point symbols
	 * @param array<string, string|number> $quant_info optional
	 * 		Enables quantification for this element.
	 * 
	 * 		The parameter has to be an array that contains a mapping from category ids to element ids.
	 * 		In general, this is only meaningfull if the MapElement is a point symbol and the given category
	 * 		only contains polygons.
	 */
	function addMapElement ($sub_id, IM_ElementInfoWindowData $element_info, $geo_data, $bounding_box, IM_Quantitfy_Info $quant_info = NULL, $marking_color = -1){
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
						$this->contains_line_strings[$sub_id] = true;
					}
				}
			}
		}	
		
		$this->element_data[$sub_id][] = array ([$element_info->getData()], $geo_data, $bounding_box, ($quant_info? $quant_info->getAjaxData(): NULL), $marking_color);
	}
	
	/**
	 * Same as addMapElement, but an array of elments with the same position can be added. This speeds up
	 * computation on the client side, since:
	 * 		a) Point distance computations can be avoided for those elements
	 * 		b) Especially for many points that have the same position the client can compute the resulting symbol much faster,
	 * 		   since it processes the data points sequentially without any buffer
	 * 
	 * @param string $sub_id Id for the subcategory or -1 if no sub-category is given
	 * @param ElementInfoWindowData $element_info Data which is used to create the popup window for this element
	 * @param string $geo_data Geo data in WKT format
	 * @param array<number> bounding_box Topleft and bottomright corner of the bounding box [x1,y1,x2,y2]. Ignored for point symbols
	 * @param array<string, string|number> $quant_info optional
	 * 		Enables quantification for this element.
	 *
	 * 		The parameter has to be an array that contains a mapping from category ids to element ids.
	 * 		In general, this is only meaningfull if the MapElement is a point symbol and the given category
	 * 		only contains polygons.
	 */
	function addMapElements ($sub_id, array $element_infos, $geo_data, $bounding_box, IM_Quantitfy_Info $quant_info = NULL, $marking_color = -1){
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
						$this->contains_line_strings[$sub_id] = true;
					}
				}
			}
		}
		
		$data = array();
		foreach($element_infos as $info){
			$data[] = $info->getData();
		}
	
		$this->element_data[$sub_id][] = array ($data, $geo_data, $bounding_box, ($quant_info? $quant_info->getAjaxData(): NULL), $marking_color);
	}
	
	function addExtraData($key, $data){
		$this->extra_data[$key] = $data;
	}
	
	function isEmpty (){
		return empty($this->element_data);
	}
	
	function setDebugData($str){
		$this->debug_data = $str;
	}
	
	function removeSubCategories ($arr){
		if($arr == null)
			return;
		
		foreach ($arr as $sub_id){
			unset($this->element_data[$sub_id]);
		}
	}
	//TODO comment the comment filter
	function addComments ($id, $db){
		$id_filtered = apply_filters('im_comment_key', $id);
		
		//Get main element comments
		$mainComments = $this->getAllLangComments($id_filtered, $db);
		if(count($mainComments) > 0){
			$mcommentList = array();
			foreach ($mainComments as $lc){
				$ctext = apply_filters('im_comment', $lc[1], $id_filtered, $lc[0]);
				$mcommentList[$lc[0]] = $ctext;
			}
			$this->comments[$id] = $mcommentList;
		}

		//Get sub-element comments
		foreach ($this->element_data as $id => $data) {
			if($id == -1)
				continue;

			$id_splited = explode('+', $id); //TODO document plus
			foreach ($id_splited as $id_p){
				$id_p_filtered = apply_filters('im_comment_key', $id_p);
				
				$currentSubComments = $this->getAllLangComments($id_p_filtered, $db);
				if(count($currentSubComments) > 0){
					$scommentList = array();
					foreach ($currentSubComments as $lc){
						$ctext = apply_filters('im_comment', $lc[1], $id_p_filtered, $lc[0]);
						$scommentList[$lc[0]] = $ctext;
					}
					$this->comments[$id_p] = $scommentList;
				}
			}
		}
	}
	
	/**
	 * @param string $newKey
	 * 
	 * Can be used if the key that should be used by the map js code is not the same
	 * as originally sent, e.g. for backwards compability if the key format has changed.
	 */
	function updateKey ($newKey){
		$this->key = $newKey;
	}
	
	private function getAllLangComments ($id, &$db){
		$sql = $db->prepare('SELECT Language, Comment FROM im_comments WHERE Id = %s', $id);
		return $db->get_results($sql, ARRAY_N);
	}
	
	function createResultString (){
	
		$result_data = array ();

		foreach ($this->element_data as $sub_id => $data){
			//Find out the overlay type of the result for visualization. As soon as there are two types of overlays it is treated like a point symbol.
			if($this->contains_point_symbols[$sub_id]){
				$overlay_type = 0; //Point
			}
			else {
				if($this->contains_line_strings[$sub_id] && !$this->contains_polygons[$sub_id]){
					$overlay_type = 2; //Line string
				}
				else if ($this->contains_polygons[$sub_id] && !$this->contains_line_strings[$sub_id]){
					$overlay_type = 1; //Polygon
				}
				else {
					$overlay_type = 0; //Point as default
				}
			}
			
			$result_data[$sub_id] = array ($overlay_type, $data);
		}
		
		$result = array($result_data, $this->comments, $this->key, $this->extra_data);
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

interface IM_Quantitfy_Info {
	function getAjaxData ();
}

/**
 * Contains a mapping from category ids to element ids
 *
 */
class IM_Point_Quantify_Info implements IM_Quantitfy_Info {
	private $mapping = array();
	
	function addCategoryIndex ($category, $index){
		$this->mapping[$category] = $index;
	}
	
	function getAjaxData (){
		return array('POINT', $this->mapping);
	}
	
}

/**
 * Contains the index for the polygon
 *
 */
class IM_Polygon_Quantify_Info implements IM_Quantitfy_Info {
	private $index;
	
	function __construct ($index){
		$this->index = $index;
	}
	
	function getAjaxData (){
		return array('POLYGON', $this->index);
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
	
	public function getName(){
		return $this->data['name'];
	}
	
	protected function getTypeSpecificData (){
	 	return $this->data;
	}
}

class IM_PolygonInfoWindowData extends IM_ElementInfoWindowData {
	private $data;

	function __construct ($name, $description, $id){
		parent::__construct('polygon');
		$this->data = array ('name' => $name, 'description' => $description, 'id_polygon' => $id);
	}

	public function getName(){
		return $this->data['name'];
	}

	protected function getTypeSpecificData (){
		return $this->data;
	}
}

class IM_EditableElementInfoWindowData extends IM_ElementInfoWindowData {
	private $data;

	function __construct ($id, $fields){
		parent::__construct('editable');
		$this->data = $fields;
		$this->data['id'] = $id;
	}

	public function getName(){
		return '';
	}

	protected function getTypeSpecificData (){
		return $this->data;
	}
}

/**
 * Returns a string with %d's for an integer list
 */
function im_key_placeholder_list ($arr){
	return '(' . implode(',', array_fill(0, count($arr), '%d')) . ')';
}

/**
 * Returns a string with %s's for a string list
 */
function im_string_placeholder_list ($arr){
	return '(' . implode(',', array_fill(0, count($arr), '%s')) . ')';
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