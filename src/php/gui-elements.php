<?php

/**
 * Returns a <select> element that is created from the values of a database table.
 * 
 * Does not check for SQL injection, so do not call with unsafe parameters.
 * 
 * @param string $table Table name
 * @param string|array $key
 * 		Primary key row of the database table. 
 * 		The values of this row will be used for the value attribute of the <option> elements.
 * 		For multiple rows the respective elements will be concatenated with | for the value of the <option> element.
 * 		
 * @param array $colums_to_select_from
 * 		Columns from which the <option> text is created.
 * 		For multiple columns the first non-empty, non-null value is used for every row.
 * 		It is also possible to give a custom format function in the $addional_data array for more complex tasks.
 * @param string $id ID attribute for the <select> element.
 * @param array $additional_data {
 * 		Optional. More specific options.
 * 
 * 		@type string 'placeholder' Placeholder attribute for the <select> element.
 * 		@type string 'class_name' Class for the <select> element
 * 		@type bool 'multiple_values' If multiple value should be selectable. Default false.
 * 		@type Row_Information 'new_values_info' If this parameter is not NULL an additional <option> is added that allows the insertion of new table rows {@see table_entry_box}. Default NULL.
 * 		@type string 'new_values_text' The text for the <option> element for adding new table rows. Only used if 'new_values_info' is not NULL. Default '(Add new value)'
 * 		@type string 'filter' SQL where clause to filter the elements (do not include the key word WHERE!)
 * 		@type string 'width' CSS width property for the <select> element. Default '190pt'.
 * 		@type string 'custom_style_attributes CSS style rules added to the <select> element. Default ''.
 * 		@type callable list_format_function 	Takes for each row an array with values of the columns specified in $colums_to_select_from and returns the string used as text for the respective <option> element.
 * 												Default behaviour is to return the first non-empty, non-null value.
 * }
 * @return string The html code for the <select> element
 */

function im_table_select ($table, $key, $colums_to_select_from, $id, $addional_data = NULL, $create_nonce_field = true){
	
	//Check mandatory parameters
	if(!isset($table)){
		return im_error_message(__('No table given!'), 'interactive-map');
	}
	if(!isset($key)){
		return im_error_message(__('No primary key given!'), 'interactive-map');
	}
	if(!isset($colums_to_select_from)){
		return im_error_message(__('No columns given!'), 'interactive-map');
	}
	if(!isset($id)){
		return im_error_message(__('No id given!'), 'interactive-map');
	}

	//Set defaults
	$multiple_values = isset($addional_data['multiple_values'])? $addional_data['multiple_values'] : false;
	
	$new_values_info = isset($addional_data['new_values_info'])? $addional_data['new_values_info'] : NULL;
	if($new_values_info != NULL){
		if(!isset($addional_data['new_values_text'])){
			$addional_data['new_values_text'] = '(' . __('Add new value', 'interactive-map') . ')';
		}
	}
	
	$class_name = isset($addional_data['class_name'])? $addional_data['class_name'] : '';
	
	$width = isset($addional_data['width'])? $addional_data['width'] : '190pt';

	$custom_style_attributes = isset($addional_data['custom_style_attributes'])? $addional_data['custom_style_attributes'] : '';
	
	$list_format_function = isset($addional_data['list_format_function'])? $addional_data['list_format_function'] : NULL;
	
	//Create key array if single key
	if(!is_array($key)){
		$key = array($key);
	}
	
	//Get table rows
	$sql = 'SELECT DISTINCT ' . implode(',', $key) . ', ' . implode(', ', $colums_to_select_from) . ' FROM ' . $table . (isset($addional_data['filter'])? ' WHERE ' . $addional_data['filter'] : '');
	$values = IM_Initializer::$instance->database->get_results($sql, ARRAY_A);
	
	$result = '';
	
	if($new_values_info != NULL){
		$result .= im_table_entry_box('TEB_' . $id, $new_values_info, NULL, $create_nonce_field);
	}

	//Create <select>
	$result .= "<select class='im_table_select " . $class_name . "' id='" . $id . "' " .
		(isset($addional_data['placeholder'])? 'data-placeholder="' . $addional_data['placeholder'] . '" ': '') . 
		($multiple_values? 'multiple="multiple" ': '') .
		"style='width : " . $width . "; " . $custom_style_attributes . "'>\n";
	
	if(!$multiple_values)
		$result .= "<option value=\"\" selected></option>\n";
	
	if($new_values_info != NULL){
		//Create option for new entry
		$result .= '<option value="###NEW###">' . $addional_data['new_values_text'] . "</option>\n";
	}
	
	//Create option texts
	$options_texts = array();
	foreach ($values as $index => &$value){
		$value[] = im_get_option_text($value, $colums_to_select_from, $list_format_function);
	}
	
	//Sort values
	uasort($values, function ($v1, $v2) {
		$a = preg_replace('/[*\']/', '', end($v1));
		$b = preg_replace('/[*\']/', '', end($v2));
		return strcasecmp($a, $b);
	});
	
	foreach($values as $index => $val){//TODO find better solution than the str_replace here or document!!!
		$result .= "<option value='" . str_replace("'", '', implode('|', array_slice($val, 0, count($key)))) . "'>" . end($val) . "</option>\n";
	}
	$result .= "</select>\n\n";
	return $result;
}


/**
 * Creates the <option> text for a table row
 * 
 * @param array $row the table row
 * @param int $start_index The first elements of the array will be ignored since they contain the key value(s) that are not used for the name
 * @param $list_format_function The function applied to the row elements or NULL for default behaviour
 * 
 * @return string The <option> text
 */
function im_get_option_text ($row, $colums_to_select_from, $list_format_function){
	
	if($list_format_function == null){
		//First non-empty, non-null value
		foreach ($row as $key => $val){
			//Filter key columns
			//Wordpress does not return duplicate rows so it is not possible to use just an index here, since that results in problems,
			//if a column is contained in $key and in $colums_to_select_from
			if(!in_array($key, $colums_to_select_from))
				continue;
			
			if($val != NULL && $val != ''){
				return $val;
			}
		}
	}
	else { //Custom function
	
		$filtered_array = array();
		foreach ($row as $key => $val){
			if(in_array($key, $colums_to_select_from)){
				$filtered_array[] = $val;
			}
		}
		if(is_array($list_format_function)){
			$filtered_array = array_merge($filtered_array, array_slice($list_format_function, 1));
			$list_format_function = $list_format_function[0];
		}
		
		return call_user_func_array($list_format_function, $filtered_array);
	}
}

class IM_Field_Information {
	function __construct ($col_name, $col_type, $mandatory, $allow_new_values = false, $default_value = NULL){
		$this->col_name = $col_name;
		$this->col_type = $col_type;
		$this->mandatory = $mandatory;
		$this->allow_new_values = $allow_new_values;
		$this->default_value = $default_value;
	}
	
	public $col_name;
	
	/**
	 * Type information for the column.
	 * 
	 * Possible values:
	 * - 'B' -> Boolean == <checkbox>
	 * - 'T' -> Text == <textfield>
	 * - 'F' -> Foreign Key == <select>
	 * - 'E' -> Enum == <select>
	 * - 'V' -> Varchar == <input>
	 * 
	 */
	public $col_type;
	public $mandatory;
	public $allow_new_values;
}

class IM_Row_Information {
	function __construct ($table, $field_list, $user_name_field = NULL){
		$this->table = $table;
		$this->field_list = $field_list;
		$this->user_name_field = $user_name_field;
	}
	
	public $table;
	public $field_list;
	public $user_name_field;
}

/**
 * An input box for new data base rows.
 * 
 * Does not check for SQL injection, so do not call with unsafe parameters.
 * 
 * @param string $id The id for the containing <div> element.
 * @param IM_Row_Information Details about the values that can be inserted
 * @param dbname Database name
 * 
 * @return string The html code for the input box
 */
function im_table_entry_box ($id, $row_information, $dbname = NULL, $create_nonce_field = true){

	$result = '<div id="' . $id . '" style="display:none;" title="' . $row_information->table . '" data-table="' . $row_information->table . '" >
				<div id="error' . $id . '" class="IM_error_message">
				</div>
				<form name="input' . $id . '" autocomplete="off">
				<table>';
				
	foreach ($row_information->field_list as $field_info){
		
		//TODO use default value for others than booleans!
		$type = $field_info->col_type;
		if($type == 'B'){ //Boolean
			$result .= 
				'<tr><td>' . $field_info->col_name . ':</td><td><input type="checkbox" name="' . 
				$field_info->col_name . '"' . ($field_info->default_value? 'checked="checked' : '') . ' data-nonempty="' . $field_info->mandatory . '" data-type="B"></td></tr>';
		}
		else if ($type == 'E'){
			$result .=
			'<tr><td>' . $field_info->col_name . ':</td><td>' .
			im_enum_select($row_information->table, $field_info->col_name, $field_info->col_name, '---', $field_info->allow_new_values, 'data-type="E" data-nonempty="' . $field_info->mandatory . '"', NULL, $dbname) . '</td></tr>';
		}
		else if ($type == 'T'){ //Text
			$result .=
			'<tr><td>' . $field_info->col_name . ':</td><td><textarea name="' .
			$field_info->col_name . '" data-nonempty="' . $field_info->mandatory . '" data-type="T"></textarea></td></tr>';
		}
		else if ($type == 'S'){ 
			//Serialized enum 
			//(e.g. used for multiple gender assignments, instead of using a separate table to store the gender assignments
			// an enum with all combinations (f m n f+m, f+n m+n f+m+n) is used. On the surface checkboxes are used for every value (f,m,n)
			$result .=
			'<tr><td>' . $field_info->col_name . ':</td><td>' .
			im_serialized_enum($row_information->table, $field_info->col_name, $field_info->col_name, '---', $dbname) .
			'</td></tr>';
		}
		else if(strpos($type, 'F') === 0){ //Foreign Key
			$whereClause = substr($type, 1);
			$result .=
			'<tr><td>' . $field_info->col_name . ':</td><td>' .
			im_fk_input($row_information->table, $field_info->col_name, $field_info->col_name,  '---', "data-type=\"F\"", $whereClause, $dbname) . '</td></tr>'; //TODO nonempty
		}
		else { //Varchar
			$result .=
			'<tr><td>' . $field_info->col_name . ':</td><td><input type="text" name="' .
			$field_info->col_name . '" data-nonempty="' . $field_info->mandatory . '" data-type="V" /></td></tr>';
		}
	}

	$result .= '</table>';
	
	if(isset($row_information->user_name_field)){
		$result .= '<input type="hidden" data-meta="user" name="' .$row_information->user_name_field . '" value="' . wp_get_current_user()->user_login . '" />';
	}
	
	if($create_nonce_field)
		$result .= wp_nonce_field('im_aett_' . $row_information->table, '_wpnonce', false, false);
	
	return $result .= "</form><br /><br /><input id='save$id' type='button' value='' data-insert-value='" . __('Insert', 'interactive-map') . "' data-update-value='" . __('Update', 'interactive-map') . "' class='button button-primary im_table_entry_box_submit' /><br /><br /><br /><br /></div>";
}

function im_serialized_enum ($table, $col, $name, $selected_value, $dbname = NULL){
	if($dbname === NULL){
		$dbname = IM_Initializer::$instance->database->dbname;
	}
	
	$enum_list = im_get_enum_values_list($table, $col, $dbname);
	
	//Search for longest value, since it contains all possibilities
	$max_len = 0;
	$max_index = -1;
	foreach ($enum_list as $i => $val){
		if(strlen($val) > $max_len){
			$max_len = strlen($val);
			$max_index = $i;
		}
	}
	
	$possiblities = explode('+', $enum_list[$max_index]);
	
	$result = '';
	foreach ($possiblities as $poss){
		$result .= '<input type="checkbox" name="' . $name . '" value="' . $poss . '" data-type="S" data-nonempty="">' . $poss . '&nbsp;&nbsp;&nbsp;';
	}
	
	return $result;
}

/**
 * Creates a <select> element to chose an enum value.
 *
 * Does not check for SQL injection, so do not call with unsafe parameters.
 *
 * @param string $table Table name
 * @param string $col Column name
 * @param string $name Name for the <select> element
 * @param string $selected_value
 * @param bool $allow_new Optional. Default false. If new enum values can be added (database user needs appropriate rights for that)
 * @param string $custom_attributes Optional. Default ''. Html attributes added to the <select> element
 * @param string $new_values_name Optional. Default '(Add new value)'. The text for the <option> element for adding new enum values. Only used if $allow_new is set to true.
 *
 *
 * @return string The html code for the <select> element
 */
function im_enum_select($table, $col, $name, $selected_value, $allow_new = false, $custom_attributes = '', $new_values_name = NULL, $dbname = NULL){

	if($new_values_name === NULL){
		$new_values_name = '(' . __('Add new value', 'interactive-map') . ')';
	}

	if($dbname === NULL){
		$dbname = IM_Initializer::$instance->database->dbname;
	}

	$enum = IM_Initializer::$instance->database->get_var("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$table' AND COLUMN_NAME = '$col' AND TABLE_SCHEMA = '" . $dbname . "'");

	$enum_list = im_get_enum_values_list($table, $col, $dbname);

	$result = '<select class="im_enum_select" name="' . $name . '" ' . $custom_attributes .
	' data-table="' . $table . '" data-column="' . $col . '" data-nonce="' . wp_create_nonce('im_anev_' . $table . $col) . '">' . "\n";
	
	foreach($enum_list as $value)
		if($value == $selected_value)
			$result .= "<option value=\"$value\" selected>$value</option>\n";
		else
			$result .= "<option value=\"$value\">$value</option>\n";

	if($allow_new)
		$result .= '<option value="###NEW###">' . $new_values_name . "</option>\n";
		
	$result .= "</select>\n";

	return $result;
}

function im_get_enum_values_list ($table, $col, $dbname){
	$enum = IM_Initializer::$instance->database->get_var("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$table' AND COLUMN_NAME = '$col' AND TABLE_SCHEMA = '" . $dbname . "'");
	
	$enum_list = array_map(function ($e){
		return str_replace("'", '', $e);
	}, explode(',', substr($enum, 5, (strlen($enum) - 6))));
	sort($enum_list);
	return $enum_list;
}

function im_fk_input ($table, $col, $name, $selected_value, $custom_attributes = '', $where_clause = '', $dbname = NULL){

	if($dbname === NULL){
		$dbname = IM_Initializer::$instance->database->dbname;
	}
	else {
		$oldname = IM_Initializer::$instance->database->dbname;
	}
	
	$db = IM_Initializer::$instance->database;
	$db->select($dbname);
	
	$table_info = $db->get_results("
			select REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
			from INFORMATION_SCHEMA.KEY_COLUMN_USAGE
			where TABLE_SCHEMA = '$dbname' and TABLE_NAME = '$table' and COLUMN_NAME = '$col'
			and referenced_column_name is not NULL;", ARRAY_N);
	$valueList = $db->get_results("SELECT " . $table_info[0][1] . " FROM " . $table_info[0][0] . $where_clause, ARRAY_N);
	
	$result = '<select name="' . $name . '" id="' . $col . '" ' . $custom_attributes . ">\n";
	foreach($valueList as $value){
		$value = $value[0];
		if($value == $selected_value)
			$result .= "<option value=\"$value\" selected>$value</option>\n";
			else
				$result .= "<option value=\"$value\">$value</option>\n";
	}
	$result .= "</select>\n\n";
	
	if(isset($oldname))
		$db->select($oldname);
	
	return $result;
}

/**
 * Returns a <p> element with an error message
 * 
 * @param string $text The message text
 * 
 * @return string The html code for the error message
 */
function im_error_message ($text){
	return '<p class="IM_error_message">' . $text . '</div>';
}

function im_create_filter_popup_html (){
	?>
	<div style="display: none" id="IM_filter_popup_div">
		<form id="IM_filter_popup_form">
			<h1 id="IM_filter_popup_title"></h1>
			<div id="IM_filter_popup_content">
				
			</div>
			
			<br />
			<br />
			<input type="button" id="IM_filter_popup_submit" class="button button-primary" value="<?php _e('Show data', 'interactive-map');?>" />
		</form>
	</div>
	<?php
}

function im_create_legend (){
	?>
	<div id="IM_legend">
	</div>
	<?php
}

function im_create_map ($min_height){
	?>
	<div id="IM_googleMap" style="min-height: <?php echo $min_height;?>pt"></div>
	<?php
}

function im_main_div_class (){
	return 'IM_main_div';
}

function im_create_synoptic_map_div ($width, $readonly = false, $extra_content = ''){
	echo '<div id="IM_Syn_Map_Cotainer">';
	$add_data = array(
		'placeholder' => __('Synoptic map', 'interactive-map'),
		'width' => $width
	);
	if(!is_super_admin(wp_get_current_user() -> ID)){
		$add_data['filter'] = "Released = 'Released' OR Author = '" .  wp_get_current_user() -> user_login . "'";
	}
	
	echo im_table_select('im_syn_maps', 'Id_Syn_Map', array('Name'), 'IM_Syn_Map_Selection', $add_data);
	
	if(is_user_logged_in() && !$readonly){
		?>
		<input type="button" class="button button-primary" id="IM_Save_Syn_Map_Button" style="width: <?php echo $width;?>;" value="<?php _e('Save selection as synoptic map', 'interactive-map');?> ">
		<?php
	}
	echo $extra_content . '</div>';
}


function im_create_ajax_nonce_field (){
	wp_nonce_field('im_load_data', '_wpnonce', false, true);
	wp_nonce_field('im_edit_comments', '_wpnonce_comments', false, true);
	wp_nonce_field('im_save_map', '_wpnonce_syn_map_save', false, true);
}

function im_create_comment_popup_html (){
	?>
	<div id="commentWindow" style="display:none;" title="<?php _e('Comment', 'interactive-map');?>">
		<h1 id="commentTitle" style="margin-left: 0.5em;"></h1>
		<br />
		
		<div id="commentTabs"  style="height : 80%;">
			<ul>
				<?php $langs = IM_Initializer::$instance->gui_languages;
				foreach ($langs as $lan){
					echo "<li><a href='#ctabs-$lan'>$lan</a></li>\n";
				}
				?>
			</ul>
			
			<?php
			foreach ($langs as $lan){
				?>
				<div id="ctabs-<?php echo $lan; ?>">
					<div id="commentContent-<?php echo $lan; ?>"  class="entry-content"></div>
					<?php
					if(current_user_can_for_blog(1, 'im_edit_comments')){
					?>
					<br />
					<br />
					<a href="#" class="editCommentLink" id="editComment-<?php echo $lan; ?>" style="text-decoration: underline;"><?php _e('Edit comment', 'interactive-map');?></a>
					<input type="button" class="button button-primary saveCommentButton" value="<?php _e('Save'); ?> " style="display: none" id="saveComment-<?php echo $lan; ?>">
				<?php
				}
				?>
				</div>
			<?php
			}
			?>
		</div>
	</div>
	<?php
}

/**
 * Returns a hierarchical menu to select from.
 * 
 * @param id id for the top-level element
 * @param string $selection_name
 * @param $data_array 
 * 	Two-dimensional array with numeric keys.
 * 	It must have the following structure:
 * 		- First column: Key
 * 		- All other columns: Tree nodes for this element starting with the top-level node. The last one will become the (selectable) leaf.
 * @param array params_leaves Optional. Html attributes for the leaf elements.
 * @param array params_root Optional. Html attributes for the top-level element.
 * 
 */
function im_hierarchical_select ($id, $selection_name, $data_array, $params_leaves = array(), $params_root = array ()){
	$tree = new IM_Tree($selection_name);
	
	foreach ($data_array as $i => $row){
		$rid = $row[0];
		unset($row[0]);
		if(isset($params_leaves[$i])){
			$className = 'sf-tree-leaf';
			if(isset($params_leaves[$i]['class'])){
				$className .= ' ' . $params_leaves[$i]['class'];
			}
			$lparams = array_merge($params_leaves[$i], array('data-id' => $rid, 'class' => $className));
		}
		else {
			$lparams = array('data-id' => $rid, 'class' => 'sf-tree-leaf');
		}
		$tree->addSubTree(IM_Tree::arrayToTreePath($row, true, $lparams));
	}
	
	if(isset($params_root['class'])){
		$params_root['class'] .= ' sf-menu sf-vertical sf-menu-toplevel im_data_loader';
	}
	else {
		$params_root['class'] = ' sf-menu sf-vertical sf-menu-toplevel im_data_loader';
	}
	$params_root['id'] = $id;
	$tree->sort();
	return $tree->toHtml($params_root);
}

function im_create_save_map_popup_html (){
	?>
	<div id="IM_Save_Syn_Map" style="display:none;" title="<?php _e('Save selection as synoptic map') ?>">
		<br />
		<table style="border-spacing: 5px; border-collapse: separate; width : 100%">
			<tr>
				<td>
					<?php _e('Name'); ?>
				</td>
				<td>
					<input type="text" id="IM_Syn_Map_Name" style="width: 90%" />
				</td>
			</tr>
			<tr>
				<td>
					<?php _e('Description') ?>
				</td>
				<td>
					<textarea id="IM_Syn_Map_Description" style="width:90%" rows="5"></textarea>
				</td>
			</tr>
		</table>
		<br />
		<p>
			<input type="radio" name="IM_Syn_Map_All" value="0" checked /> <?php _e('Save only active elements'); ?>
			<br />
			<input type="radio" name="IM_Syn_Map_All" value="1" /> <?php _e('Save all elements'); ?>
		</p>
		<br />
		<p>
			<input type="checkbox" id="IM_Syn_Map_Release" value="release" /> <?php _e('Apply for release'); ?>
			<img  id="helpRelease" src="<?php echo IM_PLUGIN_URL; ?>/icons/Help.png" style="vertical-align: middle;" />
		</p>
		<br />
		<input type="button" class="button button-primary" id="IM_Save_Syn_Map_Final_Button" value="<?php echo _e('Save') ?>">
	</div>
	<?php
}

function im_create_debug_area (){
	?>
	<div id="im_debug_area" class="IM_error_message"></div>
	<?php
}
?>